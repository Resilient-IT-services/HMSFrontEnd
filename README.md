# 🏥 HMS Frontend (Next.js) – Developer README

## 📌 Overview
This repository contains the **Next.js frontend** for the Hospital Management System (HMS).

This is a **role-driven operational system**, not a generic CRUD application. The UI represents real hospital workflows across:
- Reception
- Doctor
- Pharmacy
- Nurse
- Admin

All frontend behavior is strictly aligned with backend contracts defined in:
```
api-docs.json
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
| Admin | Manage hospitals and users assigned to them |
| Super Admin | Global system management |

👉 Every UI must map to a **real-world action**.

---

## 2. API Contract First
- `api-docs.json` = single source of truth
- `src/types/api.ts` = frontend representation of the contract
- No hardcoded APIs
- No assumptions

---

## 3. No Business Logic in UI
Frontend must NEVER:
- Calculate billing [to show ON UI its OK]
- Apply discounts
- Validate medical logic

Backend is the **source of truth for all decisions**.

---

## 4. Current Auth Transport
- Frontend sends requests with credentials (`withCredentials: true`)
- Backend session cookies are supported
- The API client also attaches a bearer token from `localStorage` when one is present
- Auth behavior should stay aligned with `src/services/apiClient.ts`

---

# 🏗️ ARCHITECTURE

## Folder Structure

```
src/
 ├── app/                     # Next.js routing (App Router)
 │    ├── (authenticated)/    # Protected routes
 │    ├── login/              # Auth pages
 │    ├── select-hospital/    # Context selection
 │    └── select-role/        # Role selection
 │
 ├── components/              # UI Components
 │    ├── admin/              # Admin-specific (UserForm, etc.)
 │    ├── reception/          # Reception-specific
 │    └── ui/                 # Shared Design System components
 │
 ├── services/                # API Service Layer (Axios)
 │    ├── authService.ts
 │    ├── userService.ts
 │    ├── doctorService.ts    # New Staff APIs (/staff/doctors)
 │    └── nurseService.ts     # New Staff APIs (/staff/nurses)
 │
 ├── state/                   # Redux Toolkit (Auth, Store)
 ├── theme/                   # Theme Provider & CSS Variables
 ├── hooks/                   # Custom React Hooks
 └── types/                   # TypeScript Definitions (api.ts)
```

---

# 🔁 KEY DATA STRUCTURES (api.ts)

## Role Assignments & Departments
Departments are now managed at the **Role Assignment** level within a membership, not at the user level.

```ts
export interface RoleAssignmentDTO {
  roleCode: string;
  departmentName: string; // Mandatory department for every role
  active: boolean;
  doctorDetails?: DoctorHospitalDetailsDTO;
  nurseDetails?: NurseHospitalDetailsDTO;
  // ... other role-specific details
}

export interface HospitalMembershipDTO {
  hospitalId: string;
  roleAssignments: RoleAssignmentDTO[];
}
```

## Professional Profiles
Staff-specific credentials (education, licenses) are stored in global info objects:
- `DoctorInfo`: Includes `DoctorEducation` (list of qualifications).
- `NurseInfo`: License and certification level.
- `PharmacistInfo`: PCI Registration and qualifications.
- `ReceptionistInfo`: Languages spoken (fluencies) and specialist flags.

---

# 🧩 UI DESIGN GUIDELINES

## Layout Philosophy
- ** Sidebar + Topbar + Content Area **
- Fast interaction > visual beauty
- Minimal clicks
- Clear actions

## Components
- **UserForm.tsx**: Unified form for creating/editing users, managing hospital contracts (roles/departments), and professional profile data.
- **Table.tsx**: Standardized data display with sort/filter.

---

# 🧪 TESTING STRATEGY (MANDATORY 70% COVERAGE)

## 🎯 Goal
Maintain **minimum 70% test coverage** across components and services using Vitest and React Testing Library.

---

# 🚀 RUN

```bash
npm install
npm run dev
```

---

# 🔥 HARD RULES

❌ No business logic in UI  
❌ No direct API calls (use `services/`)  
❌ Do not introduce a second auth flow without updating `src/services/apiClient.ts` and this README  
✔ Role-assignment based departments  
✔ API contract adherence (api-docs.json)  
✔ Mandatory 70% test coverage  

---

# 🤖 FOR CODEX / GEMINI

When fixing issues:
1. Validate against `api-docs.json`.
2. Ensure types in `src/types/api.ts` are updated first.
3. Update Service layer.
4. Implement UI changes using shared components in `src/components/ui/`.
5. add test cases for new code
6. Run `npm run lint` `npm test` and `npn run build` before finishing.
7. max file length 300 lines.

---

# 🧠 FINAL MENTAL MODEL

Backend = Brain  
Frontend = Execution Layer

Frontend must NOT think. It must execute workflows cleanly and predictably.
