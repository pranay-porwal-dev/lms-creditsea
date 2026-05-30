import express from "express";
import multer from "multer";
import Loan from "../models/Loan";
import { protect, allowRoles, AuthRequest } from "../middleware/auth";

const router = express.Router();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, JPG, PNG allowed"));
  },
});

// WHY PAN regex: Indian PAN is always 5 letters + 4 digits + 1 letter
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function runBRE(data: any) {
  const errors: string[] = [];
  const age = Math.floor(
    (Date.now() - new Date(data.dob).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000),
  );
  if (age < 23 || age > 50) errors.push("Age must be between 23 and 50");
  if (data.monthlySalary < 25000)
    errors.push("Monthly salary must be at least ₹25,000");
  if (!PAN_REGEX.test(data.pan)) errors.push("Invalid PAN format");
  if (data.employmentMode === "unemployed")
    errors.push("Unemployed applicants are not eligible");
  return errors;
}

// Borrower applies for loan
router.post(
  "/",
  protect,
  allowRoles("borrower"),
  async (req: AuthRequest, res) => {
    try {
      const breErrors = runBRE(req.body);
      if (breErrors.length > 0)
        return res
          .status(400)
          .json({ message: "BRE failed", errors: breErrors });
      const { loanAmount, tenure } = req.body;
      // Simple Interest = (P × R × T) / (365 × 100)
      const si = (loanAmount * 12 * tenure) / (365 * 100);
      const totalRepayment = loanAmount + si;
      const loan = await Loan.create({
        ...req.body,
        borrowerId: req.user!.id,
        roi: 12,
        totalRepayment,
        outstanding: totalRepayment,
        status: "applied",
      });
      res.status(201).json(loan);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Borrower sees own loans
router.get(
  "/my",
  protect,
  allowRoles("borrower"),
  async (req: AuthRequest, res) => {
    const loans = await Loan.find({ borrowerId: req.user!.id });
    res.json(loans);
  },
);

// Upload salary slip
router.post(
  "/:id/upload",
  protect,
  allowRoles("borrower"),
  (req, res, next) => {
    upload.single("salarySlip")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE")
          return res
            .status(400)
            .json({ message: "File too large. Maximum size is 5MB." });
        return res.status(400).json({ message: err.message });
      }
      Loan.findByIdAndUpdate(req.params.id, {
        salarySlipUrl: (req as any).file?.path,
      })
        .then(() => res.json({ message: "Uploaded" }))
        .catch(() => res.status(500).json({ message: "Upload failed" }));
    });
  },
);

// Get loans by status (dashboard teams use this)
router.get(
  "/",
  protect,
  allowRoles("admin", "sanction", "disbursement", "collection"),
  async (req: AuthRequest, res) => {
    const rawStatus = req.query.status;
    const role = req.user!.role;
    // Each role can only query their relevant status
    const roleStatusMap: Record<string, string> = {
      sanction: "applied",
      disbursement: "sanctioned",
      collection: "disbursed",
    };
    const qStatus =
      typeof rawStatus === "string"
        ? rawStatus
        : Array.isArray(rawStatus)
          ? rawStatus[0]
          : undefined;
    const allowedStatus = role === "admin" ? qStatus : roleStatusMap[role];
    const filter: Record<string, any> = {};
    if (allowedStatus) filter.status = allowedStatus;
    const loans = await Loan.find(filter).populate("borrowerId", "name email");
    res.json(loans);
  },
);

// Sanction
router.patch(
  "/:id/sanction",
  protect,
  allowRoles("admin", "sanction"),
  async (req: AuthRequest, res) => {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: "sanctioned", sanctionedBy: req.user!.id },
      { returnDocument: "after" },
    );
    res.json(loan);
  },
);

// Reject
router.patch(
  "/:id/reject",
  protect,
  allowRoles("admin", "sanction"),
  async (req, res) => {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: req.body.reason },
      { returnDocument: "after" },
    );
    res.json(loan);
  },
);

// Disburse
router.patch(
  "/:id/disburse",
  protect,
  allowRoles("admin", "disbursement"),
  async (req: AuthRequest, res) => {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: "disbursed", disbursedBy: req.user!.id },
      { returnDocument: "after" },
    );
    res.json(loan);
  },
);

export default router;
