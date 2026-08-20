'use client';

import {useRouter} from "next/navigation";
import { useState, useEffect } from 'react';
import useAuthStore from '../../lib/authStore';
import { mealService, orderService } from '../../lib/api';

const CUISINE_TYPES = ['Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Mediterranean', 'American', 'Other'];
const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 'keto', 'dairy-free'];

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState('meals');
  const [meals, setMeals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    cuisineType: 'Other',
    dietaryInfo: [],
    totalPortions: 10,
    availablePortions: 10,
    pricePerPortion: 8,
    availableDate: '',
    pickupStart: '',
    pickupEnd: '',
    pickupType: 'both',
    groupOrderEnabled: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!user?.cookProfile?.isCook && user?.role !== 'cook') {
      router.push('/explore');
      return;
    }
    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      mealService.getMealsByCook(user._id),
      orderService.getCookOrders(),
    ])
      .then(([mealsRes, ordersRes]) => {
        setMeals(mealsRes.data || []);
        setOrders(ordersRes.data || []);
      })
      .catch(() => setError('Could not load dashboard data'))
      .finally(() => setLoading(false));
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleDietary = (d) => {
    setForm((prev) => ({
      ...prev,
      dietaryInfo: prev.dietaryInfo.includes(d)
        ? prev.dietaryInfo.filter((x) => x !== d)
        : [...prev.dietaryInfo, d],
    }));
  };

  const openForm = (meal = null) => {
    setEditingId(meal?._id || null);
    if (meal) {
      const [start, end] = [meal.pickupTimeWindow?.start || '', meal.pickupTimeWindow?.end || ''];
      setForm({
        title: meal.title,
        description: meal.description,
        cuisineType: meal.cuisineType,
        dietaryInfo: meal.dietaryInfo || [],
        totalPortions: meal.totalPortions,
        availablePortions: meal.availablePortions,
        pricePerPortion: meal.pricePerPortion,
        availableDate: new Date(meal.availableDate).toISOString().slice(0, 10),
        pickupStart: start,
        pickupEnd: end,
        pickupType: meal.pickupType || 'both',
        groupOrderEnabled: Boolean(meal.groupOrderEnabled),
      });
    } else {
      setForm({
        title: '',
        description: '',
        cuisineType: 'Other',
        dietaryInfo: [],
        totalPortions: 10,
        availablePortions: 10,
        pricePerPortion: 8,
        availableDate: '',
        pickupStart: '',
        pickupEnd: '',
        pickupType: 'both',
        groupOrderEnabled: false,
      });
    }
    setShowForm(true);
  };

  const saveMeal = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const payload = {
      ...form,
      pickupTimeWindow: { start: form.pickupStart, end: form.pickupEnd },
      totalPortions: Number(form.totalPortions),
      availablePortions: Number(form.availablePortions),
      pricePerPortion: Number(form.pricePerPortion),
      availableDate: form.availableDate ? new Date(form.availableDate).toISOString() : undefined,
    };
    try {
      if (editingId) {
        await mealService.updateMeal(editingId, payload);
        setSuccess('Meal updated!');
      } else {
        await mealService.createMeal(payload);
        setSuccess('Meal listed! Neighbors can now see it on the map.');
      }
      setShowForm(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save meal');
    }
  };

  const deleteMeal = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await mealService.deleteMeal(id);
      setMeals((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError('Could not delete meal');
    }
  };

  const setStatus = async (id, status) => {
    try {
      await orderService.updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    } catch (err) {
      setError('Could not update order');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cook Dashboard</h1>
          <p className="text-gray-600">Manage your listings and incoming orders</p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          + New Listing
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('meals')}
          className={`px-4 py-2 rounded-lg font-medium ${tab === 'meals' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700'}`}
        >
          My Listings ({meals.length})
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium ${tab === 'orders' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700'}`}
        >
          Incoming Orders ({orders.length})
        </button>
      </div>

      {/* ---- Listings tab ---- */}
      {tab === 'meals' && (
        <>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : meals.length === 0 ? (
            <div className="text-center bg-white rounded-2xl shadow-lg p-12">
              <p className="text-gray-600 mb-4">You don't have any listings yet.</p>
              <button onClick={() => openForm()} className="text-primary-500 font-semibold hover:underline">
                Create your first listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meals.map((meal) => (
                <div key={meal._id} className="bg-white rounded-xl shadow p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{meal.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">{meal.cuisineType}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                      meal.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {meal.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{meal.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <span>${meal.pricePerPortion}/portion</span>
                    <span>{meal.availablePortions}/{meal.totalPortions} portions</span>
                    <span className="text-xs text-gray-400">
                      {new Date(meal.availableDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openForm(meal)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                      Edit
                    </button>
                    <button onClick={() => deleteMeal(meal._id)} className="flex-1 border border-red-300 text-red-600 py-2 rounded-lg text-sm hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---- Orders tab ---- */}
      {tab === 'orders' && (
        <>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-500">No orders yet. When buyers order your meals, they appear here.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-xl shadow p-5">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold">{order.mealListing?.title}</h3>
                      <p className="text-sm text-gray-500">
                        Buyer: {order.buyer?.name} • {order.portions} portion{order.portions > 1 ? 's' : ''} • $
                        {order.totalPrice}
                      </p>
                      <p className="text-xs text-gray-400">
                        Pickup: {new Date(order.scheduledPickupTime).toLocaleString()} • {order.pickupType}
                      </p>
                      {order.specialInstructions && (
                        <p className="text-xs text-gray-500 mt-1">Note: {order.specialInstructions}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                      order.status === 'ready' ? 'bg-green-50 text-green-700 border-green-200' :
                      order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {order.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {(order.status === 'confirmed' || order.status === 'pending') && (
                      <button onClick={() => setStatus(order._id, 'preparing')} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600">
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => setStatus(order._id, 'ready')} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600">
                        Mark Ready for Pickup
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button onClick={() => setStatus(order._id, 'picked-up')} className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600">
                        Mark Picked Up
                      </button>
                    )}
                    {order.status === 'picked-up' && (
                      <button onClick={() => setStatus(order._id, 'completed')} className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">
                        Complete Order
                      </button>
                    )}
                    {!['completed', 'cancelled', 'picked-up'].includes(order.status) && (
                      <button onClick={() => setStatus(order._id, 'cancelled')} className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---- Meal form modal ---- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[2000]">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Listing' : 'New Listing'}</h2>
            <form onSubmit={saveMeal} className="space-y-3">
              <input name="title" value={form.title} onChange={handleFormChange} placeholder="Dish title (e.g., Sunday Lasagna)" required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Description, ingredients, batch details" rows={3} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <select name="cuisineType" value={form.cuisineType} onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5">
                {CUISINE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDietary(d)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      form.dietaryInfo.includes(d) ? 'bg-secondary-500 text-white border-secondary-500' : 'bg-white text-gray-600 border-gray-300'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Total portions</label>
                  <input type="number" name="totalPortions" value={form.totalPortions} onChange={handleFormChange} min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Available</label>
                  <input type="number" name="availablePortions" value={form.availablePortions} onChange={handleFormChange} min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Price/portion $</label>
                  <input type="number" name="pricePerPortion" value={form.pricePerPortion} onChange={handleFormChange} min={0} step="0.5"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Available date</label>
                <input type="date" name="availableDate" value={form.availableDate} onChange={handleFormChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Pickup from</label>
                  <input type="time" name="pickupStart" value={form.pickupStart} onChange={handleFormChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Pickup until</label>
                  <input type="time" name="pickupEnd" value={form.pickupEnd} onChange={handleFormChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <select name="pickupType" value={form.pickupType} onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5">
                <option value="both">Porch pickup or handoff</option>
                <option value="porch">Porch pickup only</option>
                <option value="handoff">Handoff only</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="groupOrderEnabled" checked={form.groupOrderEnabled} onChange={handleFormChange} className="w-4 h-4" />
                Enable group orders (neighbors combine for bigger batches)
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg">
                  {editingId ? 'Save Changes' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
