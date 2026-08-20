import MealPlan from '../models/MealPlan.js';

// @desc    Get all active meal plans
// @route   GET /api/meal-plans
// @access  Public
export const getMealPlans = async (req, res) => {
  try {
    const plans = await MealPlan.find({ isActive: true })
      .populate('cook', 'name cookProfile.cuisineTypes cookProfile.dietaryOptions cookProfile.rating cookProfile.isCook')
      .sort({ pricePerWeek: 1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single meal plan
// @route   GET /api/meal-plans/:id
// @access  Public
export const getMealPlan = async (req, res) => {
  try {
    const plan = await MealPlan.findById(req.params.id)
      .populate('cook', 'name phone cookProfile');
    if (!plan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a meal plan (cooks only)
// @route   POST /api/meal-plans
// @access  Private/Cook
export const createMealPlan = async (req, res) => {
  try {
    const plan = await MealPlan.create({ ...req.body, cook: req.user._id });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error('Create meal plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a meal plan (owner only)
// @route   PUT /api/meal-plans/:id
// @access  Private/Cook
export const updateMealPlan = async (req, res) => {
  try {
    const plan = await MealPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    if (plan.cook.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this plan' });
    }
    const updated = await MealPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a meal plan (owner only)
// @route   DELETE /api/meal-plans/:id
// @access  Private/Cook
export const deleteMealPlan = async (req, res) => {
  try {
    const plan = await MealPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    if (plan.cook.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this plan' });
    }
    await plan.deleteOne();
    res.json({ success: true, message: 'Meal plan deleted' });
  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Subscribe to a meal plan
// @route   POST /api/meal-plans/:id/subscribe
// @access  Private/Buyer
export const subscribe = async (req, res) => {
  try {
    const plan = await MealPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    if (!plan.isActive) {
      return res.status(400).json({ message: 'This meal plan is no longer active' });
    }
    const activeSubscribers = plan.subscribers.filter((s) => s.status === 'active').length;
    if (activeSubscribers >= plan.maxSubscribers) {
      return res.status(400).json({ message: 'This plan is fully booked' });
    }
    const alreadySubscribed = plan.subscribers.find(
      (s) => s.subscriber.toString() === req.user._id.toString(),
    );
    if (alreadySubscribed && alreadySubscribed.status === 'active') {
      return res.status(400).json({ message: 'You are already subscribed' });
    }

    if (alreadySubscribed) {
      alreadySubscribed.status = 'active';
      alreadySubscribed.startDate = new Date();
    } else {
      plan.subscribers.push({
        subscriber: req.user._id,
        startDate: new Date(),
        weeksCommitted: req.body.weeksCommitted || plan.minimumWeeks,
      });
    }

    await plan.save();
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cancel a subscription
// @route   POST /api/meal-plans/:id/unsubscribe
// @access  Private
export const unsubscribe = async (req, res) => {
  try {
    const plan = await MealPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    const sub = plan.subscribers.find(
      (s) => s.subscriber.toString() === req.user._id.toString(),
    );
    if (!sub) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    sub.status = 'cancelled';
    sub.pausedAt = new Date();
    await plan.save();
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get buyer's own subscriptions
// @route   GET /api/meal-plans/my-subscriptions
// @access  Private
export const getMySubscriptions = async (req, res) => {
  try {
    const plans = await MealPlan.find({
      'subscribers.subscriber': req.user._id,
    }).populate('cook', 'name email');

    const mySubs = plans.map((plan) => {
      const sub = plan.subscribers.find(
        (s) => s.subscriber.toString() === req.user._id.toString(),
      );
      return { plan, subscription: sub };
    });

    res.json({ success: true, data: mySubs });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
