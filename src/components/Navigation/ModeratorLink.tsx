import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navigation.css';

const ModeratorLink: React.FC = () => {
  const { user } = useAuth();

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return null;
  }

  return (
    <Link to="/moderation" className="nav-link moderation-link">
      <i className="fas fa-shield-alt" />
      <span>Modération</span>
      {user.role === 'admin' && (
        <span className="role-badge admin">Admin</span>
      )}
      {user.role === 'moderator' && (
        <span className="role-badge moderator">Mod</span>
      )}
    </Link>
  );
};

export default ModeratorLink;
