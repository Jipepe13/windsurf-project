import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import logger from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const PING_TIMEOUT = 10000;
const PING_INTERVAL = 5000;

interface JwtPayload {
  userId: string;
}

const initializeSocket = (server: Server): SocketServer => {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: PING_TIMEOUT,
    pingInterval: PING_INTERVAL,
  });

  // Middleware d'authentification pour Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        throw new Error('Token d\'authentification requis');
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      logger.error('Erreur d\'authentification socket:', error);
      next(new Error('Authentification échouée'));
    }
  });

  // Gestionnaire de connexion
  io.on('connection', async (socket) => {
    try {
      const userId = socket.data.userId;
      
      // Mettre à jour le statut de l'utilisateur
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      // Rejoindre la room personnelle
      socket.join(userId);

      // Informer les autres utilisateurs
      socket.broadcast.emit('user_status', {
        userId,
        status: 'online',
      });

      logger.info(`Utilisateur ${userId} connecté`);

      // Gérer la saisie
      socket.on('typing_start', (data: { receiverId: string }) => {
        socket.to(data.receiverId).emit('typing_start', { userId });
      });

      socket.on('typing_stop', (data: { receiverId: string }) => {
        socket.to(data.receiverId).emit('typing_stop', { userId });
      });

      // Gérer les appels vidéo
      socket.on('call_request', (data: { targetUserId: string, offer: RTCSessionDescriptionInit }) => {
        socket.to(data.targetUserId).emit('incoming_call', {
          callerId: userId,
          offer: data.offer,
        });
      });

      socket.on('call_response', (data: { targetUserId: string, answer: RTCSessionDescriptionInit }) => {
        socket.to(data.targetUserId).emit('call_answered', {
          answer: data.answer,
        });
      });

      socket.on('ice_candidate', (data: { targetUserId: string, candidate: RTCIceCandidateInit }) => {
        socket.to(data.targetUserId).emit('ice_candidate', {
          candidate: data.candidate,
        });
      });

      socket.on('end_call', (data: { targetUserId: string }) => {
        socket.to(data.targetUserId).emit('call_ended', { userId });
      });

      // Gérer la déconnexion
      socket.on('disconnect', async () => {
        try {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          socket.broadcast.emit('user_status', {
            userId,
            status: 'offline',
          });

          logger.info(`Utilisateur ${userId} déconnecté`);
        } catch (error) {
          logger.error('Erreur lors de la déconnexion:', error);
        }
      });

    } catch (error) {
      logger.error('Erreur lors de la gestion de la connexion socket:', error);
      socket.disconnect(true);
    }
  });

  // Gérer les erreurs au niveau du serveur Socket.IO
  io.engine.on('connection_error', (error) => {
    logger.error('Erreur de connexion socket:', error);
  });

  return io;
};

export default initializeSocket;
