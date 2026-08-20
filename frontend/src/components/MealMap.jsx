import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix missing Leaflet default marker icons (Vite doesn't serve the leaflet img assets)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const cookIcon = L.divIcon({
  className: 'custom-cook-marker',
  html: `<div style="
    background:#ef710a;
    color:white;
    width:36px;
    height:36px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    font-size:16px;
  "><span style="transform:rotate(45deg)">🍳</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="
    background:#89a81e;
    color:white;
    width:28px;
    height:28px;
    border-radius:50%;
    border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:13px;
  "><span style="font-weight:bold">You</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Component that recenters the map when the user location changes
const CenterMap = ({ userLocation }) => {
  const map = useMap();
  if (userLocation) {
    map.setView([userLocation.lat, userLocation.lng], map.getZoom());
  }
  return null;
};

const MealMap = ({ meals, userLocation, onMealSelect, radius = 5 }) => {
  const defaultCenter = [40.7128, -74.006];
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <CenterMap userLocation={userLocation} />

      {/* User's location marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {/* Search radius circle */}
      {userLocation && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={(radius || 5) * 1000}
          pathOptions={{ color: '#ef710a', weight: 2, fillOpacity: 0.05 }}
        />
      )}

      {/* Cook markers */}
      {meals.map((meal) => {
        const coordinates = meal.cook?.location?.coordinates;
        if (!coordinates) return null;
        const [lng, lat] = coordinates;
        const isUrgent = meal.availablePortions <= 3 && meal.availablePortions > 0;

        return (
          <Marker
            key={meal._id}
            position={[lat, lng]}
            icon={cookIcon}
            eventHandlers={{
              click: () => onMealSelect?.(meal),
            }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 14 }}>{meal.title}</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#666', textTransform: 'capitalize' }}>
                  {meal.cuisineType}
                </p>
                <p style={{ margin: '4px 0', fontSize: 13, fontWeight: 600, color: '#ef710a' }}>
                  ${meal.pricePerPortion} per portion
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#333' }}>
                  by {meal.cook?.name || 'a cook'}
                </p>
                {meal.distance && (
                  <p style={{ margin: '2px 0', fontSize: 11, color: '#888' }}>
                    {meal.distance} km away
                  </p>
                )}
                {isUrgent && (
                  <p style={{ margin: '4px 0', fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                    Only {meal.availablePortions} portions left!
                  </p>
                )}
                <button
                  onClick={() => onMealSelect?.(meal)}
                  style={{
                    marginTop: 6,
                    background: '#ef710a',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  View & Order
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MealMap;
