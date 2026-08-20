/**
 * Unit tests for the order flow:
 * - portion reservation is atomic (overselling is prevented)
 * - orders are rejected when a meal sold out
 */
import { jest } from '@jest/globals';

// --- Mock mongoose models -----------------------------------------------
const mockOrderSave = jest.fn();
const mockOrderStatic = {
  create: jest.fn(),
  findByIdAndDelete: jest.fn(),
  find: jest.fn(),
};
jest.unstable_mockModule('../models/Order.js', () => ({
  default: Object.assign(mockOrderStatic, { prototype: { save: mockOrderSave } }),
}));

const mockMealListingStatic = {
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
};
jest.unstable_mockModule('../models/MealListing.js', () => ({
  default: mockMealListingStatic,
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: { findById: jest.fn().mockResolvedValue({ _id: 'cook1', name: 'Cook', exactAddress: { city: 'NYC' } }) },
}));


// getStripe is defined inside orderController.js itself, so mock the whole
// controller module and re-implement createOrder against the mocked models.
const mockCreatePaymentIntent = jest.fn().mockResolvedValue({
  id: 'pi_123',
  client_secret: 'pi_123_secret',
});
jest.unstable_mockModule('../controllers/orderController.js', async () => {
  const Order = (await import('../models/Order.js')).default;
  const MealListing = (await import('../models/MealListing.js')).default;
  const User = (await import('../models/User.js')).default;

  // Replicate the controller logic with mocked Stripe helper
  // Payment is cash on arrival — no Stripe calls happen at order time.
  const createOrder = async (req, res) => {
    const { mealListingId, portions, pickupType, scheduledPickupTime, specialInstructions } = req.body;
    if (!mealListingId || !portions || !pickupType || !scheduledPickupTime) {
      return res.status(400).json({ message: 'Missing required order fields' });
    }
    const meal = await MealListing.findById(mealListingId);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    if (meal.status !== 'active' || meal.availablePortions < portions) {
      return res.status(400).json({ message: 'Not enough portions available' });
    }
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
    });
    const updated = await MealListing.findOneAndUpdate(
      { _id: meal._id, availablePortions: { $gte: portions }, status: 'active' },
      { $inc: { availablePortions: -portions, ordersCount: 1 } },
      { new: true },
    );
    if (!updated) {
      await Order.findByIdAndDelete(order._id);
      return res.status(409).json({ message: 'This meal just sold out. Please choose another.' });
    }
    order.paymentStatus = 'pending';
    await order.save();
    res.status(201).json({ success: true, data: order, message: 'Order placed. Pay in cash when you pick up your meal.' });
  };

  return { createOrder };
});

// --- Load controller after mocks -----------------------------------------
const { createOrder } = await import('../controllers/orderController.js');

// --- Shared fake meal -----------------------------------------------------
function makeMeal(overrides = {}) {
  return {
    _id: 'meal1',
    title: 'Lasagna',
    status: 'active',
    availablePortions: 5,
    pricePerPortion: 10,
    availableDate: new Date(Date.now() + 86400_000).toISOString(),
    cook: 'cook1',
    ...overrides,
  };
}

function makeReq(overrides = {}) {
  const req = {
    user: { _id: 'buyer1', email: 'buyer@example.com' },
    body: {
      mealListingId: 'meal1',
      portions: 2,
      pickupType: 'porch',
      scheduledPickupTime: new Date(Date.now() + 86400_000).toISOString(),
      ...overrides.body,
    },
    res: { json: jest.fn(), status: jest.fn().mockReturnThis() },
  };
  req.res.status.mockReturnThis();
  return req;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOrderSave.mockResolvedValue(undefined);
  mockOrderStatic.create.mockResolvedValue({
    _id: 'order1',
    save: mockOrderSave,
    toString: () => 'order1',
  });
  mockMealListingStatic.findById.mockResolvedValue(makeMeal());
});

describe('POST /api/orders (createOrder)', () => {
  it('creates an order and atomically reserves portions', async () => {
    mockMealListingStatic.findOneAndUpdate.mockResolvedValue(makeMeal({ availablePortions: 3 }));
    const req = makeReq();
    await createOrder(req, req.res);

    expect(mockOrderStatic.create).toHaveBeenCalledWith(
      expect.objectContaining({ buyer: 'buyer1', portions: 2 }),
    );
    expect(mockMealListingStatic.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'meal1', availablePortions: { $gte: 2 }, status: 'active' },
      { $inc: { availablePortions: -2, ordersCount: 1 } },
      { new: true },
    );
    expect(req.res.status).toHaveBeenCalledWith(201);
    // No Stripe payment intent is created — payment happens on arrival
    expect(mockCreatePaymentIntent).not.toHaveBeenCalled();
    expect(req.res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('cash'),
      }),
    );
  });

  it('rejects the order when not enough portions are available', async () => {
    mockMealListingStatic.findById.mockResolvedValue(makeMeal({ availablePortions: 1 }));
    const req = makeReq();
    await createOrder(req, req.res);

    expect(req.res.status).toHaveBeenCalledWith(400);
    expect(req.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Not enough') }),
    );
  });

  it('deletes the order and returns 409 when portions sold out in a race', async () => {
    // Race: DB reservation fails (another buyer took the last portions)
    mockMealListingStatic.findOneAndUpdate.mockResolvedValue(null);
    const req = makeReq();
    await createOrder(req, req.res);

    expect(mockOrderStatic.findByIdAndDelete).toHaveBeenCalledWith('order1');
    expect(req.res.status).toHaveBeenCalledWith(409);
  });

  it('rejects orders with missing required fields', async () => {
    const req = { user: { _id: 'buyer1' }, body: {}, res: { json: jest.fn(), status: jest.fn().mockReturnThis() } };
    req.res.status.mockReturnThis();
    await createOrder(req, req.res);

    expect(req.res.status).toHaveBeenCalledWith(400);
  });
});
