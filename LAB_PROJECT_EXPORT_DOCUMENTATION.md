# Lab Project Documentation Export Feature

**Date Implemented:** April 16, 2026  
**Feature:** Universities can export comprehensive documentation related to their lab projects

---

## Overview

This feature allows universities to export complete, structured documentation for their lab projects. The export includes all related information such as project requirements, AI recommendations, vendor quotations, procurements, and consultant assignments.

---

## Implementation Details

### Files Modified

#### 1. **backend/controllers/labController.js**
- **Added Imports:**
  - `Quotation` model
  - `Procurement` model
  - `User` model

- **New Method:** `exportLabProjectDocumentation()`
  - **Purpose:** Generates comprehensive documentation for a lab project
  - **Authentication:** Required (token-based)
  - **Authorization:** Only the university that owns the project can export
  - **Response Type:** JSON (downloadable as file)

#### 2. **backend/routes/labRoutes.js**
- **New Route:** 
  ```
  GET /api/labs/export-documentation/:labProjectId
  ```
  - **Method:** GET
  - **Authentication:** Required (Bearer Token)
  - **Parameters:** `labProjectId` (URL parameter)
  - **Response:** JSON file download

---

## Exported Documentation Structure

### 1. **Metadata**
```json
{
  "exportDate": "ISO 8601 timestamp",
  "exportedBy": "University ID",
  "projectInformation": {
    "projectId": "String",
    "projectName": "String",
    "projectType": "Enum (Normal, Graphics, Networking, Thesis, AI)",
    "status": "Enum (draft, bidding, finalized, approved)",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp"
  }
}
```

### 2. **University Information**
```json
{
  "universityInformation": {
    "universityId": "String",
    "universityName": "String",
    "universityEmail": "String"
  }
}
```

### 3. **Project Requirements**
```json
{
  "projectRequirements": {
    "mainRequirement": "String",
    "systemsCount": "Number",
    "budgetRange": {
      "minimum": "Number",
      "maximum": "Number"
    },
    "performancePriority": "String",
    "requiredSoftware": ["Array of software"],
    "timeline": "Date or String"
  }
}
```

### 4. **AI Recommendations**
```json
{
  "aiRecommendations": {
    "totalEstimatedCost": "Number",
    "powerConsumption": "String (in Watts)",
    "componentCount": "Number",
    "components": [
      {
        "componentNumber": "Number",
        "name": "String",
        "specifications": "String",
        "estimatedPrice": "Currency String"
      }
    ]
  }
}
```

### 5. **Quotations Summary**
```json
{
  "quotationsSummary": {
    "totalQuotations": "Number",
    "quotations": [
      {
        "quotationNumber": "Number",
        "vendorName": "String",
        "vendorEmail": "String",
        "totalPrice": "Currency String",
        "bulkDiscount": "Percentage String",
        "status": "Enum (pending, accepted, rejected)",
        "installationIncluded": "Boolean",
        "maintenanceIncluded": "Boolean",
        "componentCount": "Number",
        "components": [
          {
            "componentIndex": "Number",
            "category": "Enum (CPU, GPU, RAM, Storage, etc.)",
            "name": "String",
            "unitPrice": "Currency String",
            "quantity": "Number",
            "warranty": "String",
            "deliveryTime": "String"
          }
        ],
        "createdAt": "ISO timestamp",
        "updatedAt": "ISO timestamp"
      }
    ]
  }
}
```

### 6. **Procurements Summary**
```json
{
  "procurementsSummary": {
    "totalProcurements": "Number",
    "procurements": [
      {
        "procurementNumber": "Number",
        "vendorCount": "Number",
        "vendors": [
          {
            "vendorIndex": "Number",
            "vendorName": "String",
            "vendorEmail": "String"
          }
        ],
        "acceptanceType": "Enum (full, partial)",
        "finalCost": "Currency String",
        "acceptedComponentCount": "Number",
        "components": [...],
        "approvedByAdmin": "Boolean",
        "createdAt": "ISO timestamp",
        "updatedAt": "ISO timestamp"
      }
    ]
  }
}
```

### 7. **Consultant Assignments**
```json
{
  "consultantAssignments": {
    "totalAssignments": "Number",
    "assignments": [
      {
        "assignmentNumber": "Number",
        "consultantName": "String",
        "consultantEmail": "String",
        "consultantExpertise": "String",
        "assignmentStatus": "String",
        "hoursAllocated": "Number",
        "assignedAt": "ISO timestamp"
      }
    ]
  }
}
```

### 8. **Recommended Quotation**
```json
{
  "recommendedQuotation": {
    "vendorName": "String",
    "vendorEmail": "String",
    "price": "Currency String",
    "reason": "String (e.g., 'Lowest total price')"
  }
}
```

### 9. **Documentation Summary**
```json
{
  "documentationSummary": {
    "projectStatus": "String",
    "totalQuotationsReceived": "Number",
    "totalProcurementsProcessed": "Number",
    "totalConsultantsAssigned": "Number",
    "documentsGeneratedAt": "ISO timestamp"
  }
}
```

---

## API Usage

### Request
```http
GET /api/labs/export-documentation/PROJECT_ID_HERE
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Disposition: attachment; filename="Lab_Project_Documentation_PROJECT_ID_TIMESTAMP.json"

{
  "exportDate": "2026-04-16T10:30:00Z",
  "exportedBy": "UNIVERSITY_ID",
  "projectInformation": { ... },
  "universityInformation": { ... },
  "projectRequirements": { ... },
  "aiRecommendations": { ... },
  "quotationsSummary": { ... },
  "procurementsSummary": { ... },
  "consultantAssignments": { ... },
  "recommendedQuotation": { ... },
  "documentationSummary": { ... }
}
```

### Error Responses

**404 Not Found:**
```json
{
  "message": "Lab project not found"
}
```

**403 Forbidden:**
```json
{
  "message": "Access denied. You do not own this project."
}
```

**500 Internal Server Error:**
```json
{
  "message": "Error exporting lab project documentation",
  "error": "Error details here"
}
```

---

## Security Features

1. **Authentication Required:** All requests must include valid JWT token
2. **Authorization Check:** Only the university that created the project can export its documentation
3. **Ownership Verification:** Compares `universityId` with authenticated user's ID
4. **Audit Trail:** Export timestamp and exported by information included

---

## Data Sources

The export feature aggregates data from multiple collections:

| Collection | Field Used |
|-----------|-----------|
| LabProject | Core project info, requirements, AI recommendations |
| Quotation | Vendor quotations, components, pricing |
| Procurement | Procurement status, accepted components, vendors |
| LabProjectAssignment | Consultant details, hours allocated |
| User | University, Vendor, and Consultant information |

---

## Use Cases

1. **Project Documentation:** Universities can export complete project documentation for record-keeping
2. **Administrative Review:** Generate comprehensive reports for university administrators
3. **Vendor Comparison:** Export all quotations to compare vendor offerings
4. **Procurement Tracking:** Monitor procurement process with detailed status
5. **Audit & Compliance:** Maintain documentation for compliance purposes
6. **Archive:** Create backups of project information

---

## File Download Behavior

- **Filename Format:** `Lab_Project_Documentation_[ProjectID]_[Timestamp].json`
- **Content Type:** `application/json`
- **Downloaded As:** Attachment (triggers browser download)

---

## Data Validation & Security

✅ Ownership verification (403 if not owner)  
✅ Authentication required (JWT token)  
✅ Population of references to get full data  
✅ Null-safe defaults for missing fields  
✅ Comprehensive error handling  
✅ Audit logging with export metadata  

---

## Notes

- All currency values are formatted as strings with "$" prefix
- All timestamps are in ISO 8601 format
- Missing optional fields default to sensible values (0, empty arrays, "Not specified")
- The recommended quotation is automatically selected as the lowest total price
- No existing functionality was modified
- Feature is backward compatible

---

## Future Enhancement Ideas

- Export to PDF format
- Export to CSV format
- Batch export multiple projects
- Email export directly
- Schedule periodic exports
- Custom export templates

---

**Implementation Status:** ✅ Complete and Tested

