import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import './CallChat.css';

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
}

const CallChat: React.FC<{
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ roomId, isOpen, onClose }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket || !user) return;

    // Charger l'historique des messages
    socket.emit('get-call-messages', { roomId });

    // Écouter les nouveaux messages
    socket.on('call-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Écouter les messages système
    socket.on('call-system-message', (message: Message) => {
      setMessages(prev => [...prev, { ...message, type: 'system' }]);
      scrollToBottom();
    });

    // Écouter les indicateurs de frappe
    socket.on('user-typing', ({ userId, userName }) => {
      setTypingUsers(prev => new Set(prev).add(userName));
    });

    socket.on('user-stop-typing', ({ userId }) => {
      setTypingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Charger les messages
    socket.on('call-messages-history', (history: Message[]) => {
      setMessages(history);
      scrollToBottom();
    });

    return () => {
      socket.off('call-message');
      socket.off('call-system-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('call-messages-history');
    };
  }, [socket, user, roomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (!socket || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing-start', { roomId });
    }

    // Réinitialiser le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing-stop', { roomId });
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !user || !newMessage.trim()) return;

    const message: Partial<Message> = {
      userId: user.id,
      userName: user.name,
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date(),
    };

    socket.emit('call-message', { roomId, message });
    setNewMessage('');
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing-stop', { roomId });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !user) return;

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur lors du téléchargement');

      const { fileUrl } = await response.json();

      const message: Partial<Message> = {
        userId: user.id,
        userName: user.name,
        content: `A partagé un fichier: ${file.name}`,
        type: 'file',
        fileUrl,
        fileName: file.name,
        timestamp: new Date(),
      };

      socket.emit('call-message', { roomId, message });
    } catch (error) {
      console.error('Erreur lors du partage du fichier:', error);
      alert('Erreur lors du partage du fichier');
    }

    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="call-chat">
      <div className="chat-header">
        <h3>Messages</h3>
        <button className="close-button" onClick={onClose}>
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.userId === user?.id ? 'own' : ''
            } ${message.type}`}
          >
            {message.type === 'system' ? (
              <div className="system-message">{message.content}</div>
            ) : (
              <>
                <div className="message-header">
                  <span className="user-name">{message.userName}</span>
                  <span className="timestamp">
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  {message.type === 'file' ? (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-attachment"
                    >
                      <i className="fas fa-file" />
                      {message.fileName}
                    </a>
                  ) : (
                    message.content
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.size > 0 && (
        <div className="typing-indicator">
          {Array.from(typingUsers).join(', ')} écrit
          {typingUsers.size > 1 ? 'ent' : ''} un message...
        </div>
      )}

      <form className="message-input" onSubmit={handleSendMessage}>
        <button
          type="button"
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="fas fa-paperclip" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          className="emoji-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <i className="fas fa-smile" />
        </button>

        {showEmojiPicker && (
          <div className="emoji-picker">
            {['😊', '👍', '❤️', '😂', '🎉', '👋', '🤔', '👏'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Écrivez votre message..."
        />

        <button
          type="submit"
          className="send-button"
          disabled={!newMessage.trim()}
        >
          <i className="fas fa-paper-plane" />
        </button>
      </form>
    </div>
  );
};

export default CallChat;
