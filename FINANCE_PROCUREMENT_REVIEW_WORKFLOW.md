# Finance Office & Procurement Committee Review & Approval Workflow

## Overview

This document describes the complete workflow for Finance Office and Procurement Committee members to review, audit, and approve lab project documentation submissions. The system provides a comprehensive dashboard where reviewers can:

- View all submitted documents requiring review
- Search and filter submissions by status, priority, and project
- Download documents in multiple formats (JSON, PDF, CSV)
- Add detailed reviews with budget verification and audit notes
- Approve or reject submissions with complete audit trails
- Track approval workflows across multiple stakeholders

## System Architecture

### Key Components

1. **ReviewerDashboard Component** (`frontend/src/pages/ReviewerDashboard.jsx`)
   - Main interface for Finance Office and Procurement Committee members
   - Displays all submissions submitted to their department
   - Provides search, filtering, and sorting capabilities
   - Shows summary statistics (total submissions, pending, approved, rejected)

2. **DocumentSubmission Model** (Backend)
   - Tracks all document submissions through approval workflow
   - Records reviews from each reviewer
   - Maintains complete audit trail
   - Stores budget verification and approval status

3. **DocumentSubmissionController** (Backend)
   - 9 core methods for submission management
   - Handles reviews, approvals, rejections, and audit tracking
   - Provides approval dashboard with metrics

## Access & Navigation

### For Finance Office Users

1. **Login**: Use your Finance Office credentials
   ```
   Email: finance@university.edu
   Role: Finance Officer
   ```

2. **Navigate to Review Dashboard**:
   - From University Dashboard → Click "Review Documents" button (blue)
   - Or directly visit: `/document-reviewer`

3. **View Your Submissions**:
   - See all documents submitted to Finance Office
   - Filter by status: Submitted, Under Review, Approved, Rejected, Archived
   - Search by project name or document type

### For Procurement Committee Users

1. **Login**: Use your Procurement Committee credentials
   ```
   Email: procurement@university.edu
   Role: Procurement Officer
   ```

2. **Navigate to Review Dashboard**:
   - From University Dashboard → Click "Review Documents" button (blue)
   - Or directly visit: `/document-reviewer`

3. **View Your Submissions**:
   - See all documents submitted to Procurement Committee
   - Filter by status and priority
   - Search for specific projects or document types

## Reviewer Dashboard Features

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ Document Review Dashboard                    [Back]     │
│ Review and approve submitted lab project documentation  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Search: [________________]  Status: [All ▼]  [Refresh] │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Summary Statistics:                                     │
│ Total: 15 | Pending: 5 | Approved: 8 | Rejected: 2   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Lab Project | Doc Type | Submitted To | Status | ...  │
│ ─────────────────────────────────────────────── ────── │
│ Lab A       | PDF      | Finance      | submitted │   │
│ Lab B       | CSV      | Procurement  | under_... │   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Features

#### 1. Search & Filter Panel
- **Search**: Find projects by name or document type
- **Status Filter**: Filter submissions by workflow status
  - All Status
  - Submitted
  - Under Review
  - Partially Approved
  - Approved
  - Rejected
- **Refresh Button**: Reload submissions from server

#### 2. Submissions Table
Displays all relevant submissions with columns:
- **Lab Project**: Name of the submitted lab project
- **Document Type**: JSON Data, Technical PDF, Financial CSV, or Approval Report
- **Submitted To**: Finance Office, Procurement Committee, or Both
- **Status**: Current approval workflow status (color-coded)
- **Priority**: Low (green), Medium (yellow), High (orange), Urgent (red)
- **Submitted Date**: When the document was submitted
- **Actions**: Review and Download buttons

#### 3. Summary Statistics (Footer)
Shows real-time metrics:
- **Total Submissions**: Count of all submissions to this department
- **Pending Review**: Count of submitted + under_review status
- **Approved**: Count of approved submissions
- **Rejected**: Count of rejected submissions

### Review Modal

When you click "Review" on a submission, a comprehensive modal opens:

#### Document Information Section
```
Document Type:  Technical PDF
Status:         Under Review
Priority:       High
Submitted:      04/16/2026
```

#### Budget Information Section
```
Total Project Cost:    $250,000
Budget Range:          $200,000 - $300,000
Within Budget:         ✓ Yes
Reviews Completed:     2
```

#### Submitter Notes
Display any additional notes provided by the university when submitting the document.

## Review & Approval Workflow

### Step 1: Open Document for Review

1. Locate the submission in the table
2. Click the blue "Review" button in the Actions column
3. The Review Modal opens with all document details

### Step 2: Download Document (Optional)

Before reviewing, you can download the document by:
1. Clicking the green "Download" button in the Actions column
2. The document downloads in its original format (PDF/CSV/JSON)
3. Review locally if needed

### Step 3: Add Your Review

In the Review Modal, complete the following sections:

#### A. Review Status Selection
Choose one of:
- **pending_review**: Mark for further analysis
- **reviewed**: Completed your review
- **approved**: Recommend approval
- **rejected**: Recommend rejection

#### B. Budget Verification
Click one of:
- **✓ Passed**: Budget meets your criteria
- **✗ Failed**: Budget does not meet criteria

#### C. Review Comments (Required)
Provide detailed feedback:
- Analysis of the proposal
- Questions or concerns
- Recommendations
- Compliance with institutional standards

Example:
```
The project budget appears reasonable and aligns with similar 
infrastructure projects. Equipment specifications are detailed 
and vendor quotes are competitive. However, I have questions 
regarding the maintenance cost estimates - please clarify the 
3-year maintenance plan before final approval.
```

#### D. Audit Notes (Optional)
Document audit findings:
- Compliance verification results
- Internal approval requirements checked
- Documentation completeness assessment
- Any red flags or items for further investigation

Example:
```
- Verified vendor certifications: All compliant
- Budget allocation breakdown: Complete
- Approved signatory authority: Document signed
- Timeline: 6-month deployment acceptable
```

### Step 4: Save Review

Click "Save Review" to:
- Record your review in the audit trail
- Update submission status
- Send notification to other stakeholders
- Allow submission to move to next stage if all reviews complete

### Step 5: Approve or Reject

After saving your review, choose one of:

#### Option A: Approve (Finance)
- Click "Approve (Finance)" button
- Marks document as approved by Finance Office
- If both Finance and Procurement are required, sends to Procurement for their approval
- If Finance-only, marks as fully approved

#### Option B: Approve (Procurement)
- Click "Approve (Procurement)" button
- Marks document as approved by Procurement Committee
- Enables Finance Office to complete final authorization if both required
- Updates submission status to "partially_approved" if waiting for Finance

#### Option C: Reject
- Click "Reject" button
- Prompts for rejection reason (required field)
- Rejection reason recorded in audit trail
- Submission returned to university with request to revise and resubmit
- University receives notification of rejection with feedback

## Approval Workflow Status

### Single Reviewer (Finance Only)
```
Submitted → Finance Review → Finance Approves → APPROVED ✓
                          ↓
                   Finance Rejects → REJECTED ✗
```

### Single Reviewer (Procurement Only)
```
Submitted → Procurement Review → Procurement Approves → APPROVED ✓
                              ↓
                     Procurement Rejects → REJECTED ✗
```

### Parallel Review (Finance AND Procurement)
```
Submitted → Finance Review      Procurement Review
              ↓                       ↓
        Finance Approves      Procurement Approves
              ↓                       ↓
        PARTIALLY APPROVED (Finance approved, waiting for Procurement)
              ↓
        Once Both Approve → APPROVED ✓

Alternative:
Submitted → Either Rejects → REJECTED ✗
                            (stays rejected, can be resubmitted)
```

### Sequential Review Example
1. Finance receives copy (for budget analysis)
2. Procurement receives copy (for compliance/vendor verification)
3. Finance reviews and approves → Status: "partially_approved" (Finance approved)
4. Procurement receives notification to review
5. Procurement reviews and approves → Status: "approved"

## Previous Reviews & Audit Trail

### View Previous Reviews

In the Review Modal, scroll to "Previous Reviews" section:

```
Reviewer: John Smith (Finance Director)
Role: Finance Officer
Status: approved
Date: 2026-04-15 10:30 AM

Comments: 
The $250,000 budget for Lab infrastructure is well-justified and 
aligns with our 5-year technology investment plan. Equipment selections 
are appropriate for the intended research applications.

Audit Notes:
- Budget line-item analysis: Complete
- Vendor quotes reviewed: All within market rates
- Approval authority verified: Director signature required
- Timeline: Installation can begin immediately upon approval
```

### View Complete Audit Trail

To see all actions taken on a submission:
1. In the Review Modal, scroll to "Audit Trail" section
2. See chronological list of all events:
   - Document submitted by: Jane Doe (University) on 04/14/2026
   - Finance review added by: John Smith on 04/15/2026
   - Approved by: Mary Johnson on 04/16/2026
   - Final authorization by: Procurement Committee on 04/16/2026

## Key Scenarios

### Scenario 1: Standard Finance-Only Approval

**Timeline**:
1. University submits Procurement Summary Report to Finance Office
2. Finance Director reviews budget, verifies compliance
3. Finance Director approves document
4. Status → APPROVED
5. University receives notification
6. Can proceed with procurement

### Scenario 2: Parallel Finance & Procurement Review

**Timeline**:
1. University submits all 4 formats to Both (Finance Office + Procurement Committee)
2. Finance reviews budget/financial aspects
3. Procurement reviews vendor qualifications/compliance
4. Finance approves → Status becomes "partially_approved"
5. Procurement approves → Status becomes "approved"
6. University notified - fully approved, can proceed

### Scenario 3: Document Rejection & Resubmission

**Timeline**:
1. University submits document to Procurement Committee
2. Procurement finds vendor lacks required certifications
3. Procurement clicks "Reject" → Provides rejection reason
4. Status → REJECTED
5. University receives notification with rejection details
6. University contacts vendor, obtains certifications
7. University resubmits updated document
8. Procurement reviews again and approves
9. Status → APPROVED

## API Endpoints for Reviewers

### Get All Submissions
```
GET /api/document-submission/submissions
Headers: Authorization: Bearer {token}

Response:
{
  "submissions": [
    {
      "_id": "...",
      "labProjectId": {...},
      "documentType": "Technical PDF",
      "submittedTo": "Finance Office",
      "status": "submitted",
      "priority": "high",
      "submittedAt": "2026-04-16T10:00:00Z",
      "reviews": [...],
      "budgetDetails": {...},
      "auditTrail": [...]
    }
  ]
}
```

### Get Submission Details
```
GET /api/document-submission/submission/:submissionId
Headers: Authorization: Bearer {token}

Response: Complete submission object
```

### Add Review
```
POST /api/document-submission/submission/:submissionId/add-review
Headers: Authorization: Bearer {token}
Body: {
  "status": "reviewed",
  "comments": "...",
  "budget_verification_passed": true,
  "audit_notes": "...",
  "role": "Finance Officer"
}

Response: Updated submission with new review added
```

### Approve Document
```
POST /api/document-submission/submission/:submissionId/approve
Headers: Authorization: Bearer {token}
Body: {
  "approvalType": "finance" | "procurement" | "final",
  "authorizedBy": "John Smith",
  "finalNotes": "Approved by Finance Director"
}

Response: Updated submission with approval status
```

### Reject Document
```
POST /api/document-submission/submission/:submissionId/reject
Headers: Authorization: Bearer {token}
Body: {
  "rejectionReason": "Vendor certifications incomplete",
  "rejectedBy": "Mary Johnson"
}

Response: Updated submission with rejected status
```

### Get Approval Dashboard
```
GET /api/document-submission/approval-dashboard
Headers: Authorization: Bearer {token}

Response:
{
  "submissionMetrics": {
    "total": 15,
    "byStatus": {...}
  },
  "workflowMetrics": {...},
  "budgetMetrics": {...},
  "recentSubmissions": [...]
}
```

### Get Audit Trail
```
GET /api/document-submission/submission/:submissionId/audit-trail
Headers: Authorization: Bearer {token}

Response:
{
  "auditTrail": [
    {
      "action": "submitted",
      "details": "Document submitted to Finance Office",
      "performedBy": "Jane Doe",
      "performedAt": "2026-04-16T10:00:00Z"
    },
    {
      "action": "review_added",
      "details": "Finance review completed - Status: reviewed",
      "performedBy": "John Smith",
      "performedAt": "2026-04-16T11:30:00Z"
    }
  ]
}
```

## Best Practices for Reviewers

### 1. Timely Review
- Review submissions within 2-3 business days
- Set reminders for high-priority submissions
- Consider workload when setting priorities

### 2. Detailed Comments
- Provide specific feedback, not just "approved" or "rejected"
- Reference budget lines, vendor info, or compliance issues
- Suggest solutions if requesting changes
- Be professional and constructive

### 3. Budget Verification
- Compare quoted prices with market rates
- Verify budget aligns with institutional spending limits
- Check for complete cost breakdown (equipment, installation, maintenance)
- Flag any unusual pricing or missing quotes

### 4. Compliance Checking
- Verify vendor qualifications and certifications
- Check for competitive bidding (multiple quotes)
- Ensure required approvals/signatures present
- Validate timeline feasibility

### 5. Documentation
- Keep detailed audit notes for compliance/auditing
- Document any follow-ups needed from university
- Record all clarifications provided
- Maintain records for institutional archives

## Troubleshooting

### Issue: Can't see submitted documents

**Cause**: May not have Finance/Procurement role assigned or department
**Solution**: 
- Verify your user role is "Finance Officer" or "Procurement Officer"
- Check you're logged in with correct credentials
- Contact administrator if role not properly assigned

### Issue: Document download fails

**Cause**: Backend API error or authentication issue
**Solution**:
- Check internet connection
- Verify token hasn't expired (re-login if needed)
- Try refreshing the page
- Contact support if persists

### Issue: Can't approve document

**Cause**: Missing required reviews or invalid workflow state
**Solution**:
- Ensure you've saved your review first
- Check submission status - may be already approved/rejected by another reviewer
- Verify you have permission to approve that document type
- Reload page if button appears disabled

### Issue: Review disappeared after saving

**Cause**: Submission may have been archived or page needs refresh
**Solution**:
- Reload the Review Modal
- Check submission list - may have been moved to another status filter
- Verify you're viewing the correct status filter

## Future Enhancements

1. **Email Notifications**: Auto-notify reviewers of new submissions
2. **Review Deadlines**: Set and track approval SLAs
3. **Batch Operations**: Approve multiple documents at once
4. **Advanced Reporting**: Export approval metrics and analytics
5. **E-Signatures**: Digital signatures on approval documents
6. **Mobile Access**: Review documents on mobile devices
7. **Integration**: Connect with ERP/accounting systems for budget sync

## Support & Questions

For questions or issues with the Review & Approval workflow:
- Contact: support@university.edu
- Reference: FINANCE_PROCUREMENT_REVIEW_WORKFLOW.md
- Include: Submission ID, document type, and action attempted
