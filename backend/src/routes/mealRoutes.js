import express from 'express';
import { body } from 'express-validator';
import { protect, isCook } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  getMealsByCook,
} from '../controllers/mealController.js';

const router = express.Router();

// Validation rules for creating/updating meals
const mealValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('cuisineType').notEmpty().withMessage('Cuisine type is required'),
  body('totalPortions').isInt({ min: 1 }).withMessage('Total portions must be at least 1'),
  body('availablePortions').isInt({ min: 0 }).withMessage('Available portions must be 0 or more'),
  body('pricePerPortion').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('availableDate').isISO8601().withMessage('Valid available date is required'),
  body('pickupTimeWindow.start').notEmpty().withMessage('Pickup start time is required'),
  body('pickupTimeWindow.end').notEmpty().withMessage('Pickup end time is required'),
];

// Public routes
router.route('/')
  .get(getMeals);

router.route('/:id')
  .get(getMeal);

router.route('/cook/:cookId')
  .get(getMealsByCook);

// Protected routes (cooks only)
router.route('/')
  .post(protect, isCook, mealValidation, validate, createMeal);

router.route('/:id')
  .put(protect, isCook, mealValidation, validate, updateMeal)
  .delete(protect, isCook, deleteMeal);

export default router;
