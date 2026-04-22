# Finance Office & Procurement Committee Review Dashboard - Quick Start Guide

## What's New?

The system now includes a **complete document review and approval workflow** for Finance Office and Procurement Committee members. This allows university finance and procurement departments to:

✅ View all submitted lab project documentation  
✅ Review documents for budget compliance and vendor verification  
✅ Add detailed reviews with audit notes  
✅ Approve or reject submissions with complete tracking  
✅ Maintain complete audit trails for compliance  
✅ Download documents in multiple formats  

## How to Access

### Option 1: From University Dashboard
1. Login with your credentials
2. If you're a University staff member: Click the **"Review Documents"** button (blue) in the header
3. If you're a Finance Officer/Procurement Officer: You'll be automatically directed to the Review Dashboard

### Option 2: Direct Route
- Navigate to: `/document-reviewer`
- Or use the "Document Reviewer" link from any page

### Option 3: Login with Finance/Procurement Role
1. Register or login with role: `finance` or `procurement`
2. This will automatically take you to the ReviewerDashboard

## Dashboard Overview

### Main Components

**Search & Filter Panel**
- 🔍 Search: Find projects by name or document type
- 📊 Status Filter: View submissions by status (Submitted, Under Review, Approved, Rejected)
- 🔄 Refresh: Reload submissions from server

**Submissions Table**
Shows all documents submitted to Finance Office or Procurement Committee:
- Lab Project name
- Document type (Technical PDF, Financial CSV, Approval Report, etc.)
- Submission routing (Finance Office, Procurement Committee, or Both)
- Current status with color indicators
- Priority level (Low, Medium, High, Urgent)
- Submission date

**Summary Statistics** (at bottom)
- Total submissions received
- Pending review count
- Number approved
- Number rejected

## Workflow: How to Review a Submission

### Step 1: Find the Submission
1. Use the search bar to find a specific project
2. Or filter by status to see "Submitted" documents
3. Locate the submission in the table

### Step 2: Click "Review"
1. Click the blue **"Review"** button in the Actions column
2. The Review Modal opens with complete document details

### Step 3: View Document Details
The modal shows:
- **Document Information**: Type, status, priority, submission date
- **Budget Information**: Total cost, budget range, within/under budget status
- **Submitter Notes**: Any notes provided by the university
- **Previous Reviews**: Feedback from other reviewers
- **Audit Trail**: Complete history of all actions

### Step 4: Download (Optional)
- Click green **"Download"** button to download document locally
- Supports PDF, CSV, or JSON formats

### Step 5: Add Your Review

Complete the review form:

**1. Review Status** (Select one)
- pending_review: For further analysis
- reviewed: Completed review
- approved: Recommend approval
- rejected: Recommend rejection

**2. Budget Verification** (Required for Finance)
- ✓ Passed: Budget meets institutional criteria
- ✗ Failed: Budget concerns identified

**3. Review Comments** (Required)
Provide detailed feedback:
```
Example:
"Lab equipment budget of $185,000 appears competitive based on 
multiple vendor quotes provided. Installation timeline of 8 weeks 
is reasonable. However, please clarify the maintenance cost 
calculation for years 2-3 before final approval."
```

**4. Audit Notes** (Optional)
Document compliance findings:
```
Example:
"- Vendor certifications verified: All current
- Competitive bidding: 3 quotes provided
- Budget signatory authority: Present
- Timeline: Feasible within academic calendar"
```

### Step 6: Save Review
Click **"Save Review"** to:
- Record your review with timestamp
- Update submission status in system
- Create audit trail entry
- Enable next stage of approval

### Step 7: Approve or Reject

After saving your review, choose:

| Button | Action | When to Use |
|--------|--------|-------------|
| **Approve (Finance)** | Approve for Finance | Finance Officer completing budget review |
| **Approve (Procurement)** | Approve for Procurement | Procurement Officer completing vendor review |
| **Reject** | Reject with reason | Document doesn't meet requirements; return to university |

## Key Features Explained

### 🔐 Approval Workflow Types

**Single Approver** (Finance Only)
```
Submitted → Finance Review → Finance Approves → ✅ APPROVED
```

**Single Approver** (Procurement Only)
```
Submitted → Procurement Review → Procurement Approves → ✅ APPROVED
```

**Parallel Approval** (Finance AND Procurement)
```
Submitted → [Finance Review]    [Procurement Review]
            [Finance Approves]  [Procurement Approves]
                    ↓
            ✅ Both Approved = APPROVED
```

### 📊 Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Submitted | Blue | Just submitted, awaiting review |
| Under Review | Yellow | Reviewer is analyzing |
| Partially Approved | Orange | One approver approved, waiting for other |
| Approved | Green | All required approvals complete ✅ |
| Rejected | Red | Document rejected; university must revise |

### 🎯 Priority Levels

| Priority | Color | SLA |
|----------|-------|-----|
| Low | Green | 2 weeks |
| Medium | Yellow | 1 week |
| High | Orange | 3 business days |
| Urgent | Red | Next business day |

### 📝 Document Formats Reviewers Can Access

1. **Technical PDF**: Professional documentation with full project details
2. **Financial CSV**: Spreadsheet format for budget analysis and comparison
3. **JSON Data**: Structured data for system integration
4. **Approval Report**: Institutional report with signature blocks

## Common Tasks

### Task: Review a Budget Proposal
```
1. Click Search → Search "Lab Budget"
2. Find "Submitted" status items
3. Click "Review" on the budget submission
4. Check Budget Verification section
5. Add comments about cost analysis
6. Save Review
7. Click "Approve (Finance)" if acceptable
```

### Task: Verify Vendor Compliance
```
1. Search by project name
2. Open submission
3. Check budget details for vendor information
4. Download document for full vendor analysis
5. Verify certifications in documentation
6. Add audit notes about vendor verification
7. Send approval or rejection with detailed feedback
```

### Task: Track Approval Progress
```
1. Use Status Filter → Select "Partially Approved"
2. See which documents are waiting for your approval
3. Click "Review" on each
4. See previous reviewer feedback in "Previous Reviews" section
5. Add your review based on feedback from Finance/Procurement
6. Approve final version
```

### Task: Find Recently Rejected Items
```
1. Status Filter → Select "Rejected"
2. See rejection reasons in Previous Reviews section
3. Contact university for resubmission
4. When resubmitted, review updated document with previous feedback in mind
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + R | Refresh submissions |
| Ctrl + F | Open search (browser) |
| Enter (in search) | Apply search filter |

## Tips & Tricks

💡 **Sort by Date**: Click submission date column header to sort newest/oldest first

💡 **Quick Stats**: Check footer summary before starting reviews - see workload at a glance

💡 **Download for Offline**: Download PDF/CSV before long meetings to review offline

💡 **Detailed Comments**: More detailed reviews help university provide better resubmissions

💡 **Use Audit Notes**: Record compliance checks for institutional auditing needs

## Troubleshooting

**Q: I don't see any submissions**
- A: Submissions may be filtered by status. Check Status Filter is set to "All Status"
- A: Verify you're logged in as Finance/Procurement role
- A: Click Refresh button to reload

**Q: Can't download document**
- A: Check internet connection
- A: Token may have expired - try logging out and back in
- A: Contact IT if issue persists

**Q: Review button is disabled**
- A: Refresh the page - status may have changed
- A: Another user may have completed approval workflow
- A: Check if submission was archived

**Q: Don't see Finance/Procurement roles when registering**
- Contact administrator to enable these roles for your account
- In development: Register with role "university" first, then contact admin

## Document Submission Status Flow

```
┌─────────────┐
│  Submitted  │ ← University uploads document
└──────┬──────┘
       ↓
┌──────────────────┐
│  Under Review    │ ← Finance/Procurement member opens for review
└──────┬───────────┘
       ├─ Reject? → Rejected (return to university) ❌
       ├─ Need Help? → Add Review (pending_review)
       └─ Approve? ↓
        ┌─────────────────────────┐
        │ Partially Approved      │ ← One reviewer approved
        │ (Waiting for other)     │
        └──────┬──────────────────┘
               ↓
        ┌──────────────────────┐
        │ Approved ✅          │ ← All required reviewers approved
        │ Ready for Procurement │
        └──────────────────────┘
```

## Data Security

✅ All routes protected with JWT authentication  
✅ Submission records tied to university owner  
✅ Complete audit trail of all actions  
✅ Reviewer information recorded with each action  
✅ Compliance-ready documentation  

## Next Steps for Universities

After reviewer approves a submission:
1. Document marked as APPROVED in system
2. University receives notification
3. University can proceed with procurement
4. Finance office validates invoice for payment
5. Procurement validates delivery
6. Project archived after completion

## Support

📧 For questions about the Review & Approval workflow:
- Reference: `FINANCE_PROCUREMENT_REVIEW_WORKFLOW.md`
- include: Submission ID, document type, and specific question

📞 For technical issues:
- Check `FINANCE_PROCUREMENT_REVIEW_WORKFLOW.md` Troubleshooting section
- Contact: backend@university.edu

---

**Version**: 1.0  
**Last Updated**: April 16, 2026  
**Status**: Production Ready ✅
