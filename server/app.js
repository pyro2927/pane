const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing middleware with error handling
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parsing error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON syntax' });
  }
  next(err);
});

// Static files - serve display files at root for main interface
app.use(express.static(path.join(__dirname, '../client/display')));
app.use('/admin', express.static(path.join(__dirname, '../client/config')));
app.use('/assets', express.static(path.join(__dirname, '../client/assets')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/calendar', require('./routes/api/calendar'));
app.use('/api/photos', require('./routes/api/photos'));
app.use('/api/chores', require('./routes/api/chores'));
app.use('/api/config', require('./routes/config'));

// Main display route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/display/index.html'));
});

// Configuration interface route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/config/admin.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: require('../package.json').version 
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle view switching from main display
  socket.on('switch-view', (viewName) => {
    console.log('View switch requested:', viewName);
    io.emit('view-changed', viewName);
  });

  // Handle configuration updates from admin interface
  socket.on('config-update', (config) => {
    console.log('Configuration updated:', config);
    io.emit('config-changed', config);
  });

  // Handle chore updates
  socket.on('chore-update', (choreData) => {
    console.log('Chore updated:', choreData);
    io.emit('chore-changed', choreData);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Family Pane server running on port ${PORT}`);
  console.log(`Main display: http://localhost:${PORT}`);
  console.log(`Admin interface: http://localhost:${PORT}/admin`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };