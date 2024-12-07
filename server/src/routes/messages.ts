import express from 'express';
import {
  sendMessage,
  getMessages,
  markMessageAsRead,
} from '../controllers/messageController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('media'), sendMessage);
router.get('/:receiverId?', getMessages);
router.put('/:messageId/read', markMessageAsRead);

export default router;
