'use client';

import Link from "next/link";
import {useRouter} from "next/navigation";
import { useState } from 'react';
import useAuthStore from '../../lib/authStore';
import { chatService } from '../../lib/api';
import { useGeolocation } from '../../lib/useGeolocation';

const CUISINE_TYPES = ['Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Mediterranean', 'American', 'Other'];
const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 'keto', 'dairy-free'];

const RegisterPage = () => {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { location } = useGeolocation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    isCook: false,
    cuisineTypes: [],
    dietaryOptions: [],
    bio: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleArray = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        // Geolocation (browser) gives us the buyer's neighborhood automatically
        location: location
          ? { type: 'Point', coordinates: [location.lng, location.lat] }
          : undefined,
      };
      if (form.isCook) {
        payload.cookProfile = {
          isCook: true,
          cuisineTypes: form.cuisineTypes,
          dietaryOptions: form.dietaryOptions,
          bio: form.bio,
        };
      }
      const res = await register(payload);
      chatService.socket.auth = { token: localStorage.getItem('token') };
      chatService.socket.connect();
      if (res.data?.cookProfile?.isCook) {
        router.push('/dashboard');
      } else {
        router.push('/explore');
      }
    } catch (err) {
      // error is in the store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join HomeCook Connect</h1>
          <p className="text-gray-600 mt-2">Create your account — as a buyer or a home cook</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isCook}
                onChange={(e) => setForm({ ...form, isCook: e.target.checked })}
                className="w-5 h-5 text-primary-500 rounded"
              />
              <span className="font-medium text-gray-800">I want to cook for my neighbors</span>
            </label>

            {form.isCook && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Cuisines you cook</p>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_TYPES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleArray('cuisineTypes', c)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          form.cuisineTypes.includes(c)
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Dietary options you offer</p>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleArray('dietaryOptions', d)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          form.dietaryOptions.includes(d)
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-secondary-500'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tell neighbors about your cooking..."
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-500 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
