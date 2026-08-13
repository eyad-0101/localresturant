import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mealService } from '../services/api';
import useGeolocation from '../hooks/useGeolocation';
import MealMap from '../components/MealMap';
import MealFilters from '../components/MealFilters';
import MealCard from '../components/MealCard';
import clsx from 'clsx';

const ExplorePage = () => {
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const { location: userLocation, loading: locationLoading } = useGeolocation();

  // Fetch meals with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['meals', filters, userLocation],
    queryFn: () => {
      const queryParams = {
        ...filters,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      };
      return mealService.getMeals(queryParams);
    },
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleMealSelect = (meal) => {
    setSelectedMeal(meal);
  };

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      {/* Sidebar - Filters and List */}
      <div className={clsx(
        'w-full lg:w-96 bg-gray-50 overflow-y-auto',
        viewMode === 'list' ? 'block' : 'hidden lg:block'
      )}>
        <div className="p-4 space-y-4">
          {/* Filters */}
          <MealFilters 
            onFilterChange={handleFilterChange} 
            userLocation={userLocation}
          />

          {/* Results count */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isLoading ? 'Loading...' : `${data?.count || 0} meals found`}
            </h2>
            
            {/* View toggle for mobile */}
            <div className="lg:hidden flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'px-3 py-1 rounded-md text-sm',
                  viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-gray-200'
                )}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={clsx(
                  'px-3 py-1 rounded-md text-sm',
                  viewMode === 'map' ? 'bg-primary-500 text-white' : 'bg-gray-200'
                )}
              >
                Map
              </button>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p>Error loading meals: {error.message}</p>
            </div>
          )}

          {/* Meal list */}
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeletons
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : data?.data?.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">No meals found in your area</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              data?.data?.map((meal) => (
                <MealCard
                  key={meal._id}
                  meal={meal}
                  onSelect={handleMealSelect}
                  compact
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className={clsx(
        'flex-1',
        viewMode === 'map' ? 'block' : 'hidden lg:block'
      )}>
        <MealMap
          meals={data?.data || []}
          userLocation={userLocation}
          onMealSelect={handleMealSelect}
          radius={filters.radius || 5}
        />
      </div>

      {/* Selected Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Meal Details</h2>
              <button
                onClick={() => setSelectedMeal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <MealCard meal={selectedMeal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
