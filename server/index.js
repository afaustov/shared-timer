const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Timer sessions storage
const sessions = new Map();

// Generate unique session ID (uppercase)
function generateSessionId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create new session
  socket.on('create-session', () => {
    const sessionId = generateSessionId();
    sessions.set(sessionId, {
      id: sessionId,
      timer: {
        duration: 0,
        isRunning: false,
        startTime: null,
        remainingTime: 0
      },
      host: socket.id,
      clients: []
    });
    
    socket.join(sessionId);
    socket.emit('session-created', { sessionId });
    console.log(`Session created: ${sessionId} by user ${socket.id}`);
  });

  // Join session
  socket.on('join-session', ({ sessionId }) => {
    // Convert ID to uppercase for case-insensitive matching
    const sessionIdUpper = sessionId.toUpperCase();
    const session = sessions.get(sessionIdUpper);
    
    if (!session) {
      socket.emit('session-error', { message: 'Session not found' });
      return;
    }

    socket.join(sessionIdUpper);
    
    if (socket.id !== session.host) {
      session.clients.push(socket.id);
    }
    
    // Send current timer state to new participant
    socket.emit('timer-state', session.timer);
    console.log(`User ${socket.id} joined session ${sessionIdUpper}`);
  });

  // Start timer (host only)
  socket.on('start-timer', ({ sessionId, duration }) => {
    const sessionIdUpper = sessionId.toUpperCase();
    const session = sessions.get(sessionIdUpper);
    
    if (!session || session.host !== socket.id) {
      return;
    }

    const startTime = Date.now();
    session.timer = {
      duration: duration,
      isRunning: true,
      startTime: startTime,
      remainingTime: duration
    };

    io.to(sessionIdUpper).emit('timer-started', session.timer);
    console.log(`Timer started in session ${sessionIdUpper}: ${duration}ms`);
  });

  // Pause timer (host only)
  socket.on('pause-timer', ({ sessionId }) => {
    const sessionIdUpper = sessionId.toUpperCase();
    const session = sessions.get(sessionIdUpper);
    
    if (!session || session.host !== socket.id) {
      return;
    }

    if (session.timer.isRunning) {
      const elapsed = Date.now() - session.timer.startTime;
      session.timer.remainingTime = Math.max(0, session.timer.remainingTime - elapsed);
      session.timer.isRunning = false;
      session.timer.startTime = null;
    }

    io.to(sessionIdUpper).emit('timer-paused', session.timer);
  });

  // Resume timer (host only)
  socket.on('resume-timer', ({ sessionId }) => {
    const sessionIdUpper = sessionId.toUpperCase();
    const session = sessions.get(sessionIdUpper);
    
    if (!session || session.host !== socket.id) {
      return;
    }

    if (!session.timer.isRunning && session.timer.remainingTime > 0) {
      session.timer.isRunning = true;
      session.timer.startTime = Date.now();
    }

    io.to(sessionIdUpper).emit('timer-resumed', session.timer);
  });

  // Reset timer (host only)
  socket.on('reset-timer', ({ sessionId }) => {
    const sessionIdUpper = sessionId.toUpperCase();
    const session = sessions.get(sessionIdUpper);
    
    if (!session || session.host !== socket.id) {
      return;
    }

    session.timer = {
      duration: 0,
      isRunning: false,
      startTime: null,
      remainingTime: 0
    };

    io.to(sessionIdUpper).emit('timer-reset', session.timer);
  });

  // Time synchronization (periodic)
  socket.on('sync-request', ({ sessionId }) => {
    const sessionIdUpper = sessionId.toUpperCase();
    const session = sessions.get(sessionIdUpper);
    if (session) {
      socket.emit('timer-state', session.timer);
    }
  });

  // User disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove session if host disconnected
    for (const [sessionId, session] of sessions.entries()) {
      if (session.host === socket.id) {
        io.to(sessionId).emit('session-ended');
        sessions.delete(sessionId);
        console.log(`Session ${sessionId} deleted`);
        break;
      } else {
        // Remove client from list
        const index = session.clients.indexOf(socket.id);
        if (index > -1) {
          session.clients.splice(index, 1);
        }
      }
    }
  });
});

// Periodic timer synchronization
setInterval(() => {
  for (const [sessionId, session] of sessions.entries()) {
    if (session.timer.isRunning && session.timer.startTime) {
      const elapsed = Date.now() - session.timer.startTime;
      const remaining = Math.max(0, session.timer.remainingTime - elapsed);
      
      if (remaining <= 0) {
        session.timer.isRunning = false;
        session.timer.remainingTime = 0;
        io.to(sessionId).emit('timer-finished');
      } else {
        io.to(sessionId).emit('timer-update', { remaining });
      }
    }
  }
}, 100); // Update every 100ms for smoothness

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

