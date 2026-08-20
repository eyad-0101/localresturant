import express from 'express';
import { body } from 'express-validator';
import { protect, isCook } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getRequests,
  getRequest,
  createRequest,
  respondToRequest,
  getMyRequests,
  cancelRequest,
} from '../controllers/requestController.js';

const router = express.Router();

const requestValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('portionsNeeded').isInt({ min: 1 }).withMessage('Portions needed must be at least 1'),
  body('neededDate').isISO8601().withMessage('Valid needed date is required'),
  body('maxDistance').optional().isFloat({ min: 1 }).withMessage('Max distance must be positive'),
];

// Public routes
router.route('/')
  .get(getRequests);
router.route('/:id')
  .get(getRequest)
  .delete(protect, cancelRequest);

// Protected routes
router.route('/')
  .post(protect, requestValidation, validate, createRequest);
router.route('/my')
  .get(protect, getMyRequests);
router.route('/:id/respond')
  .post(protect, isCook, respondToRequest);

export default router;
