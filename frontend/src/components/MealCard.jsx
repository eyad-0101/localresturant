import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';

const MealCard = ({ meal, onSelect, compact = false }) => {
  const isAvailable = meal.status === 'active' && meal.availablePortions > 0;
  const portionsLeft = meal.availablePortions;
  const urgencyLevel = portionsLeft <= 3 ? 'high' : portionsLeft <= 6 ? 'medium' : 'low';

  if (compact) {
    return (
      <div
        onClick={() => onSelect?.(meal)}
        className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{meal.title}</h3>
            <p className="text-sm text-gray-600">{meal.cook?.name}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {meal.cuisineType}
              </span>
              {meal.dietaryInfo?.map((diet) => (
                <span key={diet} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full capitalize">
                  {diet}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary-500">${meal.pricePerPortion}</p>
            <p className="text-sm text-gray-500">/portion</p>
          </div>
        </div>
        
        {isAvailable && (
          <div className="mt-3 flex items-center justify-between">
            <div className={clsx(
              'px-3 py-1 rounded-full text-sm font-medium',
              urgencyLevel === 'high' ? 'bg-red-100 text-red-700 availability-badge' :
              urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            )}>
              {portionsLeft} portions left
            </div>
            <span className="text-xs text-gray-500">
              {new Date(meal.availableDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Image placeholder */}
      <div className="h-48 bg-gradient-to-r from-primary-100 to-secondary-100 flex items-center justify-center">
        {meal.images?.[0] ? (
          <img src={meal.images[0]} alt={meal.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-sm text-gray-500 mt-2">No image</p>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold">{meal.title}</h3>
            <p className="text-sm text-gray-600">by {meal.cook?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-500">${meal.pricePerPortion}</p>
            <p className="text-xs text-gray-500">per portion</p>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{meal.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">{meal.cuisineType}</span>
          {meal.dietaryInfo?.map((diet) => (
            <span key={diet} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full capitalize">
              {diet}
            </span>
          ))}
        </div>

        {/* Availability Badge */}
        {isAvailable && (
          <div className={clsx(
            'mb-4 p-3 rounded-lg flex items-center justify-between',
            urgencyLevel === 'high' ? 'bg-red-50 border border-red-200' :
            urgencyLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-green-50 border border-green-200'
          )}>
            <div className="flex items-center gap-2">
              <div className={clsx(
                'w-3 h-3 rounded-full availability-badge',
                urgencyLevel === 'high' ? 'bg-red-500' :
                urgencyLevel === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              )} />
              <span className={clsx(
                'font-semibold',
                urgencyLevel === 'high' ? 'text-red-700' :
                urgencyLevel === 'medium' ? 'text-yellow-700' :
                'text-green-700'
              )}>
                Only {portionsLeft} portions left!
              </span>
            </div>
          </div>
        )}

        {/* Pickup Info */}
        <div className="border-t pt-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Available On</p>
              <p className="font-medium">
                {new Date(meal.availableDate).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Pickup Time</p>
              <p className="font-medium">
                {meal.pickupTimeWindow?.start} - {meal.pickupTimeWindow?.end}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Pickup Type</p>
              <p className="font-medium capitalize">{meal.pickupType}</p>
            </div>
            {meal.distance && (
              <div>
                <p className="text-gray-500">Distance</p>
                <p className="font-medium">{meal.distance} km</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onSelect?.(meal)}
            disabled={!isAvailable}
            className={clsx(
              'flex-1 py-3 px-4 rounded-lg font-semibold transition-colors',
              isAvailable
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            )}
          >
            {isAvailable ? 'Order Now' : 'Sold Out'}
          </button>
          {meal.groupOrderEnabled && (
            <button className="py-3 px-4 border-2 border-primary-500 text-primary-500 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
              Join Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealCard;
