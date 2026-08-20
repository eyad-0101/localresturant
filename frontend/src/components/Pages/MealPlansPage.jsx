'use client';

import {useRouter} from "next/navigation";
import { useState, useEffect } from 'react';
import useAuthStore from '../../lib/authStore';
import { mealPlanService } from '../../lib/api';

const MealPlansPage = () => {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    mealPlanService.getMealPlans()
      .then((res) => setPlans(res.data || []))
      .catch(() => setError('Could not load meal plans'))
      .finally(() => setLoading(false));
  }, []);

  const subscribe = async (plan) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      await mealPlanService.subscribe(plan._id, plan.weeksCommitted);
      setSuccess(`Subscribed to ${plan.title}! Check your profile to manage it.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not subscribe');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Meal Plans</h1>
        <p className="text-gray-600">Subscribe to recurring weekly meal drops from your favorite cooks</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>}

      {loading ? (
        <p className="text-gray-500">Loading meal plans...</p>
      ) : plans.length === 0 ? (
        <div className="text-center bg-white rounded-2xl shadow-lg p-12">
          <p className="text-gray-600">No meal plans available yet. Cooks can publish weekly plans from their dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-xl shadow-lg p-5 flex flex-col">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{plan.title}</h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-secondary-100 text-secondary-700 border-secondary-200">
                  {plan.mealsPerWeek} meals/week
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">by {plan.cook?.name}</p>
              <p className="text-sm text-gray-600 mt-3 flex-1">{plan.description}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-xl font-bold text-primary-500">${plan.pricePerWeek}<span className="text-sm font-normal text-gray-500">/week</span></span>
                <button
                  onClick={() => subscribe(plan)}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  Subscribe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MealPlansPage;
