import ChatConversation from '../models/ChatConversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get/create a private chat between buyer and a specific cook
// @route   POST /api/chat/private/:cookId
// @access  Private
export const getOrCreatePrivateChat = async (req, res) => {
  try {
    const cookId = req.params.cookId;
    const buyerId = req.user._id;

    if (cookId === buyerId.toString()) {
      return res.status(400).json({ message: 'You cannot chat with yourself' });
    }

    const cook = await User.findById(cookId);
    if (!cook) {
      return res.status(404).json({ message: 'Cook not found' });
    }
    // Anyone can chat with any cook (even buyers can reach out)
    if (!cook.cookProfile?.isCook && cook.role !== 'cook') {
      return res.status(400).json({ message: 'This user is not a cook' });
    }

    // Find existing private conversation between these two users
    let conversation = await ChatConversation.findOne({
      type: 'private',
      participants: { $all: [buyerId, cookId], $size: 2 },
    });

    if (!conversation) {
      conversation = await ChatConversation.create({
        type: 'private',
        participants: [buyerId, cookId],
      });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Create private chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get or create the group channel with ALL chefs
// @route   POST /api/chat/all-chefs
// @access  Private
export const getAllChefsChannel = async (req, res) => {
  try {
    let channel = await ChatConversation.findOne({ type: 'group', isAllChefsChannel: true });
    if (!channel) {
      channel = await ChatConversation.create({
        type: 'group',
        isAllChefsChannel: true,
        participants: [], // virtual membership: every chef + the current user see it
      });
    }
    res.json({ success: true, data: channel });
  } catch (error) {
    console.error('Get all-chefs channel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get the current user's conversation list (all private chats + all-chefs channel)
// @route   GET /api/chat/conversations
// @access  Private
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Private conversations the user participates in
    const privates = await ChatConversation.find({
      type: 'private',
      participants: userId,
    })
      .populate('participants', 'name avatar role cookProfile.isCook')
      .sort({ lastMessageAt: -1 });

    // The all-chefs group channel (visible to everyone)
    const group = await ChatConversation.findOne({ type: 'group', isAllChefsChannel: true });

    res.json({ success: true, data: { private: privates, group: group || null } });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get messages in a conversation (role-aware: admins/cooks in private chats may view)
// @route   GET /api/chat/:conversationId/messages
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.map(String).includes(req.user._id.toString());
    const isCook = req.user.cookProfile?.isCook || req.user.role === 'cook';
    const isAdmin = req.user.role === 'admin';

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ message: 'Not part of this conversation' });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name avatar role cookProfile.isCook')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    List all chefs (for the chat UI / "all chefs" channel)
// @route   GET /api/chat/chefs
// @access  Private
export const getChefs = async (req, res) => {
  try {
    const chefs = await User.find({
      $or: [
        { 'cookProfile.isCook': true },
        { role: 'cook' },
      ],
    }).select('name avatar email cookProfile.cuisineTypes cookProfile.rating location');

    res.json({ success: true, count: chefs.length, data: chefs });
  } catch (error) {
    console.error('Get chefs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
