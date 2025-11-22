# Shared Timer

Web application for synchronized timer between multiple devices. One user (host) can start the timer, and other participants see synchronized time in real-time.

## Features

- ✅ Create timer sessions
- ✅ Join session by ID
- ✅ Real-time timer synchronization via WebSocket
- ✅ Timer control (start, pause, reset) by host only
- ✅ Minimalist and modern design
- ✅ Responsive interface for mobile devices
- ✅ Ready for cloud hosting deployment

## Technologies

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: React
- **Synchronization**: WebSocket (Socket.io)
- **Deployment**: Render ready

## Project Structure

```
shared-timer-app/
├── server/
│   └── index.js          # Backend server with Socket.io
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.js        # Main component
│   │   ├── App.css       # Styles
│   │   └── index.js      # Entry point
│   └── package.json
├── package.json
└── README.md
```

## License

MIT

