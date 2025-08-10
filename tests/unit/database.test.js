const fs = require('fs');
const path = require('path');

describe('Database Service', () => {
  let Database;
  let db;

  beforeAll(() => {
    // Ensure fixtures directory exists
    const fixturesDir = path.join(__dirname, '..', 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // Clear the require cache to get a fresh instance
    jest.resetModules();
    
    // Mock console methods to avoid spam during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Require database after setting up mocks
    Database = require('../../server/services/database');
    db = Database;
    
    // Wait for database initialization
    return new Promise(resolve => setTimeout(resolve, 200));
  });

  afterEach(async () => {
    if (db && db.close) {
      await db.close();
    }
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize database connection', () => {
      expect(db).toBeDefined();
      expect(typeof db.getFamilyMembers).toBe('function');
    });

    test('should initialize with default family members', async () => {
      const members = await db.getFamilyMembers();
      expect(members).toHaveLength(4);
      expect(members.map(m => m.name)).toEqual(
        expect.arrayContaining(['Mom', 'Dad', 'Child 1', 'Child 2'])
      );
    });
  });

  describe('Family Members', () => {
    test('should add a new family member', async () => {
      const testUser = global.testUtils.createTestUser({ name: 'New Member' });
      
      const memberId = await db.addFamilyMember(testUser.name, testUser.color, testUser.role);
      expect(memberId).toBeGreaterThan(0);

      const members = await db.getFamilyMembers();
      const newMember = members.find(m => m.id === memberId);
      expect(newMember).toBeDefined();
      expect(newMember.name).toBe(testUser.name);
      expect(newMember.color).toBe(testUser.color);
      expect(newMember.role).toBe(testUser.role);
    });

    test('should not allow duplicate family member names', async () => {
      await expect(
        db.addFamilyMember('Mom', '#FF0000', 'member')
      ).rejects.toThrow();
    });

    test('should get all family members', async () => {
      const members = await db.getFamilyMembers();
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);
      
      // Check structure of family member objects
      const member = members[0];
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('color');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('created_at');
    });
  });

  describe('Chores Management', () => {
    let testMemberId;

    beforeEach(async () => {
      const members = await db.getFamilyMembers();
      testMemberId = members[0].id;
    });

    test('should add a new chore', async () => {
      const testChore = global.testUtils.createTestChore({
        assigned_to: testMemberId
      });

      const choreId = await db.addChore(testChore);
      expect(choreId).toBeGreaterThan(0);

      const chores = await db.getChores();
      const newChore = chores.find(c => c.id === choreId);
      expect(newChore).toBeDefined();
      expect(newChore.title).toBe(testChore.title);
      expect(newChore.assigned_to).toBe(testMemberId);
    });

    test('should get chores by status', async () => {
      // Add test chores
      await db.addChore(global.testUtils.createTestChore({
        title: 'Pending Chore',
        assigned_to: testMemberId
      }));

      const choreId = await db.addChore(global.testUtils.createTestChore({
        title: 'Completed Chore',
        assigned_to: testMemberId
      }));

      // Complete one chore
      await db.updateChore(choreId, { status: 'completed' });

      // Test filtering by status
      const pendingChores = await db.getChores('pending');
      const completedChores = await db.getChores('completed');

      expect(pendingChores.length).toBeGreaterThan(0);
      expect(completedChores.length).toBeGreaterThan(0);
      expect(pendingChores.find(c => c.title === 'Pending Chore')).toBeDefined();
      expect(completedChores.find(c => c.title === 'Completed Chore')).toBeDefined();
    });

    test('should get chores by assigned member', async () => {
      const members = await db.getFamilyMembers();
      const member1 = members[0];
      const member2 = members[1];

      await db.addChore(global.testUtils.createTestChore({
        title: 'Member 1 Chore',
        assigned_to: member1.id
      }));

      await db.addChore(global.testUtils.createTestChore({
        title: 'Member 2 Chore',
        assigned_to: member2.id
      }));

      const member1Chores = await db.getChores(null, member1.id);
      const member2Chores = await db.getChores(null, member2.id);

      expect(member1Chores.length).toBeGreaterThan(0);
      expect(member2Chores.length).toBeGreaterThan(0);
      expect(member1Chores.every(c => c.assigned_to === member1.id)).toBe(true);
      expect(member2Chores.every(c => c.assigned_to === member2.id)).toBe(true);
    });

    test('should update chore status', async () => {
      const choreId = await db.addChore(global.testUtils.createTestChore({
        assigned_to: testMemberId
      }));

      const changes = await db.updateChore(choreId, { status: 'in-progress' });
      expect(changes).toBe(1);

      const chores = await db.getChores();
      const updatedChore = chores.find(c => c.id === choreId);
      expect(updatedChore.status).toBe('in-progress');
    });

    test('should complete chore and record completion', async () => {
      const choreId = await db.addChore(global.testUtils.createTestChore({
        assigned_to: testMemberId,
        points: 5
      }));

      const result = await db.completeChore(choreId, testMemberId);
      expect(result).toBe(true);

      const chores = await db.getChores();
      const completedChore = chores.find(c => c.id === choreId);
      expect(completedChore.status).toBe('completed');
      expect(completedChore.completed_at).toBeTruthy();
    });

    test('should return chores with member information', async () => {
      await db.addChore(global.testUtils.createTestChore({
        assigned_to: testMemberId
      }));

      const chores = await db.getChores();
      const chore = chores[0];
      
      expect(chore).toHaveProperty('assigned_name');
      expect(chore).toHaveProperty('assigned_color');
      expect(chore.assigned_name).toBeTruthy();
    });
  });

  describe('Configuration Management', () => {
    test('should set and get configuration values', async () => {
      await db.setConfig('test_key', 'test_value');
      const value = await db.getConfig('test_key');
      expect(value).toBe('test_value');
    });

    test('should return null for non-existent config keys', async () => {
      const value = await db.getConfig('non_existent_key');
      expect(value).toBeNull();
    });

    test('should update existing configuration values', async () => {
      await db.setConfig('update_test', 'initial_value');
      await db.setConfig('update_test', 'updated_value');
      
      const value = await db.getConfig('update_test');
      expect(value).toBe('updated_value');
    });

    test('should have default configuration values', async () => {
      const currentView = await db.getConfig('current_view');
      expect(currentView).toBe('dashboard');

      const photoInterval = await db.getConfig('photo_rotation_interval');
      expect(photoInterval).toBe('30000');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close database to simulate connection error
      await db.close();

      // Should reject with error
      await expect(db.getFamilyMembers()).rejects.toThrow();
    });

    test('should validate chore data', async () => {
      // Test with missing required fields
      await expect(db.addChore({})).rejects.toThrow();
      
      // Test with invalid assigned_to
      await expect(db.addChore({
        title: 'Test Chore',
        assigned_to: 9999 // Non-existent member
      })).rejects.toThrow();
    });
  });
});