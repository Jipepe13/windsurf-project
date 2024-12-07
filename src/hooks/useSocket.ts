import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import create from 'zustand';

interface SocketStore {
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
}

const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),
  isConnected: false,
  setIsConnected: (isConnected) => set({ isConnected }),
}));

export const useSocket = () => {
  const { socket, setSocket, isConnected, setIsConnected } = useSocketStore();
  const { token } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!token || socket) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Gérer la connexion
    newSocket.on('connect', () => {
      console.log('Socket connecté');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    // Gérer la déconnexion
    newSocket.on('disconnect', (reason) => {
      console.log('Socket déconnecté:', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        // La déconnexion est intentionnelle par le serveur
        newSocket.connect();
      }
    });

    // Gérer les erreurs de connexion
    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion socket:', error);
      reconnectAttempts.current++;

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Nombre maximum de tentatives de reconnexion atteint');
        newSocket.disconnect();
      }
    });

    // Gérer les erreurs
    newSocket.on('error', (error) => {
      console.error('Erreur socket:', error);
    });

    setSocket(newSocket);

    // Nettoyage
    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, socket, setSocket, setIsConnected]);

  return { socket, isConnected };
};

export default useSocket;
