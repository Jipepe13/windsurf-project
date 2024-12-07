import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import logger from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_PREFIX = 'Bearer';

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith(TOKEN_PREFIX)) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        message: 'Accès non autorisé. Veuillez vous connecter.',
      });
    }

    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      // Vérifier l'expiration du token
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({
          message: 'Session expirée. Veuillez vous reconnecter.',
        });
      }

      // Vérifier si l'utilisateur existe toujours
      const user = await User.findById(decoded.userId)
        .select('-password')
        .lean();

      if (!user) {
        return res.status(401).json({
          message: 'Utilisateur non trouvé. Veuillez vous reconnecter.',
        });
      }

      // Ajouter l'ID de l'utilisateur à la requête
      req.user = { userId: decoded.userId };

      // Mettre à jour lastSeen
      await User.findByIdAndUpdate(decoded.userId, {
        lastSeen: new Date(),
      });

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.error('Erreur de vérification du token:', error);
        return res.status(401).json({
          message: 'Token invalide. Veuillez vous reconnecter.',
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Erreur middleware auth:', error);
    return res.status(500).json({
      message: 'Erreur serveur lors de l\'authentification.',
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const user = await User.findById(decoded.userId).select('-password');

      if (user) {
        req.user = { userId: decoded.userId };
      }
    } catch (error) {
      // Ignorer les erreurs de token en mode optionnel
      logger.debug('Token optionnel invalide:', error);
    }

    next();
  } catch (error) {
    logger.error('Erreur middleware auth optionnel:', error);
    next();
  }
};
