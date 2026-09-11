import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Set K6_SCENARIO=ci in CI to run only smoke, load, and stress (skips spike and soak).
// Omit or set to 'all' to run all scenarios locally.
const scenario = __ENV.K6_SCENARIO || 'all';

// Custom metrics
const pageLoadTime = new Trend('page_load_time', true);
const failedRequests = new Counter('failed_requests');
const successRate = new Rate('success_rate');

const allScenarios = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
    tags: { scenario: 'smoke' },
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 20 },
      { duration: '3m', target: 20 },
      { duration: '1m', target: 0 },
    ],
    tags: { scenario: 'load' },
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 50 },
      { duration: '5m', target: 50 },
      { duration: '2m', target: 0 },
    ],
    tags: { scenario: 'stress' },
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 100 }, // spike up instantly
      { duration: '1m', target: 100 },  // hold spike
      { duration: '10s', target: 0 },   // drop back down
    ],
    tags: { scenario: 'spike' },
  },
  soak: {
    executor: 'constant-vus',
    vus: 10,
    duration: '2h',                     // long run to catch memory leaks
    tags: { scenario: 'soak' },
  },
};

const ciScenarios = ['smoke', 'load', 'stress'];

export const options = {
  scenarios: scenario === 'ci'
    ? Object.fromEntries(Object.entries(allScenarios).filter(([k]) => ciScenarios.includes(k)))
    : allScenarios,
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
    page_load_time: ['p(95)<600'],
    success_rate: ['rate>0.99'],
  },
};

const pages = ['/', '/login', '/dashboard', '/courses'];

export default function loadTestPages() {
  for (const page of pages) {
    const res = http.get(`${BASE_URL}${page}`);

    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    pageLoadTime.add(res.timings.duration, { page });
    successRate.add(ok);
    if (!ok) failedRequests.add(1, { page });

    sleep(1);
  }
}
