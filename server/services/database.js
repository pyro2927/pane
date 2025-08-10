const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.dbPath = process.env.DATABASE_PATH || './config/pane.db';
    this.db = null;
    this.init();
  }

  init() {
    // Ensure the directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database:', this.dbPath);
        this.createTables();
      }
    });
  }

  createTables() {
    // Use serialize to ensure queries run in order
    this.db.serialize(() => {
      const queries = [
      // Family members table
      `CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#2196F3',
        avatar_url TEXT,
        role TEXT DEFAULT 'member',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Chores table
      `CREATE TABLE IF NOT EXISTS chores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to INTEGER,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        due_date DATETIME,
        completed_at DATETIME,
        points INTEGER DEFAULT 1,
        category TEXT DEFAULT 'general',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES family_members (id)
      )`,

      // Chore completion history
      `CREATE TABLE IF NOT EXISTS chore_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chore_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        points_earned INTEGER DEFAULT 0,
        FOREIGN KEY (chore_id) REFERENCES chores (id),
        FOREIGN KEY (member_id) REFERENCES family_members (id)
      )`,

      // Display configuration table
      `CREATE TABLE IF NOT EXISTS display_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Photo albums configuration
      `CREATE TABLE IF NOT EXISTS photo_albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_album_id TEXT UNIQUE,
        title TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        rotation_weight INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // OAuth tokens storage
      `CREATE TABLE IF NOT EXISTS oauth_tokens (
        service TEXT PRIMARY KEY,
        access_token TEXT,
        refresh_token TEXT,
        expires_at DATETIME,
        scope TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
      ];

      queries.forEach(query => {
        this.db.run(query, (err) => {
          if (err) {
            console.error('Error creating table:', err.message);
          }
        });
      });

      // Insert default configuration values after tables are created
      setTimeout(() => this.insertDefaultConfig(), 100);
    });
  }

  insertDefaultConfig() {
    const defaultConfigs = [
      { key: 'current_view', value: 'dashboard' },
      { key: 'photo_rotation_interval', value: '30000' },
      { key: 'calendar_refresh_interval', value: '300000' },
      { key: 'display_brightness', value: '80' },
      { key: 'sleep_schedule_enabled', value: '0' },
      { key: 'sleep_start_time', value: '22:00' },
      { key: 'wake_time', value: '07:00' }
    ];

    defaultConfigs.forEach(config => {
      this.db.run(
        'INSERT OR IGNORE INTO display_config (key, value) VALUES (?, ?)',
        [config.key, config.value],
        (err) => {
          if (err) console.error('Error inserting config:', err.message);
        }
      );
    });

    // Insert default family members if none exist
    this.db.get('SELECT COUNT(*) as count FROM family_members', (err, row) => {
      if (!err && row.count === 0) {
        const defaultMembers = [
          { name: 'Mom', color: '#E91E63', role: 'admin' },
          { name: 'Dad', color: '#3F51B5', role: 'admin' },
          { name: 'Child 1', color: '#4CAF50', role: 'member' },
          { name: 'Child 2', color: '#FF9800', role: 'member' }
        ];

        defaultMembers.forEach(member => {
          this.db.run(
            'INSERT INTO family_members (name, color, role) VALUES (?, ?, ?)',
            [member.name, member.color, member.role]
          );
        });
      }
    });
  }

  // Helper methods for database operations
  async getConfig(key) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT value FROM display_config WHERE key = ?',
        [key],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.value : null);
        }
      );
    });
  }

  async setConfig(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO display_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, value],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getFamilyMembers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM family_members ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async addFamilyMember(name, color = '#2196F3', role = 'member') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO family_members (name, color, role) VALUES (?, ?, ?)',
        [name, color, role],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getChores(status = null, assignedTo = null) {
    let query = `
      SELECT c.*, fm.name as assigned_name, fm.color as assigned_color
      FROM chores c 
      LEFT JOIN family_members fm ON c.assigned_to = fm.id
    `;
    const params = [];

    if (status || assignedTo) {
      query += ' WHERE ';
      const conditions = [];
      
      if (status) {
        conditions.push('c.status = ?');
        params.push(status);
      }
      
      if (assignedTo) {
        conditions.push('c.assigned_to = ?');
        params.push(assignedTo);
      }
      
      query += conditions.join(' AND ');
    }
    
    query += ' ORDER BY c.due_date ASC, c.priority DESC';

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async addChore(chore) {
    const { title, description, assigned_to, due_date, priority = 'normal', category = 'general', points = 1 } = chore;
    
    // Validate required fields
    if (!title) {
      throw new Error('Title is required for chores');
    }
    
    if (assigned_to) {
      // Verify the assigned member exists
      const member = await this.getFamilyMembers().then(members => 
        members.find(m => m.id === assigned_to)
      );
      if (!member) {
        throw new Error(`Family member with ID ${assigned_to} does not exist`);
      }
    }
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO chores (title, description, assigned_to, due_date, priority, category, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, assigned_to, due_date, priority, category, points],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async updateChore(id, updates) {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE chores SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  async completeChore(choreId, memberId) {
    const db = this.db;
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Get chore points
        db.get('SELECT points FROM chores WHERE id = ?', [choreId], (err, chore) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          // Update chore status
          db.run(
            'UPDATE chores SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['completed', choreId],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }

              // Record completion
              db.run(
                'INSERT INTO chore_completions (chore_id, member_id, points_earned) VALUES (?, ?, ?)',
                [choreId, memberId, chore.points],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                  } else {
                    db.run('COMMIT');
                    resolve(true);
                  }
                }
              );
            }
          );
        });
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err.message);
        else console.log('Database connection closed');
        resolve();
      });
    });
  }
}

// Export singleton instance
module.exports = new Database();