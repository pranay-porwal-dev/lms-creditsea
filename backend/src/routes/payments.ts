import express from "express";
import Payment from "../models/Payment";
import Loan from "../models/Loan";
import { protect, allowRoles, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.post(
  "/:loanId",
  protect,
  allowRoles("admin", "collection"),
  async (req: AuthRequest, res) => {
    try {
      const loan = await Loan.findById(req.params.loanId);
      if (!loan) return res.status(404).json({ message: "Loan not found" });
      if (loan.status !== "disbursed")
        return res.status(400).json({ message: "Loan not active" });

      // Server-side validation BEFORE touching database
      const { utrNumber, amount, date } = req.body;
      if (!utrNumber || !utrNumber.trim())
        return res.status(400).json({ message: "UTR number is required" });
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
        return res
          .status(400)
          .json({ message: "Valid payment amount is required" });
      if (!date)
        return res.status(400).json({ message: "Payment date is required" });

      // Date must be after disbursement/creation date
      const paymentDate = new Date(date);
      // Amount validation
      if (parseFloat(amount) > loan.outstanding + 0.01)
        return res.status(400).json({
          message: `Amount exceeds outstanding balance of ₹${loan.outstanding.toFixed(2)}`,
        });

      // Only create payment if ALL validations pass
      const payment = await Payment.create({
        loanId: req.params.loanId as string,
        utrNumber: utrNumber.trim(),
        amount: parseFloat(amount),
        date: paymentDate,
        recordedBy: req.user!.id,
      });

      const newOutstanding =
        Math.round((loan.outstanding - parseFloat(amount)) * 100) / 100;
      const newStatus = newOutstanding <= 0.01 ? "closed" : "disbursed";
      await Loan.findByIdAndUpdate(req.params.loanId, {
        outstanding: Math.max(0, newOutstanding),
        status: newStatus,
      });

      res.status(201).json(payment);
    } catch (err: any) {
      if (err.code === 11000)
        return res
          .status(400)
          .json({ message: "UTR number already used. Enter a different UTR." });
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.get("/:loanId", protect, async (req, res) => {
  const payments = await Payment.find({ loanId: req.params.loanId });
  res.json(payments);
});

export default router;
