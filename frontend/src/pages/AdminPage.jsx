import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import { adminService } from '../services/api';

const ROLES = ['buyer', 'cook', 'admin'];

const AdminPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer', isCook: false });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/explore');
      return;
    }
    loadUsers();
  }, [isAuthenticated, user, navigate]);

  const loadUsers = () => {
    setLoading(true);
    adminService.getUsers()
      .then((res) => setUsers(res.data || []))
      .catch(() => setError('Could not load users'))
      .finally(() => setLoading(false));
  };

  const loadChats = () => {
    setLoading(true);
    adminService.getAllConversations()
      .then((res) => setConversations(res.data || []))
      .catch(() => setError('Could not load chats'))
      .finally(() => setLoading(false));
  };

  const openConversation = async (conv) => {
    setSelectedConv(conv);
    try {
      const res = await adminService.getConversationMessages(conv._id);
      setMessages(res.data?.messages || []);
    } catch (err) {
      setError('Could not load this conversation');
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        location: { type: 'Point', coordinates: [-74.006, 40.7128] },
      };
      if (form.isCook) {
        payload.cookProfile = { isCook: true };
      }
      await adminService.createUser(payload);
      setSuccess(`${form.name} created as ${form.role}`);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'buyer', isCook: false });
      loadUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create user');
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError('Could not delete user');
    }
  };

  const toggleRole = async (u) => {
    try {
      await adminService.updateUser(u._id, { role: u.role });
      loadUsers();
    } catch (err) {
      setError('Could not update user');
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage accounts and oversee all platform conversations</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-lg">
          + Create Account
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>}

      <div className="flex gap-2 mb-6">
        <button onClick={() => { setTab('users'); loadUsers(); }} className={`px-4 py-2 rounded-lg font-medium ${tab === 'users' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700'}`}>
          User Accounts
        </button>
        <button onClick={() => { setTab('chats'); loadChats(); }} className={`px-4 py-2 rounded-lg font-medium ${tab === 'chats' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700'}`}>
          Chat Oversight ({conversations.length})
        </button>
      </div>

      {tab === 'users' && (
        <>
          {loading ? (
            <p className="text-gray-500">Loading users...</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Cook</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Active</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'cook' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">{u.cookProfile?.isCook ? 'Yes 🍳' : '—'}</td>
                      <td className="px-4 py-3">{u.isActive ? '✅' : '❌'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteUser(u._id, u.name)}
                          disabled={u._id === user._id}
                          className="text-red-600 hover:underline disabled:opacity-30 disabled:no-underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'chats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          <div className="bg-white rounded-2xl shadow-lg p-4 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-gray-400">No conversations yet.</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg mb-2 border transition-colors ${
                    selectedConv?._id === conv._id ? 'bg-primary-100 border-primary-500' : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${conv.type === 'group' ? 'bg-secondary-100 text-secondary-700' : 'bg-gray-100 text-gray-600'}`}>
                      {conv.type === 'group' ? 'GROUP' : 'PRIVATE'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-1 truncate">
                    {conv.type === 'group' ? 'All Chefs Channel' : conv.title || 'Private chat'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                </button>
              ))
            )}
          </div>
          <div className="md:col-span-2 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
            {selectedConv ? (
              <>
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedConv.type === 'group' ? 'All Chefs Channel' : selectedConv.title || 'Private chat'}</p>
                    <p className="text-xs text-gray-500">
                      {selectedConv.type === 'group' ? 'Group • all chefs' : (selectedConv.participants || []).map((p) => p.name).join(' • ')}
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">Admin oversight</span>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-8">No messages in this conversation.</p>}
                  {messages.map((msg) => {
                    const isMine = msg.sender?._id === user._id;
                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-gray-200 text-gray-800' : 'bg-primary-500 text-white'}`}>
                          <p className="text-[10px] font-semibold mb-0.5 opacity-75">
                            {msg.sender?.name} {msg.sender?.role === 'admin' ? '👑' : msg.sender?.cookProfile?.isCook ? '🍳' : ''}
                          </p>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className="text-[10px] mt-1 opacity-75">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Select a conversation to view its full history
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Create account modal ---- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[2000]">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Account</h2>
            <form onSubmit={createUser} className="space-y-3">
              <input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5" />
              <input name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5" />
              <input name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (min 6)" required minLength={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 capitalize">
                {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isCook} onChange={(e) => setForm({ ...form, isCook: e.target.checked })} className="w-4 h-4" />
                Mark as home cook
              </label>
              <p className="text-xs text-gray-400">The new account starts with a placeholder location — they can set their real neighborhood in Profile.</p>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
