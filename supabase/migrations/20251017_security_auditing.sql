-- Security Auditing and Monitoring Migration
-- Date: 2025-10-17
-- Description: Add audit logging and security monitoring capabilities

-- 1. Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.audit_log
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for efficient audit log queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_date
ON public.audit_log(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_table_operation
ON public.audit_log(table_name, operation, created_at DESC);

-- 2. Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id_val UUID;
    changed_fields TEXT[] := '{}';
    col_name TEXT;
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- Get current user ID
    user_id_val := auth.uid();

    -- Skip if no authenticated user (system operations)
    IF user_id_val IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- For UPDATE operations, identify changed fields
    IF TG_OP = 'UPDATE' THEN
        FOR col_name IN SELECT column_name
                       FROM information_schema.columns
                       WHERE table_name = TG_TABLE_NAME
                       AND table_schema = TG_TABLE_SCHEMA
        LOOP
            EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', col_name, col_name)
            INTO old_val, new_val
            USING OLD, NEW;

            IF old_val IS DISTINCT FROM new_val THEN
                changed_fields := array_append(changed_fields, col_name);
            END IF;
        END LOOP;
    END IF;

    -- Insert audit record
    INSERT INTO public.audit_log (
        user_id,
        table_name,
        operation,
        old_data,
        new_data,
        changed_fields,
        ip_address,
        user_agent
    ) VALUES (
        user_id_val,
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END,
        changed_fields,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );

    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the operation
        RAISE WARNING 'Audit trigger failed: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Apply audit triggers to sensitive tables
-- Resume tables
DROP TRIGGER IF EXISTS audit_resumes ON public.resumes;
CREATE TRIGGER audit_resumes
    AFTER INSERT OR UPDATE OR DELETE ON public.resumes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_generated_resumes ON public.generated_resumes;
CREATE TRIGGER audit_generated_resumes
    AFTER INSERT OR UPDATE OR DELETE ON public.generated_resumes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Profile data
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Work experience
DROP TRIGGER IF EXISTS audit_work_experiences ON public.work_experiences;
CREATE TRIGGER audit_work_experiences
    AFTER INSERT OR UPDATE OR DELETE ON public.work_experiences
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 4. Create security monitoring views
-- View for recent security events
CREATE OR REPLACE VIEW public.security_events AS
SELECT
    al.created_at,
    al.user_id,
    p.display_name,
    al.table_name,
    al.operation,
    al.ip_address,
    al.user_agent,
    CASE
        WHEN al.created_at > now() - interval '1 hour' THEN 'recent'
        WHEN al.created_at > now() - interval '24 hours' THEN 'today'
        ELSE 'older'
    END as event_age
FROM public.audit_log al
LEFT JOIN public.profiles p ON al.user_id = p.user_id
ORDER BY al.created_at DESC;

-- View for suspicious activity patterns
CREATE OR REPLACE VIEW public.suspicious_activity AS
SELECT
    user_id,
    COUNT(*) as event_count,
    COUNT(DISTINCT ip_address) as unique_ips,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event,
    array_agg(DISTINCT operation) as operations,
    array_agg(DISTINCT table_name) as tables_accessed
FROM public.audit_log
WHERE created_at > now() - interval '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 50 OR COUNT(DISTINCT ip_address) > 3
ORDER BY event_count DESC;

-- 5. Create data retention policy function
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete audit logs older than 1 year
    DELETE FROM public.audit_log
    WHERE created_at < now() - interval '1 year';

    -- Log cleanup action
    RAISE NOTICE 'Cleaned up audit logs older than 1 year';
END;
$$;

-- 6. Add security-related constraints
-- Ensure audit log integrity
ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_operation_valid
CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'));

ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_table_name_not_empty
CHECK (length(trim(table_name)) > 0);

-- 7. Grant necessary permissions
-- Allow authenticated users to read their audit logs
GRANT SELECT ON public.audit_log TO authenticated;
GRANT SELECT ON public.security_events TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.audit_log IS 'Tracks all data changes for security and compliance';
COMMENT ON FUNCTION public.audit_trigger_function() IS 'Captures data changes with user context and metadata';
COMMENT ON VIEW public.security_events IS 'Recent security-relevant events for monitoring';
COMMENT ON VIEW public.suspicious_activity IS 'Detects unusual activity patterns for security alerts';
COMMENT ON FUNCTION public.cleanup_old_audit_logs() IS 'Removes old audit logs to manage storage';