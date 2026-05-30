import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: { type: String, required: true },
    pan: { type: String, required: true },
    dob: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: {
      type: String,
      enum: ["salaried", "self-employed", "unemployed"],
      required: true,
    },
    loanAmount: { type: Number, required: true },
    tenure: { type: Number, required: true },
    roi: { type: Number, default: 12 },
    totalRepayment: { type: Number, required: true },
    outstanding: { type: Number, required: true },
    salarySlipUrl: { type: String },
    status: {
      type: String,
      enum: ["applied", "sanctioned", "rejected", "disbursed", "closed"],
      default: "applied",
    },
    rejectionReason: { type: String },
    sanctionedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    disbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("Loan", loanSchema);
