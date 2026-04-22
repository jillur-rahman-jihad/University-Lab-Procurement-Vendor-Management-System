# Document Submission Workflow System
## Finance Office & Procurement Committee Approval Workflow

## Overview

Universities can now submit comprehensive lab project documentation directly to their finance office or procurement committee for review, budget approval, auditing, and final authorization. This system provides a complete workflow management solution with tracking, approval management, and audit trail capabilities.

---

## System Architecture

### Components

1. **DocumentSubmission Model** - Stores all submission data and approval workflow state
2. **DocumentSubmissionController** - Business logic for submissions and approvals
3. **DocumentSubmissionRoutes** - API endpoints for submission management
4. **Frontend Modal** - User interface for document submission
5. **Approval Dashboard** - Track submission status and approval workflow

---

## Workflow Process

### Step 1: Document Selection & Preparation
University user selects a lab project and chooses:
- Document format (JSON, Technical PDF, Financial CSV, or Procurement Report)
- Recipient(s) (Finance Office, Procurement Committee, or Both)
- Optional recipient email(s)
- Priority level (low, medium, high, urgent)
- Additional notes for reviewers

### Step 2: Document Submission
User submits the prepared document, triggering:
- Document record creation in database
- Approval workflow initialization
- Submission status set to "submitted"
- Audit trail entry created

### Step 3: Finance Office Review
**When submitted to Finance Office:**
- Finance manager receives notification
- Reviews budget details
- Verifies cost compliance with university budget
- Performs financial audit
- Approves or rejects

### Step 4: Procurement Committee Review
**When submitted to Procurement Committee:**
- Committee members receive document
- Review vendor evaluations
- Verify procurement processes
- Check contract compliance
- Approve or reject

### Step 5: Authorization & Approval
**When submitted to Both:**
- Both finance and procurement must approve
- System tracks parallel review workflows
- Final authorization after all approvals
- Document status changes to "approved"

---

## Frontend Implementation

###University Dashboard Integration

The "Submit" button is integrated into the Lab Projects table with:

```
Lab Projects Table
├─ Project Name
├─ Tab Type
├─ Status
├─ Created Date
├─ Quotations
└─ Actions
    ├─ View Summary
    ├─ Reorder
    ├─ Export (dropdown with 4 formats)
    └─ Submit (NEW) ← Opens submission modal
```

### Submission Modal Features

**Modal Structure:**

1. **Document Format Selection**
   - JSON Data
   - Technical PDF
   - Financial CSV
   - Procurement Report

2. **Recipient Selection (Required)**
   - Finance Office only
   - Procurement Committee only
   - Both (parallel review)

3. **Email Configuration**
   - Finance Office email(s) (if Finance selected)
   - Procurement Committee email(s) (if Committee selected)
   - Email list management with add/remove

4. **Priority Assignment**
   - Low
   - Medium (default)
   - High
   - Urgent

5. **Additional Notes**
   - Optional field for instructions to reviewers
   - Textarea for detailed notes

### User Experience

```
Users can:
✓ Submit documents for review without downloading
✓ Track submission status in real-time
✓ View approval progress by workflow stage
✓ Access audit trail for accountability
✓ Add reviewer comments and notes
✓ Archive completed submissions
✓ View approval dashboard with metrics
```

---

## API Endpoints

### Document Submission Endpoints

#### 1. Submit Document for Review
```
POST /api/document-submission/submit-document
Authorization: Bearer {token}

Request Body:
{
  "labProjectId": "string",
  "documentType": "JSON|Technical PDF|Financial CSV|Procurement Report",
  "submittedTo": "Finance Office|Procurement Committee|Both",
  "financeOfficeEmails": ["email@example.com"],
  "procurementCommitteeEmails": ["email@example.com"],
  "notes": "Optional instructions for reviewers",
  "priority": "low|medium|high|urgent"
}

Response (201):
{
  "message": "Document submitted successfully...",
  "submission": { ...submission data... },
  "nextSteps": {
    "financeReview": "Pending finance office review",
    "procurementReview": "Pending procurement committee review"
  }
}
```

#### 2. Get Submissions History
```
GET /api/document-submission/submissions
Authorization: Bearer {token}

Query Parameters (optional):
- status: "submitted|under_review|approved|rejected"
- documentType: "JSON|Technical PDF|Financial CSV|Procurement Report"
- submittedTo: "Finance Office|Procurement Committee|Both"
- labProjectId: "{id}"

Response (200):
{
  "message": "Submissions retrieved successfully",
  "count": 5,
  "submissions": [
    {
      "_id": "string",
      "labProjectId": { ...lab project... },
      "documentType": "string",
      "status": "string",
      "submittedAt": "ISO date",
      "approvalSummary": {
        "financeStatus": "string",
        "procurementStatus": "string",
        "totalReviewsCompleted": 2,
        "totalReviewsPending": 1,
        "overallApprovalPercentage": 66
      }
    }
  ]
}
```

#### 3. Get Submission Details
```
GET /api/document-submission/submission/{submissionId}
Authorization: Bearer {token}

Response (200):
{
  "message": "Submission details retrieved",
  "submission": { ...full submission object... }
}
```

#### 4. Add Review/Feedback
```
POST /api/document-submission/submission/{submissionId}/add-review
Authorization: Bearer {token}

Request Body:
{
  "status": "pending_review|reviewed|approved|rejected",
  "comments": "Reviewer comments",
  "budget_verification_passed": true|false,
  "audit_notes": "Audit findings",
  "role": "Finance Manager|Procurement Officer|Committee Member|Admin"
}

Response (200):
{
  "message": "Review added successfully",
  "submission": { ...updated submission... }
}
```

#### 5. Approve Document
```
POST /api/document-submission/submission/{submissionId}/approve
Authorization: Bearer {token}

Request Body:
{
  "approvalType": "finance|procurement|final",
  "authorizedBy": "Name of approver",
  "finalNotes": "Optional approval notes"
}

Response (200):
{
  "message": "Document approved successfully",
  "submission": { ...updated submission... },
  "approvalStatus": {
    "financeApproved": true|false,
    "procurementApproved": true|false,
    "fullyApproved": true|false
  }
}
```

#### 6. Reject Document
```
POST /api/document-submission/submission/{submissionId}/reject
Authorization: Bearer {token}

Request Body:
{
  "rejectionReason": "Reason for rejection",
  "rejectedBy": "Name of rejector"
}

Response (200):
{
  "message": "Document rejected",
  "submission": { ...updated submission... }
}
```

#### 7. Get Approval Dashboard
```
GET /api/document-submission/approval-dashboard
Authorization: Bearer {token}

Response (200):
{
  "message": "Approval dashboard data retrieved",
  "dashboard": {
    "totalSubmissions": 15,
    "statusSummary": {
      "submitted": 2,
      "under_review": 5,
      "approved": 8,
      "rejected": 0
    },
    "workflowMetrics": {
      "awaitingFinanceReview": 3,
      "awaitingProcurementReview": 2,
      "fullyApproved": 8
    },
    "budgetMetrics": {
      "totalProjectBudget": 500000,
      "averageProjectCost": 33333.33,
      "projectsWithinBudget": 12,
      "projectsOutOfBudget": 3
    },
    "recentSubmissions": [ ... ]
  }
}
```

#### 8. Get Audit Trail
```
GET /api/document-submission/submission/{submissionId}/audit-trail
Authorization: Bearer {token}

Response (200):
{
  "message": "Audit trail retrieved",
  "auditTrail": [
    {
      "action": "Document Submitted",
      "performedBy": "User Name",
      "performedAt": "ISO date",
      "details": "Description of action"
    },
    { ... more entries ... }
  ],
  "submissionId": "string"
}
```

#### 9. Archive Submission
```
POST /api/document-submission/submission/{submissionId}/archive
Authorization: Bearer {token}

Response (200):
{
  "message": "Submission archived successfully",
  "submission": { ...updated submission... }
}
```

---

## Data Model

### DocumentSubmission Schema

```javascript
{
  // Document Identification
  labProjectId: ObjectId,          // Reference to lab project
  universityId: ObjectId,          // University that submitted
  documentType: String,             // JSON | Technical PDF | Financial CSV | Procurement Report
  downloadUrl: String,              // API endpoint to download document
  
  // Submission routing
  submittedTo: String,              // Finance Office | Procurement Committee | Both
  financeOfficeRecipientsEmails: [String],
  procurementCommitteeRecipientEmails: [String],
  
  // Submission status
  status: String,                   // submitted | under_review | partially_approved | approved | rejected | archived
  
  // Review tracking
  reviews: [
    {
      reviewerId: ObjectId,
      reviewerName: String,
      reviewerRole: String,         // Finance Manager | Procurement Officer | Committee Member | Admin
      reviewerEmail: String,
      status: String,               // pending_review | reviewed | approved | rejected
      comments: String,
      budget_verification_passed: Boolean,
      audit_notes: String,
      reviewedAt: Date,
      signaturePath: String,        // For e-signature support
      signatureTimestamp: Date
    }
  ],
  
  // Approval workflow
  approvalWorkflow: {
    financeReviewRequired: Boolean,
    financeReviewStatus: String,    // pending | in_progress | completed
    financeApprovalDate: Date,
    
    procurementReviewRequired: Boolean,
    procurementReviewStatus: String,
    procurementApprovalDate: Date,
    
    finalAuthorizationRequired: Boolean,
    finalAuthorizationDate: Date
  },
  
  // Budget information
  budgetDetails: {
    totalProjectCost: Number,
    estimatedComponentsCost: Number,
    estimatedInstallationCost: Number,
    estimatedMaintenanceCost: Number,
    budgetRange: {
      min: Number,
      max: Number
    },
    withinBudget: Boolean,
    budgetVariance: Number
  },
  
  // Audit trail
  auditTrail: [
    {
      action: String,
      performedBy: String,
      performedAt: Date,
      details: String
    }
  ],
  
  // Metadata
  submittedAt: Date,
  updatedAt: Date,
  completedAt: Date,
  notes: String,
  priority: String,                 // low | medium | high | urgent
  tags: [String],
  isArchived: Boolean
}
```

---

## Submission States & Workflows

###Submission Status Flow

```
┌─────────────┐
│  SUBMITTED  │  ← Initial state when submitted
└──────┬──────┘
       │
       ├─→  ┌──────────────┐
       │    │ UNDER_REVIEW │  ← Being reviewed by finance/procurement
       │    └──────┬───────┘
       │           ├─→ ┌──────────┐
       └───────────┼→  │ APPROVED │ ← All reviews complete, fully approved
                   │   └──────────┘
                   │
                   ├─→ ┌──────────────────┐
                   │   │ PARTIALLY_APPROVED│ ← Some approvals missing
                   │   └──────────────────┘
                   │
                   └─→ ┌──────────┐
                       │ REJECTED │ ← Rejected by reviewer
                       └──────────┘
                       
       ┌──ARCHIVE─→ │ ARCHIVED │ ← Stored for records
```

### Approval Workflow Types

#### Finance Only
```
Submitted to Finance Office
       ↓
Finance Review (in_progress)
       ↓
Finance Approval (completed)
       ↓
Status: Approved
```

#### Procurement Only
```
Submitted to Procurement Committee
       ↓
Procurement Review (in_progress)
       ↓
Procurement Approval (completed)
       ↓
Status: Approved
```

#### Both (Parallel Review)
```
       ├→ Finance Review (in_progress) ──→ Finance Approval (completed)
Submitted   │
to Both     │
       ├→ Procurement Review (in_progress) ──→ Procurement Approval (completed)
       ↓
Both Complete
       ↓
Status: Approved
```

---

## Use Cases

### Use Case 1: Lab Equipment Budget Approval
1. University prepares comprehensive budget documentation
2. Submits Technical PDF to Finance Office with notes
3. Finance manager verifies budget compliance
4. Approves with comments
5. System marks as approved, generates audit trail
6. University can then proceed with procurement

### Use Case 2: Multi-Stakeholder Approval
1. University submits Procurement Report to Both offices
2. Finance Office reviews cost structure in parallel with Procurement Committee
3. Procurement Officer reviews vendor evaluations
4. Both complete their reviews and approve
5. System shows 100% approval
6. Document forwarded for final authorization

### Use Case 3: Budget Discrepancy Resolution
1. Document submitted to Finance Office
2. Finance detects budget variance
3. Rejects with specific audit notes
4. University modifies and resubmits
5. Finance re-reviews and approves
6. Audit trail shows complete history of changes

### Use Case 4: Compliance Auditing
1. University archives completed submission
2. Auditor accesses archived documents
3. Reviews complete audit trail
4. Verifies all approvals and sign-offs
5. Confirms compliance with institutional policies

---

## Security Features

### Access Control
- Only document owner (university) can view/manage submissions
- Role-based access for reviewers
- Middleware-enforced JWT authentication on all endpoints

### Audit Trail
- Complete history of all actions
- Timestamp for each event
- User identification for accountability
- Immutable record for compliance

### Data Validation
- Document type verification
- Recipient validation
- File format validation
- Budget range verification

---

## Status Indicators

### Submission Status Icons

| Status | Color | Meaning |
|--------|-------|---------|
| Submitted | Blue | Awaiting review |
| Under Review | Yellow | Being reviewed |
| Partially Approved | Orange | Some approvals pending |
| Approved | Green | Fully approved |
| Rejected | Red | Rejected by reviewer |
| Archived | Gray | Stored for records |

---

## Integration Points

###With Export System
- Seamless transition from export to submission
- Same four document formats supported
- Direct API linking for automatic routing

### With University Dashboard
- Integrated submit button in project table
- Submission history tracking
-Real-time approval status updates Audit trail viewing

### With Finance/Procurement Systems
- Email notifications to recipients
- Budget validation before approval
- Cost breakdown visibility
- Automated approval workflows

---

## Notifications & Alerts

### Email Notifications
- Submission confirmation to university
- Review request to finance office
- Review request to procurement committee
- Approval/rejection notifications
- Completion notifications

### Dashboard Alerts
- Pending review count
- Approval progress bar
- Budget variance warnings
- Rejected document notices
- Overdue submission reminders

---

## Audit & Compliance

### Audit Trail Entries
```
Document Submitted
├─ Timestamp: 2026-04-16T10:30:00Z
├─ Performed By: John Smith
└─ Details: Technical PDF submitted to Both

Review Added
├─ Timestamp: 2026-04-16T11:00:00Z
├─ Performed By: Jane Doe (Finance Manager)
└─ Details: Finance review completed: Approved

Review Added
├─ Timestamp: 2026-04-16T11:15:00Z
├─ Performed By: Mark Johnson (Procurement Officer)
└─ Details: Procurement review completed: Approved

Document Approved
├─ Timestamp: 2026-04-16T11:20:00Z
├─ Performed By: Admin
└─ Details: Final approval completed
```

### Compliance Reporting
- Export audit trail for compliance review
- Generate approval certificates
- Access historical submission records
- Verify chain of custody
- Confirm all required approvals

---

## Future Enhancements

1. **E-Signature Integration** - Digital signatures for official approval
2. **Email Notifications** - Automatic email to reviewers
3. **Bulk Submission** - Submit multiple documents at once
4. **Workflow Templates** - Pre-configured approval workflows
5. **SLA Tracking** - Monitor approval timelines
6. **Conditional Routing** - Route based on budget thresholds
7. **Mobile Approvals** - Mobile app for reviewers
8. **Integration APIs** - Connect to external systems
9. **Reporting Dashboard** - Advanced analytics and metrics

---

## Troubleshooting

### Common Issues

**Issue: Submission fails**
- Verify all required fields are filled
- Check recipient email format
- Ensure project exists and is owned by user
- Review browser console for errors

**Issue: Status not updating**
- Refresh browser page
- Check network request in browser DevTools
- Verify JWT token is valid
- Check backend logs

**Issue: Documents not appearing**
- Verify correct status filter is selected
- Check date range of submissions
- Ensure proper authentication
- Clear browser cache

---

## Support & Documentation

For additional help:
- Check API endpoint documentation
- Review model schema structure
- Consult frontend component docs
- Check backend controller logic
- Review audit trail for debugging

