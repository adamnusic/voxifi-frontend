
# VoxiFi Frontend

A WebXR audio visualization platform that allows users to create voice-based NFTs on the Aptos blockchain.

## Features

- Voice recording and playback functionality
- WebXR-based audio visualization
- NFT minting on Aptos blockchain
- Voice cloning capabilities
- Real-time audio processing
- Firebase integration for storage

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Firebase (Storage & Firestore)
- Aptos SDK
- Express.js backend
- WebXR API

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/adamnusic/voxifi-frontend.git
cd voxifi-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env`
- Fill in required Firebase and Aptos configurations

4. Start the development server:
```bash
npm run dev
```

## Project Structure

- `/client` - Frontend React application
  - `/src/components` - React components
  - `/src/services` - Firebase and API services
  - `/src/utils` - Utility functions
  - `/src/hooks` - Custom React hooks
  
- `/server` - Express.js backend
  - API routes
  - Voice processing
  - Blockchain integration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License
