import mongoose from 'mongoose';

const chatConversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true,
  },
  // Private chat: between a buyer and a cook
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Group chat: between a buyer and ALL chefs (one shared channel)
  isAllChefsChannel: {
    type: Boolean,
    default: false,
  },
  // Optional: link to a meal listing or buyer request for context
  mealListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealListing',
  },
  buyerRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BuyerRequest',
  },
  // Last message cache for conversation lists
  lastMessage: String,
  lastMessageAt: Date,
}, {
  timestamps: true,
});

chatConversationSchema.index({ participants: 1 });
chatConversationSchema.index({ type: 1 });

const ChatConversation = mongoose.model('ChatConversation', chatConversationSchema);

export default ChatConversation;
