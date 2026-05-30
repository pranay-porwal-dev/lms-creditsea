"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import API from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>(
    {},
  );
  const [paymentData, setPaymentData] = useState<any>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(u);
    if (parsed.role === "borrower") {
      router.push("/apply");
      return;
    }
    setUser(parsed);
    fetchData(parsed.role);
  }, [router]);

  const fetchData = async (role: string) => {
    setLoading(true);
    try {
      if (role === "sales") {
        const res = await API.get("/users/leads");
        setLeads(res.data);
      } else if (role !== "admin") {
        const res = await API.get("/loans");
        setLoans(res.data);
      } else {
        const res = await API.get("/loans");
        setLoans(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string, extra?: any) => {
    setActionLoading(id + action);
    try {
      await API.patch(`/loans/${id}/${action}`, extra || {});
      fetchData(user.role);
    } catch (err: any) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading("");
    }
  };

  const handlePayment = async (loanId: string, outstanding: number) => {
    const pd = paymentData[loanId];

    // Client side validation — show inline error
    if (!pd?.utrNumber?.trim()) {
      setPaymentErrors((prev) => ({
        ...prev,
        [loanId]: "UTR number is required",
      }));
      return;
    }
    if (!pd?.amount || parseFloat(pd.amount) <= 0) {
      setPaymentErrors((prev) => ({
        ...prev,
        [loanId]: "Enter a valid amount",
      }));
      return;
    }
    if (!pd?.date) {
      setPaymentErrors((prev) => ({
        ...prev,
        [loanId]: "Payment date is required",
      }));
      return;
    }
    if (parseFloat(pd.amount) > outstanding) {
      setPaymentErrors((prev) => ({
        ...prev,
        [loanId]: `Amount cannot exceed outstanding ₹${outstanding.toFixed(2)}`,
      }));
      return;
    }

    setPaymentErrors((prev) => ({ ...prev, [loanId]: "" }));
    setActionLoading(loanId + "pay");
    try {
      await API.post(`/payments/${loanId}`, {
        utrNumber: pd.utrNumber.trim(),
        amount: parseFloat(pd.amount),
        date: pd.date,
      });
      setPaymentData((prev: any) => ({ ...prev, [loanId]: {} }));
      fetchData(user.role);
    } catch (err: any) {
      setPaymentErrors((prev) => ({
        ...prev,
        [loanId]: err.response?.data?.message || "Payment failed",
      }));
    } finally {
      setActionLoading("");
    }
  };

  const logout = () => {
    localStorage.clear();
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const statusColor: Record<string, string> = {
    applied: "bg-yellow-100 text-yellow-700",
    sanctioned: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    disbursed: "bg-purple-100 text-purple-700",
    closed: "bg-green-100 text-green-700",
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">CreditSea LMS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm capitalize">
            {user?.name} ({user?.role})
          </span>
          <button
            onClick={logout}
            className="bg-white text-green-700 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* SALES MODULE */}
        {user?.role === "sales" && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">
              Sales — Registered Leads
            </h2>
            {leads.length === 0 ? (
              <p className="text-gray-400">No leads yet.</p>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead: any) => (
                      <tr key={lead._id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{lead.name}</td>
                        <td className="p-3">{lead.email}</td>
                        <td className="p-3">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SANCTION MODULE */}
        {user?.role === "sanction" && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">
              Sanction — Pending Applications
            </h2>
            {loans.length === 0 ? (
              <p className="text-gray-400">No applications pending.</p>
            ) : (
              loans.map((loan: any) => (
                <div
                  key={loan._id}
                  className="bg-white rounded-xl shadow p-5 mb-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {loan.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        PAN: {loan.pan} | Salary: ₹{loan.monthlySalary}
                      </p>
                      <p className="text-sm text-gray-500">
                        Amount: ₹{loan.loanAmount} | Tenure: {loan.tenure} days
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${statusColor[loan.status]}`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAction(loan._id, "sanction")}
                      disabled={actionLoading === loan._id + "sanction"}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      ✓ Sanction
                    </button>
                    <input
                      className="border rounded px-3 py-2 text-sm flex-1"
                      placeholder="Rejection reason"
                      value={rejectReasons[loan._id] || ""}
                      onChange={(e) =>
                        setRejectReasons((prev) => ({
                          ...prev,
                          [loan._id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() =>
                        handleAction(loan._id, "reject", {
                          reason: rejectReasons[loan._id] || "",
                        })
                      }
                      disabled={actionLoading === loan._id + "reject"}
                      className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* DISBURSEMENT MODULE */}
        {user?.role === "disbursement" && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">
              Disbursement — Sanctioned Loans
            </h2>
            {loans.length === 0 ? (
              <p className="text-gray-400">No sanctioned loans.</p>
            ) : (
              loans.map((loan: any) => (
                <div
                  key={loan._id}
                  className="bg-white rounded-xl shadow p-5 mb-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {loan.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Amount: ₹{loan.loanAmount} | Repayment: ₹
                        {loan.totalRepayment?.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Employment: {loan.employmentMode}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${statusColor[loan.status]}`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAction(loan._id, "disburse")}
                    disabled={actionLoading === loan._id + "disburse"}
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Disburse Loan
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* COLLECTION MODULE */}
        {user?.role === "collection" && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">
              Collection — Active Loans
            </h2>
            {loans.length === 0 ? (
              <p className="text-gray-400">No active loans.</p>
            ) : (
              loans.map((loan: any) => (
                <div
                  key={loan._id}
                  className="bg-white rounded-xl shadow p-5 mb-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {loan.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Outstanding: ₹{loan.outstanding?.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Total Repayment: ₹{loan.totalRepayment?.toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${statusColor[loan.status]}`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <input
                      className="border rounded p-2 text-sm"
                      placeholder="UTR Number"
                      value={paymentData[loan._id]?.utrNumber || ""}
                      onChange={(e) =>
                        setPaymentData((prev: any) => ({
                          ...prev,
                          [loan._id]: {
                            ...prev[loan._id],
                            utrNumber: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="border rounded p-2 text-sm"
                      placeholder="Amount (₹)"
                      type="number"
                      value={paymentData[loan._id]?.amount || ""}
                      onChange={(e) =>
                        setPaymentData((prev: any) => ({
                          ...prev,
                          [loan._id]: {
                            ...prev[loan._id],
                            amount: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="border rounded p-2 text-sm"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={paymentData[loan._id]?.date || ""}
                      onChange={(e) =>
                        setPaymentData((prev: any) => ({
                          ...prev,
                          [loan._id]: {
                            ...prev[loan._id],
                            date: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  {paymentErrors[loan._id] && (
                    <p className="text-red-500 text-xs mt-1">
                      {paymentErrors[loan._id]}
                    </p>
                  )}
                  <button
                    onClick={() => handlePayment(loan._id, loan.outstanding)}
                    disabled={actionLoading === loan._id + "pay"}
                    className="mt-3 bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    Record Payment
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ADMIN MODULE */}
        {user?.role === "admin" && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">
              Admin — All Loans
            </h2>
            {loans.length === 0 ? (
              <p className="text-gray-400">No loans yet.</p>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="p-3 text-left">Applicant</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Tenure</th>
                      <th className="p-3 text-left">Outstanding</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan: any) => (
                      <tr key={loan._id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{loan.fullName}</td>
                        <td className="p-3">₹{loan.loanAmount}</td>
                        <td className="p-3">{loan.tenure}d</td>
                        <td className="p-3">₹{loan.outstanding?.toFixed(2)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${statusColor[loan.status]}`}
                          >
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
