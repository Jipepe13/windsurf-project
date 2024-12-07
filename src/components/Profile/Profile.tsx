import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '../../validations/profileSchemas';
import { uploadAvatar } from '../../services/userService';
import './Profile.css';

interface ProfileFormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  bio: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      bio: user?.bio || '',
      language: user?.language || 'fr',
      notifications: {
        email: user?.notifications?.email || false,
        push: user?.notifications?.push || false,
        sound: user?.notifications?.sound || false,
      },
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du profil');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);
      setSuccessMessage('Profil mis à jour avec succès');
      reset(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError('');

      // Afficher l'aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Uploader l'avatar
      const avatarUrl = await uploadAvatar(file);
      updateUser({ avatar: avatarUrl });
      setSuccessMessage('Avatar mis à jour avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement de l\'avatar');
      setPreviewImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Mon Profil</h2>
        <p>Gérez vos informations personnelles et vos préférences</p>
      </div>

      {error && <div className="profile-error">{error}</div>}
      {successMessage && <div className="profile-success">{successMessage}</div>}

      <div className="profile-content">
        <div className="avatar-section">
          <div
            className="avatar-wrapper"
            onClick={handleAvatarClick}
            role="button"
            tabIndex={0}
          >
            <img
              src={previewImage || user?.avatar || '/default-avatar.png'}
              alt={user?.username}
              className="profile-avatar"
            />
            <div className="avatar-overlay">
              <i className="fas fa-camera"></i>
              <span>Changer l'avatar</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
          <div className="form-section">
            <h3>Informations générales</h3>
            
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                {...register('username')}
                className={errors.username ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.username && (
                <span className="error-message">{errors.username.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className={errors.email ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.email && (
                <span className="error-message">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                {...register('bio')}
                className={errors.bio ? 'error' : ''}
                disabled={isLoading}
                rows={4}
              />
              {errors.bio && (
                <span className="error-message">{errors.bio.message}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Changer le mot de passe</h3>
            
            <div className="form-group">
              <label htmlFor="currentPassword">Mot de passe actuel</label>
              <input
                type="password"
                id="currentPassword"
                {...register('currentPassword')}
                className={errors.currentPassword ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.currentPassword && (
                <span className="error-message">{errors.currentPassword.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input
                type="password"
                id="newPassword"
                {...register('newPassword')}
                className={errors.newPassword ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.newPassword && (
                <span className="error-message">{errors.newPassword.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                id="confirmNewPassword"
                {...register('confirmNewPassword')}
                className={errors.confirmNewPassword ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.confirmNewPassword && (
                <span className="error-message">{errors.confirmNewPassword.message}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Préférences</h3>
            
            <div className="form-group">
              <label htmlFor="language">Langue</label>
              <select
                id="language"
                {...register('language')}
                className={errors.language ? 'error' : ''}
                disabled={isLoading}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
              {errors.language && (
                <span className="error-message">{errors.language.message}</span>
              )}
            </div>

            <div className="form-group notifications">
              <label>Notifications</label>
              
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    {...register('notifications.email')}
                    disabled={isLoading}
                  />
                  <span>Notifications par email</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    {...register('notifications.push')}
                    disabled={isLoading}
                  />
                  <span>Notifications push</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    {...register('notifications.sound')}
                    disabled={isLoading}
                  />
                  <span>Sons de notification</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="save-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                'Enregistrer les modifications'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
