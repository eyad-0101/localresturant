'use client';

import {useRouter} from "next/navigation";
import { useState, useEffect } from 'react';
import useAuthStore from '../../lib/authStore';
import { useGeolocation } from '../../lib/useGeolocation';
import { requestService } from '../../lib/api';

const CUISINE_TYPES = ['Any', 'Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Mediterranean', 'American', 'Other'];
const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 'keto', 'dairy-free'];

const RequestsPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { location: geoLocation } = useGeolocation();
  const [tab, setTab] = useState('browse');
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    cuisineType: 'Any',
    dietaryRequirements: [],
    portionsNeeded: 1,
    budgetPerPortion: 10,
    neededDate: '',
    pickupStart: '',
    pickupEnd: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadAll();
  }, [isAuthenticated, router]);

  const loadAll = () => {
    setLoading(true);
    Promise.all([requestService.getRequests(), requestService.getMyRequests()])
      .then(([all, mine]) => {
        setRequests(all.data || []);
        setMyRequests(mine.data || []);
      })
      .catch(() => setError('Could not load cravings'))
      .finally(() => setLoading(false));
  };

  const isCook = user?.cookProfile?.isCook || user?.role === 'cook';

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleDietary = (d) => {
    setForm((prev) => ({
      ...prev,
      dietaryRequirements: prev.dietaryRequirements.includes(d)
        ? prev.dietaryRequirements.filter((x) => x !== d)
        : [...prev.dietaryRequirements, d],
    }));
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        portionsNeeded: Number(form.portionsNeeded),
        budgetPerPortion: form.budgetPerPortion ? Number(form.budgetPerPortion) : undefined,
        neededDate: new Date(form.neededDate).toISOString(),
        pickupTimePreference: form.pickupStart && form.pickupEnd
          ? { start: form.pickupStart, end: form.pickupEnd }
          : undefined,
        location: geoLocation
          ? { type: 'Point', coordinates: [geoLocation.lng, geoLocation.lat] }
          : user?.location || { type: 'Point', coordinates: [-74.006, 40.7128] },
      };
      await requestService.createRequest(payload);
      setSuccess('Craving posted! Nearby cooks can now respond.');
      setShowForm(false);
      setForm({ title: '', description: '', cuisineType: 'Any', dietaryRequirements: [], portionsNeeded: 1, budgetPerPortion: 10, neededDate: '', pickupStart: '', pickupEnd: '' });
      loadAll();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post craving');
    }
  };

  const cookRespond = async (id, message) => {
    if (!message.trim()) return;
    try {
      await requestService.respondToRequest(id, { message });
      setSuccess('Response sent!');
      loadAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not respond');
    }
  };

  const cancelRequest = async (id) => {
    try {
      await requestService.cancelRequest(id);
      loadAll();
    } catch (err) {
      setError('Could not cancel');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cravings Board</h1>
          <p className="text-gray-600">
            {isCook ? 'Neighbors posted cravings — respond with what you can cook' : 'Post what you are craving and let cooks come to you'}
          </p>
        </div>
        {!isCook && (
          <button onClick={() => setShowForm(true)} className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-lg">
            + Post a Craving
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('browse')} className={`px-4 py-2 rounded-lg font-medium ${tab === 'browse' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700'}`}>
          Open Cravings ({requests.length})
        </button>
        <button onClick={() => setTab('mine')} className={`px-4 py-2 rounded-lg font-medium ${tab === 'mine' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700'}`}>
          My Cravings ({myRequests.length})
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (tab === 'browse' ? requests : myRequests).length === 0 ? (
        <div className="text-center bg-white rounded-2xl shadow-lg p-12">
          <p className="text-gray-600">
            {tab === 'browse' ? 'No open cravings right now. Check back later!' : 'You have not posted any cravings yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tab === 'browse' ? requests : myRequests).map((req) => (
            <div key={req._id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{req.title}</h3>
                  <p className="text-sm text-gray-500">
                    {req.buyer?.name || 'A neighbor'} • needed by{' '}
                    {new Date(req.neededDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">
                  {req.portionsNeeded} portions
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{req.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {req.cuisineType && (
                  <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full">{req.cuisineType}</span>
                )}
                {req.dietaryRequirements?.map((d) => (
                  <span key={d} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full capitalize">{d}</span>
                ))}
                {req.budgetPerPortion && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">
                    ~${req.budgetPerPortion}/portion
                  </span>
                )}
              </div>

              {/* Cook responses */}
              {req.responses?.length > 0 && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {req.responses.map((r, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-gray-800">{r.cook?.name || 'A cook'}:</p>
                      <p className="text-gray-600">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Cook: respond */}
              {isCook && tab === 'browse' && req.status === 'open' && (
                <button
                  onClick={() => {
                    const message = window.prompt('What can you offer? (dish name + price)');
                    if (message) cookRespond(req._id, message);
                  }}
                  className="mt-3 bg-secondary-500 hover:bg-secondary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Respond to Craving
                </button>
              )}

              {/* Buyer: cancel */}
              {tab === 'mine' && req.status === 'open' && (
                <button onClick={() => cancelRequest(req._id)} className="mt-3 border border-red-300 text-red-600 text-sm px-4 py-2 rounded-lg hover:bg-red-50">
                  Cancel Craving
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---- Post craving modal ---- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[2000]">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Post a Craving</h2>
            <form onSubmit={submitRequest} className="space-y-3">
              <input name="title" value={form.title} onChange={handleFormChange} placeholder="e.g., Authentic Biryani this weekend" required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Describe what you are craving..." rows={3} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <select name="cuisineType" value={form.cuisineType} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5">
                {CUISINE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDietary(d)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      form.dietaryRequirements.includes(d) ? 'bg-secondary-500 text-white border-secondary-500' : 'bg-white text-gray-600 border-gray-300'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Portions needed</label>
                  <input type="number" name="portionsNeeded" value={form.portionsNeeded} onChange={handleFormChange} min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Budget/portion $</label>
                  <input type="number" name="budgetPerPortion" value={form.budgetPerPortion} onChange={handleFormChange} min={0} step="0.5"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Needed by</label>
                <input type="date" name="neededDate" value={form.neededDate} onChange={handleFormChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Preferred pickup from</label>
                  <input type="time" name="pickupStart" value={form.pickupStart} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">until</label>
                  <input type="time" name="pickupEnd" value={form.pickupEnd} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <p className="text-xs text-gray-400">Your location is shared approximately (neighborhood only).</p>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg">
                  Post Craving
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
