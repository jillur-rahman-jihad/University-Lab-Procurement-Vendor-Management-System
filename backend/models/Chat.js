const mongoose = require("mongoose");

// MODULE 2 - Task 2B: Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: String,
  senderRole: {
    type: String,
    enum: ['university', 'consultant']
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Chat Conversation Schema
const chatConversationSchema = new mongoose.Schema({
  // Participants
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Related hire request
  hireRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConsultantHireRequest'
  },
  
  // Conversation metadata
  projectName: String,
  subject: String,
  
  // Last activity
  lastMessage: {
    text: String,
    timestamp: Date,
    senderId: mongoose.Schema.Types.ObjectId
  },
  
  // Messages count
  messageCount: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const ChatConversation = mongoose.model("ChatConversation", chatConversationSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = { ChatConversation, ChatMessage };
