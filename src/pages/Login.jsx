import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axiosInstance from "../api/axios";
import { mergeCart } from "../utils/mergeCart";
import { toast } from "react-toastify";


function Login() {
  const [formData, setFormData] = useState({
    username_or_email: "", // Changed from 'email' to match backend
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // console.log(from, "from path");
  // console.log("Full location object:", location);
  // console.log("Location state:", location.state);
  // console.log("From path:", location.state?.from?.pathname);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username_or_email)
      newErrors.username_or_email = "Username or email is required";
    if (!formData.password) newErrors.password = "Password is required";
    return newErrors;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        const response = await axiosInstance.post("/login/", formData);

        // Store tokens and user info in localStorage
        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("refresh_token", response.data.refresh);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Dynamically set Authorization header for all requests
        axiosInstance.interceptors.request.use((config) => {
          const token = localStorage.getItem("access_token");
          if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
          }
          return config;
        });

        // Debug token persistence
        // console.log(
        //   "Stored Access Token:",
        //   localStorage.getItem("access_token")
        // );

        // Merge anonymous cart with user cart
        await mergeCart();

        // Navigate after ensuring tokens are set
        navigate(from, { replace: true });

      } catch (error) {
        if (error.response) {
          if (error.response.status === 401 || 400) {
            setErrors({ general: "Invalid credentials" });
            toast.error("Invalid credentials");
          } else {
            setErrors(error.response.data);
            toast.error(error.response.data.message);
          }
        } else if (error.message) {
          setErrors({ general: "Network error. Please try again." });
          toast.error("Network error. Please try again.");
        } else {
          setErrors({ general: "An unexpected error occurred." });
        }
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h2 className="mb-5 text-center">Login to Your Account</h2>

        {errors.general && (
          <div className="alert alert-danger">{errors.general}</div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-5 shadow rounded-4"
        >
          <div className="mb-3">
            <label htmlFor="username_or_email" className="form-label">
              Username or Email
            </label>
            <input
              type="text"
              className={`form-control ${
                errors.username_or_email ? "is-invalid" : ""
              }`}
              id="username_or_email"
              name="username_or_email"
              value={formData.username_or_email}
              onChange={handleChange}
            />
            {errors.username_or_email && (
              <div className="invalid-feedback">{errors.username_or_email}</div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-3 text-center">
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
