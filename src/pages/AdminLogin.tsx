import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User, Palette } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  // Check if admin exists on component mount
  useEffect(() => {
    // Skip admin existence check - just show login form
    // Admin already exists with credentials: admin@elouarate.com / Admin123!
    setHasAdmin(true);
    setShowRegister(false);
    setCheckingAdmin(false);
  }, []);

  // Admin registration (disabled - admin already exists)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      "Admin registration is not available. Please use the existing admin account."
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Try to login with the new admin system
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const loginResponse = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.success) {
        // Login successful - store admin data and tokens
        localStorage.setItem("isAdminAuthenticated", "true");
        localStorage.setItem("adminToken", loginData.data.accessToken);
        localStorage.setItem("adminRefreshToken", loginData.data.refreshToken);
        localStorage.setItem("adminUser", JSON.stringify(loginData.data.admin));

        console.log("✅ Admin login successful:", loginData.data.admin);
        navigate("/admin");
      } else {
        // Handle login failure
        if (loginResponse.status === 401) {
          alert(
            loginData.message ||
              "Invalid email or password. Please check your credentials."
          );
        } else {
          alert(loginData.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Admin login error:", error);
      alert("Connection error. Make sure the backend is running on port 3000.");
    }

    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResetMessage("");

    try {
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_BASE}/admin/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResetMessage(
          "Password reset email sent! Check your inbox for instructions."
        );
        setShowForgotPassword(false);
      } else {
        setResetMessage(
          data.message || "Failed to send reset email. Please try again."
        );
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setResetMessage("Connection error. Please try again later.");
    }

    setIsLoading(false);
  };

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_BASE}/admin/2fa/verify-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tempToken: tempToken,
          code: twoFactorCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("isAdminAuthenticated", "true");
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.user));

        console.log("✅ 2FA verification successful:", data.user);
        navigate("/admin");
      } else {
        alert(data.message || "Invalid 2FA code. Please try again.");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      alert("Connection error. Please try again.");
    }

    setIsLoading(false);
  };

  // Removed loading check since we're not checking admin existence

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-400 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Palette className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ELOUARATE ART</h1>
          <p className="text-purple-200">Admin Dashboard Access</p>
        </div>

        {/* Registration/Login Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              {show2FA ? "Two-Factor Authentication" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {show2FA
                ? "Enter the 6-digit code from your authenticator app"
                : "Sign in to access the admin dashboard"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!show2FA ? (
              <div>
                {/* Registration form removed - admin already exists */}
                {showRegister ? (
                  <div>
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-amber-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-amber-800">
                            <strong>First Time Setup:</strong> No admin accounts
                            found. Please create the first admin account to
                            secure your system.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-700">
                          Username
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="username"
                            name="username"
                            type="text"
                            value={registerData.username}
                            onChange={handleRegisterChange}
                            placeholder="admin"
                            className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">
                          Email Address
                        </Label>
                        <div className="relative">
                          <svg
                            className="absolute left-3 top-3 h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                            />
                          </svg>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={registerData.email}
                            onChange={handleRegisterChange}
                            placeholder="admin@elouarate.art"
                            className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            placeholder="Enter secure password (min 8 chars)"
                            className="pl-10 pr-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-gray-700"
                        >
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={registerData.confirmPassword}
                            onChange={handleRegisterChange}
                            placeholder="Confirm your password"
                            className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3"
                        disabled={isLoading}
                      >
                        {isLoading
                          ? "Creating Admin Account..."
                          : "Create Admin Account"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  // Show Login Form if admin exists
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">
                        Email Address
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={credentials.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={credentials.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : showForgotPassword ? (
              // Forgot Password Form
              <div>
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                      <Lock className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Reset Password
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enter your email address and we'll send you a reset link
                    </p>
                  </div>

                  {resetMessage && (
                    <div
                      className={`p-3 rounded-md text-sm ${
                        resetMessage.includes("sent")
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-red-100 text-red-700 border border-red-300"
                      }`}
                    >
                      {resetMessage}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="forgotEmail" className="text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="forgotEmail"
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail("");
                      setResetMessage("");
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              </div>
            ) : (
              <div>
                {/* 2FA Form */}
                <form onSubmit={handle2FAVerification} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                      <Lock className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twoFactorCode" className="text-gray-700">
                      Authentication Code
                    </Label>
                    <Input
                      id="twoFactorCode"
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="000000"
                      className="text-center text-2xl tracking-widest border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      maxLength={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3"
                    disabled={isLoading || twoFactorCode.length !== 6}
                  >
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShow2FA(false);
                      setTwoFactorCode("");
                      setTempToken("");
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-purple-200 text-sm">
          <p>&copy; 2024 ELOUARATE ART. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
