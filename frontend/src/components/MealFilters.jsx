import { useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

const CUISINE_TYPES = ['Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Mediterranean', 'American', 'Other'];
const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 'keto', 'dairy-free'];

const MealFilters = ({ onFilterChange, userLocation }) => {
  const [cuisineType, setCuisineType] = useState('');
  const [dietary, setDietary] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [availableNow, setAvailableNow] = useState(false);

  const handleChange = (newValues) => {
    const filters = {
      ...newValues,
      ...((priceRange === 'low') && { minPrice: 0, maxPrice: 8 }),
      ...((priceRange === 'mid') && { minPrice: 8, maxPrice: 15 }),
      ...((priceRange === 'high') && { minPrice: 15 }),
      ...(availableNow && { availableNow: true }),
    };
    onFilterChange(filters);
  };

  return (
    <div className="bg-white rounded-lg p-4 space-y-4 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Search radius</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="1"
            max="20"
            defaultValue={5}
            onChange={(e) => handleChange({ radius: e.target.value })}
            className="flex-1 accent-orange-500"
          />
          <span className="text-sm text-gray-600 w-16">5 km</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine type</label>
        <select
          value={cuisineType}
          onChange={(e) => {
            setCuisineType(e.target.value);
            handleChange({ cuisineType: e.target.value || undefined });
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All cuisines</option>
          {CUISINE_TYPES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dietary option</label>
        <select
          value={dietary}
          onChange={(e) => {
            setDietary(e.target.value);
            handleChange({ dietary: e.target.value || undefined });
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All dietary</option>
          {DIETARY_OPTIONS.map((d) => (
            <option key={d} value={d} className="capitalize">{d}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Price range</label>
        <div className="flex gap-2">
          {['low', 'mid', 'high'].map((range) => (
            <button
              key={range}
              onClick={() => {
                setPriceRange(priceRange === range ? '' : range);
                handleChange({ minPrice: undefined, maxPrice: undefined });
              }}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                priceRange === range
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-500'
              }`}
            >
              {range === 'low' ? 'Under $8' : range === 'mid' ? '$8–$15' : '$15+'}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={availableNow}
          onChange={(e) => {
            setAvailableNow(e.target.checked);
            handleChange({ availableNow: undefined });
          }}
          className="w-4 h-4 text-primary-500 rounded"
        />
        Available now only
      </label>

      <button
        onClick={() => {
          setCuisineType('');
          setDietary('');
          setPriceRange('');
          setAvailableNow(false);
          onFilterChange({});
        }}
        className="w-full text-sm text-primary-500 hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
};

export default MealFilters;
