import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User";

dotenv.config();
const users = [
  {
    name: "Admin User",
    email: "admin@lms.com",
    password: "Admin@123",
    role: "admin" as const,
  },
  {
    name: "Sales Executive",
    email: "sales@lms.com",
    password: "Sales@123",
    role: "sales" as const,
  },
  {
    name: "Sanction Officer",
    email: "sanction@lms.com",
    password: "Sanction@123",
    role: "sanction" as const,
  },
  {
    name: "Disburse Officer",
    email: "disburse@lms.com",
    password: "Disburse@123",
    role: "disbursement" as const,
  },
  {
    name: "Collection Agent",
    email: "collection@lms.com",
    password: "Collection@123",
    role: "collection" as const,
  },
  {
    name: "Test Borrower",
    email: "borrower@lms.com",
    password: "Borrower@123",
    role: "borrower" as const,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  await User.deleteMany({});
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, password: hashed });
  }
  console.log("✅ Seeded all users");
  console.table(
    users.map((u) => ({ email: u.email, password: u.password, role: u.role })),
  );
  process.exit(0);
}

seed();
