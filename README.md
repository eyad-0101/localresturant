# HomeCook Connect - Neighborhood Homemade Food Marketplace

A map-based marketplace connecting home cooks with neighbors who want real homemade food.

## 🚀 Features

### Core Map Features
- **Cook Pins**: Display cuisine type, price range, and daily availability
- **Privacy-First**: Exact addresses hidden until order placement
- **Radius Slider**: Filter cooks within 1–5 km
- **Advanced Filters**: Cuisine, dietary restrictions (vegan, halal, gluten-free, keto), price, pickup vs. delivery, "available now"
- **Live Availability Badges**: Real-time portion counts ("Biryani today, 6 portions left")
- **Buyer Requests**: Reverse mode where buyers post cravings for cooks to respond

### Ordering System
- **Batch Cooking Model**: Cooks announce batches (e.g., "Lasagna Friday, 12 portions")
- **Preorders**: Time-window based pickup scheduling
- **Weekly Meal Plans**: Subscription model (3 dinners/week)
- **Group Orders**: Neighbors combine orders for larger batches
- **Contactless Pickup**: QR code-based porch pickup

## 📁 Project Structure

```
/homecook-connect
├── frontend/          # React + Vite + Leaflet/Mapbox
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components
│       ├── hooks/         # Custom React hooks
│       ├── services/      # API service layer
│       ├── context/       # React context providers
│       └── utils/         # Utility functions
├── backend/           # Node.js + Express + MongoDB
│   └── src/
│       ├── routes/        # API route definitions
│       ├── models/        # Mongoose models
│       ├── middleware/    # Auth, validation, etc.
│       ├── controllers/   # Business logic
│       └── config/        # Configuration files
└── docs/              # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **React** with Vite
- **Leaflet** or **Mapbox GL** for maps
- **TailwindCSS** for styling
- **React Query** for data fetching
- **Zustand** or **Context API** for state management

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Socket.io** for real-time updates
- **Stripe** for payments

## 🏃 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Start development servers
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📋 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/homecook-connect
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
MAPBOX_TOKEN=pk_...
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_MAPBOX_TOKEN=pk_...
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License
