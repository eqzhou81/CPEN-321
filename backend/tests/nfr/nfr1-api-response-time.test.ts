import request from 'supertest';
import { app } from '../../src/config/app';

describe('NFR-1: API Response Time', () => {
  const originalBypassAuth = process.env.BYPASS_AUTH;
  
  beforeAll(() => {
    process.env.BYPASS_AUTH = 'true';
  });

  afterAll(() => {
    if (originalBypassAuth !== undefined) {
      process.env.BYPASS_AUTH = originalBypassAuth;
    } else {
      delete process.env.BYPASS_AUTH;
    }
  });

  const endpoints: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    requiresAuth: boolean;
    body?: any;
    description: string;
    skip?: boolean;
  }> = [
    // Auth endpoints (no auth required)
    {
      method: 'POST',
      path: '/api/auth/signin',
      requiresAuth: false,
      body: { email: 'test@example.com', password: 'test123' },
      description: 'POST /api/auth/signin'
    },
    {
      method: 'POST',
      path: '/api/auth/signup',
      requiresAuth: false,
      body: { email: 'test@example.com', password: 'test123', name: 'Test User' },
      description: 'POST /api/auth/signup'
    },
    
    // Jobs endpoints (require auth)
    {
      method: 'GET',
      path: '/api/jobs',
      requiresAuth: true,
      description: 'GET /api/jobs'
    },
    {
      method: 'GET',
      path: '/api/jobs/search?query=engineer',
      requiresAuth: true,
      description: 'GET /api/jobs/search'
    },
    {
      method: 'GET',
      path: '/api/jobs/by-company?company=Google',
      requiresAuth: true,
      description: 'GET /api/jobs/by-company'
    },
    {
      method: 'GET',
      path: '/api/jobs/statistics',
      requiresAuth: true,
      description: 'GET /api/jobs/statistics'
    },
    {
      method: 'POST',
      path: '/api/jobs',
      requiresAuth: true,
      body: {
        title: 'Software Engineer',
        company: 'Test Company',
        location: 'Test Location',
        description: 'Test Description',
        applicationDate: new Date().toISOString()
      },
      description: 'POST /api/jobs'
    },
    
    // Sessions endpoints (require auth)
    {
      method: 'GET',
      path: '/api/sessions',
      requiresAuth: true,
      description: 'GET /api/sessions'
    },
    
    // Questions endpoints (require auth)
    {
      method: 'GET',
      path: '/api/questions/job/507f1f77bcf86cd799439011/progress',
      requiresAuth: true,
      description: 'GET /api/questions/job/:jobId/progress'
    },
    
    // User endpoints (require auth)
    {
      method: 'GET',
      path: '/api/user/profile',
      requiresAuth: true,
      description: 'GET /api/user/profile'
    },
    
    // Discussions endpoints (require auth)
    {
      method: 'GET',
      path: '/api/discussions',
      requiresAuth: true,
      description: 'GET /api/discussions'
    },
    
  ];

  const calculatePercentile = (sortedArray: number[], percentile: number): number => {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  };

  const makeRequest = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<{ responseTime: number; statusCode: number; error?: string }> => {
    const startTime = Date.now();
    
    try {
      let req = request(app);
      
      switch (method) {
        case 'GET':
          req = req.get(path);
          break;
        case 'POST':
          req = req.post(path);
          if (body) req = req.send(body);
          break;
        case 'PUT':
          req = req.put(path);
          if (body) req = req.send(body);
          break;
        case 'DELETE':
          req = req.delete(path);
          break;
      }
      
      const response = await req;
      const responseTime = Date.now() - startTime;
      
      return {
        responseTime,
        statusCode: response.status
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        responseTime,
        statusCode: error.status || 500,
        error: error.message
      };
    }
  };

  const loadTestEndpoint = async (
    endpoint: typeof endpoints[0],
    concurrency: number
  ): Promise<number[]> => {
    const promises: Promise<{ responseTime: number; statusCode: number; error?: string }>[] = [];
    
    for (let i = 0; i < concurrency; i++) {
      promises.push(makeRequest(endpoint.method, endpoint.path, endpoint.body));
    }
    
    const results = await Promise.all(promises);
    return results.map(r => r.responseTime);
  };

  it('should have p95 response time ≤ 3 seconds under normal load (≤ 100 concurrent requests)', async () => {
    const testableEndpoints = endpoints.filter(e => !e.skip);
    expect(testableEndpoints.length).toBeGreaterThan(0);
    
    const totalConcurrency = 100;
    const requestsPerEndpoint = Math.ceil(totalConcurrency / testableEndpoints.length);
    
    console.log(`\n📊 Running NFR-1 test with ${totalConcurrency} concurrent requests across ${testableEndpoints.length} endpoints`);
    console.log(`   Requests per endpoint: ~${requestsPerEndpoint}`);
    
    const allResponseTimes: number[] = [];
    const endpointTests = testableEndpoints.map(async (endpoint) => {
      const responseTimes = await loadTestEndpoint(endpoint, requestsPerEndpoint);
      allResponseTimes.push(...responseTimes);
      
      const sorted = [...responseTimes].sort((a, b) => a - b);
      const p50 = calculatePercentile(sorted, 50);
      const p95 = calculatePercentile(sorted, 95);
      const p99 = calculatePercentile(sorted, 99);
      const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const min = Math.min(...responseTimes);
      const max = Math.max(...responseTimes);
      
      console.log(`   ${endpoint.description}:`);
      console.log(`     Avg: ${avg.toFixed(2)}ms, Min: ${min}ms, Max: ${max}ms`);
      console.log(`     P50: ${p50}ms, P95: ${p95}ms, P99: ${p99}ms`);
      
      return { endpoint: endpoint.description, p95, avg, max };
    });
    
    const endpointResults = await Promise.all(endpointTests);
    const sortedResponseTimes = allResponseTimes.sort((a, b) => a - b);
    const p50 = calculatePercentile(sortedResponseTimes, 50);
    const p90 = calculatePercentile(sortedResponseTimes, 90);
    const p95 = calculatePercentile(sortedResponseTimes, 95);
    const p99 = calculatePercentile(sortedResponseTimes, 99);
    const avg = allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;
    const min = Math.min(...allResponseTimes);
    const max = Math.max(...allResponseTimes);
    
    console.log(`\n📈 Overall Statistics (${allResponseTimes.length} total requests):`);
    console.log(`   Average: ${avg.toFixed(2)}ms`);
    console.log(`   Min: ${min}ms, Max: ${max}ms`);
    console.log(`   P50: ${p50}ms, P90: ${p90}ms, P95: ${p95}ms, P99: ${p99}ms`);
    
    const slowEndpoints = endpointResults.filter(r => r.p95 > 3000);
    if (slowEndpoints.length > 0) {
      console.log(`\n⚠️  Endpoints with P95 > 3 seconds:`);
      slowEndpoints.forEach(e => {
        console.log(`   ${e.endpoint}: P95 = ${e.p95}ms`);
      });
    }
    
    expect(p95).toBeLessThanOrEqual(3000);
    expect(allResponseTimes.length).toBeGreaterThan(0);
    expect(avg).toBeLessThan(5000);
  }, 60000);

  it('should provide detailed performance metrics for each endpoint', async () => {
    const testableEndpoints = endpoints.filter(e => !e.skip);
    const concurrency = 10;
    
    const metrics: Array<{
      endpoint: string;
      p50: number;
      p95: number;
      p99: number;
      avg: number;
      min: number;
      max: number;
    }> = [];
    
    for (const endpoint of testableEndpoints) {
      const responseTimes = await loadTestEndpoint(endpoint, concurrency);
      const sorted = [...responseTimes].sort((a, b) => a - b);
      
      metrics.push({
        endpoint: endpoint.description,
        p50: calculatePercentile(sorted, 50),
        p95: calculatePercentile(sorted, 95),
        p99: calculatePercentile(sorted, 99),
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes)
      });
    }
    
    const failingEndpoints = metrics.filter(m => m.p95 > 3000);
    
    if (failingEndpoints.length > 0) {
      console.log('\n⚠️  Endpoints failing individual p95 test:');
      failingEndpoints.forEach(m => {
        console.log(`   ${m.endpoint}: P95 = ${m.p95}ms (threshold: 3000ms)`);
      });
    }
    
    expect(failingEndpoints.length).toBe(0);
  }, 60000);
});

