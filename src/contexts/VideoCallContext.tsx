import React, { createContext, useContext, useState } from 'react';
import { useWebSocket } from './WebSocketContext';

interface VideoCallContextType {
  isInCall: boolean;
  currentCallUserId: string | null;
  initiateCall: (userId: string) => void;
  acceptCall: (userId: string) => void;
  endCall: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [currentCallUserId, setCurrentCallUserId] = useState<string | null>(null);
  const { socket } = useWebSocket();

  const initiateCall = (userId: string) => {
    socket?.emit('initiate-call', { targetUserId: userId });
    setCurrentCallUserId(userId);
    setIsInCall(true);
  };

  const acceptCall = (userId: string) => {
    socket?.emit('accept-call', { targetUserId: userId });
    setCurrentCallUserId(userId);
    setIsInCall(true);
  };

  const endCall = () => {
    if (currentCallUserId) {
      socket?.emit('end-call', { targetUserId: currentCallUserId });
    }
    setCurrentCallUserId(null);
    setIsInCall(false);
  };

  return (
    <VideoCallContext.Provider
      value={{
        isInCall,
        currentCallUserId,
        initiateCall,
        acceptCall,
        endCall,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};

export default VideoCallContext;
