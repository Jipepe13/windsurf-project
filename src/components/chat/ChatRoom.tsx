import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  Image as ImageIcon,
  Videocam as VideocamIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useVideoCall } from '../../contexts/VideoCallContext';
import VideoCall from '../video/VideoCall';
import MediaUpload from '../media/MediaUpload';

const MessageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(1),
  maxWidth: '70%',
  wordBreak: 'break-word',
}));

const MyMessage = styled(MessageContainer)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  marginLeft: 'auto',
}));

const OtherMessage = styled(MessageContainer)(({ theme }) => ({
  backgroundColor: theme.palette.grey[200],
  color: theme.palette.text.primary,
}));

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video';
  content?: string;
}

const ChatRoom = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Salut !',
      sender: 'other',
      timestamp: new Date(),
      type: 'text',
    },
    {
      id: 2,
      text: 'Hey ! Comment ça va ?',
      sender: 'me',
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const { initiateCall, isInCall, currentCallUserId, endCall } = useVideoCall();

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          text: message,
          sender: 'me',
          timestamp: new Date(),
          type: 'text',
        },
      ]);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMediaUpload = (url: string) => {
    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        text: url,
        sender: 'me',
        timestamp: new Date(),
        type: url.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 'video',
        content: url,
      },
    ]);
  };

  const handleVideoCallClick = () => {
    initiateCall('target-user-id'); // Replace with actual target user ID
    setShowVideoCall(true);
  };

  const handleEndVideoCall = () => {
    endCall();
    setShowVideoCall(false);
  };

  return (
    <Paper 
      sx={{ 
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: 2,
        backgroundImage: 'url("/chat-background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        {messages.map((msg) => (
          msg.sender === 'me' ? (
            <MyMessage key={msg.id}>
              {msg.type === 'image' ? (
                <img
                  src={msg.content}
                  alt="Shared image"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}
                />
              ) : msg.type === 'video' ? (
                <video
                  src={msg.content}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}
                />
              ) : (
                <Typography variant="body2">{msg.text}</Typography>
              )}
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Typography>
            </MyMessage>
          ) : (
            <OtherMessage key={msg.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>A</Avatar>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Alice
                </Typography>
              </Box>
              {msg.type === 'image' ? (
                <img
                  src={msg.content}
                  alt="Shared image"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}
                />
              ) : msg.type === 'video' ? (
                <video
                  src={msg.content}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}
                />
              ) : (
                <Typography variant="body2">{msg.text}</Typography>
              )}
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Typography>
            </OtherMessage>
          )
        ))}
        <div ref={messagesEndRef} />
      </Box>
      
      <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Écrivez votre message..."
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <MediaUpload onUploadComplete={handleMediaUpload} maxSizeMB={2} />
                <IconButton onClick={handleVideoCallClick}>
                  <VideocamIcon />
                </IconButton>
                <IconButton onClick={handleSend} disabled={!message.trim()}>
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <VideoCall
        open={showVideoCall}
        onClose={handleEndVideoCall}
        targetUserId={currentCallUserId || ''}
        isInitiator={true}
      />
    </Paper>
  );
};

export default ChatRoom;
