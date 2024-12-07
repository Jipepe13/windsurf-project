import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import ModeratorPanel from '../../components/Moderation/ModeratorPanel';
import { moderationService } from '../../services/moderationService';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock du service de modération
jest.mock('../../services/moderationService');

const mockUsers = [
  {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    isBanned: false,
  },
  {
    id: '2',
    name: 'Banned User',
    email: 'banned@example.com',
    role: 'user',
    isBanned: true,
    banReason: 'Test ban',
    bannedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
];

const mockAuthContext = {
  user: {
    id: 'admin',
    role: 'admin',
    name: 'Admin User',
  },
  isAuthenticated: true,
};

describe('ModeratorPanel Component', () => {
  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();
    
    // Configuration des mocks
    (moderationService.getUsers as jest.Mock).mockResolvedValue(mockUsers);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          {component}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('Affiche la liste des utilisateurs', async () => {
    renderWithProviders(<ModeratorPanel />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Banned User')).toBeInTheDocument();
    });
  });

  test('Peut rechercher des utilisateurs', async () => {
    renderWithProviders(<ModeratorPanel />);

    const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...');
    
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Banned' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Banned User')).toBeInTheDocument();
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });
  });

  test('Peut bannir un utilisateur', async () => {
    (moderationService.banUser as jest.Mock).mockResolvedValue({ message: 'Utilisateur banni' });
    
    renderWithProviders(<ModeratorPanel />);

    // Attendre que les utilisateurs soient chargés
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Cliquer sur le bouton de bannissement
    const banButton = screen.getAllByText('Bannir')[0];
    fireEvent.click(banButton);

    // Remplir le formulaire de bannissement
    const reasonInput = screen.getByPlaceholderText('Spécifiez la raison...');
    const durationSelect = screen.getByRole('combobox');
    
    fireEvent.change(reasonInput, { target: { value: 'Test ban reason' } });
    fireEvent.change(durationSelect, { target: { value: '24' } });

    // Confirmer le bannissement
    const confirmButton = screen.getByText('Confirmer le bannissement');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(moderationService.banUser).toHaveBeenCalledWith('1', {
        reason: 'Test ban reason',
        duration: 24,
      });
    });
  });

  test('Peut débannir un utilisateur', async () => {
    (moderationService.unbanUser as jest.Mock).mockResolvedValue({ message: 'Utilisateur débanni' });
    
    renderWithProviders(<ModeratorPanel />);

    await waitFor(() => {
      expect(screen.getByText('Banned User')).toBeInTheDocument();
    });

    const unbanButton = screen.getByText('Débannir');
    fireEvent.click(unbanButton);

    await waitFor(() => {
      expect(moderationService.unbanUser).toHaveBeenCalledWith('2');
    });
  });

  test('Affiche les informations de bannissement', async () => {
    renderWithProviders(<ModeratorPanel />);

    await waitFor(() => {
      expect(screen.getByText('Banned User')).toBeInTheDocument();
      expect(screen.getByText('Raison : Test ban')).toBeInTheDocument();
    });
  });

  test('Admin peut promouvoir un modérateur', async () => {
    (moderationService.promoteModerator as jest.Mock).mockResolvedValue({ message: 'Utilisateur promu modérateur' });
    
    renderWithProviders(<ModeratorPanel />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const promoteButton = screen.getByText('Promouvoir modérateur');
    fireEvent.click(promoteButton);

    await waitFor(() => {
      expect(moderationService.promoteModerator).toHaveBeenCalledWith('1');
    });
  });

  test('Gère les erreurs correctement', async () => {
    (moderationService.getUsers as jest.Mock).mockRejectedValue(new Error('Erreur test'));
    
    renderWithProviders(<ModeratorPanel />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des utilisateurs')).toBeInTheDocument();
    });
  });
});
