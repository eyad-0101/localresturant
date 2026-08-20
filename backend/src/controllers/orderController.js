import Order from '../models/Order.js';
import MealListing from '../models/MealListing.js';
import User from '../models/User.js';

const CENTS_PER_DOLLAR = 100;

const getStripe = async () => {
  const { Stripe } = await import('stripe');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// @desc    Place an order (creates order + Stripe payment intent)
// @route   POST /api/orders
// @access  Private/Buyer
export const createOrder = async (req, res) => {
  try {
    const { mealListingId, portions, pickupType, scheduledPickupTime, specialInstructions } = req.body;

    if (!mealListingId || !portions || !pickupType || !scheduledPickupTime) {
      return res.status(400).json({ message: 'Missing required order fields' });
    }

    const meal = await MealListing.findById(mealListingId);
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    if (meal.status !== 'active' || meal.availablePortions < portions) {
      return res.status(400).json({ message: 'Not enough portions available' });
    }
    if (new Date(meal.availableDate) < new Date()) {
      return res.status(400).json({ message: 'This meal is no longer available' });
    }

    // Cook's exact address is revealed only to this buyer through the order
    const cook = await User.findById(meal.cook);
    const totalPrice = Number((meal.pricePerPortion * portions).toFixed(2));

    const order = await Order.create({
      buyer: req.user._id,
      mealListing: meal._id,
      cook: meal.cook,
      portions,
      totalPrice,
      pickupType,
      scheduledPickupTime: new Date(scheduledPickupTime),
      specialInstructions,
      pickupAddress: cook.exactAddress || undefined,
      isGroupOrder: Boolean(req.body.isGroupOrder),
    });

    // Atomically reserve portions to avoid overselling
    const updated = await MealListing.findOneAndUpdate(
      { _id: meal._id, availablePortions: { $gte: portions }, status: 'active' },
      { $inc: { availablePortions: -portions, ordersCount: 1 } },
      { new: true },
    );

    if (!updated) {
      // Race condition: portions were taken by another buyer
      await Order.findByIdAndDelete(order._id);
      return res.status(409).json({ message: 'This meal just sold out. Please choose another.' });
    }

    // Create Stripe payment intent
    let paymentIntent = null;
    try {
      const stripe = await getStripe();
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * CENTS_PER_DOLLAR),
        currency: process.env.STRIPE_CURRENCY || 'usd',
        metadata: {
          orderId: order._id.toString(),
          mealTitle: meal.title,
          buyerEmail: req.user.email,
        },
      });
      order.paymentIntentId = paymentIntent.id;
      order.paymentStatus = 'pending';
      await order.save();
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      // Order still created; frontend can poll or admin can confirm manually
      order.paymentStatus = 'failed';
      await order.save();
      return res.status(500).json({
        message: 'Order created but payment could not be initialized. An admin can complete it manually.',
        data: order,
      });
    }

    res.status(201).json({
      success: true,
      data: order,
      clientSecret: paymentIntent ? paymentIntent.client_secret : null,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get buyer's own orders
// @route   GET /api/orders/my-orders
// @access  Private/Buyer
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('mealListing', 'title images pricePerPortion availableDate')
      .populate('cook', 'name phone cookProfile.rating')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get cook's received orders
// @route   GET /api/orders/cook-orders
// @access  Private/Cook
export const getCookOrders = async (req, res) => {
  try {
    const orders = await Order.find({ cook: req.user._id })
      .populate('buyer', 'name phone location')
      .populate('mealListing', 'title images')
      .sort({ scheduledPickupTime: 1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Get cook orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single order (buyer, cook or admin)
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('mealListing', 'title images pricePerPortion')
      .populate('cook', 'name phone email cookProfile rating')
      .populate('buyer', 'name phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (
      order.buyer._id.toString() !== req.user._id.toString() &&
      order.cook._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cook updates order status (preparing -> ready -> picked-up)
// @route   PUT /api/orders/:id/status
// @access  Private/Cook
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'ready', 'picked-up', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.cook.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the cook can update this order' });
    }

    order.status = status;
    if (status === 'cancelled') {
      // Refund portions back to the listing
      await MealListing.updateOne(
        { _id: order.mealListing },
        { $inc: { availablePortions: order.portions, ordersCount: -1 } },
      );
    }
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Webhook: Stripe confirms payment -> order confirmed
// @route   POST /api/orders/webhook/stripe
// @access  Public (signature verified)
export const stripeWebhook = async (req, res) => {
  try {
    const stripe = await getStripe();
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ message: 'Webhook signature failed' });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'paid',
          status: 'confirmed',
        });
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Buyer leaves a review on a completed order
// @route   POST /api/orders/:id/review
// @access  Private/Buyer
export const leaveReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the buyer can review this order' });
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed orders' });
    }

    order.review = { rating, comment, createdAt: new Date() };
    await order.save();

    // Update cook and meal aggregate ratings
    const meal = await MealListing.findById(order.mealListing);
    if (meal) {
      const totalRating = meal.rating * meal.reviewsCount + rating;
      meal.reviewsCount += 1;
      meal.rating = Math.round((totalRating / meal.reviewsCount) * 10) / 10;
      await meal.save();
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
