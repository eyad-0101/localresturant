import { useState } from 'react';
import clsx from 'clsx';

const CUISINE_TYPES = [
  'Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 
  'Mediterranean', 'American', 'Other'
];

const DIETARY_OPTIONS = [
  'vegan', 'vegetarian', 'halal', 'kosher', 
  'gluten-free', 'keto', 'dairy-free'
];

const MealFilters = ({ onFilterChange, userLocation }) => {
  const [filters, setFilters] = useState({
    cuisineType: '',
    dietary: '',
    minPrice: '',
    maxPrice: '',
    availableNow: false,
    radius: 5,
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 space-y-4">
      {/* Toggle button for mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full flex items-center justify-between p-2 bg-gray-100 rounded-lg"
      >
        <span className="font-semibold">Filters</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter content */}
      <div className={clsx('space-y-4', isOpen ? 'block' : 'hidden lg:block')}>
        {/* Radius Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Radius: {filters.radius} km
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={filters.radius}
            onChange={(e) => handleFilterChange('radius', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 km</span>
            <span>20 km</span>
          </div>
        </div>

        {/* Cuisine Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cuisine Type
          </label>
          <select
            value={filters.cuisineType}
            onChange={(e) => handleFilterChange('cuisineType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Cuisines</option>
            {CUISINE_TYPES.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </div>

        {/* Dietary Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Requirements
          </label>
          <select
            value={filters.dietary}
            onChange={(e) => handleFilterChange('dietary', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">No Restrictions</option>
            {DIETARY_OPTIONS.map((option) => (
              <option key={option} value={option} className="capitalize">
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Price
            </label>
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              placeholder="$0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Price
            </label>
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="$50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Available Now Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Available Now
          </label>
          <button
            onClick={() => handleFilterChange('availableNow', !filters.availableNow)}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              filters.availableNow ? 'bg-primary-500' : 'bg-gray-200'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                filters.availableNow ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Reset Filters */}
        <button
          onClick={() => {
            const defaultFilters = {
              cuisineType: '',
              dietary: '',
              minPrice: '',
              maxPrice: '',
              availableNow: false,
              radius: 5,
            };
            setFilters(defaultFilters);
            onFilterChange?.(defaultFilters);
          }}
          className="w-full py-2 px-4 text-sm text-primary-500 hover:text-primary-600 font-medium"
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
};

export default MealFilters;
