import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mealListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealListing',
    required: true,
  },
  cook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  portions: {
    type: Number,
    required: [true, 'Please specify number of portions'],
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked-up', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
  },
  paymentIntentId: String, // Stripe payment intent
  // Pickup details
  pickupType: {
    type: String,
    enum: ['porch', 'handoff'],
    required: true,
  },
  scheduledPickupTime: {
    type: Date,
    required: true,
  },
  // QR code for contactless pickup (generated on confirmation)
  qrCode: {
    type: String,
    default: '',
  },
  // Special instructions
  specialInstructions: String,
  // For group orders
  isGroupOrder: {
    type: Boolean,
    default: false,
  },
  groupOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupOrder',
  },
  // Address snapshot at time of order (for privacy, exact address only revealed on order)
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  // Reviews
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    createdAt: Date,
  },
}, {
  timestamps: true,
});

// Index for queries
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ cook: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Generate QR code before saving (placeholder - implement actual QR generation)
orderSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'confirmed') {
    // Generate unique QR code string
    this.qrCode = `ORDER-${this._id.toString()}-${Date.now()}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
