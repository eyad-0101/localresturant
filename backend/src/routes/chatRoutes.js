import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getOrCreatePrivateChat,
  getAllChefsChannel,
  getMyConversations,
  getMessages,
  getChefs,
} from '../controllers/chatController.js';

const router = express.Router();

router.use(protect);

router.route('/private/:cookId').post(getOrCreatePrivateChat);
router.route('/all-chefs').post(getAllChefsChannel);
router.route('/conversations').get(getMyConversations);
router.route('/chefs').get(getChefs);
router.route('/:conversationId/messages').get(getMessages);

export default router;
