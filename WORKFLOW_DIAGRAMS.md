# Visual Workflow Diagrams

## 1. Complete End-to-End Document Submission & Approval Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPLETE SYSTEM WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

UNIVERSITY USER INITIATES SUBMISSION
┌────────────────────────────────────────┐
│  1. Login to University Dashboard      │
│  2. Navigate to Lab Projects           │
│  3. Click "Submit" button (orange)     │
│  4. Submission modal opens             │
│  5. Select document format:            │
│     - JSON Data                        │
│     - Technical PDF                    │
│     - Financial CSV                    │
│     - Approval Report                  │
│  6. Select recipients:                 │
│     - Finance Office                   │
│     - Procurement Committee            │
│     - Both (parallel)                  │
│  7. Enter email addresses              │
│  8. Set priority level                 │
│  9. Add optional notes                 │
│ 10. Click "Submit"                     │
└────────────┬──────────────────────────┘
             │
             ↓ DOCUMENT SAVED TO DATABASE
             │
   ┌─────────┴─────────┐
   │                   │
   ↓                   ↓
SUBMITTED TO      SUBMITTED TO
FINANCE OFFICE    PROCUREMENT
   │               │
   └─────────┬─────┘
             │
             ↓ NOTIFICATIONS SENT
             │
   ┌─────────┴─────────────┐
   │                       │
   ↓                       ↓
FINANCE OFFICER       PROCUREMENT OFFICER
LOGS IN               LOGS IN
   │                       │
   ↓                       ↓
AUTO-ROUTED TO        AUTO-ROUTED TO
ReviewerDashboard     ReviewerDashboard
   │                       │
   ↓ SEES SUBMISSIONS ↓
   │                       │
   ├─ Filter by status    ├─ Filter by status
   ├─ Search project      ├─ Search project
   ├─ View summary stats  ├─ View summary stats
   └─ Click "Review"      └─ Click "Review"
             │                   │
             ↓                   ↓
        REVIEW MODAL         REVIEW MODAL
        Opens with:          Opens with:
        - Doc details        - Doc details
        - Budget info        - Budget info
        - Previous reviews   - Previous reviews
        - Audit trail        - Audit trail
             │                   │
             ↓                   ↓
        Downloads PDF?        Downloads PDF?
        (optional)            (optional)
             │                   │
             └──────┬────────────┘
                    ↓
            FILLS OUT REVIEW
            - Review Status
            - Budget Verification
            - Comments (detailed)
            - Audit Notes
                    │
                    ↓
            CLICKS "Save Review"
            (Records in database)
                    │
    ┌───────────────┴───────────────┐
    │                               │
    ↓                               ↓
FINANCE OFFICER             PROCUREMENT OFFICER
CLICKS:                     CLICKS:
- Approve (Finance)    OR   - Approve (Procurement)
- Reject                    - Reject
    │                               │
    └───────────────┬───────────────┘
                    ↓
         DECISION RECORDED IN:
         - Submission Status
         - Audit Trail
         - Review Record
                    │
    ┌───────────────┴────────────────────┐
    │                                    │
    ↓ IF FINANCE ONLY                    ↓ IF BOTH REQUIRED
    │                                    │
APPROVED ✅                    PARTIALLY APPROVED ⚙️
(Ready for procurement)         (Waiting for Procurement)
                                    │
                                    ↓
                            PROCUREMENT REVIEWS
                            & APPROVES
                                    │
                                    ↓
                              APPROVED ✅
                              (Ready for procurement)
                                    │
                                    ↓
                          UNIVERSITY NOTIFIED ✉️
                          Can now proceed with
                          procurement process
```

## 2. ReviewerDashboard Navigation Flow

```
┌──────────────────────────────────────────┐
│     Finance/Procurement User Logs In     │
└────────────────────┬─────────────────────┘
                     │
        Role Check: finance OR procurement?
                     │
        ┌────────────┴────────────┐
        │                         │
        YES                      NO
        │                         │
        ↓                         ↓
    ReviewerDashboard      Regular Dashboard
    (Auto-routed)          (Per original flow)
        │
        ↓
┌───────────────────────────────────────────────┐
│        ReviewerDashboard Main View            │
├───────────────────────────────────────────────┤
│                                               │
│ Header: Document Review Dashboard             │
│ ┌───────────────────────────────────────────┐│
│ │ [Back] [Review Documents] [Logout]       ││
│ └───────────────────────────────────────────┘│
│                                               │
│ Filters:                                      │
│ ┌───────────────────────────────────────────┐│
│ │ Search: [________________]                ││
│ │ Status: [All ▼]  [Refresh]               ││
│ └───────────────────────────────────────────┘│
│                                               │
│ Summary Stats:                                │
│ ┌───────────────────────────────────────────┐│
│ │ Total: 15 | Pending: 5 | Approved: 8    ││
│ └───────────────────────────────────────────┘│
│                                               │
│ Table:                                        │
│ ┌────────────────────────────────────────────┬┐
│ │ Project | Type | Status | Priority | ... │││
│ ├────────────────────────────────────────────┤│
│ │ Lab A   | PDF  | submitted | high   | ..│││
│ │ Lab B   | CSV  | under_... | medium | ..│││
│ │ Lab C   | PDF  | approved  | low    | ..│││
│ └────────────────────────────────────────────┘│
│                                               │
│ Row Actions:                                  │
│ └──────────────┬──────────────┘              │
│                │                              │
│       ┌────────┴────────┐                    │
│       │                 │                     │
│   [Review]          [Download]               │
│       │                 │                     │
│       │                 └──→ File downloaded  │
│       │                                       │
│       ↓                                       │
│  REVIEW MODAL OPENS                          │
│  ┌────────────────────────────────────────┐  │
│  │  Document Review & Approval            │  │
│  ├────────────────────────────────────────┤  │
│  │                                        │  │
│  │ Document Information:                  │  │
│  │ - Type: Technical PDF                  │  │
│  │ - Status: Under Review                 │  │
│  │ - Priority: High                       │  │
│  │                                        │  │
│  │ Budget Information:                    │  │
│  │ - Total: $250,000                      │  │
│  │ - Range: $200k-$300k                   │  │
│  │ - Within Budget: ✓ Yes                 │  │
│  │                                        │  │
│  │ Submitter Notes:                       │  │
│  │ "Please review urgently..."            │  │
│  │                                        │  │
│  │ ─────────────────────────────────────  │  │
│  │ YOUR REVIEW:                           │  │
│  │ ─────────────────────────────────────  │  │
│  │                                        │  │
│  │ Status Selection:                      │  │
│  │ [pending] [reviewed] [approved] [rej] │  │
│  │                                        │  │
│  │ Budget Verified:                       │  │
│  │ [✓ Passed] [✗ Failed]                 │  │
│  │                                        │  │
│  │ Comments:                              │  │
│  │ ┌────────────────────────────────────┐ │  │
│  │ │ "Budget aligns with standards...  │ │  │
│  │ │  However, clarify maintenance..."  │ │  │
│  │ └────────────────────────────────────┘ │  │
│  │                                        │  │
│  │ Audit Notes:                           │  │
│  │ ┌────────────────────────────────────┐ │  │
│  │ │ "Vendor verified, certifications.." │ │  │
│  │ └────────────────────────────────────┘ │  │
│  │                                        │  │
│  │ Previous Reviews:                      │  │
│  │ └─ John Smith: "Budget acceptable"    │  │
│  │                                        │  │
│  │ Audit Trail:                           │  │
│  │ └─ [04/16 10:00] Submitted by Jane    │  │
│  │                                        │  │
│  │ ────────────────────────────────────── │  │
│  │ [Cancel] [Save Review] [Approve]      │  │
│  │          [Approve] [Reject]           │  │
│  └────────────────────────────────────────┘  │
│                                               │
└───────────────────────────────────────────────┘
```

## 3. Approval Status Transitions

```
SINGLE APPROVER WORKFLOW (Finance Only)
═════════════════════════════════════════

    ┌──────────┐
    │Submitted │
    └────┬─────┘
         │
         ↓
    ┌────────────┐
    │Under Review│
    └────┬─────┬─┘
    ┌────┘     └────┐
    ↓               ↓
┌─────────┐    ┌───────────┐
│Rejected │    │ Approved  │
└─────────┘    └───────────┘
    ✗               ✓


DUAL APPROVER WORKFLOW (Finance AND Procurement)
═════════════════════════════════════════════════

    ┌──────────┐
    │Submitted │
    └────┬─────┘
         │
         ├─→ [Finance Review] ─→ Approve? ─→ Partially Approved
         │         ↓                ↓
         │      [Reject] ──────→ Rejected ✗
         │
         └─→ [Procur. Review] ─→ Approve? ─→ More Reviews Needed?
                    ↓                ↓             ↓
                 [Reject] ────→ Rejected ✗    Waiting for others
                                            
If Finance APPROVED then Procurement APPROVED:
    ┌─────────────────────┐
    │    APPROVED ✓       │
    │(Both completed)     │
    └─────────────────────┘

If Either REJECTS:
    ┌──────────────┐
    │   REJECTED   │
    │ Return to    │
    │ University   │
    └──────────────┘


COMPLETE STATUS FLOW
════════════════════

    ┌──────────────────────────────────────┐
    │          submitted (0 reviews)       │  User submitted
    └──────────────┬───────────────────────┘               
                   │                         
                   ↓                         
    ┌──────────────────────────────────────┐
    │       under_review (1+ reviews)      │  Someone reviewing
    └──────────┬──────────────┬────────────┘
    ┌──────────┴──────┐       │
    │ Parallel Flows  │       │
    └────────┬────────┘       │
    ┌────────┴──────────┐     │
    ↓                   ↓     ↓
[Finance          [Procurement  [Single Path
 Reviews]          Reviews]     Reject]
    │                   │        │
    ├─→ Approve ────→   │        │
    │                   │        │
    └─→ Reject ─────────┴────→ REJECTED ✗
                        │      (Return to
                    Approve   University)
                        │
                        ↓
    ┌──────────────────────────────────────┐
    │   partially_approved (Finance OK)    │  Waiting for Procurement
    └──────────────┬───────────────────────┘
                   │
        Procurement now reviews
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
     Approve              Reject
        │                     │
        ↓                     ↓
    APPROVED ✓            REJECTED ✗
    (Ready for        (Return to
     Procurement)     University)
```

## 4. Key User Actions & Outcomes

```
UNIVERSITY USER ACTIONS              REVIEWER ACTIONS
════════════════════════════════════════════════════════════════

1. Login                              1. Login
   ↓                                     ↓
2. Click "Submit"                     2. Auto-routed to ReviewerDashboard
   ↓                                     ↓
3. Select Format                      3. View all submissions
   ↓                                     ↓
4. Select Recipients                  4. Click "Review" on submission
   ↓                                     ↓
5. Add Emails                         5. Download if needed
   ↓                                     ↓
6. Set Priority                       6. Fill review form:
   ↓                                        - Status selection
7. Add Notes                                - Budget verification
   ↓                                        - Comments
8. Submit                                   - Audit notes
   ↓                                        ↓
   SUBMISSION SAVED                    7. Click "Save Review"
   ↓                                        ↓
   Reviewers Notified ✉️                   REVIEW RECORDED
   ↓                                        ↓
   Track Status                        8. Choose Action:
   ↓                                        - Approve (Finance)
9. Receive Approval/Rejection              - Approve (Procurement)
   ↓                                        - Reject
   If Approved:                            ↓
   - Proceed with procurement              DECISION SAVED
   - Download approved docs                ↓
   - Archive submission                    AUDIT TRAIL UPDATED
                                           ↓
   If Rejected:                            University Notified ✉️
   - Review feedback
   - Address issues
   - Resubmit updated doc
```

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  UniversityDashboard            ReviewerDashboard          │
│  ├─ Lab Projects                ├─ All Submissions         │
│  ├─ Export Dropdown             ├─ Search & Filter        │
│  ├─ Submit Modal                ├─ Review Modal           │
│  └─ Submit Handler              ├─ Approval Buttons       │
│                                 └─ Status Tracking        │
│                                                             │
└──────────────┬──────────────────────────────┬──────────────┘
               │ Axios Requests               │ Axios Requests
               │ (with JWT token)             │ (with JWT token)
               ↓                              ↓
┌─────────────────────────────────────────────────────────────┐
│               BACKEND (Express.js + Node)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  labRoutes                    documentSubmissionRoutes    │
│  ├─ POST /export-doc          ├─ POST /submit-document   │
│  ├─ GET /export-pdf           ├─ GET /submissions        │
│  ├─ GET /export-csv           ├─ GET /submission/{id}    │
│  └─ GET /export-report        ├─ POST /{id}/add-review   │
│                               ├─ POST /{id}/approve      │
│  labController                ├─ POST /{id}/reject       │
│  ├─ exportLabProject...       └─ GET /approval-dashboard │
│  ├─ exportPDF()                                           │
│  ├─ exportCSV()               documentSubmissionController
│  └─ exportReport()            ├─ submitDocument()        │
│                               ├─ getSubmissions()        │
│  LabProject Model             ├─ addReview()            │
│  ├─ Project details           ├─ approveDocument()       │
│  ├─ Quotations                ├─ rejectDocument()        │
│  ├─ Procurements              └─ getAuditTrail()         │
│  └─ Budget info                                           │
│                               DocumentSubmission Model    │
│                               ├─ Submission details      │
│                               ├─ Reviews array           │
│                               ├─ Approval workflow       │
│                               ├─ Budget details          │
│                               └─ Audit trail             │
│                                                             │
└──────────────┬──────────────────────────────┬──────────────┘
               │ Database Operations          │ Database Operations
               ↓ (CRUD)                       ↓ (CRUD)
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (MongoDB)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  labprojects collection         documentsubmissions coll.  │
│  ├─ _id                         ├─ _id                     │
│  ├─ labName                     ├─ labProjectId            │
│  ├─ quotations[]                ├─ documentType            │
│  ├─ procurements[]              ├─ submittedTo             │
│  └─ budget                      ├─ reviews[]               │
│                                 ├─ approvalWorkflow        │
│  users collection               ├─ budgetDetails           │
│  ├─ _id                         ├─ auditTrail[]            │
│  ├─ email                       └─ timestamps              │
│  ├─ role                                                    │
│  └─ token                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 6. Review Decision Tree

```
┌─────────────────────────┐
│ Open Submission Modal   │
└────────────┬────────────┘
             │
             ↓
    ┌────────────────────┐
    │ Review Document    │
    │ Details/Download   │
    └────────────┬───────┘
                 │
                 ↓
    ┌──────────────────────────────────┐
    │ Are requirements met?            │
    └─────────┬──────────────┬─────────┘
              │              │
         YES  │              │  NO
              ↓              ↓
        ┌────────────┐  ┌──────────────┐
        │ More Info? │  │ Issues Found │
        └─┬────────┬─┘  └──────────────┘
       NO │        │ YES      │
          │        │          │
          │        ↓          ├──→ [Reject]
          │   Add pending_    │    Status: rejected
          │   review comment  │
          │        │          ↓
          │        └─→ [Save Review]
          │             │
          ↓             ↓
┌────────────────────────────────────┐
│ Fill Review Form Completely        │
│ 1. Status: reviewed                │
│ 2. Budget: ✓ Passed or ✗ Failed   │
│ 3. Comments: Detailed feedback     │
│ 4. Audit Notes: Compliance records │
└────────────┬───────────────────────┘
             │
             ↓
      [Save Review]
      (Audit Entry Created)
             │
             ↓
    ┌────────────────────────┐
    │ Decision Time          │
    └──┬──────────┬──────────┘
       │          │          
       ↓          ↓          ↓
  [Approve]  [Approve]  [Reject]
  (Finance)  (Procur.)  (With Reason)
       │          │         │
       ↓          ↓         ↓
    ✓ Approved ✓ Approved ✗ Rejected
    (Finance    (Procur.   (Return to
    recorded)   recorded)  University)
       │            │         │
       └────┬───────┘         └──→ University
            │                     Notified ✉️
            ↓
    Update Status to
    "partially_approved"
    or "approved"
            │
            ↓
    University Notified ✉️
    (Can Proceed)
```

---

This visual guide provides a comprehensive understanding of the document submission and approval workflow.
