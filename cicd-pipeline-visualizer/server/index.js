const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/database');
const pipelineRoutes = require('./routes/pipelines');
const metricsRoutes = require('./routes/metrics');
const githubRoutes = require('./routes/github');
const { initializeCronJobs } = require('./services/cronService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
db.connect()
  .then(() => {
    console.log('✅ Database connected successfully');
    // Initialize cron jobs after DB connection
    initializeCronJobs(io);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

// API Routes
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/github', githubRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);
  
  socket.on('subscribe-pipeline', (pipelineId) => {
    socket.join(`pipeline-${pipelineId}`);
    console.log(`📊 Client ${socket.id} subscribed to pipeline ${pipelineId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('📡 Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard available at ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

