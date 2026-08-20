import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  adminLogin,
  getAllConversations,
  getConversationMessages,
} from '../controllers/adminController.js';

const router = express.Router();

const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['buyer', 'cook', 'admin']).withMessage('Invalid role'),
];

// Admin login (public, role checked inside)
router.route('/login')
  .post(createUserValidation.slice(1, 3), validate, adminLogin);

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.route('/users')
  .get(getUsers)
  .post(createUserValidation, validate, createUser);
router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

// Chat oversight (all conversations, including private ones)
router.route('/chats')
  .get(getAllConversations);
router.route('/chats/:conversationId')
  .get(getConversationMessages);

export default router;
