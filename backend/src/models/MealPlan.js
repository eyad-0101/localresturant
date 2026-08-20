import mongoose from 'mongoose';

const mealPlanSchema = new mongoose.Schema({
  cook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a meal plan title'],
    trim: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  // Weekly schedule
  mealsPerWeek: {
    type: Number,
    required: true,
    enum: [2, 3, 4, 5],
  },
  cuisineType: {
    type: String,
    enum: ['Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Mediterranean', 'American', 'Other', 'Mixed'],
  },
  dietaryInfo: [{
    type: String,
    enum: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 'keto', 'dairy-free'],
  }],
  pricePerWeek: {
    type: Number,
    required: true,
    min: 0,
  },
  // Subscription details
  minimumWeeks: {
    type: Number,
    default: 2,
  },
  deliveryDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  }],
  pickupTimeWindow: {
    start: String,
    end: String,
  },
  // Active subscribers
  subscribers: [{
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    weeksCommitted: Number,
    weeksCompleted: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'completed'],
      default: 'active',
    },
    pausedAt: Date,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  maxSubscribers: {
    type: Number,
    default: 10,
  },
}, {
  timestamps: true,
});

mealPlanSchema.index({ cook: 1, isActive: 1 });

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

export default MealPlan;
