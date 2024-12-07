import React from 'react';
import { Message } from '../../types/message';
import { formatRelativeTime } from '../../utils/dateUtils';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  messagesEndRef,
}) => {
  return (
    <div className="message-list">
      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === currentUserId;
        const showAvatar = index === 0 || 
          messages[index - 1].senderId !== message.senderId;

        return (
          <div
            key={message._id}
            className={`message-container ${isCurrentUser ? 'sent' : 'received'}`}
          >
            {!isCurrentUser && showAvatar && (
              <img
                src={message.senderAvatar || '/default-avatar.png'}
                alt={message.senderName}
                className="message-avatar"
              />
            )}
            <div className="message-content">
              {!isCurrentUser && showAvatar && (
                <span className="sender-name">{message.senderName}</span>
              )}
              <div className="message-bubble">
                {message.content}
                <span className="message-time">
                  {formatRelativeTime(new Date(message.createdAt))}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
