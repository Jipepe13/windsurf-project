import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './VideoCall.css';

interface VideoCallProps {
  recipientId: string;
  onEndCall: () => void;
  initialOffer?: RTCSessionDescriptionInit;
  initialAnswer?: RTCSessionDescriptionInit;
  isInitiator: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({
  recipientId,
  onEndCall,
  initialOffer,
  initialAnswer,
  isInitiator,
}) => {
  const { socket } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection>();
  const localStreamRef = useRef<MediaStream>();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Configuration ICE
        const configuration: RTCConfiguration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            {
              urls: 'turn:your-turn-server.com',
              username: process.env.REACT_APP_TURN_USERNAME,
              credential: process.env.REACT_APP_TURN_CREDENTIAL,
            },
          ],
        };

        // Créer la connexion peer
        peerConnectionRef.current = new RTCPeerConnection(configuration);

        // Obtenir le flux média local
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;

        // Afficher le flux local
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Ajouter les pistes au peer connection
        stream.getTracks().forEach(track => {
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        });

        // Gérer les candidats ICE
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('ice_candidate', {
              targetUserId: recipientId,
              candidate: event.candidate,
            });
          }
        };

        // Gérer le flux distant
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnecting(false);
          }
        };

        // Si initiateur, créer et envoyer l'offre
        if (isInitiator) {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);

          if (socket) {
            socket.emit('call_request', {
              targetUserId: recipientId,
              offer,
            });
          }
        }
        // Si récepteur, traiter l'offre initiale
        else if (initialOffer) {
          await peerConnectionRef.current.setRemoteDescription(initialOffer);
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          if (socket) {
            socket.emit('call_response', {
              targetUserId: recipientId,
              answer,
            });
          }
        }

      } catch (err) {
        console.error('Erreur lors de l\'initialisation de l\'appel:', err);
        setError('Erreur lors de l\'initialisation de l\'appel vidéo');
        onEndCall();
      }
    };

    initializeCall();

    // Nettoyage
    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      peerConnectionRef.current?.close();
    };
  }, [recipientId, socket, isInitiator, initialOffer, onEndCall]);

  // Gérer la réponse à l'appel
  useEffect(() => {
    if (initialAnswer && peerConnectionRef.current) {
      peerConnectionRef.current.setRemoteDescription(initialAnswer)
        .catch(err => {
          console.error('Erreur lors de la configuration de la réponse:', err);
          setError('Erreur lors de la configuration de l\'appel');
          onEndCall();
        });
    }
  }, [initialAnswer, onEndCall]);

  // Gérer les candidats ICE
  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('Erreur lors de l\'ajout du candidat ICE:', err);
      }
    };

    socket.on('ice_candidate', handleIceCandidate);

    return () => {
      socket.off('ice_candidate');
    };
  }, [socket]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <div className="video-call-container">
      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="video-grid">
            <div className="video-wrapper remote">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video"
              />
              {isConnecting && (
                <div className="connecting-overlay">
                  <div className="spinner"></div>
                  <span>Connexion en cours...</span>
                </div>
              )}
            </div>
            <div className="video-wrapper local">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video"
              />
            </div>
          </div>

          <div className="video-controls">
            <button
              onClick={toggleMute}
              className={`control-button ${isMuted ? 'active' : ''}`}
              title={isMuted ? 'Activer le micro' : 'Couper le micro'}
            >
              <i className={`fas fa-microphone${isMuted ? '-slash' : ''}`} />
            </button>
            <button
              onClick={onEndCall}
              className="control-button end-call"
              title="Terminer l'appel"
            >
              <i className="fas fa-phone-slash" />
            </button>
            <button
              onClick={toggleVideo}
              className={`control-button ${!isVideoEnabled ? 'active' : ''}`}
              title={isVideoEnabled ? 'Désactiver la caméra' : 'Activer la caméra'}
            >
              <i className={`fas fa-video${!isVideoEnabled ? '-slash' : ''}`} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoCall;
