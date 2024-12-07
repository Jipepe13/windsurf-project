import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes';

const app = express();
const httpServer = createServer(app);

// Configuration CORS pour la production
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions,
  path: '/socket.io',
});

// Routes API
app.use('/api', routes);

// Route de santé pour Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

export { app, httpServer, io };
