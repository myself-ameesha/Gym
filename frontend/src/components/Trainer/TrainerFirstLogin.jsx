import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetTrainerPassword } from "../../features/auth/authApi";
import { useNavigate } from "react-router-dom";

const TrainerFirstLogin = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      // Fix the parameter names to match what the API expects
      await dispatch(resetTrainerPassword({
        new_password: newPassword
        // No need for current_password on first login
      })).unwrap();
      
      setSuccess(true);
      setTimeout(() => navigate("/Trainer/TrainerHome"), 1500);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Password reset failed");
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <div style={{ backgroundImage: "url('/bgimgg.jpg')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", overflow: "auto", margin: 0, padding: 0 }}></div>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.75)", zIndex: -1 }}></div>
      <div className="d-flex justify-content-center align-items-center w-100 h-100" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-white p-4 rounded w-100" style={{ maxWidth: "400px", background: "rgba(0, 0, 0, 0.7)", border: "1px solid rgba(30, 30, 30, 0.5)" }}>
          <h2 className="text-center mb-4 fw-bold" style={{ fontSize: "2rem" }}>Reset Password</h2>
          <p className="text-center mb-4">Please set a new password for your account.</p>
          {error && <div className="alert alert-danger text-center">{error}</div>}
          {success && (
            <div className="alert text-center" style={{ backgroundColor: "rgba(0, 255, 0, 0.2)", color: "#00ff00", border: "1px solid #00ff00", borderRadius: "4px", padding: "10px", marginBottom: "15px" }}>
              Password reset successful! Redirecting...
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="form-label text-white mb-2">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-control bg-transparent text-white"
                style={{ borderRadius: "4px", border: "1px solid #00ff00", padding: "10px 12px" }}
                required
                minLength="8"
              />
              <small className="text-muted">Password must be at least 8 characters</small>
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label text-white mb-2">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-control bg-transparent text-white"
                style={{ borderRadius: "4px", border: "1px solid #00ff00", padding: "10px 12px" }}
                required
              />
            </div>
            
            <button type="submit" className="btn w-100 py-2" style={{ backgroundColor: "#00ff00", color: "#000", fontWeight: "bold", borderRadius: "4px", border: "none" }}>
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrainerFirstLogin;