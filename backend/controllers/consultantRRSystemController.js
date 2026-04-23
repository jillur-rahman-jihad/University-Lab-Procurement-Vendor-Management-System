const User = require('../models/User');

// Performance points calculation constants
const PERFORMANCE_POINTS = {
  LAB_COMPLETION: 10,
  POSITIVE_RATING: 5,
  BUDGET_OPTIMIZATION: 8,
  TIMELY_DEPLOYMENT: 7,
  CONSULTANT_HIRE: 15,
  SUGGESTION_SUBMITTED: 5,
  SUGGESTION_ACCEPTED: 20
};

// Ranking thresholds
const RANKING_THRESHOLDS = {
  General: 0,
  Certified: 30,
  Professional: 50
};

const LEGACY_RANK_MAP = {
  'General Consultant': 'General',
  'Certified Consultant': 'Certified',
  'Professional Consultant': 'Professional'
};

const normalizeRank = (rank) => LEGACY_RANK_MAP[rank] || rank;

const getRecentReviews = (reviews = [], limit = 2) => {
  return [...reviews]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map((review) => ({
      reviewer: review.reviewer,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt
    }));
};

// Calculate consultant rank based on points
const calculateRank = (points) => {
  if (points >= RANKING_THRESHOLDS.Professional) {
    return 'Professional';
  } else if (points >= RANKING_THRESHOLDS.Certified) {
    return 'Certified';
  } else {
    return 'General';
  }
};

/**
 * Internal helper to add points to a consultant and update their rank
 * @param {string} consultantId - The ID of the consultant
 * @param {string} pointsType - The type of achievement (key in PERFORMANCE_POINTS)
 * @param {number} [manualAmount] - Optional manual points amount
 * @returns {Promise<object>} - Updated consultant info
 */
const internalAddPoints = async (consultantId, pointsType, manualAmount = null) => {
  const consultant = await User.findById(consultantId);
  if (!consultant || consultant.role !== 'consultant') {
    throw new Error('Consultant not found');
  }

  const pointsToAdd = manualAmount !== null ? manualAmount : (PERFORMANCE_POINTS[pointsType] || 0);
  
  if (!consultant.consultantInfo) {
    consultant.consultantInfo = { points: 0, experienceLevel: 'General' };
  }

  consultant.consultantInfo.points = (consultant.consultantInfo.points || 0) + pointsToAdd;
  
  // Calculate and update rank
  const newRank = calculateRank(consultant.consultantInfo.points);
  consultant.consultantInfo.experienceLevel = newRank;

  await consultant.save();
  return {
    points: consultant.consultantInfo.points,
    rank: consultant.consultantInfo.experienceLevel,
    added: pointsToAdd
  };
};

// Export internal helper for use in other controllers
exports.internalAddPoints = internalAddPoints;

// Add performance points to consultant (API endpoint)
exports.addPerformancePoints = async (req, res) => {
  try {
    const { consultantId, pointsType, amount, description } = req.body;

    // Validate input
    if (!consultantId || !pointsType) {
      return res.status(400).json({ error: 'Consultant ID and points type are required' });
    }

    const result = await internalAddPoints(consultantId, pointsType, amount);

    res.status(200).json({
      message: 'Performance points added successfully',
      consultant: {
        id: consultantId,
        points: result.points,
        rank: result.rank,
        pointsAdded: result.added,
        description: description || `Added ${pointsType}`
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error adding performance points: ' + error.message });
  }
};

// Get consultant ranking details
exports.getConsultantRanking = async (req, res) => {
  try {
    const { consultantId } = req.params;

    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(404).json({ error: 'Consultant not found' });
    }

    const currentPoints = consultant.consultantInfo.points;
    const currentRank = consultant.consultantInfo.experienceLevel;
    
    // Calculate points to next rank
    let pointsToNextRank = 0;
    let nextRank = null;

    if (currentRank === 'General') {
      nextRank = 'Certified';
      pointsToNextRank = RANKING_THRESHOLDS.Certified - currentPoints;
    } else if (currentRank === 'Certified') {
      nextRank = 'Professional';
      pointsToNextRank = RANKING_THRESHOLDS.Professional - currentPoints;
    }

    res.status(200).json({
      consultant: {
        id: consultant._id,
        name: consultant.name,
        email: consultant.email,
        currentRank,
        totalPoints: currentPoints,
        nextRank,
        pointsToNextRank: Math.max(0, pointsToNextRank),
        completedLabDeployments: consultant.consultantInfo.completedLabDeployments,
        rating: consultant.consultantInfo.rating,
        reviewsCount: consultant.consultantInfo.reviews.length,
        averageResponseTime: consultant.consultantInfo.averageResponseTime,
        availability: consultant.consultantInfo.availability
      },
      rankingThresholds: RANKING_THRESHOLDS,
      performancePointsSystem: PERFORMANCE_POINTS
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching consultant ranking: ' + error.message });
  }
};

// Get all consultants with ranking
exports.getAllConsultantsRanking = async (req, res) => {
  try {
    const consultants = await User.find({ role: 'consultant' }).select(
      'name email consultantInfo.points consultantInfo.experienceLevel consultantInfo.rating consultantInfo.reviews consultantInfo.completedLabDeployments'
    );

    if (!consultants || consultants.length === 0) {
      return res.status(404).json({ error: 'No consultants found' });
    }

    const consultantRankings = consultants.map(consultant => ({
      id: consultant._id,
      name: consultant.name,
      email: consultant.email,
      rank: consultant.consultantInfo.experienceLevel,
      points: consultant.consultantInfo.points,
      rating: consultant.consultantInfo.rating,
      reviewsCount: consultant.consultantInfo.reviews.length,
      completedLabDeployments: consultant.consultantInfo.completedLabDeployments
    }));

    // Sort by points (descending)
    consultantRankings.sort((a, b) => b.points - a.points);

    res.status(200).json({
      message: 'Consultants ranking retrieved successfully',
      consultants: consultantRankings,
      totalConsultants: consultantRankings.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching consultants ranking: ' + error.message });
  }
};

// Record lab completion achievement
exports.recordLabCompletion = async (req, res) => {
  try {
    const { consultantId, labProjectId } = req.body;

    if (!consultantId || !labProjectId) {
      return res.status(400).json({ error: 'Consultant ID and Lab Project ID are required' });
    }

    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(404).json({ error: 'Consultant not found' });
    }

    // Add points for lab completion
    consultant.consultantInfo.points += PERFORMANCE_POINTS.LAB_COMPLETION;
    consultant.consultantInfo.completedLabDeployments += 1;

    // Update rank
    const newRank = calculateRank(consultant.consultantInfo.points);
    consultant.consultantInfo.experienceLevel = newRank;

    await consultant.save();

    res.status(200).json({
      message: 'Lab completion recorded successfully',
      consultant: {
        id: consultant._id,
        name: consultant.name,
        completedLabDeployments: consultant.consultantInfo.completedLabDeployments,
        points: consultant.consultantInfo.points,
        rank: consultant.consultantInfo.experienceLevel,
        pointsEarned: PERFORMANCE_POINTS.LAB_COMPLETION
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error recording lab completion: ' + error.message });
  }
};

// Update consultant rating and award points
exports.updateConsultantRating = async (req, res) => {
  try {
    const { consultantId, rating, review, universityId, universityName } = req.body;

    if (!consultantId || rating === undefined) {
      return res.status(400).json({ error: 'Consultant ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(404).json({ error: 'Consultant not found' });
    }

    const isIdLike = (value) => (
      typeof value === 'string' && (
        /^[a-f\d]{24}$/i.test(value) ||
        /^university-/i.test(value)
      )
    );

    const reviewerName = req.user?.role === 'university'
      ? req.user.name
      : (typeof universityName === 'string' && universityName.trim())
        ? universityName.trim()
        : (typeof universityId === 'string' && !isIdLike(universityId) && universityId.trim())
          ? universityId.trim()
          : 'University';

    // Add review
    const newReview = {
      reviewer: reviewerName,
      rating,
      comment: review || '',
      createdAt: new Date()
    };

    consultant.consultantInfo.reviews.push(newReview);

    // Calculate average rating
    const totalRating = consultant.consultantInfo.reviews.reduce((sum, r) => sum + r.rating, 0);
    consultant.consultantInfo.rating = (totalRating / consultant.consultantInfo.reviews.length).toFixed(2);

    // Award points for positive ratings (4 or 5 stars)
    if (rating >= 4) {
      consultant.consultantInfo.points += PERFORMANCE_POINTS.POSITIVE_RATING;
      
      // Update rank
      const newRank = calculateRank(consultant.consultantInfo.points);
      consultant.consultantInfo.experienceLevel = newRank;
    }

    await consultant.save();

    res.status(200).json({
      message: 'Consultant rating updated successfully',
      consultant: {
        id: consultant._id,
        name: consultant.name,
        rating: consultant.consultantInfo.rating,
        reviewsCount: consultant.consultantInfo.reviews.length,
        points: consultant.consultantInfo.points,
        rank: consultant.consultantInfo.experienceLevel,
        pointsEarned: rating >= 4 ? PERFORMANCE_POINTS.POSITIVE_RATING : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating consultant rating: ' + error.message });
  }
};

// Record budget optimization achievement
exports.recordBudgetOptimization = async (req, res) => {
  try {
    const { consultantId, amountSaved, description } = req.body;

    if (!consultantId || !amountSaved) {
      return res.status(400).json({ error: 'Consultant ID and amount saved are required' });
    }

    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(404).json({ error: 'Consultant not found' });
    }

    // Award points for budget optimization
    consultant.consultantInfo.points += PERFORMANCE_POINTS.BUDGET_OPTIMIZATION;

    // Update rank
    const newRank = calculateRank(consultant.consultantInfo.points);
    consultant.consultantInfo.experienceLevel = newRank;

    await consultant.save();

    res.status(200).json({
      message: 'Budget optimization recorded successfully',
      consultant: {
        id: consultant._id,
        name: consultant.name,
        points: consultant.consultantInfo.points,
        rank: consultant.consultantInfo.experienceLevel,
        pointsEarned: PERFORMANCE_POINTS.BUDGET_OPTIMIZATION,
        amountSaved,
        description: description || 'Budget optimization achievement'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error recording budget optimization: ' + error.message });
  }
};

// Record timely deployment achievement
exports.recordTimelyDeployment = async (req, res) => {
  try {
    const { consultantId, projectId, description } = req.body;

    if (!consultantId || !projectId) {
      return res.status(400).json({ error: 'Consultant ID and Project ID are required' });
    }

    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(404).json({ error: 'Consultant not found' });
    }

    // Award points for timely deployment
    consultant.consultantInfo.points += PERFORMANCE_POINTS.TIMELY_DEPLOYMENT;

    // Update rank
    const newRank = calculateRank(consultant.consultantInfo.points);
    consultant.consultantInfo.experienceLevel = newRank;

    await consultant.save();

    res.status(200).json({
      message: 'Timely deployment recorded successfully',
      consultant: {
        id: consultant._id,
        name: consultant.name,
        points: consultant.consultantInfo.points,
        rank: consultant.consultantInfo.experienceLevel,
        pointsEarned: PERFORMANCE_POINTS.TIMELY_DEPLOYMENT,
        description: description || 'Timely project deployment achievement'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error recording timely deployment: ' + error.message });
  }
};

// Get consultant leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const consultants = await User.find({ role: 'consultant' })
      .select(
        'name email consultantInfo.points consultantInfo.experienceLevel consultantInfo.rating consultantInfo.reviews consultantInfo.completedLabDeployments'
      )
      .sort({ 'consultantInfo.points': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    if (!consultants || consultants.length === 0) {
      return res.status(404).json({ error: 'No consultants found' });
    }

    const leaderboard = consultants.map((consultant, index) => ({
      rank: parseInt(offset) + index + 1,
      id: consultant._id,
      name: consultant.name,
      email: consultant.email,
      experienceLevel: consultant.consultantInfo.experienceLevel,
      points: consultant.consultantInfo.points,
      rating: consultant.consultantInfo.rating,
      reviewsCount: consultant.consultantInfo.reviews.length,
      recentReviews: getRecentReviews(consultant.consultantInfo.reviews),
      completedLabDeployments: consultant.consultantInfo.completedLabDeployments
    }));

    res.status(200).json({
      message: 'Leaderboard retrieved successfully',
      leaderboard,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await User.countDocuments({ role: 'consultant' })
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leaderboard: ' + error.message });
  }
};

// Filter consultants by rank
exports.getConsultantsByRank = async (req, res) => {
  try {
    const requestedRank = req.params.rank;
    const rank = normalizeRank(requestedRank);
    const validRanks = ['General', 'Certified', 'Professional'];

    if (!validRanks.includes(rank)) {
      return res.status(400).json({ error: `Invalid rank. Valid ranks: ${validRanks.join(', ')}` });
    }

    const consultants = await User.find({
      role: 'consultant',
      'consultantInfo.experienceLevel': rank
    }).select(
      'name email consultantInfo.points consultantInfo.experienceLevel consultantInfo.rating consultantInfo.reviews consultantInfo.completedLabDeployments'
    );

    if (!consultants || consultants.length === 0) {
      return res.status(404).json({ error: `No consultants found with rank: ${requestedRank}` });
    }

    const consultantsList = consultants.map(consultant => ({
      id: consultant._id,
      name: consultant.name,
      email: consultant.email,
      rank: consultant.consultantInfo.experienceLevel,
      points: consultant.consultantInfo.points,
      rating: consultant.consultantInfo.rating,
      reviewsCount: consultant.consultantInfo.reviews.length,
      recentReviews: getRecentReviews(consultant.consultantInfo.reviews),
      completedLabDeployments: consultant.consultantInfo.completedLabDeployments
    }));

    res.status(200).json({
      message: `Consultants with rank: ${requestedRank}`,
      rank,
      consultants: consultantsList,
      totalCount: consultantsList.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching consultants by rank: ' + error.message });
  }
};

// Get consultant performance statistics
exports.getPerformanceStats = async (req, res) => {
  try {
    const { consultantId } = req.params;

    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(404).json({ error: 'Consultant not found' });
    }

    const averageRating = consultant.consultantInfo.rating || 0;
    const reviewsCount = consultant.consultantInfo.reviews.length;
    const completedLabDeployments = consultant.consultantInfo.completedLabDeployments;
    const totalPoints = consultant.consultantInfo.points;
    const currentRank = consultant.consultantInfo.experienceLevel;

    // Calculate percentage to next rank
    let percentToNextRank = 0;
    let nextRank = null;

    if (currentRank === 'General') {
      nextRank = 'Certified';
      percentToNextRank = (totalPoints / RANKING_THRESHOLDS.Certified) * 100;
    } else if (currentRank === 'Certified') {
      nextRank = 'Professional';
      percentToNextRank = (totalPoints / RANKING_THRESHOLDS.Professional) * 100;
    } else {
      percentToNextRank = 100;
    }

    res.status(200).json({
      consultant: {
        id: consultant._id,
        name: consultant.name,
        email: consultant.email
      },
      performanceMetrics: {
        currentRank,
        nextRank,
        totalPoints,
        percentToNextRank: Math.min(100, percentToNextRank.toFixed(2)),
        averageRating,
        reviewsCount,
        completedLabDeployments,
        averageResponseTime: consultant.consultantInfo.averageResponseTime,
        availability: consultant.consultantInfo.availability
      },
      rankingInfo: RANKING_THRESHOLDS,
      pointsSystem: PERFORMANCE_POINTS
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching performance statistics: ' + error.message });
  }
};
