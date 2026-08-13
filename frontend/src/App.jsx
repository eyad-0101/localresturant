import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ExplorePage from './pages/ExplorePage';

// Placeholder pages - to be implemented
const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Real Homemade Food,<br />From Your Neighbors
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Connect with local home cooks in your neighborhood. Discover authentic homemade meals, 
        support your community, and enjoy real food made with love.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/explore"
          className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
        >
          Explore Meals
        </a>
        <a
          href="/register"
          className="bg-white hover:bg-gray-50 text-primary-500 border-2 border-primary-500 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
        >
          Become a Cook
        </a>
      </div>
      
      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Find Nearby Cooks</h3>
          <p className="text-gray-600">Discover home cooks within kilometers of your location. See what they are making today!</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Fresh & Authentic</h3>
          <p className="text-gray-600">Real homemade food made fresh daily. Know exactly what goes into your meal.</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Support Locals</h3>
          <p className="text-gray-600">Directly support home cooks in your community. Fair prices, real connections.</p>
        </div>
      </div>
    </div>
  </div>
);

const LoginPage = () => <div className="p-8"><h1>Login Page</h1></div>;
const RegisterPage = () => <div className="p-8"><h1>Register Page</h1></div>;
const ProfilePage = () => <div className="p-8"><h1>Profile Page</h1></div>;
const OrdersPage = () => <div className="p-8"><h1>Orders Page</h1></div>;
const DashboardPage = () => <div className="p-8"><h1>Cook Dashboard</h1></div>;
const RequestsPage = () => <div className="p-8"><h1>Post Craving Page</h1></div>;

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/requests" element={<RequestsPage />} />
      </Routes>
    </div>
  );
}

export default App;
