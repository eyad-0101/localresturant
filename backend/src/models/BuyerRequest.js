import mongoose from 'mongoose';

const buyerRequestSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a title for your craving'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please describe what you are craving'],
    maxlength: 500,
  },
  cuisineType: {
    type: String,
    enum: ['Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Mediterranean', 'American', 'Other', 'Any'],
  },
  dietaryRequirements: [{
    type: String,
    enum: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 'keto', 'dairy-free'],
  }],
  portionsNeeded: {
    type: Number,
    required: true,
    min: 1,
  },
  budgetPerPortion: {
    type: Number,
    min: 0,
  },
  // When they want it
  neededDate: {
    type: Date,
    required: [true, 'Please specify when you need this'],
  },
  pickupTimePreference: {
    start: String,
    end: String,
  },
  // Location for nearby cooks
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  maxDistance: {
    type: Number,
    default: 5, // km
  },
  // Status
  status: {
    type: String,
    enum: ['open', 'in-progress', 'fulfilled', 'cancelled', 'expired'],
    default: 'open',
  },
  // Cook responses
  responses: [{
    cook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: String,
    mealListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealListing',
    },
    respondedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for geospatial queries
buyerRequestSchema.index({ location: '2dsphere' });
buyerRequestSchema.index({ status: 1, neededDate: 1 });

// Auto-expire old requests
buyerRequestSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  next();
});

const BuyerRequest = mongoose.model('BuyerRequest', buyerRequestSchema);

export default BuyerRequest;
