import express from "express";
import User from "../models/User";
import Loan from "../models/Loan";
import { protect, allowRoles } from "../middleware/auth";

const router = express.Router();

// Sales dashboard — users who registered but haven't applied yet
router.get(
  "/leads",
  protect,
  allowRoles("admin", "sales"),
  async (req, res) => {
    const allBorrowers = await User.find({ role: "borrower" });
    const loansExist = await Loan.distinct("borrowerId");
    const leads = allBorrowers.filter(
      (u) => !loansExist.map(String).includes(String(u._id)),
    );
    res.json(leads);
  },
);

router.get("/", protect, allowRoles("admin"), async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

export default router;
