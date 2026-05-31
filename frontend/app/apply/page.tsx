"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import API from "../../lib/api";

const STEPS = ["Personal Info", "Documents", "Loan Details", "Review"];

function ApplyForm({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    pan: "",
    dob: "",
    monthlySalary: "",
    employmentMode: "salaried",
    loanAmount: "50000",
    tenure: "30",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const calcRepayment = () => {
    const p = parseFloat(form.loanAmount) || 0;
    const t = parseFloat(form.tenure) || 0;
    return (p + (p * 12 * t) / (365 * 100)).toFixed(2);
  };

  const validateStep = (): boolean => {
    const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (step === 0) {
      if (!form.fullName.trim()) {
        setError("Full name is required");
        return false;
      }
      if (!PAN_REGEX.test(form.pan)) {
        setError("Invalid PAN. Format: ABCDE1234F");
        return false;
      }
      if (!form.dob) {
        setError("Date of birth is required");
        return false;
      }
      const age = Math.floor(
        (Date.now() - new Date(form.dob).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      );
      if (age < 23 || age > 50) {
        setError("Age must be between 23 and 50");
        return false;
      }
      if (!form.monthlySalary || parseFloat(form.monthlySalary) < 25000) {
        setError("Minimum salary ₹25,000");
        return false;
      }
      if (form.employmentMode === "unemployed") {
        setError("Unemployed applicants not eligible");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        monthlySalary: parseFloat(form.monthlySalary),
        loanAmount: parseFloat(form.loanAmount),
        tenure: parseInt(form.tenure),
      };
      const res = await API.post("/loans", payload);
      if (file && res.data._id) {
        const fd = new FormData();
        fd.append("salarySlip", file);
        await API.post(`/loans/${res.data._id}/upload`, fd);
      }
      onDone();
    } catch (err: any) {
      const msgs = err.response?.data?.errors;
      setError(
        msgs
          ? msgs.join(", ")
          : err.response?.data?.message || "Submission failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ["Personal Info", "Documents", "Loan Details", "Review"];

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-green-700">New Application</h2>
        <button
          onClick={() => onDone()}
          className="text-gray-500 text-sm hover:text-gray-700"
        >
          ← Back
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex justify-between mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${i <= step ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              {i + 1}
            </div>
            <span className="text-xs mt-1 text-gray-500 text-center">{s}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {step === 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 mb-2">
              Personal Information
            </h3>
            <label className="text-sm text-gray-600 font-medium">
              Full Name
            </label>
            <input
              className="w-full border rounded-lg p-3"
              placeholder="e.g. Pranay Porwal"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
            <label className="text-sm text-gray-600 font-medium">
              PAN Number
            </label>
            <input
              className="w-full border rounded-lg p-3"
              placeholder="ABCDE1234F"
              value={form.pan}
              onChange={(e) => update("pan", e.target.value.toUpperCase())}
            />
            <p className="text-xs text-gray-400">
              Format: 5 letters + 4 digits + 1 letter
            </p>
            <label className="text-sm text-gray-600 font-medium">
              Date of Birth
            </label>
            <input
              className="w-full border rounded-lg p-3"
              type="date"
              value={form.dob}
              onChange={(e) => update("dob", e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Age must be between 23 and 50 years
            </p>
            <label className="text-sm text-gray-600 font-medium">
              Monthly Salary (₹)
            </label>
            <input
              className="w-full border rounded-lg p-3"
              type="number"
              placeholder="e.g. 50000"
              value={form.monthlySalary}
              onChange={(e) => update("monthlySalary", e.target.value)}
            />
            <p className="text-xs text-gray-400">Minimum ₹25,000 per month</p>
            <label className="text-sm text-gray-600 font-medium">
              Employment Mode
            </label>
            <select
              className="w-full border rounded-lg p-3"
              value={form.employmentMode}
              onChange={(e) => update("employmentMode", e.target.value)}
            >
              <option value="salaried">Salaried</option>
              <option value="self-employed">Self Employed</option>
              <option value="unemployed">Unemployed</option>
            </select>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 mb-2">
              Upload Documents
            </h3>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 5 * 1024 * 1024) {
                    setError("Max 5MB");
                    return;
                  }
                  setError("");
                  setFile(f);
                }}
              />
              <p className="text-xs text-gray-400 mt-2">
                PDF, JPG, PNG • Max 5MB
              </p>
            </div>
            {file && <p className="text-green-600 text-sm">✓ {file.name}</p>}
            <p className="text-xs text-gray-400">* Optional but recommended</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="font-semibold text-gray-700 mb-2">Loan Details</h3>
            <div>
              <label className="text-sm text-gray-600">
                Loan Amount:{" "}
                <strong>₹{Number(form.loanAmount).toLocaleString()}</strong>
              </label>
              <input
                type="range"
                min="50000"
                max="500000"
                step="5000"
                className="w-full mt-1"
                value={form.loanAmount}
                onChange={(e) => update("loanAmount", e.target.value)}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>₹50,000</span>
                <span>₹5,00,000</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">
                Tenure: <strong>{form.tenure} days</strong>
              </label>
              <input
                type="range"
                min="30"
                max="365"
                step="1"
                className="w-full mt-1"
                value={form.tenure}
                onChange={(e) => update("tenure", e.target.value)}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>30 days</span>
                <span>365 days</span>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="text-gray-600">
                Interest Rate: <strong>12% p.a.</strong>
              </p>
              <p className="text-gray-600">
                Total Repayment: <strong>₹{calcRepayment()}</strong>
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-gray-700 mb-3">Review</h3>
            {[
              ["Full Name", form.fullName],
              ["PAN", form.pan],
              ["DOB", form.dob],
              ["Salary", `₹${form.monthlySalary}`],
              ["Employment", form.employmentMode],
              ["Loan Amount", `₹${Number(form.loanAmount).toLocaleString()}`],
              ["Tenure", `${form.tenure} days`],
              ["Total Repayment", `₹${calcRepayment()}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b pb-1">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6">
          {step > 0 && (
            <button
              onClick={() => {
                setError("");
                setStep((s) => s - 1);
              }}
              className="px-5 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => {
                if (validateStep()) setStep((s) => s + 1);
              }}
              className="ml-auto px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="ml-auto px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoanStatus() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    API.get("/loans/my")
      .then((res) => {
        setLoans(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    applied: "bg-yellow-100 text-yellow-700",
    sanctioned: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    disbursed: "bg-purple-100 text-purple-700",
    closed: "bg-green-100 text-green-700",
  };

  const statusMessage: Record<string, string> = {
    applied: "Your application is under review by our team.",
    sanctioned: "Your loan has been approved! Awaiting disbursement.",
    rejected: "Your application was not approved.",
    disbursed: "Loan disbursed. Please make payments on time.",
    closed: "Loan fully repaid. Thank you!",
  };

  if (applying)
    return (
      <ApplyForm
        onDone={() => {
          setApplying(false);
          setLoading(true);
          API.get("/loans/my").then((res) => {
            setLoans(res.data);
            setLoading(false);
          });
        }}
      />
    );
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">CreditSea LMS</h1>
        <button
          onClick={() => {
            localStorage.clear();
            document.cookie = "token=; path=/; max-age=0";
            router.push("/login");
          }}
          className="bg-white text-green-700 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-700">
            My Loan Applications
          </h2>
          <button
            onClick={() => setApplying(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            + New Application
          </button>
        </div>

        {loading && <p className="text-gray-400">Loading...</p>}

        {!loading && loans.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-500">No applications found.</p>
          </div>
        )}

        {loans.map((loan: any) => (
          <div key={loan._id} className="bg-white rounded-xl shadow p-6 mb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-gray-800 text-lg">
                  ₹{loan.loanAmount?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Tenure: {loan.tenure} days
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor[loan.status]}`}
              >
                {loan.status}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {statusMessage[loan.status]}
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
              <div>
                <p className="text-gray-400">Total Repayment</p>
                <p className="font-semibold">
                  ₹{loan.totalRepayment?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Outstanding</p>
                <p className="font-semibold">₹{loan.outstanding?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-400">Interest Rate</p>
                <p className="font-semibold">12% p.a.</p>
              </div>
              <div>
                <p className="text-gray-400">Employment</p>
                <p className="font-semibold capitalize">
                  {loan.employmentMode}
                </p>
              </div>
            </div>

            {loan.status === "rejected" && loan.rejectionReason && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-600">
                Reason: {loan.rejectionReason}
              </div>
            )}
          </div>
        ))}

        <button
          onClick={() => {
            setLoading(true);
            API.get("/loans/my").then((res) => {
              setLoans(res.data);
              setLoading(false);
            });
          }}
          className="w-full mt-2 border border-green-600 text-green-600 py-2 rounded-lg hover:bg-green-50 text-sm"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) router.push("/login");
  }, [router]);

  return <LoanStatus />;
}
