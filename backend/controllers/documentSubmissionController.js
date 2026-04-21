const mongoose = require('mongoose');
const DocumentSubmission = require('../models/DocumentSubmission');
const LabProject = require('../models/LabProject');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// ============ Submit Document to Finance/Procurement ============
exports.submitDocument = async (req, res) => {
    try {
        const { labProjectId, documentType, submittedTo, financeOfficeEmails, procurementCommitteeEmails, notes, priority } = req.body;
        const universityId = req.user.id;

        // Fetch lab project to verify ownership
        const labProject = await LabProject.findById(labProjectId).populate('universityId', 'name email');
        
        if (!labProject) {
            return res.status(404).json({ message: 'Lab project not found' });
        }

        if (labProject.universityId._id.toString() !== universityId) {
            return res.status(403).json({ message: 'Access denied. You do not own this project.' });
        }

        // Validate document type
        const validDocumentTypes = ['JSON', 'Technical PDF', 'Financial CSV', 'Procurement Report'];
        if (!validDocumentTypes.includes(documentType)) {
            return res.status(400).json({ message: 'Invalid document type' });
        }

        // Validate submission recipient
        if (!['Finance Office', 'Procurement Committee', 'Both'].includes(submittedTo)) {
            return res.status(400).json({ message: 'Invalid submission recipient' });
        }

        // Collect budget information from lab project
        const budgetDetails = {
            totalProjectCost: labProject.aiRecommendation?.totalEstimatedCost || 0,
            estimatedComponentsCost: labProject.requirements?.budgetMin || 0,
            estimatedMaintenanceCost: labProject.aiRecommendation?.powerConsumption || 0,
            budgetRange: {
                min: labProject.requirements?.budgetMin || 0,
                max: labProject.requirements?.budgetMax || 0
            },
            withinBudget: (labProject.aiRecommendation?.totalEstimatedCost || 0) <= (labProject.requirements?.budgetMax || Infinity)
        };

        // Create document submission record
        const documentSubmission = new DocumentSubmission({
            labProjectId,
            universityId,
            documentType,
            downloadUrl: `/api/labs/export-${documentType.toLowerCase().replace(' ', '-')}/${labProjectId}`,
            submittedTo,
            financeOfficeRecipientsEmails: submittedTo === 'Finance Office' || submittedTo === 'Both' ? financeOfficeEmails || [] : [],
            procurementCommitteeRecipientEmails: submittedTo === 'Procurement Committee' || submittedTo === 'Both' ? procurementCommitteeEmails || [] : [],
            status: 'submitted',
            budgetDetails,
            notes: notes || '',
            priority: priority || 'medium',
            approvalWorkflow: {
                financeReviewRequired: submittedTo === 'Finance Office' || submittedTo === 'Both',
                procurementReviewRequired: submittedTo === 'Procurement Committee' || submittedTo === 'Both'
            },
            auditTrail: [
                {
                    action: 'Document Submitted',
                    performedBy: req.user.name || 'University User',
                    details: `${documentType} submitted to ${submittedTo}`
                }
            ]
        });

        await documentSubmission.save();

        res.status(201).json({
            message: 'Document submitted successfully for review and approval',
            submission: documentSubmission,
            nextSteps: {
                financeReview: submittedTo === 'Finance Office' || submittedTo === 'Both' ? 'Pending finance office review' : 'Not required',
                procurementReview: submittedTo === 'Procurement Committee' || submittedTo === 'Both' ? 'Pending procurement committee review' : 'Not required'
            }
        });

    } catch (error) {
        console.error('[SUBMISSION] Error submitting document:', error);
        res.status(500).json({
            message: 'Error submitting document',
            error: error.message
        });
    }
};

// ============ Get Submissions History ============
exports.getSubmissions = async (req, res) => {
    try {
        const universityId = req.user.id;
        const { status, documentType, submittedTo, labProjectId } = req.query;

        // Build filter query
        const filter = { universityId };
        if (status) filter.status = status;
        if (documentType) filter.documentType = documentType;
        if (submittedTo) filter.submittedTo = submittedTo;
        if (labProjectId) filter.labProjectId = labProjectId;

        const submissions = await DocumentSubmission.find(filter)
            .populate('labProjectId', 'labName labType')
            .populate('reviews.reviewerId', 'name email')
            .sort({ submittedAt: -1 });

        // Enrich with approval status summary
        const enrichedSubmissions = submissions.map(sub => ({
            ...sub._doc,
            approvalSummary: {
                financeStatus: sub.approvalWorkflow.financeReviewStatus,
                procurementStatus: sub.approvalWorkflow.procurementReviewStatus,
                totalReviewsCompleted: sub.reviews.filter(r => r.status === 'reviewed').length,
                totalReviewsPending: sub.reviews.filter(r => r.status === 'pending_review').length,
                overallApprovalPercentage: sub.reviews.length > 0 
                    ? Math.round((sub.reviews.filter(r => r.status === 'approved').length / sub.reviews.length) * 100)
                    : 0
            }
        }));

        res.status(200).json({
            message: 'Submissions retrieved successfully',
            count: enrichedSubmissions.length,
            submissions: enrichedSubmissions
        });

    } catch (error) {
        console.error('[SUBMISSION] Error retrieving submissions:', error);
        res.status(500).json({
            message: 'Error retrieving submissions',
            error: error.message
        });
    }
};

// ============ Get Submission Details ============
exports.getSubmissionDetails = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const universityId = req.user.id;

        const submission = await DocumentSubmission.findById(submissionId)
            .populate('labProjectId', 'labName labType requirements aiRecommendation')
            .populate('universityId', 'name email')
            .populate('reviews.reviewerId', 'name email');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        if (submission.universityId._id.toString() !== universityId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json({
            message: 'Submission details retrieved',
            submission
        });

    } catch (error) {
        console.error('[SUBMISSION] Error retrieving submission details:', error);
        res.status(500).json({
            message: 'Error retrieving submission details',
            error: error.message
        });
    }
};

// ============ Add Review/Feedback ============
exports.addReview = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { status, comments, budget_verification_passed, audit_notes, role } = req.body;

        console.log('[REVIEW] Adding review for submission:', submissionId);
        console.log('[REVIEW] Request body:', req.body);
        console.log('[REVIEW] User info:', req.user);

        // Validation
        if (!comments || comments.trim().length === 0) {
            return res.status(400).json({ message: 'Review comments are required' });
        }

        if (budget_verification_passed === null || budget_verification_passed === undefined) {
            return res.status(400).json({ message: 'Budget verification status is required' });
        }

        if (!status) {
            return res.status(400).json({ message: 'Review status is required' });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const submission = await DocumentSubmission.findById(submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        console.log('[REVIEW] Found submission:', submission._id);

        // Update or create review
        const existingReviewIndex = submission.reviews.findIndex(r => r.reviewerId.toString() === req.user.id);
        
        const reviewData = {
            reviewerId: req.user.id,
            reviewerName: req.user.name || 'Reviewer',
            reviewerRole: role || 'Committee Member',
            reviewerEmail: req.user.email,
            status,
            comments,
            budget_verification_passed: Boolean(budget_verification_passed),
            audit_notes: audit_notes || '',
            reviewedAt: new Date()
        };

        console.log('[REVIEW] Review data:', reviewData);

        if (existingReviewIndex >= 0) {
            submission.reviews[existingReviewIndex] = reviewData;
            console.log('[REVIEW] Updated existing review at index:', existingReviewIndex);
        } else {
            submission.reviews.push(reviewData);
            console.log('[REVIEW] Added new review');
        }

        // Update status
        if (status === 'approved' || status === 'reviewed') {
            submission.status = 'under_review';
        } else if (status === 'rejected') {
            submission.status = 'rejected';
        }

        // Add audit trail
        submission.auditTrail.push({
            action: 'Review Added',
            performedBy: req.user.name || 'Reviewer',
            details: `${role || 'Committee Member'} reviewed document: ${status}`
        });

        submission.updatedAt = new Date();
        await submission.save();

        console.log('[REVIEW] Submission saved successfully');

        res.status(200).json({
            message: 'Review added successfully',
            submission
        });

    } catch (error) {
        console.error('[SUBMISSION] Error adding review:', error);
        res.status(500).json({
            message: 'Error adding review',
            error: error.message
        });
    }
};

// ============ Approve Document ============
exports.approveDocument = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { approvalType, authorizedBy, finalNotes } = req.body;

        const submission = await DocumentSubmission.findById(submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Update approval workflow based on type
        if (approvalType === 'finance') {
            submission.approvalWorkflow.financeReviewStatus = 'completed';
            submission.approvalWorkflow.financeApprovalDate = new Date();
        } else if (approvalType === 'procurement') {
            submission.approvalWorkflow.procurementReviewStatus = 'completed';
            submission.approvalWorkflow.procurementApprovalDate = new Date();
        } else if (approvalType === 'final') {
            submission.approvalWorkflow.finalAuthorizationDate = new Date();
        }

        // Check if all required approvals are complete
        const financeComplete = !submission.approvalWorkflow.financeReviewRequired || 
                               submission.approvalWorkflow.financeReviewStatus === 'completed';
        const procurementComplete = !submission.approvalWorkflow.procurementReviewRequired || 
                                   submission.approvalWorkflow.procurementReviewStatus === 'completed';

        if (financeComplete && procurementComplete) {
            submission.status = 'approved';
            submission.completedAt = new Date();
        }

        // Add audit trail
        submission.auditTrail.push({
            action: 'Document Approved',
            performedBy: authorizedBy || req.user.name || 'Administrator',
            details: `${approvalType} approval completed. ${finalNotes || ''}`
        });

        submission.updatedAt = new Date();
        await submission.save();

        // Send notification to university when document is fully approved
        if (financeComplete && procurementComplete) {
            (async () => {
                try {
                    const lab = await LabProject.findById(submission.labProjectId).select('labName');
                    const university = await User.findById(submission.universityId).select('email name');

                    if (university) {
                        await notificationService.createNotification({
                            userId: submission.universityId.toString(),
                            type: 'approval',
                            category: 'document_approved',
                            message: `Your "${submission.documentType}" submission for "${lab?.labName || 'Lab Project'}" has been fully approved by both Finance and Procurement departments!`,
                            referenceData: {
                                resourceType: 'DocumentSubmission',
                                resourceId: submission._id,
                                resourceName: lab?.labName || 'Lab Project'
                            },
                            actionUrl: `/document-submission/${submission._id}`,
                            sendEmail: true,
                            priority: 'high'
                        });
                    }
                } catch (notifError) {
                    console.error('[SUBMISSION] Error sending approval notification:', notifError.message);
                }
            })();
        }

        res.status(200).json({
            message: 'Document approved successfully',
            submission,
            approvalStatus: {
                financeApproved: financeComplete,
                procurementApproved: procurementComplete,
                fullyApproved: financeComplete && procurementComplete
            }
        });

    } catch (error) {
        console.error('[SUBMISSION] Error approving document:', error);
        res.status(500).json({
            message: 'Error approving document',
            error: error.message
        });
    }
};

// ============ Reject Document ============
exports.rejectDocument = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { rejectionReason, rejectedBy } = req.body;

        const submission = await DocumentSubmission.findById(submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.status = 'rejected';
        submission.updatedAt = new Date();

        // Add audit trail
        submission.auditTrail.push({
            action: 'Document Rejected',
            performedBy: rejectedBy || req.user.name || 'Administrator',
            details: `Rejection reason: ${rejectionReason || 'Not specified'}`
        });

        await submission.save();

        res.status(200).json({
            message: 'Document rejected',
            submission
        });

    } catch (error) {
        console.error('[SUBMISSION] Error rejecting document:', error);
        res.status(500).json({
            message: 'Error rejecting document',
            error: error.message
        });
    }
};

// ============ Get Approval Status Dashboard ============
exports.getApprovalDashboard = async (req, res) => {
    try {
        const universityId = req.user.id;

        // Get submissions by status
        const submissions = await DocumentSubmission.find({ universityId });

        const dashboard = {
            totalSubmissions: submissions.length,
            statusSummary: {
                submitted: submissions.filter(s => s.status === 'submitted').length,
                under_review: submissions.filter(s => s.status === 'under_review').length,
                partially_approved: submissions.filter(s => s.status === 'partially_approved').length,
                approved: submissions.filter(s => s.status === 'approved').length,
                rejected: submissions.filter(s => s.status === 'rejected').length
            },
            workflowMetrics: {
                awaitingFinanceReview: submissions.filter(s => 
                    s.approvalWorkflow.financeReviewRequired && 
                    s.approvalWorkflow.financeReviewStatus === 'pending'
                ).length,
                awaitingProcurementReview: submissions.filter(s => 
                    s.approvalWorkflow.procurementReviewRequired && 
                    s.approvalWorkflow.procurementReviewStatus === 'pending'
                ).length,
                fullyApproved: submissions.filter(s => s.status === 'approved').length
            },
            budgetMetrics: {
                totalProjectBudget: submissions.reduce((sum, s) => sum + (s.budgetDetails?.totalProjectCost || 0), 0),
                averageProjectCost: submissions.length > 0 
                    ? submissions.reduce((sum, s) => sum + (s.budgetDetails?.totalProjectCost || 0), 0) / submissions.length
                    : 0,
                projectsWithinBudget: submissions.filter(s => s.budgetDetails?.withinBudget).length,
                projectsOutOfBudget: submissions.filter(s => !s.budgetDetails?.withinBudget).length
            },
            recentSubmissions: submissions.slice(0, 5).map(s => ({
                id: s._id,
                labName: s.labProjectId?.labName,
                documentType: s.documentType,
                status: s.status,
                submittedAt: s.submittedAt
            }))
        };

        res.status(200).json({
            message: 'Approval dashboard data retrieved',
            dashboard
        });

    } catch (error) {
        console.error('[SUBMISSION] Error retrieving dashboard:', error);
        res.status(500).json({
            message: 'Error retrieving dashboard',
            error: error.message
        });
    }
};

// ============ Get Audit Trail ============
exports.getAuditTrail = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const submission = await DocumentSubmission.findById(submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.status(200).json({
            message: 'Audit trail retrieved',
            auditTrail: submission.auditTrail,
            submissionId
        });

    } catch (error) {
        console.error('[SUBMISSION] Error retrieving audit trail:', error);
        res.status(500).json({
            message: 'Error retrieving audit trail',
            error: error.message
        });
    }
};

// ============ Archive Submission ============
exports.archiveSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const universityId = req.user.id;

        const submission = await DocumentSubmission.findById(submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        if (submission.universityId.toString() !== universityId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        submission.isArchived = true;
        submission.status = 'archived';
        submission.updatedAt = new Date();

        submission.auditTrail.push({
            action: 'Submission Archived',
            performedBy: req.user.name || 'User',
            details: 'Document submission archived for record keeping'
        });

        await submission.save();

        res.status(200).json({
            message: 'Submission archived successfully',
            submission
        });

    } catch (error) {
        console.error('[SUBMISSION] Error archiving submission:', error);
        res.status(500).json({
            message: 'Error archiving submission',
            error: error.message
        });
    }
};
