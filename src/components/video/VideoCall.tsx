import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  Dialog,
  DialogContent,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  CallEnd as CallEndIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Peer from 'simple-peer';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';

const VideoContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  backgroundColor: '#000',
  borderRadius: '8px',
  overflow: 'hidden',
});

const Video = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const ControlsContainer = styled(Box)({
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '10px',
  padding: '10px',
  borderRadius: '50px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
});

interface VideoCallProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  isInitiator?: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({
  open,
  onClose,
  targetUserId,
  isInitiator = false,
}) => {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  useEffect(() => {
    if (open) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          if (isInitiator) {
            initializePeer(stream);
          }
        })
        .catch((error) => {
          console.error('Error accessing media devices:', error);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [open, isInitiator]);

  const initializePeer = (stream: MediaStream) => {
    const peer = new Peer({
      initiator: isInitiator,
      trickle: false,
      stream,
    });

    peer.on('signal', (data) => {
      socket?.emit('video-signal', {
        signal: data,
        targetUserId,
      });
    });

    peer.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    peerRef.current = peer;

    socket?.on('video-signal', ({ signal }) => {
      peer.signal(signal);
    });
  };

  useEffect(() => {
    if (!isInitiator && stream && socket) {
      initializePeer(stream);
    }
  }, [stream, isInitiator, socket]);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, height: '600px' }}>
          <VideoContainer sx={{ flex: 1 }}>
            <Video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
            />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: '80px',
                left: '10px',
                color: '#fff',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              Vous
            </Typography>
          </VideoContainer>

          <VideoContainer sx={{ flex: 1 }}>
            <Video
              ref={remoteVideoRef}
              autoPlay
              playsInline
            />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: '80px',
                left: '10px',
                color: '#fff',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              Interlocuteur
            </Typography>
          </VideoContainer>
        </Box>

        <ControlsContainer>
          <IconButton
            onClick={toggleMute}
            sx={{
              backgroundColor: isMuted ? 'error.main' : 'primary.main',
              '&:hover': {
                backgroundColor: isMuted ? 'error.dark' : 'primary.dark',
              },
            }}
          >
            {isMuted ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
          <IconButton
            onClick={toggleVideo}
            sx={{
              backgroundColor: isVideoOff ? 'error.main' : 'primary.main',
              '&:hover': {
                backgroundColor: isVideoOff ? 'error.dark' : 'primary.dark',
              },
            }}
          >
            {isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
          </IconButton>
          <IconButton
            onClick={handleEndCall}
            sx={{
              backgroundColor: 'error.main',
              '&:hover': { backgroundColor: 'error.dark' },
            }}
          >
            <CallEndIcon />
          </IconButton>
        </ControlsContainer>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCall;
