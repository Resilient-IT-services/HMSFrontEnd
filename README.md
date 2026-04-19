# 🏥 HMS Frontend (Next.js) – Developer README

## 📌 Overview
This repository contains the **Next.js frontend** for the Hospital Management System (HMS).

This is a **role-driven operational system**, not a generic CRUD application. The UI represents real hospital workflows across:
- Reception
- Doctor
- Pharmacy

All frontend behavior is strictly aligned with backend contracts defined in:
```
{backendURL}/v3/api-docs
```

---

# 🧠 CORE PRINCIPLES (STRICT)

## 1. Role-Driven Design
We DO NOT design screens based on entities.
We design based on **who is doing what**.

| Role | Responsibility |
|------|--------------|
| Receptionist | Manage patients + appointments |
| Doctor | Consultation + prescription |
| Pharmacy | Billing + stock |

👉 Every UI must map to a **real-world action**.

---

## 2. API Contract First
- `apidoc.json` = single source of truth
- No hardcoded APIs
- No assumptions

---

## 3. No Business Logic in UI
Frontend must NEVER:
- Calculate billing
- Apply discounts
- Validate medical logic

Backend is the **source of truth for all decisions**.

---

## 4. Cookie-Based Auth Only
- Backend sets HTTP-only cookies
- Frontend sends requests with credentials

---

# 🏗️ ARCHITECTURE

## Folder Structure

```
src/
 ├── app/                     # Next.js routing
 │    ├── (auth)/
 │    ├── reception/
 │    ├── doctor/
 │    ├── pharmacy/
 │
 ├── modules/                 # BUSINESS LOGIC PER FEATURE
 │    ├── reception/
 │    ├── doctor/
 │    ├── pharmacy/
 │
 ├── services/                # API calls
 ├── components/              # Shared UI
 ├── hooks/
 ├── state/
 ├── utils/
 └── types/
```

---

# 🔁 USER FLOWS (CRITICAL SECTION)

## 👩‍💼 Reception Flow

### 🎯 Goal
Register patient → create appointment → manage status

### Flow
1. Reception opens dashboard
2. Search patient
    - If exists → select
    - If not → register new
3. Create appointment
4. Assign doctor + time
5. Update status later:
    - No-show
    - Delayed
    - Completed

### UI Screens
- Patient Search Screen
- Patient Registration Form
- Appointment Creation Screen
- Appointment List (with actions)

### Key Rules
- No duplicate patient creation
- Status updates must reflect backend state

---

## 🧑‍⚕️ Doctor Flow

### 🎯 Goal
Consult patient → create prescription

### Flow
1. Doctor opens queue
2. Select patient
3. View patient history (if available)
4. Add notes
5. Create prescription
6. Submit

### UI Screens
- Doctor Queue
- Consultation Screen
- Prescription Builder

### Key Rules
- Doctor cannot edit billing
- Prescription must be sent to pharmacy

---

## 💊 Pharmacy Flow

### 🎯 Goal
Generate bill + manage stock

### Flow
1. Pharmacy opens prescriptions queue
2. Select prescription
3. System fetches medicines
4. Generate bill (via backend)
5. Confirm & print
6. Update stock

### UI Screens
- Prescription Queue
- Billing Screen
- Stock Management Screen

### Key Rules
- Billing is backend-driven
- No manual price calculation

---

# 🧩 UI DESIGN GUIDELINES

## Layout Philosophy
- Fast interaction > visual beauty
- Minimal clicks
- Clear actions

## Patterns

### Tables First
Use tables for:
- Appointments
- Patients
- Prescriptions

### Inline Actions
- Edit
- Update status
- View details

### Forms
- Short
- Structured
- No unnecessary validation logic

---

# 🧠 GLOBAL STATE MANAGEMENT (REDUX-STYLE)

## 🎯 Purpose
We maintain a **centralized global state** for:
- Logged-in user info
- User role
- Permissions (derived)

Data source:
```
GET /me
```

---

## 🏗️ Approach
Use a **Redux-style architecture (or Zustand/Redux Toolkit equivalent)** with:

- Single source of truth
- Predictable updates
- No scattered auth/user state

---

## 📦 State Structure

```ts
interface AppState {
  user: {
    id: string
    name: string
    role: 'RECEPTION' | 'DOCTOR' | 'PHARMACY'
  } | null

  isAuthenticated: boolean
}
```

---

## 🔄 Flow

1. App loads
2. Call `/me`
3. Store response in global state
4. Derive role-based access

---

## 🔐 Rules

- `/me` is the ONLY source of user truth
- No hardcoding roles
- No storing user in localStorage

---

## 🧭 Usage

- Route protection
- Conditional rendering
- Module access control

Example:

```ts
if (user.role !== 'DOCTOR') {
  redirect('/unauthorized')
}
```

---

# 📡 API INTEGRATION

## Source
```
{backendURL}/v3/api-docs
```

## Rules
- No API calls inside components
- Use service layer

Example:

```ts
// WRONG
fetch('/api')

// CORRECT
patientService.getPatients()
```

---

# 🔐 AUTH FLOW

1. Login
2. Backend sets cookie
3. Frontend sends cookie automatically

### Error Handling
- 401 → redirect to login
- Session expired → clear state

---

# ⚡ DATA FLOW

## Pattern
UI → Service → API → Response → UI

## Rules
- No transformation logic in UI
- Backend response should be rendered directly

---

# ⚠️ ERROR HANDLING

| Scenario | Handling |
|--------|---------|
| Validation | Inline |
| API error | Toast |
| Network | Retry |

---

# 🧪 TESTING STRATEGY (MANDATORY 70% COVERAGE)

## 🎯 Goal
Maintain **minimum 70% test coverage** across:
- Components
- Hooks
- Services

---

## 🧩 What to Test

### 1. Components
- Rendering correctness
- User interactions
- Conditional UI (role-based)

### 2. Hooks
- State transitions
- Side effects

### 3. Services
- API calls
- Response handling
- Error handling

---

## 🧪 Example Test Cases

### Reception Module
- Create appointment success
- Create appointment failure
- Patient search results

### Doctor Module
- Load queue
- Submit prescription
- Validation errors

### Pharmacy Module
- Load prescription
- Generate bill
- Stock update

---

## ⚠️ Critical Test Areas

- `/me` API handling
- Role-based routing
- Auth failure (401)
- API error states

---

## 🧰 Tools (Suggested)

- Jest
- React Testing Library

---

## 📊 Coverage Rule

- PR should NOT be merged if coverage < 70%

---

# 🚀 RUN

- Components
- Hooks
- Service layer

---

# 🚀 RUN

```
npm install
npm run dev
```

---

# 🔥 HARD RULES

❌ No business logic in UI  
❌ No direct API calls  
❌ No localStorage auth  
❌ No generic CRUD screens

✔ Role-based flows  
✔ API contract adherence  
✔ Clean modular structure

---

# 🤖 FOR CODEX / GEMINI

When fixing issues, follow this order:

1. Check `{backendURL}/v3/api-docs` for apidocs
2. Verify service layer
3. Check module placement
4. Ensure cookie is sent
5. Verify route

Never patch UI blindly.

---

# 🧠 FINAL MENTAL MODEL

Backend = Brain  
Frontend = Execution Layer

Frontend must NOT think.
It must execute workflows cleanly and predictably.


---

# 🤖 AI IMPLEMENTATION RULES (GEMINI / CODEX)

## 🚨 STRICT EXECUTION MODE

You are building a **Next.js frontend for a Hospital Management System**.

This is a **production medical system UI**, not a design playground.

### NON-NEGOTIABLE RULES

- ❌ Do NOT redesign UI
- ❌ Do NOT introduce new layouts
- ❌ Do NOT change spacing, alignment, or structure
- ❌ Do NOT create generic CRUD screens
- ❌ Do NOT add unnecessary animations or styling variations

- ✅ Follow UI patterns EXACTLY as defined below
- ✅ Prefer consistency over creativity
- ✅ Reuse existing components only

---

# 🎨 UI DESIGN CONTRACT (SOURCE OF TRUTH)

All UI must strictly follow the provided reference designs:
- Login Screen
- Admin Dashboard
- User Management
- Create User
- Fee Configuration

These define:
- Layout
- Component structure
- Interaction patterns

---

## 🧱 GLOBAL LAYOUT (MANDATORY)

Every authenticated page MUST follow:

```
[ Sidebar ] [ Topbar ]
             [ Content Area ]
```

### Sidebar
- Fixed left navigation
- Icon + label
- Active item highlighted
- Bottom section:
    - Support
    - Logout

### Topbar
- Page title
- Optional search bar
- Right side:
    - Notifications
    - User profile/avatar

---

## 🧩 COMPONENT RULES

### Cards
Used for:
- Forms
- Sections
- Dashboards

Rules:
- Rounded corners
- Light shadow
- Internal padding
- Title at top

---

### Forms

Structure MUST be:

```
Label
Input
Error (if any)
```

Rules:
- Labels always visible
- Required fields marked with `*`
- Errors shown inline (red text)
- Buttons aligned right

---

### Tables

Used for:
- User Management
- Lists
- Data views

Rules:
- Clean row layout
- Action column (edit/view)
- Status as toggle or badge
- Pagination at bottom

---

### Buttons

Primary:
- Solid (blue)
- Used for main actions (Save, Create)

Secondary:
- Light / ghost
- Used for cancel/back

---

## 🎯 SCREEN-SPECIFIC CONTRACTS

### 🔐 Login Screen
Layout:

```
[ Branding Left ] [ Login Form Right ]
```

- Left: image/gradient + messaging
- Right: login form
- Inline error on invalid credentials

---

### 👥 User Management
- Table inside card
- Top:
    - Search
    - Filters
    - “Create User” button

Columns:
- Name
- Role
- Contact
- Status (toggle)
- Actions (edit)

---

### ➕ Create User
- Form inside card
- Two-column layout

Fields:
- Full Name
- Mobile (unique validation)
- Email (optional)
- Roles (multi-select)

Section:
- Security (toggle: auto password)

Footer:
- Cancel | Save User

---

### 💰 Fee Configuration
Layout:

```
[ Form Left ] [ Live Preview Right ]
```

Fields:
- Doctor (searchable select)
- Consultation Fee
- Follow-up Days

Rules:
- Inline validation
- Live preview updates
- Save → toast success

---

### 📊 Dashboard
- Cards for metrics
- Clean grid layout
- No clutter
- No unnecessary charts

---

## 🔄 INTERACTION RULES

### Feedback
- Success → Toast (bottom-right)
- Error → Inline or toast

### Validation
- Immediate for required fields
- No silent failures

---

## 🧠 STATE & AUTH

- User data MUST come from `/me`
- Role drives UI rendering
- No hardcoded roles
- No localStorage auth

---

## 🧩 COMPONENT REUSE (MANDATORY)

You MUST use existing components:

```
/components/ui/
  Sidebar
  Topbar
  Card
  FormField
  Table
```

❌ Do NOT create new layout systems  
❌ Do NOT duplicate components

---

## 🧪 TESTING REQUIREMENT

- Minimum **70% test coverage**
- Test:
    - Role-based rendering
    - Form validation
    - API error handling
    - `/me` user state

---

## ⚠️ FAILURE CONDITIONS

Your implementation is WRONG if:

- Layout differs from defined structure
- Components are inconsistent across screens
- Business logic is added in frontend
- API calls are made directly in components
- UI deviates from defined patterns

---

## 🧠 FINAL DIRECTIVE

If uncertain:
> Follow existing patterns. Do NOT invent new ones.

Consistency > Creativity

