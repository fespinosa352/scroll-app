-- Database Monitoring and Maintenance Utilities
-- Date: 2025-10-17
-- Description: Add monitoring views and maintenance functions for database health

-- 1. Database performance monitoring views
-- View to monitor slow queries and performance
CREATE OR REPLACE VIEW public.performance_stats AS
SELECT
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as sequential_reads,
    idx_scan as index_scans,
    idx_tup_fetch as index_reads,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    CASE
        WHEN seq_scan > 0 AND idx_scan > 0 THEN
            ROUND((seq_tup_read::numeric / seq_scan) / (idx_tup_fetch::numeric / NULLIF(idx_scan, 0)), 2)
        ELSE NULL
    END as scan_efficiency_ratio
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC, n_live_tup DESC;

-- View to monitor index usage
CREATE OR REPLACE VIEW public.index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_category
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 2. Data quality monitoring
-- View to check data consistency and quality
CREATE OR REPLACE VIEW public.data_quality_report AS
SELECT
    'resumes' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE name IS NULL OR trim(name) = '') as empty_names,
    COUNT(*) FILTER (WHERE content IS NULL) as null_content,
    COUNT(*) FILTER (WHERE ats_score IS NOT NULL AND (ats_score < 0 OR ats_score > 100)) as invalid_ats_scores,
    COUNT(*) FILTER (WHERE created_at > updated_at) as inconsistent_dates
FROM public.resumes

UNION ALL

SELECT
    'user_skills' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE skill_name IS NULL OR trim(skill_name) = '') as empty_names,
    COUNT(*) FILTER (WHERE proficiency_level IS NOT NULL AND proficiency_level NOT IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')) as invalid_proficiency,
    COUNT(*) FILTER (WHERE years_experience IS NOT NULL AND years_experience < 0) as negative_experience,
    COUNT(*) FILTER (WHERE created_at > updated_at) as inconsistent_dates
FROM public.user_skills

UNION ALL

SELECT
    'work_experiences' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE title IS NULL OR trim(title) = '') as empty_titles,
    COUNT(*) FILTER (WHERE start_date > COALESCE(end_date, CURRENT_DATE)) as invalid_date_ranges,
    COUNT(*) FILTER (WHERE is_current = true AND end_date IS NOT NULL) as current_with_end_date,
    COUNT(*) FILTER (WHERE created_at > updated_at) as inconsistent_dates
FROM public.work_experiences;

-- 3. Storage and size monitoring
CREATE OR REPLACE VIEW public.table_sizes AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    pg_total_relation_size(schemaname||'.'||tablename) as total_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 4. User activity monitoring
CREATE OR REPLACE VIEW public.user_activity_summary AS
SELECT
    p.user_id,
    p.display_name,
    p.created_at as user_created,
    COUNT(DISTINCT r.id) as total_resumes,
    COUNT(DISTINCT gr.id) as generated_resumes,
    COUNT(DISTINCT we.id) as work_experiences,
    COUNT(DISTINCT e.id) as education_entries,
    COUNT(DISTINCT c.id) as certifications,
    COUNT(DISTINCT us.id) as skills,
    COUNT(DISTINCT ja.id) as job_analyses,
    MAX(GREATEST(
        r.updated_at,
        gr.updated_at,
        we.updated_at,
        e.updated_at,
        c.updated_at,
        us.updated_at,
        ja.updated_at
    )) as last_activity
FROM public.profiles p
LEFT JOIN public.resumes r ON p.user_id = r.user_id
LEFT JOIN public.generated_resumes gr ON p.user_id = gr.user_id
LEFT JOIN public.work_experiences we ON p.user_id = we.user_id
LEFT JOIN public.education e ON p.user_id = e.user_id
LEFT JOIN public.certifications c ON p.user_id = c.user_id
LEFT JOIN public.user_skills us ON p.user_id = us.user_id
LEFT JOIN public.job_analyses ja ON p.user_id = ja.user_id
GROUP BY p.user_id, p.display_name, p.created_at
ORDER BY last_activity DESC NULLS LAST;

-- 5. Maintenance functions
-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION public.refresh_table_stats()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_record RECORD;
    result_text TEXT := '';
BEGIN
    -- Analyze all user tables to update statistics
    FOR table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ANALYZE public.' || quote_ident(table_record.tablename);
        result_text := result_text || 'Analyzed ' || table_record.tablename || E'\n';
    END LOOP;

    result_text := result_text || 'Statistics refresh completed at ' || now();
    RETURN result_text;
END;
$$;

-- Function to check database health
CREATE OR REPLACE FUNCTION public.database_health_check()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check for tables without recent activity
    RETURN QUERY
    SELECT
        'Stale Tables'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
        'Tables with no activity in 30 days: ' || COUNT(*)::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'Review data retention policies' ELSE 'No action needed' END::TEXT
    FROM pg_stat_user_tables
    WHERE last_autoanalyze < now() - interval '30 days'
    AND schemaname = 'public';

    -- Check for unused indexes
    RETURN QUERY
    SELECT
        'Unused Indexes'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
        'Indexes never used: ' || COUNT(*)::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'Consider dropping unused indexes' ELSE 'No action needed' END::TEXT
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    AND schemaname = 'public';

    -- Check for data quality issues
    RETURN QUERY
    SELECT
        'Data Quality'::TEXT,
        CASE WHEN EXISTS(
            SELECT 1 FROM public.data_quality_report
            WHERE empty_names > 0 OR null_content > 0 OR invalid_ats_scores > 0 OR inconsistent_dates > 0
        ) THEN 'WARNING' ELSE 'OK' END::TEXT,
        'Data quality issues detected'::TEXT,
        'Review data_quality_report view for details'::TEXT;

    -- Check for large tables needing maintenance
    RETURN QUERY
    SELECT
        'Table Maintenance'::TEXT,
        CASE WHEN EXISTS(
            SELECT 1 FROM pg_stat_user_tables
            WHERE n_dead_tup > n_live_tup * 0.1
            AND schemaname = 'public'
        ) THEN 'INFO' ELSE 'OK' END::TEXT,
        'Tables may benefit from VACUUM'::TEXT,
        'Consider running VACUUM on tables with high dead tuple ratio'::TEXT;
END;
$$;

-- 6. Create monitoring permissions
-- Grant read access to monitoring views for authenticated users
GRANT SELECT ON public.performance_stats TO authenticated;
GRANT SELECT ON public.index_usage_stats TO authenticated;
GRANT SELECT ON public.data_quality_report TO authenticated;
GRANT SELECT ON public.table_sizes TO authenticated;
GRANT SELECT ON public.user_activity_summary TO authenticated;

-- Grant execute permissions for maintenance functions
GRANT EXECUTE ON FUNCTION public.refresh_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.database_health_check() TO authenticated;

-- Add helpful comments
COMMENT ON VIEW public.performance_stats IS 'Monitor table scan patterns and performance metrics';
COMMENT ON VIEW public.index_usage_stats IS 'Track index usage to identify optimization opportunities';
COMMENT ON VIEW public.data_quality_report IS 'Identify data consistency and validation issues';
COMMENT ON VIEW public.table_sizes IS 'Monitor database storage usage by table';
COMMENT ON VIEW public.user_activity_summary IS 'Track user engagement and data completeness';
COMMENT ON FUNCTION public.refresh_table_stats() IS 'Update table statistics for query optimization';
COMMENT ON FUNCTION public.database_health_check() IS 'Comprehensive database health assessment';