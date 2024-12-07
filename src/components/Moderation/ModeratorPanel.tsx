import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { moderationService } from '../../services/moderationService';
import { notificationService } from '../../services/notificationService';
import './Moderation.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  isBanned: boolean;
  banReason?: string;
  bannedUntil?: Date;
  banHistory: {
    reason: string;
    bannedAt: Date;
    bannedUntil: Date;
    bannedBy: string;
  }[];
}

const ModeratorPanel: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('24');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await moderationService.getUsers();
      setUsers(response);
      setLoading(false);
    } catch (error) {
      setError('Erreur lors du chargement des utilisateurs');
      setLoading(false);
    }
  };

  const handlePromoteToModerator = async (userId: string) => {
    try {
      await moderationService.promoteModerator(userId);
      notificationService.showNotification({
        title: 'Succès',
        message: 'Utilisateur promu modérateur',
        type: 'system',
      });
      loadUsers();
    } catch (error) {
      notificationService.showNotification({
        title: 'Erreur',
        message: 'Impossible de promouvoir l\'utilisateur',
        type: 'system',
      });
    }
  };

  const handleRevokeModerator = async (userId: string) => {
    try {
      await moderationService.revokeModerator(userId);
      notificationService.showNotification({
        title: 'Succès',
        message: 'Statut de modérateur révoqué',
        type: 'system',
      });
      loadUsers();
    } catch (error) {
      notificationService.showNotification({
        title: 'Erreur',
        message: 'Impossible de révoquer le modérateur',
        type: 'system',
      });
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!banReason.trim()) {
      setError('Veuillez spécifier une raison');
      return;
    }

    try {
      const duration = parseInt(banDuration);
      await moderationService.banUser(userId, {
        reason: banReason,
        duration,
      });
      
      notificationService.showNotification({
        title: 'Utilisateur banni',
        message: `Banni pour ${duration} heures`,
        type: 'system',
      });
      
      setSelectedUser(null);
      setBanReason('');
      setBanDuration('24');
      loadUsers();
    } catch (error) {
      notificationService.showNotification({
        title: 'Erreur',
        message: 'Impossible de bannir l\'utilisateur',
        type: 'system',
      });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await moderationService.unbanUser(userId);
      notificationService.showNotification({
        title: 'Succès',
        message: 'Utilisateur débanni',
        type: 'system',
      });
      loadUsers();
    } catch (error) {
      notificationService.showNotification({
        title: 'Erreur',
        message: 'Impossible de débannir l\'utilisateur',
        type: 'system',
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="moderator-panel-loading">
        <i className="fas fa-spinner fa-spin" />
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="moderator-panel">
      <div className="moderator-header">
        <h2>Panneau de modération</h2>
        <div className="search-bar">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle" />
          {error}
        </div>
      )}

      <div className="users-list">
        {filteredUsers.map((u) => (
          <div key={u.id} className={`user-item ${u.isBanned ? 'banned' : ''}`}>
            <div className="user-info">
              <div className="user-primary">
                <span className="user-name">{u.name}</span>
                <span className="user-role">{u.role}</span>
                {u.isBanned && (
                  <span className="banned-badge">
                    <i className="fas fa-ban" /> Banni
                  </span>
                )}
              </div>
              <div className="user-secondary">
                <span className="user-email">{u.email}</span>
              </div>
            </div>

            <div className="user-actions">
              {user?.role === 'admin' && u.role !== 'admin' && (
                <button
                  onClick={() =>
                    u.role === 'moderator'
                      ? handleRevokeModerator(u.id)
                      : handlePromoteToModerator(u.id)
                  }
                  className="action-button"
                >
                  {u.role === 'moderator' ? (
                    <>
                      <i className="fas fa-user-minus" />
                      Révoquer modérateur
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-shield" />
                      Promouvoir modérateur
                    </>
                  )}
                </button>
              )}

              {(user?.role === 'admin' || user?.role === 'moderator') && (
                <>
                  {u.isBanned ? (
                    <button
                      onClick={() => handleUnbanUser(u.id)}
                      className="action-button unban"
                    >
                      <i className="fas fa-user-check" />
                      Débannir
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="action-button ban"
                    >
                      <i className="fas fa-ban" />
                      Bannir
                    </button>
                  )}
                </>
              )}
            </div>

            {u.isBanned && u.banReason && (
              <div className="ban-info">
                <p>
                  <strong>Raison :</strong> {u.banReason}
                </p>
                {u.bannedUntil && (
                  <p>
                    <strong>Jusqu'au :</strong>{' '}
                    {new Date(u.bannedUntil).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedUser && (
        <div className="ban-modal">
          <div className="modal-content">
            <h3>Bannir {selectedUser.name}</h3>
            
            <div className="form-group">
              <label>Raison du bannissement</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Spécifiez la raison..."
              />
            </div>

            <div className="form-group">
              <label>Durée (heures)</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
              >
                <option value="1">1 heure</option>
                <option value="12">12 heures</option>
                <option value="24">24 heures</option>
                <option value="72">3 jours</option>
                <option value="168">1 semaine</option>
                <option value="720">30 jours</option>
                <option value="-1">Permanent</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => handleBanUser(selectedUser.id)}
                className="ban-button"
              >
                Confirmer le bannissement
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setBanReason('');
                  setBanDuration('24');
                }}
                className="cancel-button"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorPanel;
