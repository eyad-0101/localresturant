import mongoose from 'mongoose';

const mealListingSchema = new mongoose.Schema({
  cook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a meal title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: 1000,
  },
  cuisineType: {
    type: String,
    enum: ['Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Mediterranean', 'American', 'Other'],
    required: true,
  },
  dietaryInfo: [{
    type: String,
    enum: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 'keto', 'dairy-free'],
  }],
  images: [{
    type: String,
  }],
  // Batch cooking model
  totalPortions: {
    type: Number,
    required: [true, 'Please specify total portions'],
    min: 1,
  },
  availablePortions: {
    type: Number,
    required: true,
    min: 0,
  },
  pricePerPortion: {
    type: Number,
    required: [true, 'Please specify price per portion'],
    min: 0,
  },
  // Availability
  availableDate: {
    type: Date,
    required: [true, 'Please specify when this meal is available'],
  },
  pickupTimeWindow: {
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
  },
  // Pickup options
  pickupType: {
    type: String,
    enum: ['porch', 'handoff', 'both'],
    default: 'both',
  },
  porchPickupInstructions: String,
  // Status
  status: {
    type: String,
    enum: ['active', 'sold-out', 'cancelled', 'expired'],
    default: 'active',
  },
  // Group order support
  groupOrderEnabled: {
    type: Boolean,
    default: false,
  },
  groupOrderDeadline: Date,
  // Stats
  ordersCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewsCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for geospatial queries (through cook's location)
mealListingSchema.index({ cook: 1, availableDate: 1 });
mealListingSchema.index({ status: 1, availableDate: 1 });

// Virtual for checking if still available
mealListingSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && 
         this.availablePortions > 0 && 
         this.availableDate > new Date();
});

// Update status when portions run out
mealListingSchema.pre('save', function(next) {
  if (this.availablePortions === 0 && this.status !== 'sold-out') {
    this.status = 'sold-out';
  }
  if (this.availableDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

const MealListing = mongoose.model('MealListing', mealListingSchema);

export default MealListing;
