import express from 'express';
import { authenticateToken, checkRole } from '../middleware/auth';
import {
  getUsers,
  promoteModerator,
  revokeModerator,
  banUser,
  unbanUser,
  getBanHistory,
  reportUser,
  getReports,
  resolveReport,
} from '../controllers/moderationController';

const router = express.Router();

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les modérateurs et admins
router.get('/users', checkRole(['moderator', 'admin']), getUsers);
router.post('/ban/:userId', checkRole(['moderator', 'admin']), banUser);
router.post('/unban/:userId', checkRole(['moderator', 'admin']), unbanUser);
router.get('/ban-history/:userId', checkRole(['moderator', 'admin']), getBanHistory);
router.get('/reports', checkRole(['moderator', 'admin']), getReports);
router.post('/resolve-report/:reportId', checkRole(['moderator', 'admin']), resolveReport);

// Routes pour les admins uniquement
router.post('/promote/:userId', checkRole('admin'), promoteModerator);
router.post('/revoke/:userId', checkRole('admin'), revokeModerator);

// Routes pour tous les utilisateurs authentifiés
router.post('/report/:userId', reportUser);

export default router;
