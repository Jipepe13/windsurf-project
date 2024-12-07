import { Request, Response } from 'express';
import { User } from '../models/User';
import { BanRecord } from '../models/BanRecord';
import { Report } from '../models/Report';
import { checkRole } from '../middleware/auth';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const promoteModerator = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur actuel est admin
    if (!checkRole(req, 'admin')) {
      return res.status(403).json({ error: 'Permission refusée' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.role = 'moderator';
    await user.save();

    res.json({ message: 'Utilisateur promu modérateur' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const revokeModerator = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur actuel est admin
    if (!checkRole(req, 'admin')) {
      return res.status(403).json({ error: 'Permission refusée' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.role = 'user';
    await user.save();

    res.json({ message: 'Statut de modérateur révoqué' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;
    
    // Vérifier que l'utilisateur actuel est modérateur ou admin
    if (!checkRole(req, ['moderator', 'admin'])) {
      return res.status(403).json({ error: 'Permission refusée' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Calculer la date de fin du ban
    const bannedUntil = duration === -1 
      ? null 
      : new Date(Date.now() + duration * 60 * 60 * 1000);

    // Créer l'enregistrement du ban
    const banRecord = new BanRecord({
      userId,
      reason,
      bannedBy: req.user.id,
      bannedAt: new Date(),
      bannedUntil,
    });
    await banRecord.save();

    // Mettre à jour l'utilisateur
    user.isBanned = true;
    user.banReason = reason;
    user.bannedUntil = bannedUntil;
    await user.save();

    res.json({ message: 'Utilisateur banni' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const unbanUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur actuel est modérateur ou admin
    if (!checkRole(req, ['moderator', 'admin'])) {
      return res.status(403).json({ error: 'Permission refusée' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.isBanned = false;
    user.banReason = undefined;
    user.bannedUntil = undefined;
    await user.save();

    res.json({ message: 'Utilisateur débanni' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getBanHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const banHistory = await BanRecord.find({ userId })
      .populate('bannedBy', 'name')
      .sort('-bannedAt');

    res.json(banHistory);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const reportUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const report = new Report({
      reportedUser: userId,
      reportedBy: req.user.id,
      reason,
      status: 'pending',
    });
    await report.save();

    res.json({ message: 'Utilisateur signalé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    // Vérifier que l'utilisateur actuel est modérateur ou admin
    if (!checkRole(req, ['moderator', 'admin'])) {
      return res.status(403).json({ error: 'Permission refusée' });
    }

    const reports = await Report.find()
      .populate('reportedUser', 'name email')
      .populate('reportedBy', 'name')
      .sort('-createdAt');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const resolveReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { resolution } = req.body;
    
    // Vérifier que l'utilisateur actuel est modérateur ou admin
    if (!checkRole(req, ['moderator', 'admin'])) {
      return res.status(403).json({ error: 'Permission refusée' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    report.status = 'resolved';
    report.resolution = resolution;
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    await report.save();

    res.json({ message: 'Signalement résolu' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
