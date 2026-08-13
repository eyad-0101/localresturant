import MealListing from '../models/MealListing.js';
import User from '../models/User.js';
import geolib from 'geolib';

// @desc    Get all meal listings with filters
// @route   GET /api/meals
// @access  Public
export const getMeals = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 5,
      cuisineType,
      dietary,
      minPrice,
      maxPrice,
      availableNow,
      status = 'active',
    } = req.query;

    // Build query
    const query = { status };

    // Filter by cuisine type
    if (cuisineType) {
      query.cuisineType = cuisineType;
    }

    // Filter by dietary info
    if (dietary) {
      query.dietaryInfo = { $in: [dietary] };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.pricePerPortion = {};
      if (minPrice) query.pricePerPortion.$gte = Number(minPrice);
      if (maxPrice) query.pricePerPortion.$lte = Number(maxPrice);
    }

    // Filter by availability
    if (availableNow === 'true') {
      query.availableDate = { $gte: new Date() };
      query.availablePortions = { $gt: 0 };
    }

    // Find meals
    let meals = await MealListing.find(query)
      .populate('cook', 'name cookProfile.cuisineTypes cookProfile.rating location')
      .sort({ availableDate: 1 });

    // Filter by location if coordinates provided
    if (lat && lng) {
      const userLocation = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
      
      meals = meals.filter(meal => {
        if (!meal.cook?.location?.coordinates) return false;
        
        const cookLocation = {
          latitude: meal.cook.location.coordinates[1],
          longitude: meal.cook.location.coordinates[0],
        };
        
        const distance = geolib.getDistance(userLocation, cookLocation) / 1000; // Convert to km
        return distance <= parseFloat(radius);
      });

      // Add distance to each meal
      meals = meals.map(meal => {
        const cookLocation = {
          latitude: meal.cook.location.coordinates[1],
          longitude: meal.cook.location.coordinates[0],
        };
        const distance = geolib.getDistance(userLocation, cookLocation) / 1000;
        return {
          ...meal.toObject(),
          distance: distance.toFixed(2),
        };
      });
    }

    res.json({
      success: true,
      count: meals.length,
      data: meals,
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single meal listing
// @route   GET /api/meals/:id
// @access  Public
export const getMeal = async (req, res) => {
  try {
    const meal = await MealListing.findById(req.params.id)
      .populate('cook', 'name cookProfile bio phone location exactAddress');

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json({
      success: true,
      data: meal,
    });
  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create meal listing
// @route   POST /api/meals
// @access  Private/Cook
export const createMeal = async (req, res) => {
  try {
    // Add cook ID from authenticated user
    req.body.cook = req.user._id;

    const meal = await MealListing.create(req.body);

    res.status(201).json({
      success: true,
      data: meal,
    });
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update meal listing
// @route   PUT /api/meals/:id
// @access  Private/Cook
export const updateMeal = async (req, res) => {
  try {
    let meal = await MealListing.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check ownership
    if (meal.cook.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this meal' });
    }

    meal = await MealListing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: meal,
    });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete meal listing
// @route   DELETE /api/meals/:id
// @access  Private/Cook
export const deleteMeal = async (req, res) => {
  try {
    const meal = await MealListing.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check ownership
    if (meal.cook.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this meal' });
    }

    await meal.deleteOne();

    res.json({
      success: true,
      message: 'Meal listing deleted',
    });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get meals by cook
// @route   GET /api/meals/cook/:cookId
// @access  Public
export const getMealsByCook = async (req, res) => {
  try {
    const meals = await MealListing.find({ cook: req.params.cookId })
      .sort({ availableDate: -1 });

    res.json({
      success: true,
      count: meals.length,
      data: meals,
    });
  } catch (error) {
    console.error('Get meals by cook error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
