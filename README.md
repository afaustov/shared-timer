# Shared Timer

Web application for synchronized timer between multiple devices. One user (host) can start the timer, and other participants see synchronized time in real-time.

## 🚀 Quick Start

### For local development:
1. Install Node.js: https://nodejs.org/
2. Run: `npm run install-all`
3. Start: `npm run dev`
4. Open: http://localhost:3000

### For deployment:

**📤 First upload to GitHub:**
- See deployment instructions in `RENDER_TROUBLESHOOTING.md`

**🌐 Then deploy on Render:**
- Open https://render.com
- "New +" → "Web Service"
- Select your repository
- Get link - done!

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

