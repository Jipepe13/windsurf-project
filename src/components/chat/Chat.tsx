import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { Message } from '../../types/message';
import { User } from '../../types/user';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoCall from '../VideoCall/VideoCall';
import './Chat.css';

interface ChatProps {
  recipientId: string;
}

const Chat: React.FC<ChatProps> = ({ recipientId }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [recipient, setRecipient] = useState<User | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState<{
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    callerId?: string;
  }>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !user) return;

    // Charger les messages précédents
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${recipientId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des messages');
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    // Charger les informations du destinataire
    const fetchRecipient = async () => {
      try {
        const response = await fetch(`/api/users/${recipientId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement du profil');
        const data = await response.json();
        setRecipient(data);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    fetchMessages();
    fetchRecipient();

    // Gérer les nouveaux messages
    socket.on('private_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Gérer la saisie
    socket.on('typing_start', (data: { userId: string }) => {
      if (data.userId === recipientId) {
        setIsTyping(true);
      }
    });

    socket.on('typing_stop', (data: { userId: string }) => {
      if (data.userId === recipientId) {
        setIsTyping(false);
      }
    });

    // Gérer les appels vidéo
    socket.on('incoming_call', (data: { callerId: string, offer: RTCSessionDescriptionInit }) => {
      if (data.callerId === recipientId) {
        setCallData({ offer: data.offer, callerId: data.callerId });
      }
    });

    socket.on('call_answered', (data: { answer: RTCSessionDescriptionInit }) => {
      setCallData(prev => ({ ...prev, answer: data.answer }));
    });

    socket.on('call_ended', () => {
      setIsInCall(false);
      setCallData({});
    });

    return () => {
      socket.off('private_message');
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('incoming_call');
      socket.off('call_answered');
      socket.off('call_ended');
    };
  }, [socket, user, recipientId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!socket || !user || !content.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: recipientId,
          content: content.trim(),
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'envoi du message');

      const message = await response.json();
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      socket.emit('typing_start', { receiverId: recipientId });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { receiverId: recipientId });
      }, 3000);
    } else {
      socket.emit('typing_stop', { receiverId: recipientId });
    }
  };

  const handleStartCall = () => {
    if (!socket) return;
    setIsInCall(true);
  };

  const handleEndCall = () => {
    if (!socket) return;
    socket.emit('end_call', { targetUserId: recipientId });
    setIsInCall(false);
    setCallData({});
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="recipient-info">
          <img
            src={recipient?.avatar || '/default-avatar.png'}
            alt={recipient?.username}
            className="recipient-avatar"
          />
          <div className="recipient-details">
            <h3>{recipient?.username}</h3>
            {isTyping && <span className="typing-indicator">est en train d'écrire...</span>}
          </div>
        </div>
        {!isInCall && (
          <button
            className="video-call-button"
            onClick={handleStartCall}
            title="Démarrer un appel vidéo"
          >
            <i className="fas fa-video" />
          </button>
        )}
      </div>

      <MessageList
        messages={messages}
        currentUserId={user?.id || ''}
        messagesEndRef={messagesEndRef}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={!socket || !user}
      />

      {isInCall && (
        <VideoCall
          recipientId={recipientId}
          onEndCall={handleEndCall}
          initialOffer={callData.offer}
          initialAnswer={callData.answer}
          isInitiator={!callData.callerId}
        />
      )}
    </div>
  );
};

export default Chat;
