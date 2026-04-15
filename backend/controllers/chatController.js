const { ChatConversation, ChatMessage } = require("../models/Chat");
const User = require("../models/User");

// MODULE 2 - Task 2B: Chat Management

// Create or get a chat conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId, hireRequestId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    // Check if conversation already exists
    let conversation = await ChatConversation.findOne({
      $or: [
        { universityId: userId, consultantId: otherUserId },
        { universityId: otherUserId, consultantId: userId }
      ]
    });

    if (!conversation) {
      // Create new conversation
      const userDoc = await User.findById(userId);
      const otherUserDoc = await User.findById(otherUserId);

      // Determine which is university and which is consultant
      const isUserUniversity = userDoc.role === 'university';
      const isOtherUniversity = otherUserDoc.role === 'university';

      conversation = new ChatConversation({
        universityId: isUserUniversity ? userId : otherUserId,
        consultantId: isUserUniversity ? otherUserId : userId,
        hireRequestId,
        projectName: "Consultant Assignment Chat",
        subject: "Project Coordination"
      });

      await conversation.save();
      console.log("[CHAT] New conversation created:", conversation._id);
    }

    res.status(200).json({
      message: "Conversation retrieved/created successfully",
      conversation
    });
  } catch (error) {
    console.error("[CHAT] Error creating conversation:", error);
    res.status(500).json({ 
      message: "Error creating conversation", 
      error: error.message 
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({ 
        message: "conversationId and message are required" 
      });
    }

    // Verify conversation exists and user is participant
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = 
      conversation.universityId.toString() === userId || 
      conversation.consultantId.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: "Not a participant in this conversation" });
    }

    // Get user info for message
    const userDoc = await User.findById(userId);
    const senderRole = userDoc.role;

    // Create message
    const chatMessage = new ChatMessage({
      conversationId,
      senderId: userId,
      senderName: userDoc.name,
      senderRole,
      message
    });

    await chatMessage.save();

    // Update conversation
    conversation.lastMessage = {
      text: message,
      timestamp: new Date(),
      senderId: userId
    };
    conversation.messageCount += 1;
    await conversation.save();

    console.log("[CHAT] Message sent:", chatMessage._id);

    res.status(201).json({
      message: "Message sent successfully",
      chatMessage
    });
  } catch (error) {
    console.error("[CHAT] Error sending message:", error);
    res.status(500).json({ 
      message: "Error sending message", 
      error: error.message 
    });
  }
};

// Get message history
exports.getMessageHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { limit = 50, page = 1 } = req.query;

    // Verify conversation exists and user is participant
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = 
      conversation.universityId.toString() === userId || 
      conversation.consultantId.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: "Not a participant in this conversation" });
    }

    // Get messages with pagination
    const skip = (page - 1) * limit;
    const messages = await ChatMessage.find({ conversationId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("senderId", "name email");

    const totalMessages = await ChatMessage.countDocuments({ conversationId });

    res.status(200).json({
      message: "Message history retrieved successfully",
      messages: messages.reverse(),
      pagination: {
        total: totalMessages,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalMessages / limit)
      }
    });
  } catch (error) {
    console.error("[CHAT] Error fetching message history:", error);
    res.status(500).json({ 
      message: "Error fetching message history", 
      error: error.message 
    });
  }
};

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await ChatConversation.find({
      $or: [
        { universityId: userId },
        { consultantId: userId }
      ]
    })
      .populate("universityId", "name email phone")
      .populate("consultantId", "name email phone")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      message: "Conversations retrieved successfully",
      conversations
    });
  } catch (error) {
    console.error("[CHAT] Error fetching conversations:", error);
    res.status(500).json({ 
      message: "Error fetching conversations", 
      error: error.message 
    });
  }
};

// Get conversation details
exports.getConversationDetails = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await ChatConversation.findById(conversationId)
      .populate("universityId", "name email phone")
      .populate("consultantId", "name email phone")
      .populate("hireRequestId");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = 
      conversation.universityId._id.toString() === userId || 
      conversation.consultantId._id.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: "Not a participant in this conversation" });
    }

    res.status(200).json({
      message: "Conversation details retrieved successfully",
      conversation
    });
  } catch (error) {
    console.error("[CHAT] Error fetching conversation details:", error);
    res.status(500).json({ 
      message: "Error fetching conversation details", 
      error: error.message 
    });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify conversation exists and user is participant
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = 
      conversation.universityId.toString() === userId || 
      conversation.consultantId.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: "Not a participant in this conversation" });
    }

    // Mark all unread messages from other user as read
    await ChatMessage.updateMany(
      { 
        conversationId, 
        senderId: { $ne: userId },
        isRead: false 
      },
      { isRead: true }
    );

    res.status(200).json({
      message: "Messages marked as read successfully"
    });
  } catch (error) {
    console.error("[CHAT] Error marking messages as read:", error);
    res.status(500).json({ 
      message: "Error marking messages as read", 
      error: error.message 
    });
  }
};
