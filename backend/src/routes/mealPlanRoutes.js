import express from 'express';
import { body } from 'express-validator';
import { protect, isCook } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getMealPlans,
  getMealPlan,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  subscribe,
  unsubscribe,
  getMySubscriptions,
} from '../controllers/mealPlanController.js';

const router = express.Router();

const planValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('mealsPerWeek').isInt({ min: 2, max: 5 }).withMessage('Meals per week must be 2-5'),
  body('pricePerWeek').isFloat({ min: 0 }).withMessage('Price must be positive'),
];

// Public routes
router.route('/')
  .get(getMealPlans);
router.route('/:id')
  .get(getMealPlan);
router.get('/subscriptions/my', protect, getMySubscriptions);

// Protected routes
router.route('/')
  .post(protect, isCook, planValidation, validate, createMealPlan);
router.route('/:id')
  .put(protect, isCook, planValidation, validate, updateMealPlan)
  .delete(protect, isCook, deleteMealPlan);

router.post('/:id/subscribe', protect, subscribe);
router.post('/:id/unsubscribe', protect, unsubscribe);

export default router;
