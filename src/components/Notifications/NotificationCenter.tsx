import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import './Notifications.css';

interface Notification {
  id: string;
  type: 'message' | 'call' | 'donation' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

const NotificationCenter: React.FC = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket || !user) return;

    // Charger les notifications existantes
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          updateUnreadCount(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    };

    fetchNotifications();

    // Écouter les nouvelles notifications
    socket.on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      updateUnreadCount([notification, ...notifications]);
      
      // Afficher une notification système si le centre est fermé
      if (!isOpen && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png'
        });
      }
    });

    return () => {
      socket.off('notification');
    };
  }, [socket, user, isOpen, notifications]);

  const updateUnreadCount = (notifs: Notification[]) => {
    const count = notifs.filter((n) => !n.read).length;
    setUnreadCount(count);
    // Mettre à jour le badge du favicon
    updateFaviconBadge(count);
  };

  const updateFaviconBadge = (count: number) => {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon && count > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Dessiner l'icône de base
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 32, 32);
          
          // Ajouter le badge
          if (count > 0) {
            ctx.beginPath();
            ctx.arc(24, 8, 8, 0, 2 * Math.PI);
            ctx.fillStyle = '#f44336';
            ctx.fill();
            
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(count > 99 ? '99+' : count.toString(), 24, 8);
          }
          
          favicon.href = canvas.toDataURL('image/png');
        };
        img.src = '/favicon.ico';
      }
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        updateUnreadCount(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT'
      });
      
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        updateUnreadCount([]);
      }
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotifications([]);
        updateUnreadCount([]);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Gérer les actions selon le type de notification
    switch (notification.type) {
      case 'message':
        // Rediriger vers la conversation
        if (notification.data?.conversationId) {
          window.location.href = `/chat/${notification.data.conversationId}`;
        }
        break;
      case 'call':
        // Ouvrir la fenêtre d'appel
        if (notification.data?.callId) {
          window.location.href = `/call/${notification.data.callId}`;
        }
        break;
      case 'donation':
        // Rediriger vers l'historique des dons
        window.location.href = '/donations/history';
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'message':
        return 'fa-comment';
      case 'call':
        return 'fa-phone';
      case 'donation':
        return 'fa-gift';
      default:
        return 'fa-bell';
    }
  };

  return (
    <div className="notification-center">
      <button
        className="notification-toggle"
        onClick={() => setIsOpen(!isOpen)}
        data-count={unreadCount}
      >
        <i className="fas fa-bell" />
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllAsRead} className="action-button">
                    <i className="fas fa-check-double" />
                    Tout marquer comme lu
                  </button>
                  <button onClick={clearNotifications} className="action-button">
                    <i className="fas fa-trash" />
                    Effacer tout
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <i className="fas fa-bell-slash" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    <i className={`fas ${getNotificationIcon(notification.type)}`} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {formatDistanceToNow(new Date(notification.timestamp), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="notification-badge" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
