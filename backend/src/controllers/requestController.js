import BuyerRequest from '../models/BuyerRequest.js';

// @desc    Get all open buyer requests (with nearby filtering)
// @route   GET /api/requests
// @access  Public
export const getRequests = async (req, res) => {
  try {
    const query = { status: { $in: ['open', 'in-progress'] }, expiresAt: { $gt: new Date() } };

    if (req.query.cuisineType) {
      query.cuisineType = { $in: [req.query.cuisineType, 'Any'] };
    }
    if (req.query.dietary) {
      query.dietaryRequirements = { $in: [req.query.dietary] };
    }

    const requests = await BuyerRequest.find(query)
      .populate('buyer', 'name')
      .sort({ neededDate: 1 });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single request
// @route   GET /api/requests/:id
// @access  Public
export const getRequest = async (req, res) => {
  try {
    const request = await BuyerRequest.findById(req.params.id)
      .populate('buyer', 'name location')
      .populate('responses.cook', 'name cookProfile rating');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Post a craving
// @route   POST /api/requests
// @access  Private
export const createRequest = async (req, res) => {
  try {
    const request = await BuyerRequest.create({
      ...req.body,
      buyer: req.user._id,
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cook responds to a craving
// @route   POST /api/requests/:id/respond
// @access  Private/Cook
export const respondToRequest = async (req, res) => {
  try {
    const { message, mealListingId } = req.body;
    const isCook = req.user.cookProfile?.isCook || req.user.role === 'cook';
    if (!isCook) {
      return res.status(403).json({ message: 'Only cooks can respond to cravings' });
    }

    const request = await BuyerRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.status !== 'open') {
      return res.status(400).json({ message: 'This request is no longer open' });
    }
    const duplicate = request.responses.find(
      (r) => r.cook.toString() === req.user._id.toString(),
    );
    if (duplicate) {
      return res.status(400).json({ message: 'You already responded to this request' });
    }

    request.responses.push({
      cook: req.user._id,
      message,
      mealListingId,
    });
    request.status = 'in-progress';
    await request.save();

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Respond error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Buyer's own requests
// @route   GET /api/requests/my
// @access  Private
export const getMyRequests = async (req, res) => {
  try {
    const requests = await BuyerRequest.find({ buyer: req.user._id })
      .populate('responses.cook', 'name cookProfile rating')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cancel a request (buyer only)
// @route   DELETE /api/requests/:id
// @access  Private
export const cancelRequest = async (req, res) => {
  try {
    const request = await BuyerRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.buyer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    request.status = 'cancelled';
    await request.save();
    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
