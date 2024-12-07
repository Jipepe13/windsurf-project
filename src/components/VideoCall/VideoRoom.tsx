import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import CallControls from './CallControls';
import ParticipantVideo from './ParticipantVideo';
import DeviceSettings from './DeviceSettings';
import './VideoCall.css';

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  audio: boolean;
  video: boolean;
  screen: boolean;
}

interface RTCPeerData {
  pc: RTCPeerConnection;
  iceCandidates: RTCIceCandidate[];
}

const VideoRoom: React.FC<{
  roomId: string;
  onLeave: () => void;
}> = ({ roomId, onLeave }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  
  const peerConnections = useRef<Map<string, RTCPeerData>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Configuration STUN/TURN
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: process.env.REACT_APP_TURN_URL || '',
        username: process.env.REACT_APP_TURN_USERNAME || '',
        credential: process.env.REACT_APP_TURN_CREDENTIAL || '',
      },
    ],
    iceCandidatePoolSize: 10,
  };

  useEffect(() => {
    if (!socket || !user) return;

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Rejoindre la salle
        socket.emit('join-room', { roomId, userId: user.id });
      } catch (err) {
        setError('Erreur d\'accès aux périphériques média');
        console.error('Erreur média:', err);
      }
    };

    initializeMedia();
    setConnecting(false);

    // Gestion des événements socket
    socket.on('user-connected', handleUserConnected);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('receive-ice-candidate', handleReceiveIceCandidate);
    socket.on('receive-offer', handleReceiveOffer);
    socket.on('receive-answer', handleReceiveAnswer);

    return () => {
      // Nettoyage
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.off('receive-ice-candidate');
      socket.off('receive-offer');
      socket.off('receive-answer');
      
      localStream?.getTracks().forEach(track => track.stop());
      screenStream?.getTracks().forEach(track => track.stop());
      
      peerConnections.current.forEach(({ pc }) => pc.close());
      peerConnections.current.clear();
    };
  }, [socket, user, roomId]);

  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(rtcConfig);

    // Ajouter les tracks locaux
    localStream?.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Gérer les ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket?.emit('ice-candidate', {
          userId,
          candidate,
        });
      }
    };

    // Gérer les nouveaux tracks
    pc.ontrack = (event) => {
      setParticipants(prev => {
        const participant = prev.get(userId);
        if (participant) {
          participant.stream = event.streams[0];
          return new Map(prev);
        }
        return prev;
      });
    };

    // Gérer l'état de la connexion
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        console.error('Connection failed for user:', userId);
        handleReconnect(userId);
      }
    };

    return pc;
  };

  const handleUserConnected = async ({ userId, name }: { userId: string; name: string }) => {
    const pc = createPeerConnection(userId);
    peerConnections.current.set(userId, { pc, iceCandidates: [] });

    setParticipants(prev => {
      const updated = new Map(prev);
      updated.set(userId, { id: userId, name, audio: true, video: true, screen: false });
      return updated;
    });

    // Créer et envoyer l'offre
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit('offer', { userId, offer });
    } catch (err) {
      console.error('Erreur lors de la création de l\'offre:', err);
    }
  };

  const handleUserDisconnected = (userId: string) => {
    const peerData = peerConnections.current.get(userId);
    if (peerData) {
      peerData.pc.close();
      peerConnections.current.delete(userId);
    }

    setParticipants(prev => {
      const updated = new Map(prev);
      updated.delete(userId);
      return updated;
    });
  };

  const handleReceiveIceCandidate = async ({
    userId,
    candidate,
  }: {
    userId: string;
    candidate: RTCIceCandidate;
  }) => {
    const peerData = peerConnections.current.get(userId);
    if (!peerData) return;

    try {
      if (peerData.pc.remoteDescription) {
        await peerData.pc.addIceCandidate(candidate);
      } else {
        peerData.iceCandidates.push(candidate);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du candidat ICE:', err);
    }
  };

  const handleReceiveOffer = async ({
    userId,
    offer,
  }: {
    userId: string;
    offer: RTCSessionDescriptionInit;
  }) => {
    const pc = createPeerConnection(userId);
    peerConnections.current.set(userId, { pc, iceCandidates: [] });

    try {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Ajouter les candidats ICE en attente
      const peerData = peerConnections.current.get(userId);
      if (peerData) {
        for (const candidate of peerData.iceCandidates) {
          await pc.addIceCandidate(candidate);
        }
        peerData.iceCandidates = [];
      }

      socket?.emit('answer', { userId, answer });
    } catch (err) {
      console.error('Erreur lors du traitement de l\'offre:', err);
    }
  };

  const handleReceiveAnswer = async ({
    userId,
    answer,
  }: {
    userId: string;
    answer: RTCSessionDescriptionInit;
  }) => {
    const peerData = peerConnections.current.get(userId);
    if (!peerData) return;

    try {
      await peerData.pc.setRemoteDescription(answer);

      // Ajouter les candidats ICE en attente
      for (const candidate of peerData.iceCandidates) {
        await peerData.pc.addIceCandidate(candidate);
      }
      peerData.iceCandidates = [];
    } catch (err) {
      console.error('Erreur lors du traitement de la réponse:', err);
    }
  };

  const handleReconnect = async (userId: string) => {
    const peerData = peerConnections.current.get(userId);
    if (!peerData) return;

    try {
      peerData.pc.close();
      const newPc = createPeerConnection(userId);
      peerConnections.current.set(userId, { pc: newPc, iceCandidates: [] });

      const offer = await newPc.createOffer();
      await newPc.setLocalDescription(offer);
      socket?.emit('offer', { userId, offer });
    } catch (err) {
      console.error('Erreur lors de la reconnexion:', err);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      socket?.emit('media-state-change', {
        roomId,
        audio: !isAudioEnabled,
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      socket?.emit('media-state-change', {
        roomId,
        video: !isVideoEnabled,
      });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        screenStream?.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        setIsScreenSharing(false);

        // Restaurer la vidéo normale
        peerConnections.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => 
            s.track?.kind === 'video'
          );
          if (sender && localStream) {
            sender.replaceTrack(localStream.getVideoTracks()[0]);
          }
        });
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
          },
          audio: false,
        });

        setScreenStream(stream);
        setIsScreenSharing(true);

        // Remplacer la vidéo par le partage d'écran
        peerConnections.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => 
            s.track?.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });

        // Arrêter le partage d'écran quand l'utilisateur le termine
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      }

      socket?.emit('screen-share-change', {
        roomId,
        sharing: !isScreenSharing,
      });
    } catch (err) {
      console.error('Erreur lors du partage d\'écran:', err);
      setError('Erreur lors du partage d\'écran');
    }
  };

  const handleLeave = () => {
    socket?.emit('leave-room', { roomId });
    localStream?.getTracks().forEach(track => track.stop());
    screenStream?.getTracks().forEach(track => track.stop());
    peerConnections.current.forEach(({ pc }) => pc.close());
    onLeave();
  };

  if (error) {
    return (
      <div className="video-error">
        <i className="fas fa-exclamation-circle" />
        <h3>Erreur</h3>
        <p>{error}</p>
        <button onClick={handleLeave}>Quitter</button>
      </div>
    );
  }

  if (connecting) {
    return (
      <div className="video-loading">
        <i className="fas fa-spinner fa-spin" />
        <p>Connexion en cours...</p>
      </div>
    );
  }

  return (
    <div className="video-room">
      <div className="video-grid">
        {/* Vidéo locale */}
        <div className="video-container local">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={!isVideoEnabled ? 'disabled' : ''}
          />
          <div className="video-overlay">
            <div className="participant-name">Vous</div>
            <div className="media-indicators">
              {!isAudioEnabled && <i className="fas fa-microphone-slash" />}
              {!isVideoEnabled && <i className="fas fa-video-slash" />}
              {isScreenSharing && <i className="fas fa-desktop" />}
            </div>
          </div>
        </div>

        {/* Vidéos des participants */}
        {Array.from(participants.values()).map((participant) => (
          <ParticipantVideo
            key={participant.id}
            participant={participant}
          />
        ))}
      </div>

      {/* Contrôles */}
      <CallControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onShowSettings={() => setShowSettings(true)}
        onLeave={handleLeave}
      />

      {/* Paramètres des périphériques */}
      {showSettings && (
        <DeviceSettings
          onClose={() => setShowSettings(false)}
          localStream={localStream}
        />
      )}
    </div>
  );
};

export default VideoRoom;
