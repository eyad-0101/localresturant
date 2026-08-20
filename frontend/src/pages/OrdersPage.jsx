import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import useAuthStore from '../context/authStore';
import { orderService } from '../services/api';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'picked-up', 'completed'];

const statusColor = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'preparing': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'ready': return 'bg-green-50 text-green-700 border-green-200';
    case 'picked-up': return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const OrdersPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    orderService.getMyOrders()
      .then((res) => setOrders(res.data || []))
      .catch(() => setError('Could not load your orders'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const submitReview = async (orderId) => {
    setSubmitting(true);
    try {
      await orderService.leaveReview(orderId, reviewForm);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, review: { ...reviewForm, createdAt: new Date() } } : o)),
      );
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      setError('Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div className="text-center bg-white rounded-2xl shadow-lg p-12">
          <p className="text-gray-600 mb-4">You haven't ordered anything yet.</p>
          <Link to="/explore" className="text-primary-500 font-semibold hover:underline">
            Browse meals near you
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedId === order._id;
            const statusIdx = STATUS_STEPS.indexOf(order.status);
            return (
              <div key={order._id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order._id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{order.mealListing?.title || 'Meal'}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusColor(order.status)}`}>
                        {order.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      from {order.cook?.name || 'a cook'} • {order.portions} portion{order.portions > 1 ? 's' : ''} • $
                      {order.totalPrice}
                    </p>
                    {order.scheduledPickupTime && (
                      <p className="text-xs text-gray-400 mt-1">
                        Pickup: {new Date(order.scheduledPickupTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="border-t px-5 pb-5 pt-4 space-y-4">
                    {/* Payment status */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Payment:</span>
                      <span className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {order.paymentStatus}
                      </span>
                    </div>

                    {/* Progress steps */}
                    <div className="flex items-center gap-1">
                      {STATUS_STEPS.map((step, idx) => (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full ${idx <= statusIdx ? 'bg-primary-500' : 'bg-gray-200'}`}
                          title={step}
                        />
                      ))}
                    </div>

                    {/* Pickup address + QR (privacy: revealed through the order) */}
                    {order.status !== 'cancelled' && (
                      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Pickup address (contactless)</p>
                          <p className="text-sm font-medium">
                            {[order.pickupAddress?.street, order.pickupAddress?.city, order.pickupAddress?.state, order.pickupAddress?.zipCode]
                              .filter(Boolean)
                              .join(', ') || 'Available at pickup time'}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">Pickup type: {order.pickupType}</p>
                          <p className="text-xs text-gray-400">Cook phone: {order.cook?.phone || '—'}</p>
                        </div>
                        {order.qrCode && (
                          <div className="flex flex-col items-center justify-center bg-white rounded-lg p-3">
                            <QRCodeSVG value={order.qrCode} size={96} />
                            <p className="text-[10px] text-gray-400 mt-2 text-center break-all">{order.qrCode}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chat with the cook */}
                    <Link
                      to={`/chat?cookId=${order.cook?._id}`}
                      className="inline-block bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      Message {order.cook?.name?.split(' ')[0]}
                    </Link>

                    {/* Review */}
                    {order.status === 'completed' && !order.review && (
                      <div className="border rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">Leave a review</p>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                              className={`text-2xl ${n <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          rows={2}
                          placeholder="How was the meal?"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          onClick={() => submitReview(order._id)}
                          disabled={submitting}
                          className="mt-2 bg-secondary-500 hover:bg-secondary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          Submit Review
                        </button>
                      </div>
                    )}
                    {order.review && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm">
                        <span className="text-yellow-500">{'★'.repeat(order.review.rating)}</span>{' '}
                        <span className="text-gray-600">{order.review.comment}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
