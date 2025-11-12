# Collaborative Drawing Board

A real-time collaborative drawing application that allows multiple users to draw together on a shared canvas. Built with React, Express.js, and Socket.IO for seamless real-time communication.


## Live Demo

You can try the live version here:  
 [https://drawingboardcollab-production.up.railway.app](https://drawingboardcollab-production.up.railway.app)

## Features

### Drawing Tools
- **Customizable Brush**: Adjust color, size, and opacity
- **Color History**: Quick access to your 6 most recently used colors
- **Stroke Management**: Undo functionality with stroke history

### Layer System
- **Multiple Layers**: Create, rename, and delete layers
- **Layer Controls**: Toggle visibility and lock layers
- **Layer Reordering**: Drag and drop to reorder layers and adjust drawing order
- **Layer Movement**: Rearrange layers to control which elements appear on top
- **Independent Drawing**: Each layer maintains its own drawing data

### Collaboration Features
- **Real-time Drawing**: See other users' strokes as they draw
- **Room System**: Create or join rooms with a 6-character code
- **User Management**: Room hosts can remove participants
- **Live Cursor Tracking**: See where other users are drawing
- **Room Capacity**: Support for up to 20 users per room

### Additional Features
- **Canvas Zoom & Pan**: Navigate large canvases easily
- **Rate Limiting**: Built-in protection against drawing spam
- **Auto-sync**: New users automatically receive the current canvas state
- **Event Notifications**: Stay informed about room activities

## Tech Stack

### Frontend
- **React** - UI framework
- **Zustand** - State management
- **Socket.IO Client** - Real-time communication
- **Canvas API** - Drawing implementation

### Backend
- **Express.js** - Server framework
- **Socket.IO** - WebSocket server
- **Node.js** - Runtime environment

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Elizigi/DrawingBoardCollab.git
cd DrawingBoardCollab
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

### Running the Application

1. **Start the backend server**
```bash
cd backend
npm start
```
The server will start on `http://localhost:3000`

2. **Start the frontend development server**
```bash
cd client
npm run dev
```
The application will be available at `http://localhost:5173` (or your configured port)

3. **Open multiple browser tabs** to test the collaborative features

## Usage

### Creating a Room
1. Enter your name
2. Click "Create Room"
3. Share the generated 6-character room code with others

### Joining a Room
1. Enter your name
2. Enter the room code
3. Click "Join Room"

### Drawing
- Select a layer from the layers panel
- Choose your brush color, size, and opacity
- Click and drag on the canvas to draw
- Use mouse wheel to zoom in/out
- Hold middle mouse button to pan

### Layer Management
- **Add Layer**: Create new layers for organization
- **Toggle Visibility**: Show/hide individual layers
- **Lock Layer**: Prevent accidental edits
- **Rename Layer**: Double-click layer name to rename
- **Delete Layer**: Remove unwanted layers (minimum 1 layer required)

### Host Controls
As the room creator, you can:
- Remove users from the room
- Manage layer permissions
- Close the room (automatically disconnects all users)

## Project Structure

```
.
├── backend/
│   └── server.ts          # Express + Socket.IO server
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── helpers/       # Canvas and drawing utilities
│   │   ├── zustand/       # State management
│   │   └── main.tsx       # Application entry point
│   └── ...
└── README.md
```

## Key Implementation Details

### Real-time Communication
- Socket.IO handles all real-time events (drawing, user actions, room management)
- Throttled drawing updates to optimize network performance
- Automatic state synchronization for new users

### Canvas Architecture
- Separate canvas layers for better performance
- Temporary canvas for smooth stroke rendering
- Remote temporary canvas for displaying other users' in-progress strokes

### State Management
- Zustand store manages application state
- Reactive updates trigger canvas redraws
- Efficient layer and stroke management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

Built with modern web technologies for real-time collaborative drawing experiences.
