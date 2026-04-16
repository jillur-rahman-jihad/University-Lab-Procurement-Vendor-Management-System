const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  hiringId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hiring', 
    required: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  senderRole: {
    type: String,
    enum: ['university', 'consultant'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
