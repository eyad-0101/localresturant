import express from 'express';
import { protect, isCook, authorize } from '../middleware/auth.js';
import {
  createOrder,
  getMyOrders,
  getCookOrders,
  getOrder,
  updateOrderStatus,
  leaveReview,
} from '../controllers/orderController.js';

const router = express.Router();

// Protected routes
router.route('/')
  .post(protect, createOrder);

router.get('/my-orders', protect, getMyOrders);
router.get('/cook-orders', protect, isCook, getCookOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, updateOrderStatus);
router.post('/:id/review', protect, leaveReview);

export default router;
