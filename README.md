# LMS - CreditSea Assignment

## Setup & Run

### Backend
cd backend
npm install
npm run seed
npm run dev

### Frontend
cd frontend
npm install
npm run dev

## Seed Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.com | Admin@123 |
| Sales | sales@lms.com | Sales@123 |
| Sanction | sanction@lms.com | Sanction@123 |
| Disbursement | disburse@lms.com | Disburse@123 |
| Collection | collection@lms.com | Collection@123 |
| Borrower | borrower@lms.com | Borrower@123 |

## Tech Stack
- Backend: Node.js, Express, TypeScript, MongoDB
- Frontend: Next.js, TypeScript, Tailwind CSS
- Auth: JWT + bcrypt
- Deploy: Render (backend) + Vercel (frontend)

## Architecture
- RBAC middleware protects all routes
- BRE engine validates: age (23-50), salary (≥25k), PAN format, employment
- Loan FSM: applied → sanctioned → disbursed → closed (or rejected)
- Simple Interest: (P × R × T) / (365 × 100)