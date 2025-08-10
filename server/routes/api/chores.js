const express = require('express');
const database = require('../../services/database');
const router = express.Router();

// Chores API endpoints
router.get('/', async (req, res) => {
  try {
    const { status, assignedTo } = req.query;
    const chores = await database.getChores(status, assignedTo);
    res.json({ chores });
  } catch (error) {
    console.error('Error fetching chores:', error);
    res.status(500).json({ error: 'Failed to fetch chores' });
  }
});

router.post('/', async (req, res) => {
  try {
    const choreId = await database.addChore(req.body);
    res.status(201).json({ id: choreId, message: 'Chore created successfully' });
  } catch (error) {
    console.error('Error creating chore:', error);
    res.status(500).json({ error: 'Failed to create chore' });
  }
});

router.put('/:choreId', async (req, res) => {
  try {
    const choreId = parseInt(req.params.choreId);
    const changes = await database.updateChore(choreId, req.body);
    
    if (changes === 0) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    res.json({ message: 'Chore updated successfully' });
  } catch (error) {
    console.error('Error updating chore:', error);
    res.status(500).json({ error: 'Failed to update chore' });
  }
});

router.delete('/:choreId', async (req, res) => {
  try {
    const choreId = parseInt(req.params.choreId);
    // We'll implement this when needed
    res.json({ message: 'Delete chore - to be implemented' });
  } catch (error) {
    console.error('Error deleting chore:', error);
    res.status(500).json({ error: 'Failed to delete chore' });
  }
});

router.post('/:choreId/complete', async (req, res) => {
  try {
    const choreId = parseInt(req.params.choreId);
    const { memberId } = req.body;
    
    await database.completeChore(choreId, memberId);
    res.json({ message: 'Chore completed successfully' });
  } catch (error) {
    console.error('Error completing chore:', error);
    res.status(500).json({ error: 'Failed to complete chore' });
  }
});

// Family members endpoints
router.get('/members', async (req, res) => {
  try {
    const members = await database.getFamilyMembers();
    res.json({ members });
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

router.post('/members', async (req, res) => {
  try {
    const { name, color, role } = req.body;
    const memberId = await database.addFamilyMember(name, color, role);
    res.status(201).json({ id: memberId, message: 'Family member added successfully' });
  } catch (error) {
    console.error('Error adding family member:', error);
    res.status(500).json({ error: 'Failed to add family member' });
  }
});

module.exports = router;