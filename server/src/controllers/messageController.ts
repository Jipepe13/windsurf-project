import type { Request, Response } from 'express';
import Message from '../models/Message';
import logger from '../config/logger';
import { isValidObjectId } from 'mongoose';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { content, receiverId, type = 'text' } = req.body;
    const senderId = req.user?.userId;

    if (!senderId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    if (receiverId && !isValidObjectId(receiverId)) {
      return res.status(400).json({ message: 'ID du destinataire invalide' });
    }

    if (!content && !req.file) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }

    let mediaUrl;

    // Gérer l'upload de fichier
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      type,
      mediaUrl,
      isPrivate: !!receiverId,
      readBy: [senderId],
    });

    await message.save();

    // Peupler les informations de l'expéditeur
    await message.populate('sender', 'username avatar');
    if (receiverId) {
      await message.populate('receiver', 'username avatar');
    }

    // Émettre le message via Socket.IO
    const io = (req.app as any).get('io');
    if (receiverId) {
      io.to(receiverId).emit('new_message', message);
    } else {
      io.emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (error) {
    logger.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user?.userId;

    if (!senderId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    if (receiverId && !isValidObjectId(receiverId)) {
      return res.status(400).json({ message: 'ID du destinataire invalide' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 50));

    const query = receiverId
      ? {
          $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId },
          ],
        }
      : { receiver: null };

    const [messages, total] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('sender', 'username avatar')
        .populate('receiver', 'username avatar'),
      Message.countDocuments(query)
    ]);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({ message: 'ID du message invalide' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier si l'utilisateur est autorisé à marquer ce message comme lu
    if (message.isPrivate && message.receiver.toString() !== userId) {
      return res.status(403).json({ message: 'Non autorisé à marquer ce message comme lu' });
    }

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();

      // Notifier l'expéditeur que le message a été lu
      const io = (req.app as any).get('io');
      io.to(message.sender.toString()).emit('message_read', {
        messageId,
        readBy: userId,
      });
    }

    res.json(message);
  } catch (error) {
    logger.error('Erreur lors du marquage du message comme lu:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
