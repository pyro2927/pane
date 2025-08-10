const express = require('express');
const router = express.Router();

// Configuration endpoints
router.get('/display', (req, res) => {
  res.json({ 
    message: 'Display configuration - to be implemented',
    config: {
      currentView: 'dashboard',
      photoRotationInterval: 30000,
      calendarRefreshInterval: 300000
    }
  });
});

router.post('/display', (req, res) => {
  res.json({ message: 'Update display configuration - to be implemented' });
});

router.get('/network/devices', (req, res) => {
  res.json({ message: 'Network device discovery - to be implemented', devices: [] });
});

router.get('/system/info', (req, res) => {
  res.json({ 
    message: 'System information',
    info: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime()
    }
  });
});

module.exports = router;