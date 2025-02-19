
# VoxiFi Frontend

A WebXR-enabled voice NFT platform built on Aptos blockchain with real-time audio visualization.

## 🌟 Features

- **Voice Recording & Minting**: Create unique voice-based NFTs
- **WebXR Visualization**: Immersive 3D audio visualization
- **Voice Cloning**: Advanced voice synthesis capabilities
- **Blockchain Integration**: Seamless minting on Aptos blockchain
- **Real-time Processing**: Live audio processing and feedback
- **Secure Storage**: Firebase integration for reliable data management

## 🚀 Quick Start

1. Clone and install:
```bash
git clone https://github.com/adamnusic/voxifi-frontend.git
cd voxifi-frontend
npm install
```

2. Set up environment:
- Copy `.env.example` to `.env` in the client directory
- Configure Firebase and Aptos credentials

3. Start development server:
```bash
npm run dev
```

## 🏗️ Architecture

### Frontend (`/client`)
- React + TypeScript for robust UI
- Vite for fast development
- Tailwind CSS for styling
- WebXR API for immersive experiences

### Backend (`/server`)
- Express.js for API routing
- Voice processing integration
- Blockchain transaction handling

### Services
- Firebase Storage & Firestore
- Aptos blockchain integration
- Voice synthesis API

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **3D Rendering**: Three.js
- **Blockchain**: Aptos SDK
- **Storage**: Firebase
- **Backend**: Express.js

## 📦 Project Structure

```
/
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API & Firebase services
│   │   ├── utils/       # Helper functions
│   │   └── pages/       # Route components
├── server/
│   ├── routes.ts        # API endpoints
│   └── storage.ts       # Storage handling
└── shared/
    └── schema.ts        # Shared type definitions
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit changes
4. Push to your branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Live Demo](https://voxifinft.replit.app/)
