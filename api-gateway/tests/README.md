# API Gateway Tests

## Overview

This test suite provides comprehensive coverage for the API Gateway, including integration tests for proxying requests and unit tests for configuration modules.

## Test Structure

```
api-gateway/
├── tests/
│   ├── integration/
│   │   ├── test-helper.js      # Mock backend services setup
│   │   └── gateway.test.js     # Integration tests
│   └── unit/
│       └── config.test.js      # Unit tests for config modules
└── spec/
    └── support/
        └── jasmine.json        # Jasmine configuration
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Specific Test File
```bash
npx jasmine tests/integration/gateway.test.js
```

## Test Coverage

### Integration Tests (`gateway.test.js`)

Tests the API Gateway's ability to proxy requests to backend services:

- **Health Check**: Verifies gateway health endpoint
- **Auth Service Proxy**:
  - User signup proxying
  - User login proxying
  - Error handling for invalid requests
- **Music Catalog Service Proxy**:
  - Artist search proxying
  - Query parameter validation
- **Error Handling**:
  - 404 for unknown routes
  - Service unavailable scenarios
- **Security**: Headers and CORS configuration

### Unit Tests (`config.test.js`)

Tests individual configuration modules:

- **Service Configuration**:
  - Environment variable loading
  - Default port fallbacks
  - Service URL generation
- **Proxy Configuration**:
  - Path rewriting rules
  - Error handlers
  - Request logging
- **Middleware**:
  - Request logger functionality
  - Not found handler

## Mock Services

The test helper creates mock backend services that simulate:
- **Auth Service** (port 3001): Handles signup/login
- **Music Catalog Service** (port 3002): Handles artist search

These mocks allow testing the gateway in isolation without requiring actual backend services.

## Test Patterns

Following the same patterns as auth-service tests:

```javascript
describe('Feature', () => {
    let variable;
    
    const exec = async () => {
        return await request(app)
            .post('/endpoint')
            .send({ data });
    };
    
    beforeEach(() => {
        // Setup test data
    });
    
    it('should do something', async () => {
        const res = await exec();
        expect(res.status).toBe(200);
    });
});
```

## Dependencies

- **jasmine**: Test framework
- **supertest**: HTTP assertion library
- **express**: For creating mock services

## Notes

- Tests run in `NODE_ENV=test` mode
- Mock services start before tests and stop after
- Each test is isolated and doesn't affect others
- Integration tests verify end-to-end proxy functionality
- Unit tests verify individual module behavior
