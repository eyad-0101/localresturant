import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService, chatService } from '../services/api';
import useAuthStore from '../context/authStore';

const MealCard = ({ meal, onSelect, compact }) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [portions, setPortions] = useState(1);
  const [pickupType, setPickupType] = useState(meal.pickupType === 'porch' ? 'porch' : 'handoff');
  const [scheduledTime, setScheduledTime] = useState('');
  const [instructions, setInstructions] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const cookId = typeof meal.cook === 'object' ? meal.cook?._id : meal.cook;

  const handleOrder = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (portions > meal.availablePortions) {
      setError(`Only ${meal.availablePortions} portions left`);
      return;
    }
    if (!scheduledTime) {
      setError('Please pick a pickup time');
      return;
    }
    setOrdering(true);
    setError('');
    try {
      // Create the order (reserves portions server-side)
      const res = await orderService.createOrder({
        mealListingId: meal._id,
        portions,
        pickupType,
        scheduledPickupTime: new Date(scheduledTime).toISOString(),
        specialInstructions: instructions || undefined,
      });
      // Payment happens on arrival — no upfront online payment.
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place the order');
    } finally {
      setOrdering(false);
    }
  };

  const startChat = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await chatService.getOrCreatePrivateChat(cookId);
      navigate(`/chat?id=${res.data._id}`);
    } catch (err) {
      setError('Could not open chat');
    }
  };

  const isUrgent = meal.availablePortions <= 3 && meal.availablePortions > 0;

  if (compact) {
    return (
      <div
        onClick={() => onSelect?.(meal)}
        className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
      >
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-900">{meal.title}</h3>
          <span className="text-primary-500 font-bold">${meal.pricePerPortion}</span>
        </div>
        <p className="text-sm text-gray-500 capitalize">{meal.cuisineType}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span>by {meal.cook?.name || 'a cook'}</span>
          {meal.distance && <span>• {meal.distance} km away</span>}
          {isUrgent && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
              Only {meal.availablePortions} left!
            </span>
          )}
        </div>
        {meal.distance && (
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500" style={{ width: `${Math.min((meal.distance / 20) * 100, 100)}%` }} />
          </div>
        )}
      </div>
    );
  }

  // Expanded view (detail modal)
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{meal.title}</h2>
          <p className="text-gray-500 capitalize">{meal.cuisineType}</p>
          <p className="text-sm text-gray-500 mt-1">by {meal.cook?.name}</p>
        </div>
        <span className="text-2xl font-bold text-primary-500">${meal.pricePerPortion}/portion</span>
      </div>

      <p className="text-gray-600">{meal.description}</p>

      <div className="flex flex-wrap gap-2">
        {meal.dietaryInfo?.map((d) => (
          <span key={d} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full capitalize">{d}</span>
        ))}
        {meal.distance && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{meal.distance} km away</span>
        )}
        {isUrgent && (
          <span className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-full font-medium">
            Only {meal.availablePortions} portions left!
          </span>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p><strong>Pickup:</strong> {meal.pickupType === 'both' ? 'Porch pickup or handoff' : meal.pickupType === 'porch' ? 'Porch pickup' : 'Handoff'}</p>
        {meal.pickupTimeWindow && (
          <p><strong>Time window:</strong> {meal.pickupTimeWindow.start} – {meal.pickupTimeWindow.end}</p>
        )}
        <p><strong>Available:</strong> {new Date(meal.availableDate).toLocaleDateString()}</p>
        <p><strong>Portions left:</strong> {meal.availablePortions} / {meal.totalPortions}</p>
        {meal.groupOrderEnabled && (
          <p className="text-primary-600 font-medium">Group orders welcome — combine with neighbors for bigger batches</p>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Order placed — pay now to confirm it, then check My Orders for pickup details.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Portions</label>
            <input
              type="number"
              min={1}
              max={meal.availablePortions}
              value={portions}
              onChange={(e) => setPortions(Math.max(1, Number(e.target.value)))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pickup time</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pickup type</label>
            <select
              value={pickupType}
              onChange={(e) => setPickupType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {meal.pickupType !== 'handoff' && <option value="porch">Porch pickup</option>}
              {meal.pickupType !== 'porch' && <option value="handoff">Handoff</option>}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Special instructions (optional)</label>
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Allergies, preferences..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOrder}
            disabled={ordering}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
          >
            {ordering ? 'Placing order...' : `Order — $${(portions * meal.pricePerPortion).toFixed(2)}`}
          </button>
          <button
            onClick={startChat}
            className="px-4 border border-primary-500 text-primary-500 font-semibold rounded-lg hover:bg-primary-50"
            title="Chat with the cook"
          >
            💬
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center">Pay in cash when you pick up your meal • Exact address revealed after ordering</p>
      </div>
    </div>
  );
};

export default MealCard;
