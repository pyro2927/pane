const express = require('express');
const router = express.Router();

// Google OAuth endpoints - to be implemented
router.get('/google', (req, res) => {
  res.json({ message: 'Google OAuth - to be implemented' });
});

router.get('/google/callback', (req, res) => {
  res.json({ message: 'Google OAuth callback - to be implemented' });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout - to be implemented' });
});

module.exports = router;