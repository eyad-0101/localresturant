import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import ChatConversation from '../models/ChatConversation.js';
import User from '../models/User.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authenticate socket connections with the same JWT used by the REST API
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.user._id})`);

    // Join the all-chefs group channel automatically for chefs
    const isCook = socket.user.cookProfile?.isCook || socket.user.role === 'cook';
    if (isCook) {
      socket.join('channel:all-chefs');
    }
    // Buyers joining the all-chefs channel via the UI
    socket.on('join:all-chefs', async () => {
      const channel = await ChatConversation.findOne({ type: 'group', isAllChefsChannel: true });
      if (channel) socket.join(`channel:${channel._id}`);
    });

    // Join a specific conversation (private chat)
    socket.on('join:conversation', (conversationId) => {
      socket.join(`channel:${conversationId}`);
    });

    // Send a message (private or group)
    socket.on('message:send', async ({ conversationId, content }) => {
      if (!content || !content.trim()) return;

      // Only admins may post in the all-chefs channel; chefs may post everywhere they belong
      const isAdmin = socket.user.role === 'admin';
      const isCook = socket.user.cookProfile?.isCook || socket.user.role === 'cook';
      if (conversationId === 'all-chefs' && !isAdmin && !isCook) {
        return;
      }

      const message = await Message.create({
        conversation: conversationId === 'all-chefs' ? 'all-chefs' : conversationId,
        sender: socket.user._id,
        content: content.trim(),
      });
      await message.populate('sender', 'name avatar role cookProfile.isCook');

      if (conversationId === 'all-chefs') {
        io.to('channel:all-chefs').emit('message:new', message);
      } else {
        io.to(`channel:${conversationId}`).emit('message:new', message);

        // Update conversation cache
        await ChatConversation.findByIdAndUpdate(conversationId, {
          lastMessage: content.trim().slice(0, 200),
          lastMessageAt: new Date(),
        });
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`channel:${conversationId}`).emit('typing', {
        userId: socket.user._id,
        userName: socket.user.name,
        conversationId,
      });
    });
    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`channel:${conversationId}`).emit('typing-stop', {
        userId: socket.user._id,
        conversationId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

export const getIO = () => io;
