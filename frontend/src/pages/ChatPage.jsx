import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import { chatService } from '../services/api';

const ChatPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCookId = searchParams.get('cookId');

  const [conversations, setConversations] = useState({ private: [], group: null });
  const [activeId, setActiveId] = useState(null); // conversation id or 'all-chefs'
  const [activeType, setActiveType] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadConversations();
  }, [isAuthenticated, navigate]);

  // Open preselected cook chat (e.g., from an order page)
  useEffect(() => {
    if (preselectedCookId && conversations.private.length >= 0) {
      chatService.getOrCreatePrivateChat(preselectedCookId).then((res) => {
        setActiveId(res.data._id);
        setActiveType('private');
      }).catch(() => {});
    }
  }, [preselectedCookId, conversations]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const [convRes, chefsRes] = await Promise.all([
        chatService.getMyConversations(),
        chatService.getChefs(),
      ]);
      setConversations(convRes.data);
      setChefs(chefsRes.data || []);
    } catch (err) {
      setError('Could not load chats');
    } finally {
      setLoading(false);
    }
  };

  // Load messages whenever the active conversation changes
  useEffect(() => {
    if (!activeId) return;
    setMessages([]);
    chatService.getMessages(activeId)
      .then((res) => setMessages(res.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load messages'));
  }, [activeId]);

  // Socket event listeners
  useEffect(() => {
    const socket = chatService.socket;

    const onMessage = (message) => {
      if (!activeId) return;
      if (activeId === 'all-chefs') {
        setMessages((prev) => [...prev, message]);
      } else if (String(message.conversation) === String(activeId)) {
        setMessages((prev) => [...prev, message]);
      }
    };
    const onTyping = (data) => {
      if (String(data.conversationId) === String(activeId) && data.userId !== user?._id) {
        setTyping(`${data.userName} is typing...`);
        setTimeout(() => setTyping(''), 3000);
      }
    };
    const onTypingStop = (data) => {
      if (String(data.conversationId) === String(activeId)) setTyping('');
    };

    socket.on('message:new', onMessage);
    socket.on('typing', onTyping);
    socket.on('typing-stop', onTypingStop);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('typing', onTyping);
      socket.off('typing-stop', onTypingStop);
    };
  }, [activeId, user]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openPrivateChat = async (cookId) => {
    try {
      const res = await chatService.getOrCreatePrivateChat(cookId);
      setActiveId(res.data._id);
      setActiveType('private');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open chat');
    }
  };

  const openAllChefs = async () => {
    try {
      const res = await chatService.getAllChefsChannel();
      setActiveId('all-chefs');
      setActiveType('group');
      chatService.socket.emit('join:all-chefs');
    } catch (err) {
      setError('Could not open the all-chefs channel');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;
    chatService.socket.emit('message:send', { conversationId: activeId, content: input.trim() });
    setInput('');
  };

  const onTypingChange = (e) => {
    setInput(e.target.value);
    if (activeId && activeId !== 'all-chefs') {
      chatService.socket.emit('typing:start', { conversationId: activeId });
    }
  };

  const otherParticipant = (conv) =>
    conv.participants?.find((p) => p._id !== user?._id);

  const activeTitle =
    activeType === 'group'
      ? 'All Chefs Channel'
      : conversations.private.find((c) => c._id === activeId)
        ? `Chat with ${otherParticipant(conversations.private.find((c) => c._id === activeId))?.name}`
        : '';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* ---- Sidebar ---- */}
        <div className="bg-white rounded-2xl shadow-lg p-4 overflow-y-auto">
          <button
            onClick={openAllChefs}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
              activeId === 'all-chefs' ? 'bg-primary-100 border border-primary-500' : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-600 font-bold">
              ALL
            </div>
            <div>
              <p className="font-semibold text-sm">All Chefs Channel</p>
              <p className="text-xs text-gray-500">Announce to every cook</p>
            </div>
          </button>

          <p className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-2">Your conversations</p>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : conversations.private.length === 0 ? (
            <p className="text-sm text-gray-400">No conversations yet. Chat with a cook from a meal listing or your orders.</p>
          ) : (
            conversations.private.map((conv) => {
              const other = otherParticipant(conv);
              return (
                <button
                  key={conv._id}
                  onClick={() => { setActiveId(conv._id); setActiveType('private'); }}
                  className={`w-full text-left p-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
                    activeId === conv._id ? 'bg-primary-100 border border-primary-500' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                    {other?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{other?.name || 'Cook'}</p>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'Start a conversation'}</p>
                  </div>
                </button>
              );
            })
          )}

          <p className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-2">Chefs you can message</p>
          <div className="space-y-2">
            {chefs.map((chef) => (
              <button
                key={chef._id}
                onClick={() => openPrivateChat(chef._id)}
                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm font-bold">
                  {chef.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{chef.name}</p>
                  <p className="text-xs text-gray-400 truncate">{chef.cookProfile?.cuisineTypes?.join(', ') || 'Home cook'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ---- Chat window ---- */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
          {activeId ? (
            <>
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${activeType === 'group' ? 'bg-secondary-100 text-secondary-600' : 'bg-primary-100 text-primary-600'}`}>
                    {activeType === 'group' ? 'ALL' : activeTitle.replace('Chat with ', '').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{activeTitle}</p>
                    {activeType === 'group' && (
                      <p className="text-xs text-gray-500">Every chef on the platform can see this channel</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 text-sm mt-8">No messages yet — say hi!</p>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender._id === user._id;
                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMine ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        {!isMine && (
                          <p className={`text-xs font-semibold mb-0.5 ${activeType === 'group' ? 'text-secondary-600' : 'text-primary-600'}`}>
                            {msg.sender.name}
                            {msg.sender.cookProfile?.isCook || msg.sender.role === 'cook' ? ' 🍳' : ''}
                            {msg.sender.role === 'admin' ? ' 👑' : ''}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typing && <p className="text-xs text-gray-400 italic">{typing}</p>}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="border-t p-4 flex gap-2">
                <input
                  value={input}
                  onChange={onTypingChange}
                  placeholder={activeType === 'group' ? 'Announce something to all chefs...' : 'Type a message...'}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-lg"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a conversation or a chef to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
