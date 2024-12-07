import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { notificationService } from '../../services/notificationService';
import './Settings.css';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
  notifications: {
    messages: boolean;
    calls: boolean;
    donations: boolean;
    system: boolean;
    sound: boolean;
  };
  privacy: {
    onlineStatus: boolean;
    lastSeen: boolean;
    readReceipts: boolean;
    typing: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    contrast: 'normal' | 'high';
    animations: boolean;
  };
}

const UserPreferences: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    language: 'fr',
    notifications: {
      messages: true,
      calls: true,
      donations: true,
      system: true,
      sound: true,
    },
    privacy: {
      onlineStatus: true,
      lastSeen: true,
      readReceipts: true,
      typing: true,
    },
    accessibility: {
      fontSize: 'medium',
      contrast: 'normal',
      animations: true,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Charger les préférences utilisateur
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/users/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      }
    };

    // Vérifier la permission des notifications
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    loadPreferences();
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setPreferences((prev) => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLanguage: 'fr' | 'en') => {
    setPreferences((prev) => ({ ...prev, language: newLanguage }));
    // Implémenter le changement de langue
  };

  const handleNotificationChange = async (key: keyof typeof preferences.notifications) => {
    if (key === 'sound') {
      setPreferences((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !prev.notifications[key],
        },
      }));
      return;
    }

    if (notificationPermission === 'default') {
      const permission = await notificationService.requestPermission();
      setNotificationPermission(permission ? 'granted' : 'denied');
    }

    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handlePrivacyChange = (key: keyof typeof preferences.privacy) => {
    setPreferences((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key],
      },
    }));
  };

  const handleAccessibilityChange = (
    key: keyof typeof preferences.accessibility,
    value: string | boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: value,
      },
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        notificationService.showNotification({
          title: 'Préférences enregistrées',
          message: 'Vos préférences ont été mises à jour avec succès.',
          type: 'system',
        });
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      notificationService.showNotification({
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la sauvegarde des préférences.',
        type: 'system',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-container">
      <h2>Préférences utilisateur</h2>

      <section className="settings-section">
        <h3>Apparence</h3>
        <div className="settings-group">
          <label>Thème</label>
          <div className="theme-selector">
            <button
              className={preferences.theme === 'light' ? 'active' : ''}
              onClick={() => handleThemeChange('light')}
            >
              <i className="fas fa-sun" /> Clair
            </button>
            <button
              className={preferences.theme === 'dark' ? 'active' : ''}
              onClick={() => handleThemeChange('dark')}
            >
              <i className="fas fa-moon" /> Sombre
            </button>
            <button
              className={preferences.theme === 'system' ? 'active' : ''}
              onClick={() => handleThemeChange('system')}
            >
              <i className="fas fa-desktop" /> Système
            </button>
          </div>
        </div>

        <div className="settings-group">
          <label>Langue</label>
          <select
            value={preferences.language}
            onChange={(e) => handleLanguageChange(e.target.value as 'fr' | 'en')}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>

      <section className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-group">
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.messages}
              onChange={() => handleNotificationChange('messages')}
            />
            Messages
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.calls}
              onChange={() => handleNotificationChange('calls')}
            />
            Appels
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.donations}
              onChange={() => handleNotificationChange('donations')}
            />
            Dons
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.system}
              onChange={() => handleNotificationChange('system')}
            />
            Notifications système
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.sound}
              onChange={() => handleNotificationChange('sound')}
            />
            Son
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h3>Confidentialité</h3>
        <div className="settings-group">
          <label>
            <input
              type="checkbox"
              checked={preferences.privacy.onlineStatus}
              onChange={() => handlePrivacyChange('onlineStatus')}
            />
            Afficher mon statut en ligne
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.privacy.lastSeen}
              onChange={() => handlePrivacyChange('lastSeen')}
            />
            Afficher ma dernière connexion
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.privacy.readReceipts}
              onChange={() => handlePrivacyChange('readReceipts')}
            />
            Accusés de lecture
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.privacy.typing}
              onChange={() => handlePrivacyChange('typing')}
            />
            Indicateur de frappe
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h3>Accessibilité</h3>
        <div className="settings-group">
          <label>Taille du texte</label>
          <select
            value={preferences.accessibility.fontSize}
            onChange={(e) =>
              handleAccessibilityChange(
                'fontSize',
                e.target.value as 'small' | 'medium' | 'large'
              )
            }
          >
            <option value="small">Petite</option>
            <option value="medium">Moyenne</option>
            <option value="large">Grande</option>
          </select>

          <label>Contraste</label>
          <select
            value={preferences.accessibility.contrast}
            onChange={(e) =>
              handleAccessibilityChange(
                'contrast',
                e.target.value as 'normal' | 'high'
              )
            }
          >
            <option value="normal">Normal</option>
            <option value="high">Élevé</option>
          </select>

          <label>
            <input
              type="checkbox"
              checked={preferences.accessibility.animations}
              onChange={(e) =>
                handleAccessibilityChange('animations', e.target.checked)
              }
            />
            Animations
          </label>
        </div>
      </section>

      <div className="settings-actions">
        <button
          className="primary-button"
          onClick={savePreferences}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <i className="fas fa-spinner fa-spin" /> Enregistrement...
            </>
          ) : (
            'Enregistrer les préférences'
          )}
        </button>
      </div>
    </div>
  );
};

export default UserPreferences;
