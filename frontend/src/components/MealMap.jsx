import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

// Custom marker icons
const cookIcon = new Icon({
  iconUrl: '/markers/cook-marker.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const userIcon = new Icon({
  iconUrl: '/markers/user-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Component to update map center when filters change
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

const MealMap = ({ 
  meals, 
  userLocation, 
  onMealSelect, 
  radius = 5,
  showUserLocation = true 
}) => {
  const defaultCenter = [40.7128, -74.0060]; // New York as default
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (userLocation) {
      setCenter([userLocation.lat, userLocation.lng]);
    } else if (meals.length > 0 && meals[0].cook?.location?.coordinates) {
      const firstCook = meals[0].cook.location.coordinates;
      setCenter([firstCook[1], firstCook[0]]);
    }
  }, [userLocation, meals]);

  // Calculate circle area for radius visualization
  const radiusInDegrees = radius / 111; // Rough conversion

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {showUserLocation && userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
            
            {/* Radius circle */}
            <circle
              center={[userLocation.lat, userLocation.lng]}
              pathOptions={{ color: '#ef710a', fillColor: '#ef710a', fillOpacity: 0.1 }}
              radius={radius * 1000}
            />
          </>
        )}

        {/* Cook markers */}
        {meals.map((meal) => {
          if (!meal.cook?.location?.coordinates) return null;
          
          const [lng, lat] = meal.cook.location.coordinates;
          const isAvailable = meal.status === 'active' && meal.availablePortions > 0;
          
          return (
            <Marker
              key={meal._id}
              position={[lat, lng]}
              eventHandlers={{
                click: () => onMealSelect?.(meal),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg">{meal.title}</h3>
                  <p className="text-sm text-gray-600">{meal.cook.name}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Cuisine:</span>
                      <span className="text-sm font-medium">{meal.cuisineType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Price:</span>
                      <span className="text-sm font-medium">${meal.pricePerPortion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Available:</span>
                      <span className={clsx(
                        'text-sm font-medium',
                        isAvailable ? 'text-green-600' : 'text-red-600'
                      )}>
                        {meal.availablePortions} portions
                      </span>
                    </div>
                    {meal.distance && (
                      <div className="text-xs text-gray-500 mt-1">
                        {meal.distance} km away
                      </div>
                    )}
                  </div>
                  {isAvailable && (
                    <button
                      onClick={() => onMealSelect?.(meal)}
                      className="mt-3 w-full bg-primary-500 hover:bg-primary-600 text-white text-sm py-2 px-4 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapUpdater center={center} zoom={zoom} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <span>Cook available today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Cook not available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-primary-500 rounded-full"></div>
            <span>Your location</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealMap;
