export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch('/api/users/avatar', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du téléchargement de l\'avatar');
    }

    const data = await response.json();
    return data.avatarUrl;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Une erreur est survenue lors du téléchargement de l\'avatar');
  }
};

export const updateProfile = async (profileData: any): Promise<any> => {
  try {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour du profil');
    }

    return await response.json();
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Une erreur est survenue lors de la mise à jour du profil');
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    const response = await fetch('/api/users/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du changement de mot de passe');
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Une erreur est survenue lors du changement de mot de passe');
  }
};

export const updateNotificationPreferences = async (preferences: {
  email: boolean;
  push: boolean;
  sound: boolean;
}): Promise<void> => {
  try {
    const response = await fetch('/api/users/notifications', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Erreur lors de la mise à jour des préférences de notification'
      );
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(
          'Une erreur est survenue lors de la mise à jour des préférences de notification'
        );
  }
};

export const updateLanguagePreference = async (language: string): Promise<void> => {
  try {
    const response = await fetch('/api/users/language', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Erreur lors de la mise à jour de la préférence de langue'
      );
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(
          'Une erreur est survenue lors de la mise à jour de la préférence de langue'
        );
  }
};
