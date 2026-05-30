import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    utrNumber: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
