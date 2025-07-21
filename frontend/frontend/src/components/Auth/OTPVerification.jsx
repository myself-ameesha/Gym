import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const email = location.state?.email || new URLSearchParams(location.search).get("email") || "";

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!email) {
      setError("Email is missing. Please go back to login.");
      setIsSubmitting(false);
      return;
    }

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code");
      setIsSubmitting(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const response = await axios.post(`${API_URL}/verify-otp/`, {
        email: email,
        otp_code: otp
      });

      setSuccess("Email verified successfully!");

      if (response.data.requires_payment) {
        setTimeout(() => {
          navigate("/payment", {
            state: {
              email: response.data.email,
              membership_plan_id: response.data.membership_plan_id
            }
          });
        }, 1500);
      } else {
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      setError(error.response?.data?.error || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setSuccess(null);
    setIsResending(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      await axios.post(`${API_URL}/resend-otp/`, { email });
      setSuccess("A new verification code has been sent to your email");
    } catch (error) {
      console.error("Resend OTP failed:", error);
      setError(error.response?.data?.error || "Failed to resend verification code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        backgroundImage: "url('/bgimgg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        overflow: "auto",
        margin: 0,
        padding: 0,
      }}
    >
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-50"></div>
      <div
        className="position-relative text-white p-5 rounded shadow-lg"
        style={{
          maxWidth: "450px",
          background: "rgba(0, 0, 0, 0.6)",
          border: "1px solid rgba(0, 255, 0, 0.2)",
          boxShadow: "0px 0px 20px rgba(0, 255, 0, 0.3)",
        }}
      >
        <h2 className="text-center fw-bold mb-4" style={{ color: "#00ff00" }}>Verify Your Email</h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <p className="text-center">
              We've sent a verification code to: <br />
              <strong>{email}</strong>
            </p>
            <p className="text-center small text-white-50">
              Please check your inbox and enter the 6-digit code below
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="otp" className="form-label text-white mb-2">
              Verification Code
            </label>
            <input
              type="text"
              id="otp"
              className="form-control bg-transparent text-white text-center fs-4 letter-spacing-1"
              style={{ 
                borderRadius: "10px", 
                border: "1px solid #00ff00", 
                padding: "10px",
                letterSpacing: "0.5em"
              }}
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>

          <button
            type="submit"
            className="btn w-100 py-3 mt-3 text-white"
            style={{ backgroundColor: "#00ff00" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </button>

          <div className="mt-4 text-center">
            <p>
              Didn't receive a code?{" "}
              <span
                onClick={handleResendOTP}
                style={{ 
                  cursor: "pointer", 
                  color: "#00ff00", 
                  fontWeight: "bold",
                  textDecoration: "underline" 
                }}
                className={isResending ? "disabled" : ""}
              >
                {isResending ? "Sending..." : "Resend Code"}
              </span>
            </p>
          </div>

          <div className="mt-3 text-center">
            <p>
              <span
                onClick={() => navigate("/login")}
                style={{ 
                  cursor: "pointer", 
                  color: "#00ff00"
                }}
              >
                Back to Login
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;