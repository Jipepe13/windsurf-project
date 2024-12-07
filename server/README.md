# WebChat Server

Backend server for the WebChat application, providing real-time communication features using Node.js, Express, MongoDB, and Socket.IO.

## Features

- User authentication (register, login, logout)
- Real-time messaging with Socket.IO
- Private and public chat rooms
- Media file sharing
- Video call signaling
- User presence tracking
- Message read receipts

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server
   npm install
   ```
3. Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

## Configuration

Update the `.env` file with your settings:

- `PORT`: Server port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLIENT_URL`: Frontend application URL
- `NODE_ENV`: Environment (development/production)

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/:receiverId?` - Get messages
- `PUT /api/messages/:messageId/read` - Mark message as read

## WebSocket Events

### Client -> Server
- `private_message` - Send private message
- `video-signal` - Video call signaling

### Server -> Client
- `new_message` - New message notification
- `user_status` - User online/offline status
- `video-signal` - Video call signal

## Security Features

- JWT authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Password hashing
- Input validation

## Error Handling

The server implements comprehensive error handling and logging:
- Request validation errors
- Authentication errors
- Database errors
- Socket connection errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
