# Quotation System - Complete Workflow Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Backend Structure](#backend-structure)
5. [Frontend Structure](#frontend-structure)
6. [Complete User Workflows](#complete-user-workflows)
7. [API Endpoints](#api-endpoints)
8. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Overview

The Quotation System is a comprehensive procurement platform that connects universities (buyers) with vendors (suppliers) through a competitive bidding process. 

### Key Features:
- **Universities**: Create lab projects, receive quotations from vendors, compare bids, accept/reject quotations
- **Vendors**: View available lab projects, submit quotations with component details, update submitted quotations
- **Role-Based Access**: Different views and capabilities based on user role
- **Quotation Comparison**: Side-by-side comparison of quotations grouped by component category
- **Component Management**: Detailed specification of hardware components with pricing and warranty

### User Roles:
- **University**: Creates lab projects and evaluates vendor quotations
- **Vendor**: Submits quotations on available lab projects
- **Consultant**: (Future use)
- **Admin**: (Future use)

---

## Architecture

### Tech Stack:
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Cloud: MongoDB Atlas)
- **Frontend**: React 18.2.0
- **Authentication**: JWT (JSON Web Tokens)
- **HTTP Client**: Axios (Frontend)
- **Styling**: Tailwind CSS 3.4

### System Architecture Diagram:
```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  QuotationSystem.jsx │ CompareQuotation.jsx              │   │
│  │  - Lab Selection     │ - Category-based Comparison       │   │
│  │  - Component Form    │ - Price Comparison                │   │
│  │  - Submit/Update     │ - Side-by-side View               │   │
│  │  - Quotation List    │                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ Axios (HTTP) ↓                       │
│                    API Calls with JWT Token                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              QuotationSystemRoutes.js                    │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  authMiddleware - Verify JWT Token                │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  GET  /labs                        ← Get Available Labs  │   │
│  │  GET  /labs/:id                    ← Lab Details        │   │
│  │  GET  /labs/:id/quotations         ← All Quotations     │   │
│  │  POST /quotations                  ← Submit Quotation   │   │
│  │  GET  /quotations/my               ← Vendor's Quotes    │   │
│  │  GET  /quotations/:id              ← Single Quote       │   │
│  │  PUT  /quotations/:id              ← Update Quote       │   │
│  │  POST /quotations/:id/accept       ← Accept Quote       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │       QuotationSystemController.js                       │   │
│  │  - Business Logic & Validation                           │   │
│  │  - Database Operations                                   │   │
│  │  - Role-Based Authorization                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              MongoDB Models                              │   │
│  │  - User (Universities, Vendors)                          │   │
│  │  - LabProject (Lab specifications)                       │   │
│  │  - Quotation (Vendor bids)                               │   │
│  │  - Procurement (Accepted quotations)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  MongoDB Atlas (Cloud Database)                  │
│  - university-lab-procurement                                    │
│  - Collections: users, labprojects, quotations, procurements    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### 1. User Model (`models/User.js`)

```javascript
{
  _id: ObjectId,
  role: "university" | "vendor" | "consultant" | "admin",
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  
  // University-specific fields
  universityInfo: {
    universityName: String,
    department: String,
    address: String,
    representative: {
      name: String,
      email: String,
      phone: String
    },
    isApproved: Boolean,
    subscriptionPlan: "free" | "premium"
  },
  
  // Vendor-specific fields
  vendorInfo: {
    shopName: String,
    tradeLicense: String,
    location: {
      address: String,
      lat: Number,
      lng: Number
    },
    isVerified: Boolean,
    rating: Number
  },
  
  // Consultant-specific fields
  consultantInfo: {
    profilePhoto: String,
    bio: String,
    expertise: [String],
    experienceLevel: String,
    completedLabDeployments: Number,
    rating: Number,
    reviews: []
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Lab Project Model (`models/LabProject.js`)

```javascript
{
  _id: ObjectId,
  universityId: ObjectId (Reference to User),
  labName: String,
  labType: "Normal" | "Graphics" | "Networking" | "Thesis" | "AI",
  
  requirements: {
    mainRequirement: String,
    systems: Number,
    budgetMin: Number,
    budgetMax: Number,
    performancePriority: String,
    software: [String],
    timeline: Date
  },
  
  courseOutlineFile: String (URL),
  
  aiRecommendation: {
    suggestedComponents: [{
      name: String,
      specs: String,
      estimatedPrice: Number
    }],
    totalEstimatedCost: Number,
    powerConsumption: Number
  },
  
  status: "draft" | "bidding" | "finalized" | "approved",
  consultantId: ObjectId,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Quotation Model (`models/Quotation.js`)

```javascript
{
  _id: ObjectId,
  labProjectId: ObjectId (Reference to LabProject),
  vendorId: ObjectId (Reference to User),
  
  components: [{
    category: "CPU" | "GPU" | "RAM" | "Storage" | "Motherboard" | "Networking" | "UPS" | "Other",
    name: String,
    unitPrice: Number,
    quantity: Number,
    warranty: String,
    deliveryTime: String
  }],
  
  totalPrice: Number,
  bulkDiscount: Number,
  installationIncluded: Boolean,
  maintenanceIncluded: Boolean,
  
  status: "pending" | "accepted" | "rejected",
  
  revisionHistory: [{
    updatedAt: Date,
    changes: String
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Procurement Model (`models/Procurement.js`)

```javascript
{
  _id: ObjectId,
  labProjectId: ObjectId,
  quotationId: ObjectId,
  selectedVendorIds: [ObjectId],
  
  acceptanceType: "full" | "partial",
  acceptedComponents: [{...component details}],
  
  finalCost: Number,
  approvedByAdmin: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Backend Structure

### 1. Authentication Middleware (`middleware/authMiddleware.js`)

**Purpose**: Verify JWT token and attach user info to request

```javascript
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains: { id: userId, role: userRole }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
```

**Flow**:
1. Client sends JWT token in `Authorization` header
2. Middleware extracts token (removes "Bearer " prefix)
3. Verifies token signature using `JWT_SECRET`
4. If valid, decodes token and attaches user info to `req.user`
5. If invalid, returns 401 Unauthorized

---

### 2. Routes (`routes/QuotationSystemRoutes.js`)

All routes are protected by `authMiddleware`:

```javascript
router.use(authMiddleware); // All routes require authentication

router.get('/labs', getAccessibleLabProjects);
router.get('/labs/:id', getLabProjectDetails);
router.get('/labs/:id/quotations', getLabQuotations);
router.post('/quotations', submitQuotation);
router.get('/quotations/my', getMyQuotations);
router.get('/quotations/:id', getQuotationById);
router.put('/quotations/:id', updateQuotation);
router.post('/quotations/:id/accept', acceptQuotation);
```

---

### 3. Controller Functions (`controllers/QuotationSystemController.js`)

#### A. `getAccessibleLabProjects()`

**Purpose**: Fetch labs visible to the current user

**Access Control**:
- **Vendors**: See all labs in "bidding" status that they haven't submitted to
- **Universities**: See only their own labs

**Code Flow**:
```javascript
exports.getAccessibleLabProjects = async (req, res) => {
    // 1. Get user's role
    const role = await getRole(req.user.id);
    
    if (role === 'vendor') {
        // Get labs this vendor has already submitted to
        const submittedLabIds = await Quotation.find({ 
            vendorId: req.user.id 
        }).distinct('labProjectId');
        
        // Fetch all bidding labs
        const labs = await LabProject.find({ 
            status: { $in: ['draft', 'bidding', 'finalized', 'approved'] } 
        }).populate('universityId');
        
        // Filter out labs they've already bid on
        return res.json(
            labs.filter(lab => !submittedLabIds.includes(lab._id))
        );
    }
    
    if (role === 'university') {
        // Get only this university's labs with quotation counts
        const labs = await LabProject.find({ 
            universityId: req.user.id 
        }).populate('universityId');
        
        // Add quotation count to each lab
        const labsWithCounts = await Promise.all(
            labs.map(async (lab) => ({
                ...lab.toObject(),
                quotationCount: await Quotation.countDocuments({
                    labProjectId: lab._id
                })
            }))
        );
        
        return res.json(labsWithCounts);
    }
};
```

**Response**:
```json
[
  {
    "_id": "lab123",
    "labName": "AI Lab",
    "labType": "AI",
    "requirements": {...},
    "status": "bidding",
    "quotationCount": 2  // Only for universities
  }
]
```

---

#### B. `getLabProjectDetails()`

**Purpose**: Get full details of a specific lab project

**Code Flow**:
```javascript
exports.getLabProjectDetails = async (req, res) => {
    // 1. Get user's role
    const role = await getRole(req.user.id);
    
    // 2. Fetch lab by ID
    const lab = await LabProject.findById(req.params.id)
        .populate('universityId');
    
    // 3. Authorization check for universities
    if (role === 'university' && lab.universityId._id !== req.user.id) {
        return res.status(403).json({ 
            message: 'You can only access your own lab projects' 
        });
    }
    
    // 4. Return formatted lab data
    return res.json(mapLab(lab));
};
```

---

#### C. `submitQuotation()`

**Purpose**: Submit a new quotation for a lab project

**Step-by-Step Process**:

1. **Role Verification**: Only vendors can submit
2. **Validation**: 
   - Lab exists
   - Has at least one component
   - All components have name and unitPrice
   - Vendor hasn't already submitted
3. **Component Normalization**: Convert to correct data types
4. **Price Calculation**: Calculate total if not provided
5. **Creation**: Store in database
6. **Response**: Return created quotation

**Code**:
```javascript
exports.submitQuotation = async (req, res) => {
    try {
        // 1. Verify role
        const role = await getRole(req.user.id);
        if (role !== 'vendor') {
            return res.status(403).json({ message: 'Vendor only' });
        }

        // 2. Extract and validate input
        const { labProjectId, components, totalPrice, bulkDiscount, 
                installationIncluded, maintenanceIncluded } = req.body;

        if (!labProjectId || !components.length) {
            return res.status(400).json({ 
                message: 'Lab and at least 1 component required' 
            });
        }

        // 3. Check lab exists
        const lab = await LabProject.findById(labProjectId);
        if (!lab) {
            return res.status(404).json({ message: 'Lab not found' });
        }

        // 4. Check vendor hasn't already submitted
        const existingQuotation = await Quotation.findOne({
            labProjectId,
            vendorId: req.user.id
        });
        if (existingQuotation) {
            return res.status(400).json({ 
                message: 'You already submitted for this lab' 
            });
        }

        // 5. Normalize components
        const normalizedComponents = components.map((component) => ({
            category: component.category,
            name: component.name,
            unitPrice: Number(component.unitPrice),
            quantity: Number(component.quantity || 1),
            warranty: component.warranty || '',
            deliveryTime: component.deliveryTime || ''
        }));

        // 6. Validate all components have required fields
        const invalid = normalizedComponents.filter(
            c => !c.name || !c.name.trim() || c.unitPrice === 0
        );
        if (invalid.length > 0) {
            return res.status(400).json({ 
                message: 'All components need name and price' 
            });
        }

        // 7. Calculate total price
        const calculatedTotal = normalizedComponents.reduce(
            (sum, c) => sum + (c.unitPrice * c.quantity), 
            0
        );

        // 8. Create quotation
        const quotation = await Quotation.create({
            labProjectId,
            vendorId: req.user.id,
            components: normalizedComponents,
            totalPrice: Number(totalPrice || calculatedTotal),
            bulkDiscount: Number(bulkDiscount || 0),
            installationIncluded: Boolean(installationIncluded),
            maintenanceIncluded: Boolean(maintenanceIncluded),
            status: 'pending',
            revisionHistory: []
        });

        return res.status(201).json({ 
            message: 'Quotation submitted successfully', 
            quotation 
        });

    } catch (error) {
        return res.status(500).json({ 
            message: 'Failed to submit', 
            error: error.message 
        });
    }
};
```

---

#### D. `updateQuotation()`

**Purpose**: Update an existing quotation (vendors only)

**Constraints**:
- Only vendor who submitted can update
- Only "pending" quotations can be updated
- Cannot update after university accepts

**Code Flow**:
```javascript
exports.updateQuotation = async (req, res) => {
    // 1. Verify vendor role
    const role = await getRole(req.user.id);
    if (role !== 'vendor') return res.status(403).json({...});

    // 2. Fetch quotation
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({...});

    // 3. Verify ownership
    if (quotation.vendorId.toString() !== req.user.id) {
        return res.status(403).json({ 
            message: 'Can only update your own quotations' 
        });
    }

    // 4. Verify pending status
    if (quotation.status !== 'pending') {
        return res.status(400).json({ 
            message: 'Only pending quotations can be updated' 
        });
    }

    // 5. Update fields if provided
    if (req.body.components) {
        quotation.components = req.body.components.map(c => ({
            category: c.category,
            name: c.name,
            unitPrice: Number(c.unitPrice),
            quantity: Number(c.quantity || 1),
            warranty: c.warranty || '',
            deliveryTime: c.deliveryTime || ''
        }));
    }

    if (req.body.totalPrice !== undefined) 
        quotation.totalPrice = Number(req.body.totalPrice);
    if (req.body.bulkDiscount !== undefined) 
        quotation.bulkDiscount = Number(req.body.bulkDiscount);
    if (req.body.installationIncluded !== undefined) 
        quotation.installationIncluded = Boolean(req.body.installationIncluded);
    if (req.body.maintenanceIncluded !== undefined) 
        quotation.maintenanceIncluded = Boolean(req.body.maintenanceIncluded);

    // 6. Track revision
    quotation.revisionHistory.push({
        updatedAt: new Date(),
        changes: 'Updated by vendor'
    });

    // 7. Save
    await quotation.save();

    return res.json({ 
        message: 'Updated successfully', 
        quotation 
    });
};
```

---

#### E. `acceptQuotation()`

**Purpose**: University accepts a quotation (full or partial)

**Workflow**:
1. Verify university role
2. Verify ownership of lab
3. Check quotation is "pending"
4. Handle full or partial acceptance
5. Create/update procurement record
6. Update lab status to "approved"

**Code**:
```javascript
exports.acceptQuotation = async (req, res) => {
    // 1. Verify university role
    const role = await getRole(req.user.id);
    if (role !== 'university') return res.status(403).json({...});

    // 2. Fetch quotation with relations
    const quotation = await Quotation.findById(req.params.id)
        .populate({
            path: 'labProjectId',
            populate: { path: 'universityId' }
        });

    if (!quotation) return res.status(404).json({...});

    // 3. Verify lab ownership
    const labOwnerId = quotation.labProjectId.universityId._id.toString();
    if (labOwnerId !== req.user.id) {
        return res.status(403).json({ 
            message: 'Can only accept quotations for your labs' 
        });
    }

    // 4. Verify pending status
    if (quotation.status !== 'pending') {
        return res.status(400).json({ 
            message: 'Only pending quotations can be accepted' 
        });
    }

    // 5. Determine acceptance type (full or partial)
    const acceptanceType = req.body.acceptanceType === 'partial' ? 'partial' : 'full';
    let acceptedComponents = quotation.components;

    if (acceptanceType === 'partial') {
        // Get selected component indices
        const selectedIndexes = req.body.componentIndexes || [];
        acceptedComponents = selectedIndexes
            .map(idx => quotation.components[Number(idx)])
            .filter(Boolean);

        if (!acceptedComponents.length) {
            return res.status(400).json({ 
                message: 'Select at least one component' 
            });
        }
    }

    // 6. Calculate final cost
    const finalCost = acceptedComponents.reduce(
        (sum, comp) => sum + (Number(comp.unitPrice) * Number(comp.quantity)),
        0
    );

    // 7. Update quotation
    quotation.status = 'accepted';
    quotation.revisionHistory.push({
        updatedAt: new Date(),
        changes: `Accepted (${acceptanceType}) by university`
    });
    await quotation.save();

    // 8. Create/update procurement record
    const procurementPayload = {
        labProjectId: quotation.labProjectId._id,
        quotationId: quotation._id,
        selectedVendorIds: [quotation.vendorId._id],
        finalCost,
        acceptanceType,
        acceptedComponents,
        approvedByAdmin: false
    };

    const existing = await Procurement.findOne({ 
        labProjectId: quotation.labProjectId._id 
    });

    if (existing) {
        Object.assign(existing, procurementPayload);
        await existing.save();
    } else {
        await Procurement.create(procurementPayload);
    }

    // 9. Update lab status
    await LabProject.findByIdAndUpdate(
        quotation.labProjectId._id,
        { status: 'approved' }
    );

    return res.json({ 
        message: 'Quotation accepted successfully',
        procurement: procurementPayload
    });
};
```

---

#### F. `getLabQuotations()`

**Purpose**: Get all quotations for a lab

**Access Control**:
- **Universities**: See all quotations for their labs
- **Vendors**: See only their own quotation for the lab

**Code**:
```javascript
exports.getLabQuotations = async (req, res) => {
    const role = await getRole(req.user.id);
    const lab = await LabProject.findById(req.params.id);

    if (!lab) return res.status(404).json({...});

    // Universities can see all, vendors see only theirs
    if (role === 'vendor') {
        const myQuotation = await Quotation.findOne({
            labProjectId: req.params.id,
            vendorId: req.user.id
        }).populate('vendorId', 'name vendorInfo.shopName email');

        return res.json(myQuotation ? [myQuotation] : []);
    }

    // University: see all quotations for this lab
    const quotations = await Quotation.find({ 
        labProjectId: req.params.id 
    })
        .populate('vendorId', 'name vendorInfo.shopName email')
        .sort({ createdAt: -1 });

    return res.json(quotations);
};
```

---

#### G. `getMyQuotations()`

**Purpose**: Get all quotations submitted by a vendor

**Code**:
```javascript
exports.getMyQuotations = async (req, res) => {
    const role = await getRole(req.user.id);
    if (role !== 'vendor') return res.status(403).json({...});

    const quotations = await Quotation.find({ vendorId: req.user.id })
        .populate({
            path: 'labProjectId',
            populate: { path: 'universityId' }
        })
        .sort({ createdAt: -1 });

    return res.json(quotations);
};
```

---

## Frontend Structure

### 1. QuotationSystem.jsx (`src/pages/QuotationSystem.jsx`)

**Purpose**: Main quotation system interface for both vendors and universities

#### State Management

```javascript
const [labs, setLabs] = useState([]);              // Available labs
const [selectedLab, setSelectedLab] = useState(null);  // Currently viewing
const [labDetails, setLabDetails] = useState(null);    // Lab specs
const [quotations, setQuotations] = useState([]);      // Quotations for lab
const [loading, setLoading] = useState(true);          // Loading state
const [loadingDetails, setLoadingDetails] = useState(false);
const [error, setError] = useState('');                // Error messages
const [success, setSuccess] = useState('');            // Success messages
const [editingQuotationId, setEditingQuotationId] = useState(null);  // For updates
const [components, setComponents] = useState([]);      // Form components
const [bulkDiscount, setBulkDiscount] = useState('');
const [installationIncluded, setInstallationIncluded] = useState(false);
const [maintenanceIncluded, setMaintenanceIncluded] = useState(false);
const [selectedQuotations, setSelectedQuotations] = useState([]);    // For comparison
const [compareError, setCompareError] = useState('');
```

#### Component Structure

```
QuotationSystem
├── Header (with Material Icons)
│   ├── Title + Subtitle (based on role)
│   └── Back to Dashboard Button
│
├── Main Grid Layout (2 columns)
│
├── Column 1: Lab Selection Panel
│   ├── Lab Projects List
│   │   ├── Lab Type Badge
│   │   ├── Lab Name
│   │   ├── Budget Range
│   │   └── Quotation Count (if university)
│   │
│   └── VENDOR VIEW:
│       ├── If selected, show available quotations
│       ├── Compare selected quotations button
│
├── Column 2: Form/Details Panel
│   │
│   ├── IF ROLE = 'vendor':
│   │   ├── Component Form
│   │   │   ├── Add/Remove Component Buttons
│   │   │   ├── Component Grid (for each component)
│   │   │   │   ├── Category Select (CPU, GPU, RAM, etc.)
│   │   │   │   ├── Component Name Input
│   │   │   │   ├── Unit Price Input
│   │   │   │   ├── Quantity Input
│   │   │   │   ├── Warranty Input
│   │   │   │   └── Delivery Time Input
│   │   │   │
│   │   │   ├── Additional Options
│   │   │   │   ├── Bulk Discount Input
│   │   │   │   ├── Installation Included Checkbox
│   │   │   │   └── Maintenance Included Checkbox
│   │   │   │
│   │   │   ├── Total Price Summary
│   │   │   └── Submit/Update Button
│   │
│   └── IF ROLE = 'university':
│       ├── Lab Specifications Display
│       │   ├── Requirements
│       │   ├── Software Needed
│       │   └── Timeline
│       │
│       ├── Quotations List Display
│       │   ├── Best Quotation Highlight (marked with star)
│       │   ├── Quotation Card (for each vendor quotation)
│       │   │   ├── Vendor Name + Shop Name
│       │   │   ├── Total Price
│       │   │   ├── Components Count
│       │   │   ├── Bulk Discount
│       │   │   ├── Installation/Maintenance Tags
│       │   │   ├── Checkbox for Comparison Selection
│       │   │   └── Action Buttons (View, Compare)
│       │   │
│       │   └── Compare Button
│       │       └── Navigates to CompareQuotation page
```

#### Key Functions

**1. fetchLabs() - useEffect Hook**
```javascript
useEffect(() => {
    async function fetchLabs() {
        setLoading(true);
        try {
            // GET /api/quotation-system/labs
            const res = await axios.get(
                'http://localhost:5001/api/quotation-system/labs',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLabs(res.data || []);
            if (res.data && res.data.length > 0) {
                setSelectedLab(res.data[0]);  // Select first lab
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load labs');
        } finally {
            setLoading(false);
        }
    }
    if (token) fetchLabs();
}, [token]);
```

**Flow**:
1. Component mounts or token changes
2. Fetch labs from backend
3. Set first lab as selected
4. Triggers second useEffect to load lab details

**2. fetchLabDetails() - useEffect Hook**
```javascript
useEffect(() => {
    async function fetchLabDetails() {
        if (!selectedLab?._id) return;
        
        setLoadingDetails(true);
        try {
            // Fetch lab details and quotations in parallel
            const [labRes, quotationRes] = await Promise.all([
                axios.get(`/api/quotation-system/labs/${selectedLab._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`/api/quotation-system/labs/${selectedLab._id}/quotations`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setLabDetails(labRes.data);
            setQuotations(quotationRes.data || []);

            // If vendor: populate form with existing quotation
            if (role === 'vendor' && quotationRes.data?.length > 0) {
                const myQuotation = quotationRes.data[0];
                setEditingQuotationId(myQuotation._id);
                setComponents(myQuotation.components);
                setBulkDiscount(myQuotation.bulkDiscount || '');
                setInstallationIncluded(myQuotation.installationIncluded);
                setMaintenanceIncluded(myQuotation.maintenanceIncluded);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load details');
        } finally {
            setLoadingDetails(false);
        }
    }
    if (token && selectedLab?._id) fetchLabDetails();
}, [selectedLab?._id, token, role]);
```

**Flow**:
1. Lab selected
2. Fetch lab details and quotations in parallel
3. If vendor: check if they have existing quotation
4. Pre-populate form if editing

**3. updateComponent() - Form Handler**
```javascript
function updateComponent(index, key, value) {
    setComponents(prev => 
        prev.map((component, idx) => 
            idx === index 
                ? { ...component, [key]: value }  // Update specific field
                : component
        )
    );
}
```

**4. addComponent() - Add New Component**
```javascript
function addComponent() {
    setComponents(prev => [...prev, {...blankComponent}]);
}
```

**5. removeComponent() - Remove Component**
```javascript
function removeComponent(index) {
    setComponents(prev => {
        if (prev.length === 1) return prev;  // Keep at least 1
        return prev.filter((_, idx) => idx !== index);
    });
}
```

**6. submitQuotation() - Form Submission**
```javascript
async function submitQuotation(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Validate: filter empty components
    const validComponents = components.filter(
        (c) => c.name && c.name.trim() && c.unitPrice
    );

    if (validComponents.length === 0) {
        setError('Please add at least one complete component');
        return;
    }

    try {
        const payload = {
            labProjectId: selectedLab._id,
            components: validComponents,
            totalPrice,
            bulkDiscount: Number(bulkDiscount || 0),
            installationIncluded,
            maintenanceIncluded
        };

        if (editingQuotationId) {
            // PUT: Update existing quotation
            await axios.put(
                `http://localhost:5001/api/quotation-system/quotations/${editingQuotationId}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('Quotation updated successfully');
        } else {
            // POST: Create new quotation
            await axios.post(
                'http://localhost:5001/api/quotation-system/quotations',
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('Quotation submitted successfully');
        }
        
        // Refresh quotations list
        // ... (re-fetch quotations)
        
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit');
    }
}
```

**Validation Flow**:
1. Filter out components with empty name or price
2. Check at least 1 valid component exists
3. If new: POST to create
4. If editing: PUT to update
5. Include all component fields in payload
6. Handle response: show success/error messages

**7. totalPrice - Memoized Calculation**
```javascript
const totalPrice = useMemo(() => {
    return components.reduce((sum, component) => {
        const unitPrice = Number(component.unitPrice || 0);
        const quantity = Number(component.quantity || 1);
        return sum + (unitPrice * quantity);
    }, 0);
}, [components]);
```

**8. bestQuotation - Find Best Price**
```javascript
const bestQuotation = useMemo(() => {
    if (role !== 'university' || quotations.length === 0) {
        return null;
    }
    return quotations.reduce((best, current) => {
        const bestPrice = Number(best.totalPrice || Infinity);
        const currentPrice = Number(current.totalPrice || Infinity);
        return currentPrice < bestPrice ? current : best;
    }, null);
}, [quotations, role]);
```

---

### 2. CompareQuotation.jsx (`src/pages/CompareQuotation.jsx`)

**Purpose**: Side-by-side comparison of two quotations, grouped by component category

#### Data Flow

```javascript
// Get comparison data from navigation state or sessionStorage
const comparisonData = location.state || JSON.parse(sessionStorage.getItem('quotationComparisonData'));
const quotations = comparisonData.quotations;  // Array of 2 quotations
const selectedLab = comparisonData.selectedLab;
```

#### Component Logic

**Group Components by Category**
```javascript
const comparisonRows = useMemo(() => {
    const componentMap = new Map();

    quotations.forEach((quotation) => {
        (quotation.components || []).forEach((component) => {
            // Use CATEGORY as key (not name)
            const key = component.category?.toLowerCase() || 'other';
            
            if (!componentMap.has(key)) {
                componentMap.set(key, {
                    category: component.category || 'Other',
                    components: new Map()  // Map of quotationId -> component
                });
            }

            // Store component by vendor
            componentMap.get(key).components.set(quotation._id, component);
        });
    });

    return Array.from(componentMap.values());
}, [quotations]);
```

**Key Point**: Grouping by category (CPU, GPU, RAM) instead of name allows:
- Comparing different models of same component type
- Clear organization in table
- Original component names still visible in details

#### Component Structure

```
CompareQuotation Page
├── Header Section
│   ├── Title + Compare Icon
│   ├── Lab Name Display
│   └── Back Button
│
├── Quotation Cards Section (2 columns)
│   ├── Card 1: Vendor 1 Info
│   │   ├── Vendor Name + Shop Name
│   │   ├── Email
│   │   ├── Total Price (highlighted)
│   │   └── Component Count
│   │
│   └── Card 2: Vendor 2 Info
│       └── (same as Card 1)
│
└── Comparison Table
    ├── Table Header
    │   ├── Category Column
    │   ├── Quotation 1 Column
    │   └── Quotation 2 Column
    │
    └── Table Rows (one per component category)
        ├── Category Name (CPU, GPU, RAM, etc.)
        ├── Vendor 1 Details (if has component)
        │   ├── Component Name
        │   ├── Unit Price
        │   └── Warranty
        └── Vendor 2 Details (if has component)
            ├── Component Name
            ├── Unit Price
            └── Warranty
            
        Or: "Not included" message if vendor doesn't have this category
```

#### Display Logic

```javascript
{comparisonRows.map((row) => (
    <tr key={row.category}>
        <td>{row.category}</td>  {/* Category header */}
        
        {quotations.map((quotation) => {
            const component = row.components.get(quotation._id);
            return (
                <td key={quotation._id}>
                    {component ? (
                        <>
                            <p>Name: {component.name}</p>
                            <p>Price: {component.unitPrice}</p>
                            <p>Warranty: {component.warranty}</p>
                        </>
                    ) : (
                        <p>Not included</p>
                    )}
                </td>
            );
        })}
    </tr>
))}
```

---

## Complete User Workflows

### Workflow 1: Vendor Submitting a Quotation

```
VENDOR
├─ Login with credentials (star@gmail.com, password: 1234)
│  └─ JWT token stored in localStorage
│
├─ Navigate to Quotation System
│  └─ Frontend GET /api/quotation-system/labs
│     └─ Backend returns all available labs (that vendor hasn't bid on yet)
│
├─ Select a lab from the list
│  └─ Fetch lab details + quotations for that lab
│     ├─ GET /api/quotation-system/labs/{id}
│     ├─ GET /api/quotation-system/labs/{id}/quotations
│     └─ Vendor sees only their own quotation (if exists)
│
├─ If first time: Fill quotation form
│  ├─ Add components dynamically
│  │  ├─ Select category (CPU, GPU, RAM, etc.)
│  │  ├─ Enter component name
│  │  ├─ Enter unit price
│  │  ├─ Enter quantity
│  │  ├─ Enter warranty period
│  │  └─ Enter delivery time
│  │
│  ├─ Set bulk discount (optional)
│  ├─ Check installation included
│  ├─ Check maintenance included
│  └─ Frontend calculates total price = sum of (unitPrice × quantity)
│
├─ Submit quotation
│  └─ POST /api/quotation-system/quotations
│     ├─ Backend validates:
│     │  ├─ User is vendor
│     │  ├─ Lab exists
│     │  ├─ All components have name & price
│     │  └─ Vendor hasn't already submitted
│     ├─ Backend normalizes components (convert to numbers)
│     ├─ Backend calculates total if not provided
│     ├─ Backend creates Quotation document
│     └─ Returns 201 with quotation details
│
├─ Success message displays
│  └─ "Quotation submitted successfully"
│
└─ Vendor can later:
   ├─ Update quotation (if status still "pending")
   │  └─ PUT /api/quotation-system/quotations/{id}
   │     ├─ Backend verifies vendor owns it
   │     ├─ Backend verifies status is "pending"
   │     └─ Backend updates fields
   │
   └─ View all their quotations
      └─ GET /api/quotation-system/quotations/my

Validation Points:
├─ Frontend: Components have name & unitPrice
├─ Frontend: At least 1 complete component
├─ Backend: Vendor role check
├─ Backend: Lab exists check
├─ Backend: Duplicate submission check
├─ Backend: Component name & price validation
└─ Backend: Numeric conversion
```

---

### Workflow 2: University Viewing and Comparing Quotations

```
UNIVERSITY
├─ Login with credentials (seu1@gmail.com, password: 1234)
│  └─ JWT token stored in localStorage
│
├─ Navigate to Quotation System
│  └─ Frontend GET /api/quotation-system/labs
│     └─ Backend returns only this university's labs with quotation counts
│
├─ Select one of their labs
│  └─ Fetch lab details + all quotations for the lab
│     ├─ GET /api/quotation-system/labs/{id}
│     ├─ GET /api/quotation-system/labs/{id}/quotations
│     └─ Backend returns all vendor quotations (not filtered)
│
├─ View quotation list
│  ├─ See all vendors who submitted
│  ├─ See best quotation (lowest price) marked with star icon
│  ├─ For each quotation show:
│  │  ├─ Vendor name + shop name
│  │  ├─ Total price (highlighted)
│  │  ├─ Number of components
│  │  ├─ Bulk discount offered
│  │  ├─ Installation included (yes/no)
│  │  └─ Maintenance included (yes/no)
│  │
│  └─ Checkbox to select quotations for comparison
│
├─ Compare Feature
│  ├─ Select exactly 2 quotations (checkboxes)
│  ├─ Click "Compare" button
│  └─ Frontend navigates to CompareQuotation page
│     ├─ Stores comparison data in sessionStorage
│     ├─ Passes as navigation state
│     └─ Displays CompareQuotation component
│
├─ CompareQuotation Page
│  ├─ Shows both quotations' basic info (vendor name, email, total price)
│  │
│  └─ Comparison table grouped by component category
│     ├─ Row for CPU category
│     │  ├─ Column 1: Vendor 1's CPU
│     │  │  ├─ Name (Intel Xeon Platinum 8380)
│     │  │  ├─ Price (15,000)
│     │  │  └─ Warranty (3 years)
│     │  │
│     │  └─ Column 2: Vendor 2's CPU
│     │     ├─ Name (AMD EPYC 7003)
│     │     ├─ Price (14,000)
│     │     └─ Warranty (3 years)
│     │
│     ├─ Row for GPU category
│     │  └─ Similar structure...
│     │
│     └─ Row for other categories...
│        └─ "Not included" if vendor doesn't have that component
│
├─ Back to lab to select another quotation
│  └─ Repeat comparison with different vendor
│
└─ Accept Quotation
   ├─ University chooses to accept one quotation
   ├─ Full acceptance: Accept all components
   │  ├─ POST /api/quotation-system/quotations/{id}/accept
   │  │  └─ { acceptanceType: "full" }
   │  │
   │  └─ Backend:
   │     ├─ Verifies user is university
   │     ├─ Verifies they own the lab
   │     ├─ Verifies quotation is "pending"
   │     ├─ Updates quotation.status = "accepted"
   │     ├─ Creates Procurement record
   │     │  ├─ labProjectId
   │     │  ├─ quotationId
   │     │  ├─ selectedVendorIds: [vendorId]
   │     │  ├─ finalCost (total price)
   │     │  └─ acceptedComponents: all components
   │     │
   │     └─ Updates LabProject.status = "approved"
   │
   ├─ Partial acceptance: Accept selected components only
   │  ├─ POST /api/quotation-system/quotations/{id}/accept
   │  │  └─ { 
   │  │      acceptanceType: "partial",
   │  │      componentIndexes: [0, 2, 3]  // Selected component indices
   │  │    }
   │  │
   │  └─ Backend processes same as above, but with selected components only
   │
   └─ Success: Quotation moves to Procurement phase

Key Features:
├─ Best quotation automatically highlighted
├─ Category-based comparison (not name-based)
├─ Component names still visible
├─ Clear "Not included" indicators
├─ Full/partial acceptance options
└─ Procurement record created for next phase
```

---

### Workflow 3: Quotation Lifecycle States

```
Quotation State Diagram:

                    [PENDING]
                   /         \
                  /           \
            UPDATED BY      ACCEPTED BY
            VENDOR         UNIVERSITY
            (PUT)           (POST)
              |               |
              v               v
            [PENDING] ──→  [ACCEPTED]
                            |
                            └──→ Moves to Procurement Phase

Status Transitions:
├─ draft → pending (when first submitted)
├─ pending → pending (when vendor updates)
├─ pending → accepted (when university accepts)
└─ accepted → (locked, cannot change)

Constraints:
├─ Only vendors can create/update quotations
├─ Only pending quotations can be updated
├─ Only pending quotations can be accepted
├─ Accepted quotations are locked
└─ One quotation per vendor per lab
```

---

## API Endpoints

### Authentication Required (All Endpoints)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/quotation-system/labs` | vendor, university | Get accessible labs |
| GET | `/api/quotation-system/labs/:id` | vendor, university | Get lab details |
| GET | `/api/quotation-system/labs/:id/quotations` | vendor, university | Get quotations for lab |
| POST | `/api/quotation-system/quotations` | vendor | Create new quotation |
| GET | `/api/quotation-system/quotations/my` | vendor | Get vendor's quotations |
| GET | `/api/quotation-system/quotations/:id` | vendor, university | Get quotation details |
| PUT | `/api/quotation-system/quotations/:id` | vendor | Update quotation |
| POST | `/api/quotation-system/quotations/:id/accept` | university | Accept quotation |

### Request/Response Examples

#### 1. GET /api/quotation-system/labs

**Request**:
```javascript
headers: {
  Authorization: 'Bearer {JWT_TOKEN}'
}
```

**Response (Vendor)**:
```json
[
  {
    "_id": "lab123",
    "labName": "AI and Machine Learning Lab",
    "labType": "AI",
    "status": "bidding",
    "requirements": {
      "mainRequirement": "High-performance ML training systems",
      "systems": 10,
      "budgetMin": 500000,
      "budgetMax": 1000000,
      "performancePriority": "GPU Performance"
    },
    "universityName": "South East University",
    "minBudget": 500000,
    "maxBudget": 1000000
  }
]
```

**Response (University)**:
```json
[
  {
    "_id": "lab123",
    "labName": "AI and Machine Learning Lab",
    "labType": "AI",
    "status": "bidding",
    "quotationCount": 2,
    "requirements": {...},
    "universityName": "South East University"
  }
]
```

---

#### 2. POST /api/quotation-system/quotations

**Request**:
```json
{
  "labProjectId": "lab123",
  "components": [
    {
      "category": "CPU",
      "name": "Intel Xeon Platinum 8380",
      "unitPrice": 15000,
      "quantity": 10,
      "warranty": "3 years",
      "deliveryTime": "2 weeks"
    },
    {
      "category": "GPU",
      "name": "NVIDIA A100 80GB",
      "unitPrice": 50000,
      "quantity": 10,
      "warranty": "3 years",
      "deliveryTime": "3 weeks"
    }
  ],
  "totalPrice": 950000,
  "bulkDiscount": 50000,
  "installationIncluded": true,
  "maintenanceIncluded": true
}
```

**Response (201)**:
```json
{
  "message": "Quotation submitted successfully",
  "quotation": {
    "_id": "quot123",
    "labProjectId": "lab123",
    "vendorId": "vendor456",
    "components": [...],
    "totalPrice": 950000,
    "bulkDiscount": 50000,
    "installationIncluded": true,
    "maintenanceIncluded": true,
    "status": "pending",
    "revisionHistory": [],
    "createdAt": "2026-04-16T10:00:00Z"
  }
}
```

---

#### 3. POST /api/quotation-system/quotations/:id/accept

**Request (Full Acceptance)**:
```json
{
  "acceptanceType": "full"
}
```

**Request (Partial Acceptance)**:
```json
{
  "acceptanceType": "partial",
  "componentIndexes": [0, 2]
}
```

**Response (200)**:
```json
{
  "message": "Quotation accepted successfully",
  "procurement": {
    "labProjectId": "lab123",
    "quotationId": "quot123",
    "selectedVendorIds": ["vendor456"],
    "finalCost": 950000,
    "acceptanceType": "full",
    "acceptedComponents": [...],
    "approvedByAdmin": false
  }
}
```

---

## Data Flow Diagrams

### Submit Quotation Flow

```
┌─ Frontend: Vendor ──────────────────────────────────────┐
│                                                          │
│ 1. User fills form:                                     │
│    ├─ Selects lab                                       │
│    ├─ Adds components (name, price, etc.)              │
│    ├─ Sets bulk discount                               │
│    └─ Checks options                                   │
│                                                          │
│ 2. Frontend validation:                                 │
│    └─ All components have name & unitPrice ✓           │
│                                                          │
│ 3. Prepare payload:                                    │
│    {                                                    │
│      labProjectId: "lab123",                            │
│      components: [...valid components],                │
│      totalPrice: 950000,  (calculated)                  │
│      bulkDiscount: 50000,                               │
│      installationIncluded: true                         │
│    }                                                    │
│                                                          │
│ 4. POST /quotations + JWT token                        │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ HTTP POST + JWT in header
                       ↓
┌─ Backend: Node.js/Express ─────────────────────────────┐
│                                                          │
│ 1. authMiddleware:                                      │
│    ├─ Extract JWT from header                          │
│    ├─ Verify signature                                 │
│    └─ Attach user info to req.user ✓                   │
│                                                          │
│ 2. submitQuotation controller:                          │
│    ├─ Check req.user.role === 'vendor'                 │
│    ├─ Validate lab exists                              │
│    ├─ Check no duplicate submission                    │
│    ├─ Normalize component data types                   │
│    ├─ Validate all components have name & price        │
│    ├─ Calculate total if not provided                  │
│    ├─ Create Quotation document in MongoDB             │
│    └─ Return 201 ✓                                      │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ Success Response
                       ↓
┌─ Frontend: Success ─────────────────────────────────────┐
│                                                          │
│ 1. Show success message                                │
│ 2. Refresh quotation list                              │
│ 3. Clear form                                          │
│ 4. Set editingQuotationId for future updates           │
│                                                          │
└────────────────────────────────────────────────────────┘
```

---

### Accept Quotation Flow

```
┌─ Frontend: University ──────────────────────────────────┐
│                                                          │
│ 1. View quotations for selected lab                    │
│    ├─ See vendor names and prices                      │
│    ├─ Identify best quotation (lowest price)           │
│    └─ Decide to accept one                             │
│                                                          │
│ 2. Choose acceptance type:                              │
│    ├─ FULL: Accept all components                      │
│    └─ PARTIAL: Select specific components              │
│                                                          │
│ 3. POST /quotations/:id/accept + JWT token            │
│    {                                                    │
│      acceptanceType: "full"|"partial",                  │
│      componentIndexes: [0,1,2]  (if partial)           │
│    }                                                    │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ HTTP POST + JWT
                       ↓
┌─ Backend: MongoDB/Express ─────────────────────────────┐
│                                                          │
│ 1. authMiddleware: Verify JWT ✓                        │
│                                                          │
│ 2. acceptQuotation controller:                          │
│    ├─ Check req.user.role === 'university'             │
│    ├─ Fetch quotation with relations                   │
│    ├─ Verify university owns this lab                  │
│    ├─ Verify quotation status === 'pending'            │
│    │                                                    │
│    ├─ IF acceptanceType === 'full':                    │
│    │  └─ acceptedComponents = all components            │
│    │                                                    │
│    ├─ IF acceptanceType === 'partial':                 │
│    │  ├─ Get componentIndexes from request              │
│    │  ├─ Filter to selected components                 │
│    │  └─ acceptedComponents = filtered                 │
│    │                                                    │
│    ├─ Calculate finalCost from accepted components    │
│    │                                                    │
│    ├─ Update Quotation:                                │
│    │  ├─ status = 'accepted'                           │
│    │  ├─ Add to revisionHistory                        │
│    │  └─ Save ✓                                         │
│    │                                                    │
│    ├─ Create/Update Procurement:                        │
│    │  ├─ labProjectId: from quotation                  │
│    │  ├─ quotationId: this quotation                   │
│    │  ├─ selectedVendorIds: [vendor._id]               │
│    │  ├─ finalCost: calculated                         │
│    │  ├─ acceptanceType: full/partial                  │
│    │  ├─ acceptedComponents: selected                  │
│    │  └─ Save ✓                                         │
│    │                                                    │
│    ├─ Update LabProject:                                │
│    │  └─ status = 'approved'                           │
│    │                                                    │
│    └─ Return 200 with procurement details ✓            │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ Success Response
                       ↓
┌─ Frontend: Success ─────────────────────────────────────┐
│                                                          │
│ 1. Show success message                                │
│ 2. Update UI:                                          │
│    ├─ Mark quotation as "accepted"                    │
│    ├─ Disable other quotations for this lab            │
│    └─ Refresh list                                    │
│                                                          │
│ 3. Optional: Navigate to procurement page              │
│                                                          │
└────────────────────────────────────────────────────────┘

Side Effects in Database:
├─ Quotation.status: pending → accepted
├─ Quotation.revisionHistory: added entry
├─ Procurement: created/updated
└─ LabProject.status: bidding → approved
```

---

### Quotation Comparison Flow

```
┌─ Frontend: University ──────────────────────────────────┐
│                                                          │
│ 1. In QuotationSystem page:                             │
│    ├─ See quotations from multiple vendors              │
│    ├─ Check 2 quotations for comparison                │
│    └─ Click "Compare" button                           │
│                                                          │
│ 2. Frontend prepares comparison data:                   │
│    {                                                    │
│      selectedLab: {...lab details},                    │
│      quotations: [quotation1, quotation2]              │
│    }                                                    │
│                                                          │
│ 3. Store in sessionStorage + navigate to CompareQuotation
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ↓
┌─ CompareQuotation Component ────────────────────────────┐
│                                                          │
│ 1. Retrieve comparison data from:                       │
│    ├─ Navigation state (location.state)                │
│    └─ sessionStorage (if page refreshed)               │
│                                                          │
│ 2. Display quotation info cards:                        │
│    ├─ Vendor 1 name + email + total price              │
│    └─ Vendor 2 name + email + total price              │
│                                                          │
│ 3. Process components:                                  │
│    ├─ Extract all components from both quotations      │
│    ├─ GROUP BY CATEGORY (not name):                    │
│    │  {                                                │
│    │    category: "CPU",                               │
│    │    components: {                                  │
│    │      vendor1._id: {component details},            │
│    │      vendor2._id: {component details}             │
│    │    }                                              │
│    │  }                                                │
│    │                                                    │
│    └─ Creates rows with same categories from each     │
│       vendor for easy comparison                      │
│                                                          │
│ 4. Render comparison table:                             │
│    ├─ Rows = component categories (CPU, GPU, RAM)      │
│    ├─ Columns = vendors (Quotation 1, Quotation 2)     │
│    └─ Cells = component details (name, price, warranty)
│       or "Not included"                                │
│                                                          │
└─ Display Example:                                       ├─────────────────────────────────────────────────┤
│                                                          │
│ Category │ Vendor 1 (Star)      │ Vendor 2 (TechLand)   │
│ ─────────┼──────────────────────┼────────────────────── │
│ CPU      │ Intel Xeon Platinum  │ AMD EPYC 7003        │
│          │ $15,000/unit         │ $14,000/unit         │
│          │ 3 years warranty     │ 3 years warranty     │
│ ─────────┼──────────────────────┼────────────────────── │
│ GPU      │ NVIDIA A100 80GB     │ NVIDIA H100 80GB     │
│          │ $50,000/unit         │ $55,000/unit         │
│          │ 3 years warranty     │ 3 years warranty     │
│ ─────────┼──────────────────────┼────────────────────── │
│ RAM      │ DDR4 64GB ECC        │ DDR4 64GB ECC        │
│          │ $8,000/unit          │ $7,500/unit          │
│          │ 5 years warranty     │ 5 years warranty     │
│ ─────────┼──────────────────────┼────────────────────── │
│ Storage  │ NVMe SSD 2TB         │ NVMe SSD 2TB         │
│          │ $25,000/unit         │ $23,000/unit         │
│          │ 5 years warranty     │ 5 years warranty     │
│                                                          │
│ TOTAL: $950,000 - $50k discount  │ $920,000 - $40k discount
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

This quotation system provides a complete procurement workflow where:

1. **Universities** create lab projects with specifications and budgets
2. **Vendors** discover available labs and submit competitive quotations with detailed component specifications
3. **Universities** compare quotations side-by-side (grouped by component category) and make informed purchasing decisions
4. **System** handles acceptance (full/partial), creates procurement records, and manages the entire quotation lifecycle

The system is built with:
- **Role-based access control** ensuring vendors and universities see appropriate data
- **Robust validation** at both frontend and backend
- **Component-level flexibility** allowing partial acceptance of quotations
- **Clear comparison tools** for evaluating competing vendor proposals
- **Audit trails** with revision history for transparency

---

## Additional Resources

- **MongoDB Connection**: Uses Atlas cloud database
- **JWT Authentication**: Token-based security with expiration
- **RESTful API**: Follows HTTP standards for CRUD operations
- **Responsive UI**: Material Icons and Tailwind CSS for modern design
- **Error Handling**: Comprehensive error messages at each step
