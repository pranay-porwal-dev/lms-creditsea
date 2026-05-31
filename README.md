# LMS - CreditSea Assignment

A full-stack Loan Management System built with MERN + Next.js + TypeScript.

## 🚀 Live Demo

- **Frontend:** https://lms-creditsea.vercel.app
- **Backend:** https://lms-creditsea.onrender.com

## 🔑 Test Credentials

| Role         | Email              | Password       |
| ------------ | ------------------ | -------------- |
| Admin        | admin@lms.com      | Admin@123      |
| Sales        | sales@lms.com      | Sales@123      |
| Sanction     | sanction@lms.com   | Sanction@123   |
| Disbursement | disburse@lms.com   | Disburse@123   |
| Collection   | collection@lms.com | Collection@123 |
| Borrower     | borrower@lms.com   | Borrower@123   |

## 🛠 Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB Atlas
- **Auth:** JWT + bcrypt
- **Deploy:** Render (backend) + Vercel (frontend)

## ⚙️ Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run seed           # creates all 6 role accounts
npm run dev            # runs on port 5000
```

### Frontend

```bash
cd frontend
npm install
# create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev            # runs on port 3000
```

## 🏗 Architecture

- **RBAC** — JWT carries role, middleware enforces access per route
- **BRE** — server-side rules: age 23–50, salary ≥₹25k, valid PAN, employed
- **Loan FSM** — applied → sanctioned → disbursed → closed (or rejected)
- **Interest** — Simple Interest: `(P × R × T) / (365 × 100)` at 12% p.a.
- **Payments** — UTR unique constraint, auto-closes loan when outstanding = 0

**RBAC:** Every API route is protected server-side via `allowRoles()` middleware.
Frontend route protection via Next.js middleware + JWT cookie validation.

## 📁 Project Structure

lms-creditsea/
├── backend/ # Express + TypeScript API
│ ├── src/
│ │ ├── models/ # User, Loan, Payment
│ │ ├── routes/ # auth, loans, payments, users
│ │ ├── middleware/ # JWT auth + RBAC
│ │ └── seed.ts
└── frontend/ # Next.js App Router
├── app/
│ ├── login/
│ ├── signup/
│ ├── apply/ # 4-step borrower form
│ └── dashboard/ # role-based operations
└── lib/api.ts

## 📝 .env.example

PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/lms?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
