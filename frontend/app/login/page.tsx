"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      document.cookie = `token=${res.data.token}; path=/; max-age=604800`;
      const role = res.data.user.role;
      if (role === "borrower") router.push("/apply");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">
          CreditSea LMS
        </h1>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Login</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input
          className="w-full border rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative mb-4">
          <input
            className="w-full border rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-center text-sm mt-4 text-gray-500">
          No account?{" "}
          <a href="/signup" className="text-green-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
