import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Mail, Lock } from "lucide-react";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/auth/login", formData);

      const token = response.data.token;

      localStorage.setItem("token", token);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err.response?.data?.message ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">

      {/* Left side */}
      <div className="hidden w-1/2 flex-col justify-center px-16 lg:flex">
        <div className="max-w-lg">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Car size={26} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">
                Smart Vehicle
              </h1>
              <p className="text-sm text-slate-400">
                Operations Platform
              </p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight text-white">
            Smart Vehicle Compliance &
            <span className="text-blue-500"> Journey Management</span>
          </h2>

          <p className="mt-5 text-slate-400">
            Monitor vehicle journeys, verification,
            queue operations, bays and service activity
            from one centralized platform.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              "Real-time monitoring",
              "Vehicle verification",
              "Queue management",
              "Service tracking"
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300"
              >
                ✓ {item}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Login side */}
      <div className="flex w-full items-center justify-center bg-slate-50 px-6 lg:w-1/2">

        <div className="w-full max-w-md">

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to access the operations dashboard.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
          >

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Smart Vehicle Operations Platform
          </p>

        </div>
      </div>

    </div>
  );
}