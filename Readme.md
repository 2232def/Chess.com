# चतुरङ्ग (Chaturanga) - Ancient Indian Chess Game

A modern web-based chess platform with an authentic ancient Indian aesthetic, featuring real-time multiplayer gameplay, AI opponents, and stunning visual design.

## ✨ Features

- **🎮 Multiplayer Chess** - Real-time matches with Socket.io
- **🤖 AI Opponent** - Play against Stockfish chess engine
- **🎨 Indian Theme** - Animated mandalas, Sanskrit typography, and golden aesthetics
- **💬 Live Chat** - In-game messaging with auto-replies
- **🔐 Authentication** - Secure login with Clerk
- **📱 Responsive Design** - Mobile, tablet, and desktop support
- **⚡ Private Games** - Create custom game links
- **🏆 Game Modes** - Classic, Computer, and Private match options

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS Templates, Tailwind CSS, Custom CSS
- **Real-time**: Socket.io
- **Chess Logic**: Chess.js
- **Chess Engine**: Stockfish
- **Authentication**: Clerk

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/2232def/Chess.com.git
cd Chess.com
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file:
```env
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
PORT=3000
```

4. **Run the application**
```bash
npm start
```

5. **Open in browser**
```
http://localhost:3000
```

## 🎯 Usage

### Play Online
1. Sign in using Clerk authentication
2. Click "Find a Match" to search for opponents
3. Play in real-time with live chat(in construction)

### Play vs Computer
1. Navigate to "Play vs Computer"
2. Select your difficulty level(in construction)
3. Play against Stockfish AI

### Create Private Game
1. Click "Create Private Game"
2. Share the generated link with a friend
3. Play together privately

## 📁 Project Structure

```
Chess.com/
├── public/
│   ├── css/          # Stylesheets (homepage, chat, searching)
│   ├── js/           # Client-side scripts (chess logic, chat, timer)
│   └── assets/       # Images and SVG files
├── views/
│   ├── homepage.ejs  # Landing page
│   ├── index.ejs     # Game board
│   ├── searching.ejs # Matchmaking
│   └── sign-in.ejs   # Authentication
├── app.js            # Main server file
└── package.json      # Dependencies
```

## 🎨 Key Features Details

### Indian Theme Design
- 3 intricate animated SVG mandalas
- Sanskrit title with glowing animation
- Golden gradient color scheme (#d4af37)
- Temple-inspired button shapes
- 3D chess board with hover effects

### Real-time Features
- Live opponent matching
- Real-time move synchronization
- In-game chat with typing indicators
- Automatic reconnection handling

## 🔧 Configuration

### Socket.io
Real-time communication setup in `app.js` and `public/js/chessgame.js`

### Styling
- Main theme: `public/css/homepage.css`
- Game board: `public/css/style.css`
- Chat interface: `public/css/chat-style.css`

## 🐛 Troubleshooting

**Issue**: Socket.io not connecting
- Check if CDN is accessible
- Verify server is running on correct port

## 👥 Author

**2232def**
- GitHub: [@2232def](https://github.com/2232def)

---

**चतुरङ्ग - Where Ancient Tradition Meets Modern Gaming** ♟️

This is inspired from chess.com
