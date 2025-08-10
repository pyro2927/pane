const request = require('supertest');
const path = require('path');

describe('API Integration Tests', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = ':memory:'; // Use in-memory database for integration tests
    
    // Mock console to reduce test noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Import app after setting environment
    const appModule = require('../../server/app');
    app = appModule.app;
    server = appModule.io.httpServer || appModule.app;

    // Wait for database initialization
    await global.testUtils.sleep(300);
  });

  afterAll(async () => {
    if (server && server.close) {
      await new Promise(resolve => server.close(resolve));
    }
    jest.restoreAllMocks();
  });

  describe('Health Endpoint', () => {
    test('GET /health should return status ok', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Static File Serving', () => {
    test('GET / should serve main HTML file', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Family Pane');
    });

    test('GET /css/main.css should serve CSS file', async () => {
      const response = await request(app)
        .get('/css/main.css')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/css/);
      expect(response.text).toContain('Material Design');
    });

    test('GET /js/app.js should serve JavaScript file', async () => {
      const response = await request(app)
        .get('/js/app.js')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/javascript/);
      expect(response.text).toContain('FamilyPaneApp');
    });
  });

  describe('Family Members API', () => {
    test('GET /api/chores/members should return family members', async () => {
      const response = await request(app)
        .get('/api/chores/members')
        .expect(200);

      expect(response.body).toHaveProperty('members');
      expect(Array.isArray(response.body.members)).toBe(true);
      expect(response.body.members.length).toBeGreaterThan(0);

      // Check structure of family member objects
      const member = response.body.members[0];
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('color');
      expect(member).toHaveProperty('role');
    });

    test('POST /api/chores/members should create new family member', async () => {
      const newMember = global.testUtils.createTestUser({ name: 'API Test User' });

      const response = await request(app)
        .post('/api/chores/members')
        .send(newMember)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Family member added successfully');

      // Verify member was created
      const getResponse = await request(app)
        .get('/api/chores/members')
        .expect(200);

      const createdMember = getResponse.body.members.find(m => m.id === response.body.id);
      expect(createdMember).toBeDefined();
      expect(createdMember.name).toBe(newMember.name);
    });

    test('POST /api/chores/members should reject invalid data', async () => {
      const response = await request(app)
        .post('/api/chores/members')
        .send({}) // Missing required fields
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Chores API', () => {
    let testMemberId;

    beforeEach(async () => {
      // Get a test member ID
      const response = await request(app).get('/api/chores/members');
      testMemberId = response.body.members[0].id;
    });

    test('GET /api/chores should return chores list', async () => {
      const response = await request(app)
        .get('/api/chores')
        .expect(200);

      expect(response.body).toHaveProperty('chores');
      expect(Array.isArray(response.body.chores)).toBe(true);
    });

    test('POST /api/chores should create new chore', async () => {
      const newChore = global.testUtils.createTestChore({
        assigned_to: testMemberId,
        title: 'API Test Chore'
      });

      const response = await request(app)
        .post('/api/chores')
        .send(newChore)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Chore created successfully');

      // Verify chore was created
      const getResponse = await request(app)
        .get('/api/chores')
        .expect(200);

      const createdChore = getResponse.body.chores.find(c => c.id === response.body.id);
      expect(createdChore).toBeDefined();
      expect(createdChore.title).toBe(newChore.title);
      expect(createdChore.assigned_to).toBe(testMemberId);
    });

    test('PUT /api/chores/:id should update chore', async () => {
      // Create a chore first
      const newChore = global.testUtils.createTestChore({
        assigned_to: testMemberId
      });

      const createResponse = await request(app)
        .post('/api/chores')
        .send(newChore)
        .expect(201);

      const choreId = createResponse.body.id;

      // Update the chore
      const updateResponse = await request(app)
        .put(`/api/chores/${choreId}`)
        .send({ status: 'in-progress' })
        .expect(200);

      expect(updateResponse.body.message).toBe('Chore updated successfully');

      // Verify update
      const getResponse = await request(app)
        .get('/api/chores')
        .expect(200);

      const updatedChore = getResponse.body.chores.find(c => c.id === choreId);
      expect(updatedChore.status).toBe('in-progress');
    });

    test('PUT /api/chores/:id should return 404 for non-existent chore', async () => {
      const response = await request(app)
        .put('/api/chores/9999')
        .send({ status: 'completed' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/chores/:id/complete should complete chore', async () => {
      // Create a chore first
      const newChore = global.testUtils.createTestChore({
        assigned_to: testMemberId,
        points: 3
      });

      const createResponse = await request(app)
        .post('/api/chores')
        .send(newChore)
        .expect(201);

      const choreId = createResponse.body.id;

      // Complete the chore
      const completeResponse = await request(app)
        .post(`/api/chores/${choreId}/complete`)
        .send({ memberId: testMemberId })
        .expect(200);

      expect(completeResponse.body.message).toBe('Chore completed successfully');

      // Verify completion
      const getResponse = await request(app)
        .get('/api/chores')
        .expect(200);

      const completedChore = getResponse.body.chores.find(c => c.id === choreId);
      expect(completedChore.status).toBe('completed');
      expect(completedChore.completed_at).toBeTruthy();
    });

    test('GET /api/chores should support status filtering', async () => {
      // Create chores with different statuses
      const pendingChore = await request(app)
        .post('/api/chores')
        .send(global.testUtils.createTestChore({
          title: 'Pending Test Chore',
          assigned_to: testMemberId
        }));

      const completedChoreRes = await request(app)
        .post('/api/chores')
        .send(global.testUtils.createTestChore({
          title: 'Completed Test Chore',
          assigned_to: testMemberId
        }));

      // Mark one as completed
      await request(app)
        .put(`/api/chores/${completedChoreRes.body.id}`)
        .send({ status: 'completed' });

      // Test filtering
      const pendingResponse = await request(app)
        .get('/api/chores?status=pending')
        .expect(200);

      const completedResponse = await request(app)
        .get('/api/chores?status=completed')
        .expect(200);

      expect(pendingResponse.body.chores.every(c => c.status === 'pending')).toBe(true);
      expect(completedResponse.body.chores.every(c => c.status === 'completed')).toBe(true);
    });

    test('GET /api/chores should support assignee filtering', async () => {
      const members = await request(app).get('/api/chores/members');
      const member1 = members.body.members[0];
      const member2 = members.body.members[1];

      // Create chores for different members
      await request(app)
        .post('/api/chores')
        .send(global.testUtils.createTestChore({
          title: 'Member 1 Chore',
          assigned_to: member1.id
        }));

      await request(app)
        .post('/api/chores')
        .send(global.testUtils.createTestChore({
          title: 'Member 2 Chore',
          assigned_to: member2.id
        }));

      // Test filtering by assignee
      const member1Response = await request(app)
        .get(`/api/chores?assignedTo=${member1.id}`)
        .expect(200);

      const member2Response = await request(app)
        .get(`/api/chores?assignedTo=${member2.id}`)
        .expect(200);

      expect(member1Response.body.chores.every(c => c.assigned_to === member1.id)).toBe(true);
      expect(member2Response.body.chores.every(c => c.assigned_to === member2.id)).toBe(true);
    });
  });

  describe('Configuration API', () => {
    test('GET /api/config/display should return display config', async () => {
      const response = await request(app)
        .get('/api/config/display')
        .expect(200);

      expect(response.body).toHaveProperty('config');
      expect(typeof response.body.config).toBe('object');
    });

    test('GET /api/config/system/info should return system info', async () => {
      const response = await request(app)
        .get('/api/config/system/info')
        .expect(200);

      expect(response.body).toHaveProperty('info');
      expect(response.body.info).toHaveProperty('platform');
      expect(response.body.info).toHaveProperty('arch');
      expect(response.body.info).toHaveProperty('nodeVersion');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/chores')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('strict-transport-security');
    });
  });
});