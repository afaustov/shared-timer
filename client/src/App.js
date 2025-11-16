import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// Automatic Socket.io URL detection
const getSocketUrl = () => {
  // Use environment variable if specified
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  
  // In production use the same domain
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  
  // In development use localhost
  return 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

function App() {
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [timer, setTimer] = useState({
    duration: 0,
    isRunning: false,
    remainingTime: 0
  });
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSessionId, setInputSessionId] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('session-created', ({ sessionId }) => {
      setSessionId(sessionId.toUpperCase());
      setIsHost(true);
    });

    newSocket.on('timer-state', (state) => {
      setTimer(state);
    });

    newSocket.on('timer-started', (state) => {
      setTimer(state);
    });

    newSocket.on('timer-paused', (state) => {
      setTimer(state);
    });

    newSocket.on('timer-resumed', (state) => {
      setTimer(state);
    });

    newSocket.on('timer-reset', (state) => {
      setTimer(state);
    });

    newSocket.on('timer-update', ({ remaining }) => {
      setTimer(prev => ({
        ...prev,
        remainingTime: remaining
      }));
    });

    newSocket.on('timer-finished', () => {
      setTimer(prev => ({
        ...prev,
        isRunning: false,
        remainingTime: 0
      }));
    });

    newSocket.on('session-error', ({ message }) => {
      alert(message);
    });

    newSocket.on('session-ended', () => {
      alert('Session ended by host');
      setSessionId('');
      setIsHost(false);
      setTimer({
        duration: 0,
        isRunning: false,
        remainingTime: 0
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Timer display update
  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev.remainingTime <= 0) {
            return { ...prev, isRunning: false, remainingTime: 0 };
          }
          return { ...prev, remainingTime: Math.max(0, prev.remainingTime - 100) };
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning]);

  const createSession = () => {
    if (socket) {
      socket.emit('create-session');
    }
  };

  const joinSession = () => {
    if (socket && inputSessionId.trim()) {
      const sessionIdUpper = inputSessionId.trim().toUpperCase();
      socket.emit('join-session', { sessionId: sessionIdUpper });
      setSessionId(sessionIdUpper);
      setIsHost(false);
    }
  };

  const startTimer = () => {
    if (socket && sessionId && isHost) {
      const duration = inputMinutes * 60 * 1000; // Convert to milliseconds
      socket.emit('start-timer', { sessionId, duration });
    }
  };

  const pauseTimer = () => {
    if (socket && sessionId && isHost) {
      socket.emit('pause-timer', { sessionId });
    }
  };

  const resumeTimer = () => {
    if (socket && sessionId && isHost) {
      socket.emit('resume-timer', { sessionId });
    }
  };

  const resetTimer = () => {
    if (socket && sessionId && isHost) {
      socket.emit('reset-timer', { sessionId });
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <div className="container">
        {!sessionId ? (
          <div className="session-setup">
          <h1 className="title">Shared Timer</h1>
          
          <div className="setup-options">
            <div className="setup-card setup-card-center">
              <button onClick={createSession} className="btn btn-primary btn-large">
                Create
              </button>
            </div>

            <div className="setup-card">
              <h2>Join</h2>
              <div className="input-group">
                <label>Session ID:</label>
                <input
                  type="text"
                  placeholder="Enter ID"
                  value={inputSessionId}
                  onChange={(e) => setInputSessionId(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && joinSession()}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <button onClick={joinSession} className="btn btn-secondary btn-large">
                Join
              </button>
            </div>
          </div>
        </div>
        ) : (
          <div className="timer-view">
            <div className="session-info">
              <div className="session-id">
                <span>Session ID: </span>
                <code>{sessionId.toUpperCase()}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(sessionId.toUpperCase())}
                  className="copy-btn"
                  title="Copy"
                >
                  📋
                </button>
              </div>
              <div className="role-badge">
                {isHost ? '👑 Host' : '👤 Participant'}
              </div>
            </div>

            <div className="timer-display">
              <div className={`timer-circle ${timer.isRunning ? 'running' : ''}`}>
                <div className="timer-time">
                  {formatTime(timer.remainingTime)}
                </div>
              </div>
            </div>

            {isHost && (
              <div className="timer-controls">
                {!timer.isRunning && timer.remainingTime === 0 ? (
                  <div className="start-controls">
                    <div className="input-group">
                      <label>Minutes:</label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={inputMinutes}
                        onChange={(e) => setInputMinutes(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <button onClick={startTimer} className="btn btn-primary btn-large">
                      ▶ Start
                    </button>
                  </div>
                ) : (
                  <div className="control-buttons">
                    {timer.isRunning ? (
                      <button onClick={pauseTimer} className="btn btn-secondary">
                        ⏸ Pause
                      </button>
                    ) : (
                      <button onClick={resumeTimer} className="btn btn-primary">
                        ▶ Resume
                      </button>
                    )}
                    <button onClick={resetTimer} className="btn btn-danger">
                      ↻ Reset
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isHost && (
              <div className="participant-message">
                Waiting for host to start timer...
              </div>
            )}

            <button 
              onClick={() => {
                setSessionId('');
                setIsHost(false);
                setTimer({
                  duration: 0,
                  isRunning: false,
                  remainingTime: 0
                });
              }}
              className="btn btn-link"
            >
              Leave Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

