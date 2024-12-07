import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatRelativeTime = (date: Date): string => {
  try {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: fr,
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date invalide';
  }
};

export const formatDateTime = (date: Date): string => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  } catch (error) {
    console.error('Erreur lors du formatage de la date et l\'heure:', error);
    return 'Date invalide';
  }
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};

export const formatMessageDate = (date: Date): string => {
  try {
    if (isToday(date)) {
      return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }

    if (isYesterday(date)) {
      return 'Hier ' + new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }

    return formatDateTime(date);
  } catch (error) {
    console.error('Erreur lors du formatage de la date du message:', error);
    return 'Date invalide';
  }
};
