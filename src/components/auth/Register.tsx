import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../validations/authSchemas';
import './Auth.css';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'inscription');
      }

      navigate('/login', {
        state: { message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' },
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const password = watch('password');

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Inscription</h2>
          <p>Créez votre compte WebChat</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              {...register('username')}
              className={errors.username ? 'error' : ''}
              disabled={isLoading}
              autoComplete="username"
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
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-input">
              <input
                type="password"
                id="password"
                {...register('password')}
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
            <div className="password-strength">
              <div className={`strength-bar ${getPasswordStrength(password)}`} />
              <span className="strength-text">
                {getPasswordStrengthText(password)}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'error' : ''}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="error-message">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                {...register('acceptTerms')}
                disabled={isLoading}
              />
              <span>
                J'accepte les{' '}
                <Link to="/terms" className="terms-link">
                  conditions d'utilisation
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <span className="error-message">{errors.acceptTerms.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              'Créer un compte'
            )}
          </button>
        </form>

        <div className="auth-links">
          <span>Déjà inscrit ?</span>
          <Link to="/login" className="auth-link-secondary">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

const getPasswordStrength = (password: string): string => {
  if (!password) return '';
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  switch (strength) {
    case 0:
    case 1:
      return 'weak';
    case 2:
    case 3:
      return 'medium';
    case 4:
    case 5:
      return 'strong';
    default:
      return '';
  }
};

const getPasswordStrengthText = (password: string): string => {
  const strength = getPasswordStrength(password);
  switch (strength) {
    case 'weak':
      return 'Faible';
    case 'medium':
      return 'Moyen';
    case 'strong':
      return 'Fort';
    default:
      return '';
  }
};

export default Register;
