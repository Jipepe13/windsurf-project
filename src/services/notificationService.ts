interface NotificationOptions {
  title: string;
  message: string;
  type: 'message' | 'call' | 'donation' | 'system';
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }
  }

  public async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === 'granted';
      } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
        return false;
      }
    }
    return false;
  }

  public async showNotification(options: NotificationOptions): Promise<void> {
    // Notification système
    if (this.permission === 'granted' && 'Notification' in window) {
      try {
        const notification = new Notification(options.title, {
          body: options.message,
          icon: '/notification-icon.png',
          tag: options.type,
          data: options.data,
        });

        notification.onclick = () => {
          this.handleNotificationClick(options);
          notification.close();
        };
      } catch (error) {
        console.error('Erreur lors de l\'affichage de la notification:', error);
      }
    }

    // Notification serveur
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la notification:', error);
    }
  }

  private handleNotificationClick(options: NotificationOptions): void {
    // Mettre le focus sur la fenêtre
    window.focus();

    // Gérer le clic selon le type
    switch (options.type) {
      case 'message':
        if (options.data?.conversationId) {
          window.location.href = `/chat/${options.data.conversationId}`;
        }
        break;
      case 'call':
        if (options.data?.callId) {
          window.location.href = `/call/${options.data.callId}`;
        }
        break;
      case 'donation':
        window.location.href = '/donations/history';
        break;
      default:
        break;
    }
  }

  public async getNotifications(): Promise<any[]> {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Erreur lors de la récupération des notifications');
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  public async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      return false;
    }
  }

  public async markAllAsRead(): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      return false;
    }
  }

  public async clearNotifications(): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur lors de la suppression des notifications:', error);
      return false;
    }
  }

  public async getUnreadCount(): Promise<number> {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) throw new Error('Erreur lors de la récupération du compte');
      const { count } = await response.json();
      return count;
    } catch (error) {
      console.error('Erreur lors de la récupération du compte:', error);
      return 0;
    }
  }

  public async updateBadge(count: number): Promise<void> {
    // Mettre à jour le favicon avec un badge
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

    // Mettre à jour le titre de la page
    if (count > 0) {
      document.title = `(${count}) ${document.title.replace(/^\(\d+\)\s/, '')}`;
    } else {
      document.title = document.title.replace(/^\(\d+\)\s/, '');
    }
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
