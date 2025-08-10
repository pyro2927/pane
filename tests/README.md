# Family Pane Test Suite

Comprehensive test suite using Jest and Supertest for the Family Pane application.

## Test Structure

```
tests/
├── setup.js                    # Global test configuration
├── unit/                       # Unit tests
│   └── database.test.js        # Database service tests
├── integration/                # Integration tests
│   └── api.test.js            # API endpoint tests
└── fixtures/                  # Test data and utilities
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI (no watch, with coverage)
npm run test:ci
```

### Test Environment

Tests use an in-memory SQLite database (`:memory:`) for isolation and speed. Each test gets a fresh database instance.

## Test Coverage

Current coverage targets:
- **Statements**: 70%+
- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+

## Test Categories

### Unit Tests

**Database Service** (`tests/unit/database.test.js`)
- Database initialization and connection
- Family member CRUD operations
- Chore management with status transitions
- Configuration key-value storage
- Data validation and error handling

Coverage: 85%+ of database service functionality

### Integration Tests

**API Endpoints** (`tests/integration/api.test.js`)
- HTTP server functionality
- Static file serving
- REST API endpoints
- Request/response validation
- Error handling and status codes
- Security headers

Coverage: All major API routes and error conditions

## Test Utilities

Global test utilities are available in all test files:

```javascript
// Create test user data
const testUser = global.testUtils.createTestUser({
  name: 'Custom Name',
  color: '#FF0000'
});

// Create test chore data
const testChore = global.testUtils.createTestChore({
  title: 'Custom Chore',
  assigned_to: 1
});

// Utility for async delays
await global.testUtils.sleep(100);
```

## GitHub Actions Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Scheduled weekly compatibility checks

### CI Pipeline

1. **Test Suite**: Runs all tests with coverage
2. **Code Quality**: Linting and security audits
3. **Build Test**: Production build validation
4. **Performance**: Basic performance benchmarks
5. **Raspberry Pi**: ARM compatibility checks

### Artifacts

- Test coverage reports uploaded to Codecov
- Test results archived for 7 days
- Coverage HTML reports in `/coverage` directory

## Writing New Tests

### Test File Structure

```javascript
describe('Feature Name', () => {
  let testData;

  beforeEach(() => {
    // Setup for each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Specific functionality', () => {
    test('should do something specific', async () => {
      // Test implementation
      expect(result).toBe(expected);
    });
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should clearly describe what's being tested
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Async/Await**: Use async/await for better error handling
5. **Mock External Dependencies**: Use mocks for external services

### API Testing

```javascript
const response = await request(app)
  .post('/api/endpoint')
  .send(testData)
  .expect(201);

expect(response.body).toMatchObject(expectedResponse);
```

### Database Testing

```javascript
const result = await db.someMethod(testData);
expect(result).toBeDefined();
expect(result.id).toBeGreaterThan(0);
```

## Debugging Tests

### Enable Verbose Output

```bash
JEST_VERBOSE=true npm test
```

### Run Specific Tests

```bash
# Run specific test file
npm test -- tests/unit/database.test.js

# Run specific test pattern
npm test -- --testNamePattern="should add a new chore"

# Run in debug mode
npm test -- --runInBand --detectOpenHandles
```

### Common Issues

1. **Database Connection Errors**: Tests use in-memory DB, check setup.js
2. **Async Issues**: Ensure proper async/await usage
3. **Port Conflicts**: Tests use random ports, shouldn't conflict
4. **File Permissions**: In-memory DB avoids file permission issues

## Performance Testing

Basic performance tests run in CI for:
- API response times
- Memory usage monitoring
- Static asset loading times

For detailed performance testing:
```bash
# Start server and run manual performance tests
npm start &
# Run your performance testing tools
```

## Future Enhancements

Planned test additions:
- [ ] Frontend JavaScript unit tests
- [ ] E2E tests with Playwright
- [ ] Visual regression tests
- [ ] Load testing with Artillery
- [ ] Security testing integration
- [ ] Mock Google API responses

## Troubleshooting

### Tests Fail on Different Machines

- Ensure Node.js version matches (18.19.0)
- Run `npm ci` instead of `npm install`
- Check that in-memory database is being used

### Coverage Too Low

- Add tests for uncovered branches
- Test error conditions and edge cases
- Mock external dependencies properly

### Slow Tests

- Use in-memory database (already configured)
- Minimize setup/teardown operations
- Run tests in parallel (Jest default)