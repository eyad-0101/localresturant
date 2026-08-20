import MealListing from '../models/MealListing.js';

// @desc    Get all meals (with filtering + MongoDB geospatial queries)
// @route   GET /api/meals
// @access  Public
export const getMeals = async (req, res) => {
  try {
    const {
      cuisineType,
      dietary,
      minPrice,
      maxPrice,
      availableNow,
      lat,
      lng,
      radius,
    } = req.query;

    const query = { status: 'active' };

    // Filter by cuisine
    if (cuisineType) {
      query.cuisineType = cuisineType;
    }

    // Filter by dietary option
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

    // Geo filter: use MongoDB's native $nearSphere with the 2dsphere index
    // (much faster than fetching everything and filtering in JavaScript)
    let results = [];
    if (lat && lng) {
      const coordinates = [parseFloat(lng), parseFloat(lat)];
      const distanceInRadians = parseFloat(radius || 5) / 6378.1; // km -> radians

      const nearbyCookIds = await MealListing.distinct('cook', {
        ...query,
        'cook.location': {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates },
            $maxDistance: distanceInRadians,
          },
        },
      });

      if (nearbyCookIds.length > 0) {
        query.cook = { $in: nearbyCookIds };
      } else {
        return res.json({ success: true, count: 0, data: [] });
      }
    }

    // Find meals
    const meals = await MealListing.find(query)
      .populate('cook', 'name cookProfile.cuisineTypes cookProfile.rating location')
      .sort({ availableDate: 1 });

    // Add display distance (lightweight since the result set is already small)
    if (lat && lng) {
      const userLocation = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
      const { default: geolib } = await import('geolib');
      results = meals.map((meal) => {
        if (!meal.cook?.location?.coordinates) return meal.toObject();
        const cookLocation = {
          latitude: meal.cook.location.coordinates[1],
          longitude: meal.cook.location.coordinates[0],
        };
        const distance = geolib.getDistance(userLocation, cookLocation) / 1000;
        return { ...meal.toObject(), distance: distance.toFixed(2) };
      });
    } else {
      results = meals;
    }

    res.json({ success: true, count: results.length, data: results });
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

    res.json({ success: true, data: meal });
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
    req.body.cook = req.user._id;
    const meal = await MealListing.create(req.body);
    res.status(201).json({ success: true, data: meal });
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

    if (meal.cook.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this meal' });
    }

    meal = await MealListing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: meal });
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

    if (meal.cook.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this meal' });
    }

    await meal.deleteOne();

    res.json({ success: true, message: 'Meal listing deleted' });
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

    res.json({ success: true, count: meals.length, data: meals });
  } catch (error) {
    console.error('Get meals by cook error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
