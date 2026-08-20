# HomeCook Connect - Neighborhood Homemade Food Marketplace

A map-based marketplace connecting home cooks with neighbors who want real homemade food. Buyers browse nearby cooks on an interactive map, order portions securely with Stripe, schedule contactless pickups, chat with cooks in real time, and admins oversee all accounts and conversations.

## 🚀 Features

### Map & Discovery
- **Cook Pins**: Cuisine type, price, daily availability, and distance shown directly on the map
- **Privacy-First**: Exact addresses hidden until an order is placed
- **Geo Filtering**: MongoDB `$nearSphere` queries filter meals within the chosen radius server-side (fast at any scale)
- **Advanced Filters**: Cuisine, dietary restrictions (vegan, halal, gluten-free, keto), price range, "available now"
- **Urgency Badges**: Live portion counts ("Only 3 portions left!")

### Ordering & Payments
- **Batch Cooking Model**: Cooks announce batches (e.g., "Lasagna Friday, 12 portions")
- **Atomic Reservation**: Portions are reserved in the database atomically — concurrent buyers cannot oversell a meal
- **Stripe Payments**: Payment intents created on the server, confirmed on the client via Stripe Elements; a webhook marks the order paid when Stripe confirms
- **Preorders**: Time-window-based pickup scheduling (porch pickup or handoff)
- **Contactless Pickup**: QR-code confirmation, with buyer reviews and cook ratings after completion
- **Group Orders**: Neighbors combine orders for larger batches

### Real-Time Chat
- **Private Chats**: Buyers message any cook directly; conversations are created lazily and deduplicated per pair
- **All-Chefs Channel**: One shared group channel where anyone can reach all chefs at once
- **Socket.io**: Instant message delivery across clients

### Meal Plans & Cravings
- **Weekly Meal Plans**: Cooks publish recurring plans; buyers subscribe to weekly drops
- **Buyer Requests (Cravings)**: Buyers post what they want; cooks browse the public cravings board

### Admin Panel
- **Account Management**: Admins create buyer, cook, and admin accounts, and can deactivate or delete users
- **Chat Oversight**: Admins can read every conversation on the platform, including private 1-on-1 chats

## 📁 Project Structure
```
homecook-connect
├── frontend/          # React + Vite + TailwindCSS + Leaflet
│   └── src/
│       ├── components/    # MealCard, MealMap, MealFilters, Navbar
│       ├── pages/         # Explore, Login, Register, Profile, Orders,
│       │                  # Dashboard, Requests, Chat, Admin, MealPlans
│       ├── services/      # Axios API layer + Socket.io chat service
│       ├── context/       # Zustand auth store
│       └── hooks/         # useGeolocation
├── backend/           # Node.js + Express + MongoDB
│   └── src/
│       ├── routes/        # auth, meals, orders, chat, mealPlans,
│       │                  # requests, admin
│       ├── models/        # User, MealListing, Order, ChatConversation,
│       │                  # Message, MealPlan, BuyerRequest
│       ├── controllers/   # Business logic (Stripe, geo queries)
│       ├── services/      # Socket.io chat service
│       ├── middleware/    # Auth, roles, validation
│       ├── config/        # Database, Stripe
│       └── __tests__/     # Jest unit tests
└── docs/              # Documentation
```

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, TailwindCSS, Leaflet, React Query, Zustand, Socket.io client, Stripe Elements |
| Backend | Node.js, Express, MongoDB/Mongoose, JWT, Socket.io, Stripe, Express Validator |
| Maps | OpenStreetMap tiles via Leaflet (no API key required) |
| Testing | Jest unit tests for orders and chat |

## 🏃 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation
```bash
# Install everything with the root monorepo script
npm run install:all

# Or install manually
cd frontend && npm install
cd ../backend && npm install
```

### Environment Variables
Copy the example files and fill in your values:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The backend needs at minimum:
```
MONGODB_URI=mongodb://localhost:27017/homecook-connect
JWT_SECRET=your-secret-key
PORT=5000
```

Optional (enables the full payment flow):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd
```

Without a Stripe key the app still works — orders are created, and an admin can mark them as paid manually.

### Run the App
```bash
# Development (both servers)
npm run dev

# Or run separately
cd backend && npm run dev     # API on port 5000
cd frontend && npm run dev    # UI on port 3000
```

The first server start automatically creates an admin account — the credentials are printed to the console.

### Tests
```bash
cd backend && npm test
```

## 📄 License
MIT
