// Performance testing utilities for database optimizations
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  queryCount: number;
  totalTime: number;
  averageTime: number;
  dataSize: number;
  cacheHits: number;
  cacheMisses: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    queryCount: 0,
    totalTime: 0,
    averageTime: 0,
    dataSize: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  private startTime: number = 0;

  startQuery() {
    this.startTime = performance.now();
  }

  endQuery(dataSize: number = 0) {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    this.metrics.queryCount++;
    this.metrics.totalTime += duration;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.queryCount;
    this.metrics.dataSize += dataSize;
    
    console.log(`Query ${this.metrics.queryCount} took ${duration.toFixed(2)}ms`);
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      queryCount: 0,
      totalTime: 0,
      averageTime: 0,
      dataSize: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  printReport() {
    console.log('\n=== Performance Report ===');
    console.log(`Total Queries: ${this.metrics.queryCount}`);
    console.log(`Total Time: ${this.metrics.totalTime.toFixed(2)}ms`);
    console.log(`Average Time: ${this.metrics.averageTime.toFixed(2)}ms`);
    console.log(`Data Size: ${this.metrics.dataSize} bytes`);
    console.log(`Cache Hits: ${this.metrics.cacheHits}`);
    console.log(`Cache Misses: ${this.metrics.cacheMisses}`);
    console.log(`Cache Hit Rate: ${((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(1)}%`);
    console.log('=========================\n');
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Test function to compare old vs new data fetching
export const testDataFetchingPerformance = async (userId: string) => {
  console.log('🚀 Testing Data Fetching Performance...');
  
  // Test 1: Old method (multiple queries)
  console.log('\n--- OLD METHOD (Multiple Queries) ---');
  performanceMonitor.reset();
  
  const oldMethodStart = performance.now();
  
  // Simulate old method with multiple queries
  performanceMonitor.startQuery();
  const { data: workExp } = await supabase
    .from('work_experiences')
    .select('*')
    .eq('user_id', userId);
  performanceMonitor.endQuery(JSON.stringify(workExp || []).length);
  
  performanceMonitor.startQuery();
  const { data: education } = await supabase
    .from('education')
    .select('*')
    .eq('user_id', userId);
  performanceMonitor.endQuery(JSON.stringify(education || []).length);
  
  performanceMonitor.startQuery();
  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', userId);
  performanceMonitor.endQuery(JSON.stringify(certifications || []).length);
  
  performanceMonitor.startQuery();
  const { data: skills } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId);
  performanceMonitor.endQuery(JSON.stringify(skills || []).length);
  
  const oldMethodEnd = performance.now();
  const oldMethodMetrics = performanceMonitor.getMetrics();
  
  console.log(`Old Method Total Time: ${(oldMethodEnd - oldMethodStart).toFixed(2)}ms`);
  performanceMonitor.printReport();
  
  // Test 2: New method (single aggregated query)
  console.log('\n--- NEW METHOD (Single Aggregated Query) ---');
  performanceMonitor.reset();
  
  const newMethodStart = performance.now();
  
  performanceMonitor.startQuery();
  const { data: profileData } = await supabase
    .from('profiles')
    .select(`
      id,
      user_id,
      display_name,
      email,
      phone,
      location,
      work_experiences (
        id,
        title,
        company_name,
        start_date,
        end_date,
        is_current,
        location,
        description,
        companies (
          id,
          name,
          industry,
          size_category
        )
      ),
      education (
        id,
        institution,
        degree,
        field_of_study,
        start_date,
        end_date,
        gpa,
        is_current
      ),
      certifications (
        id,
        name,
        issuing_organization,
        issue_date,
        expiration_date,
        credential_id,
        credential_url
      ),
      user_skills (
        id,
        skill_name,
        proficiency_level,
        years_of_experience
      )
    `)
    .eq('user_id', userId)
    .single();
  performanceMonitor.endQuery(JSON.stringify(profileData || {}).length);
  
  const newMethodEnd = performance.now();
  const newMethodMetrics = performanceMonitor.getMetrics();
  
  console.log(`New Method Total Time: ${(newMethodEnd - newMethodStart).toFixed(2)}ms`);
  performanceMonitor.printReport();
  
  // Performance comparison
  console.log('\n=== PERFORMANCE COMPARISON ===');
  console.log(`Query Count Reduction: ${oldMethodMetrics.queryCount} → ${newMethodMetrics.queryCount} (${((oldMethodMetrics.queryCount - newMethodMetrics.queryCount) / oldMethodMetrics.queryCount * 100).toFixed(1)}% reduction)`);
  console.log(`Total Time Improvement: ${oldMethodMetrics.totalTime.toFixed(2)}ms → ${newMethodMetrics.totalTime.toFixed(2)}ms (${((oldMethodMetrics.totalTime - newMethodMetrics.totalTime) / oldMethodMetrics.totalTime * 100).toFixed(1)}% improvement)`);
  console.log(`Data Transfer: ${oldMethodMetrics.dataSize} → ${newMethodMetrics.dataSize} bytes`);
  console.log('===============================\n');
  
  return {
    oldMethod: oldMethodMetrics,
    newMethod: newMethodMetrics,
    improvement: {
      queryReduction: ((oldMethodMetrics.queryCount - newMethodMetrics.queryCount) / oldMethodMetrics.queryCount * 100).toFixed(1),
      timeImprovement: ((oldMethodMetrics.totalTime - newMethodMetrics.totalTime) / oldMethodMetrics.totalTime * 100).toFixed(1),
      dataReduction: ((oldMethodMetrics.dataSize - newMethodMetrics.dataSize) / oldMethodMetrics.dataSize * 100).toFixed(1)
    }
  };
};

// Test database indexes performance
export const testIndexPerformance = async (userId: string) => {
  console.log('🔍 Testing Database Index Performance...');
  
  // Test query that should benefit from our new indexes
  const tests = [
    {
      name: 'Work Experience by User + Date',
      query: () => supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(10)
    },
    {
      name: 'Current Work Experience',
      query: () => supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
    },
    {
      name: 'Education by User + Date',
      query: () => supabase
        .from('education')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(10)
    },
    {
      name: 'Certifications by User + Date',
      query: () => supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId)
        .order('issue_date', { ascending: false })
        .limit(10)
    }
  ];
  
  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`);
    
    const start = performance.now();
    const { data, error } = await test.query();
    const end = performance.now();
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ Success: ${(end - start).toFixed(2)}ms (${data?.length || 0} records)`);
    }
  }
};

// Test batch operations vs sequential operations
export const testBatchOperations = async (userId: string, sampleData: any) => {
  console.log('📦 Testing Batch Operations...');
  
  // Test sequential operations (old way)
  console.log('\n--- Sequential Operations ---');
  const sequentialStart = performance.now();
  
  for (const exp of sampleData.experience.slice(0, 3)) { // Test with 3 items
    const start = performance.now();
    await supabase
      .from('work_experiences')
      .insert({
        user_id: userId,
        title: exp.title + ' (Sequential Test)',
        company_name: exp.company,
        description: exp.achievements.join(', ')
      });
    const end = performance.now();
    console.log(`Sequential insert took: ${(end - start).toFixed(2)}ms`);
  }
  
  const sequentialEnd = performance.now();
  console.log(`Total Sequential Time: ${(sequentialEnd - sequentialStart).toFixed(2)}ms`);
  
  // Test batch operations (new way)
  console.log('\n--- Batch Operations ---');
  const batchStart = performance.now();
  
  const batchData = sampleData.experience.slice(0, 3).map((exp: any) => ({
    user_id: userId,
    title: exp.title + ' (Batch Test)',
    company_name: exp.company,
    description: exp.achievements.join(', ')
  }));
  
  await supabase
    .from('work_experiences')
    .insert(batchData);
  
  const batchEnd = performance.now();
  console.log(`Total Batch Time: ${(batchEnd - batchStart).toFixed(2)}ms`);
  
  console.log(`\nBatch vs Sequential: ${((sequentialEnd - sequentialStart) - (batchEnd - batchStart)).toFixed(2)}ms improvement (${(((sequentialEnd - sequentialStart) - (batchEnd - batchStart)) / (sequentialEnd - sequentialStart) * 100).toFixed(1)}%)`);
  
  // Clean up test data
  await supabase
    .from('work_experiences')
    .delete()
    .eq('user_id', userId)
    .like('title', '%Test%');
};

// Main performance test runner
export const runPerformanceTests = async (userId: string) => {
  console.log('🏃‍♂️ Running Performance Test Suite...');
  
  try {
    // Test 1: Data fetching performance
    await testDataFetchingPerformance(userId);
    
    // Test 2: Index performance
    await testIndexPerformance(userId);
    
    // Test 3: Batch operations (with sample data)
    const sampleData = {
      experience: [
        { title: 'Test Engineer', company: 'Test Corp', achievements: ['Test achievement 1', 'Test achievement 2'] },
        { title: 'Test Manager', company: 'Test LLC', achievements: ['Test achievement 3', 'Test achievement 4'] },
        { title: 'Test Developer', company: 'Test Inc', achievements: ['Test achievement 5', 'Test achievement 6'] }
      ]
    };
    
    await testBatchOperations(userId, sampleData);
    
    console.log('✅ Performance tests completed!');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
};

// Helper function to add performance monitoring to any function
export const withPerformanceMonitoring = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  console.log(`⏱️ Starting: ${name}`);
  const start = performance.now();
  
  try {
    const result = await fn();
    const end = performance.now();
    console.log(`✅ Completed: ${name} in ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`❌ Failed: ${name} in ${(end - start).toFixed(2)}ms`, error);
    throw error;
  }
};