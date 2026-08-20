import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { orderService, mealPlanService } from '../services/api';

const CUISINE_TYPES = ['Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Mediterranean', 'American', 'Other'];
const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 'keto', 'dairy-free'];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, isLoading, error, clearError, logout } = useAuthStore();
  const { location: geoLocation } = useGeolocation();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
    isCook: false,
    cuisineTypes: [],
    dietaryOptions: [],
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [success, setSuccess] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      bio: user.cookProfile?.bio || '',
      isCook: user.cookProfile?.isCook || false,
      cuisineTypes: user.cookProfile?.cuisineTypes || [],
      dietaryOptions: user.cookProfile?.dietaryOptions || [],
      street: user.exactAddress?.street || '',
      city: user.exactAddress?.city || '',
      state: user.exactAddress?.state || '',
      zipCode: user.exactAddress?.zipCode || '',
    });
    if (user.role === 'buyer' || user.cookProfile?.isCook) {
      mealPlanService.getMySubscriptions().then((res) => setSubscriptions(res.data || [])).catch(() => {});
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleArray = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    clearError();
    setSuccess('');
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        cookProfile: {
          isCook: form.isCook,
          bio: form.bio,
          cuisineTypes: form.isCook ? form.cuisineTypes : [],
          dietaryOptions: form.isCook ? form.dietaryOptions : [],
        },
        exactAddress: {
          street: form.street,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
        },
      };
      // Prefer browser geolocation for the approximate neighborhood pin
      if (geoLocation) {
        payload.location = { type: 'Point', coordinates: [geoLocation.lng, geoLocation.lat] };
      }
      await updateProfile(payload);
      setSuccess('Profile saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      // error in store
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
      <p className="text-gray-600 mb-6">Manage your account, cooking preferences, and privacy settings</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-500 text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-500 text-sm">
              {user.email} •{' '}
              <span className="capitalize">{user.role}</span>
              {user.cookProfile?.isCook && ' • Cook'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isCook}
                onChange={(e) => setForm({ ...form, isCook: e.target.checked })}
                className="w-5 h-5 text-primary-500 rounded"
              />
              <span className="font-medium text-gray-800">I am a home cook</span>
            </label>

            {form.isCook && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Cuisines</p>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_TYPES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleArray('cuisineTypes', c)}
                        className={`px-3 py-1.5 rounded-full text-sm border ${
                          form.cuisineTypes.includes(c)
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Dietary options</p>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleArray('dietaryOptions', d)}
                        className={`px-3 py-1.5 rounded-full text-sm border ${
                          form.dietaryOptions.includes(d)
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3">
              <strong>Exact address (private)</strong> — only revealed to buyers when they order from you.
              Your map pin shows only an approximate neighborhood.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                <input
                  type="text"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State / ZIP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    name="zipCode"
                    value={form.zipCode}
                    onChange={handleChange}
                    className="w-24 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {subscriptions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">My Meal Plan Subscriptions</h2>
          <div className="space-y-3">
            {subscriptions.map(({ plan, subscription }) => (
              <div key={plan._id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{plan.title}</p>
                  <p className="text-sm text-gray-500">by {plan.cook?.name} • {plan.mealsPerWeek} meals/week • ${plan.pricePerWeek}/week</p>
                  <p className={`text-xs font-medium mt-1 ${subscription.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                    {subscription.status}
                  </p>
                </div>
                {subscription.status === 'active' && (
                  <button
                    onClick={() =>
                      mealPlanService.unsubscribe(plan._id).then((res) => {
                        setSubscriptions((prev) =>
                          prev.map((s) =>
                            s.plan._id === plan._id ? { ...s, subscription: { ...s.subscription, status: 'cancelled' } } : s,
                          ),
                        );
                      })
                    }
                    className="text-sm text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
