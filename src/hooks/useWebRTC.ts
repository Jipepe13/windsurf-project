import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

interface UseWebRTCProps {
  roomId: string;
  userId: string;
  onError?: (error: string) => void;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  setAudioDevice: (deviceId: string) => Promise<void>;
  setVideoDevice: (deviceId: string) => Promise<void>;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: process.env.REACT_APP_TURN_URL,
    username: process.env.REACT_APP_TURN_USERNAME,
    credential: process.env.REACT_APP_TURN_CREDENTIAL,
  },
];

export const useWebRTC = ({
  roomId,
  userId,
  onError,
}: UseWebRTCProps): UseWebRTCReturn => {
  const socket = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const peerConnections = useRef<Map<string, PeerConnection>>(new Map());
  const screenStream = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback(
    async (targetUserId: string): Promise<RTCPeerConnection> => {
      const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Ajouter les tracks locaux
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // Gérer les candidats ICE
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            targetUserId,
            roomId,
          });
        }
      };

      // Gérer les nouveaux tracks
      peerConnection.ontrack = (event) => {
        const stream = event.streams[0];
        setRemoteStreams((prev) => {
          const newStreams = new Map(prev);
          newStreams.set(targetUserId, stream);
          return newStreams;
        });
      };

      // Gérer les changements d'état de connexion
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'failed') {
          onError?.('La connexion avec un participant a échoué');
        }
      };

      peerConnections.current.set(targetUserId, {
        userId: targetUserId,
        connection: peerConnection,
      });

      return peerConnection;
    },
    [localStream, roomId, socket, onError]
  );

  // Initialiser le flux local
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setLocalStream(stream);
      } catch (error) {
        onError?.('Erreur lors de l\'accès à la caméra ou au microphone');
      }
    };

    initLocalStream();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [onError]);

  // Gérer les événements de signalement
  useEffect(() => {
    if (!socket || !localStream) return;

    socket.on('user-joined', async ({ userId: newUserId }) => {
      const peerConnection = await createPeerConnection(newUserId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', { offer, targetUserId: newUserId, roomId });
    });

    socket.on(
      'offer',
      async ({ offer, targetUserId: fromUserId }: { offer: RTCSessionDescriptionInit; targetUserId: string }) => {
        const peerConnection = await createPeerConnection(fromUserId);
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { answer, targetUserId: fromUserId, roomId });
      }
    );

    socket.on(
      'answer',
      async ({ answer, targetUserId: fromUserId }: { answer: RTCSessionDescriptionInit; targetUserId: string }) => {
        const peerConnection = peerConnections.current.get(fromUserId)?.connection;
        if (peerConnection) {
          await peerConnection.setRemoteDescription(answer);
        }
      }
    );

    socket.on(
      'ice-candidate',
      async ({ candidate, targetUserId: fromUserId }: { candidate: RTCIceCandidate; targetUserId: string }) => {
        const peerConnection = peerConnections.current.get(fromUserId)?.connection;
        if (peerConnection) {
          await peerConnection.addIceCandidate(candidate);
        }
      }
    );

    socket.on('user-left', ({ userId: leftUserId }) => {
      const peerConnection = peerConnections.current.get(leftUserId);
      if (peerConnection) {
        peerConnection.connection.close();
        peerConnections.current.delete(leftUserId);
      }
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.delete(leftUserId);
        return newStreams;
      });
    });

    return () => {
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
    };
  }, [socket, localStream, createPeerConnection, roomId]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      screenStream.current = stream;
      setIsScreenSharing(true);

      // Remplacer la piste vidéo dans toutes les connexions
      const videoTrack = stream.getVideoTracks()[0];
      peerConnections.current.forEach(({ connection }) => {
        const sender = connection
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Arrêter le partage quand l'utilisateur arrête
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      onError?.('Erreur lors du partage d\'écran');
    }
  }, [onError]);

  const stopScreenShare = useCallback(() => {
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
      screenStream.current = null;
      setIsScreenSharing(false);

      // Restaurer la piste vidéo originale
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        peerConnections.current.forEach(({ connection }) => {
          const sender = connection
            .getSenders()
            .find((s) => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
  }, [localStream]);

  const setAudioDevice = useCallback(
    async (deviceId: string) => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId },
          video: localStream?.getVideoTracks()[0] ? true : false,
        });

        // Remplacer la piste audio
        const audioTrack = newStream.getAudioTracks()[0];
        if (localStream && audioTrack) {
          const oldTrack = localStream.getAudioTracks()[0];
          if (oldTrack) {
            localStream.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStream.addTrack(audioTrack);

          // Mettre à jour les connexions
          peerConnections.current.forEach(({ connection }) => {
            const sender = connection
              .getSenders()
              .find((s) => s.track?.kind === 'audio');
            if (sender) {
              sender.replaceTrack(audioTrack);
            }
          });
        }
      } catch (error) {
        onError?.('Erreur lors du changement de microphone');
      }
    },
    [localStream, onError]
  );

  const setVideoDevice = useCallback(
    async (deviceId: string) => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: localStream?.getAudioTracks()[0] ? true : false,
          video: { deviceId },
        });

        // Remplacer la piste vidéo
        const videoTrack = newStream.getVideoTracks()[0];
        if (localStream && videoTrack) {
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) {
            localStream.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStream.addTrack(videoTrack);

          // Mettre à jour les connexions
          peerConnections.current.forEach(({ connection }) => {
            const sender = connection
              .getSenders()
              .find((s) => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
      } catch (error) {
        onError?.('Erreur lors du changement de caméra');
      }
    },
    [localStream, onError]
  );

  return {
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    setAudioDevice,
    setVideoDevice,
  };
};

export default useWebRTC;
