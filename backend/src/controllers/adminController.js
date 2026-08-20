import User from '../models/User.js';
import ChatConversation from '../models/ChatConversation.js';
import Message from '../models/Message.js';

// Generate a temporary password + token helper (reused by auth flow)
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

// @desc    List all users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a user account (admin creates buyer/cook/admin accounts)
// @route   POST /api/admin/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, isCook, location } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'buyer',
      cookProfile: isCook ? { isCook: true } : undefined,
      location: location || { type: 'Point', coordinates: [-74.006, 40.7128] },
    });

    // Return the password once so admin can share it with the new account owner
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cookProfile: user.cookProfile,
        temporaryPassword: password,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update any user (role toggles, cook status, deactivation)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, role, isCook, isActive } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role && ['buyer', 'cook', 'admin'].includes(role)) user.role = role;
    if (typeof isCook === 'boolean') user.cookProfile.isCook = isCook;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    const updated = await user.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Admin login (same endpoint style, guarded by role)
// @route   POST /api/admin/login
// @access  Public (role check inside)
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can log in here' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Admin chat oversight: list every conversation (including private ones)
// @route   GET /api/admin/chats
// @access  Private/Admin
export const getAllConversations = async (req, res) => {
  try {
    const conversations = await ChatConversation.find()
      .populate('participants', 'name email role cookProfile.isCook')
      .populate('mealListing', 'title')
      .sort({ lastMessageAt: -1 });
    res.json({ success: true, count: conversations.length, data: conversations });
  } catch (error) {
    console.error('Get all conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Admin chat oversight: read full message history of any conversation
// @route   GET /api/admin/chats/:conversationId
// @access  Private/Admin
export const getConversationMessages = async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name email role cookProfile.isCook')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
