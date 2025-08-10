const express = require('express');
const router = express.Router();

// Photos API endpoints
router.get('/albums', (req, res) => {
  res.json({ message: 'Photo albums - to be implemented', albums: [] });
});

router.get('/albums/:albumId/photos', (req, res) => {
  res.json({ message: 'Album photos - to be implemented', photos: [] });
});

router.get('/random', (req, res) => {
  res.json({ message: 'Random photo - to be implemented', photo: null });
});

module.exports = router;