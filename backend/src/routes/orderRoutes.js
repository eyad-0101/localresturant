import express from 'express';
import { protect, isCook, authorize } from '../middleware/auth.js';
import {
  createOrder,
  getMyOrders,
  getCookOrders,
  getOrder,
  updateOrderStatus,
  stripeWebhook,
  leaveReview,
} from '../controllers/orderController.js';

const router = express.Router();

// Public Stripe webhook — must receive the RAW body for signature verification,
// so register it BEFORE express.json() parses the request payload.
router.use('/webhook/stripe', express.raw({ type: 'application/json' }));
router.post('/webhook/stripe', stripeWebhook);

// Protected routes
router.route('/')
  .post(protect, createOrder);

router.get('/my-orders', protect, getMyOrders);
router.get('/cook-orders', protect, isCook, getCookOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, updateOrderStatus);
router.post('/:id/review', protect, leaveReview);

export default router;
