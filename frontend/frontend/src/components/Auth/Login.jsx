import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authApi";
import { useNavigate } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

const Login = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required")
      .transform(value => value?.toLowerCase().trim()),
    password: Yup.string()
      .required("Password is required"),
  });

  const handleLogin = async (values) => {
    setLoading(true);
    setError(null);
    
    const normalizedEmail = values.email.toLowerCase().trim();
    try {
      const resultAction = await dispatch(loginUser({
        email: normalizedEmail,
        password: values.password
      }));
      
      if (loginUser.fulfilled.match(resultAction)) {
        setLoginSuccess(true);
      } else {
        const errorMessage = resultAction.payload || "Incorrect email or password";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    let navigationTimer = null;
    
    if (isAuthenticated && user && loginSuccess) {
      navigationTimer = setTimeout(() => {
        if (user.user_type === "admin") {
          navigate("/Admin/AdminHome");
        } else if (user.user_type === "trainer") {
          if (user.requires_password_reset) {
            navigate("/reset-password", { 
              state: { 
                fromLogin: true,
                message: "Please set a new password for your account"
              } 
            });
          } else {
            navigate("/Trainer/TrainerHome");
          }
        } else if (user.user_type === "member") {
          navigate("/");
        } else {
          navigate("/"); // Fallback
        }
      }, 1500);
    }
    return () => {
      if (navigationTimer) clearTimeout(navigationTimer);
    };
  }, [isAuthenticated, user, loginSuccess, navigate]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <div style={{ 
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
        padding: 0 
      }}></div>
      <div style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "100%", 
        backgroundColor: "rgba(0, 0, 0, 0.75)", 
        zIndex: -1 
      }}></div>
      <div className="d-flex justify-content-center align-items-center w-100 h-100" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-white p-4 rounded w-100" style={{ 
          maxWidth: "400px", 
          background: "rgba(0, 0, 0, 0.7)", 
          border: "1px solid rgba(30, 30, 30, 0.5)" 
        }}>
          <h2 className="text-center mb-4 fw-bold" style={{ fontSize: "2rem" }}>Login</h2>
          {error && <div className="alert alert-danger text-center">{error}</div>}
          {loginSuccess && (
            <div className="alert text-center" style={{ 
              backgroundColor: "rgba(0, 255, 0, 0.2)", 
              color: "#00ff00", 
              border: "1px solid #00ff00", 
              borderRadius: "4px", 
              padding: "10px", 
              marginBottom: "15px" 
            }}>
              Logged in successfully! Redirecting...
            </div>
          )}
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleLogin}
          >
            <Form>
              <div className="mb-3">
                <label htmlFor="email" className="form-label text-white mb-2">Email Address</label>
                <Field 
                  type="email" 
                  name="email" 
                  id="email" 
                  className="form-control bg-transparent text-white" 
                  style={{ 
                    borderRadius: "4px", 
                    border: "1px solid #00ff00", 
                    padding: "10px 12px" 
                  }} 
                  placeholder="your.email@example.com" 
                />
                <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="form-label text-white mb-2">Password</label>
                <Field 
                  type="password" 
                  name="password" 
                  id="password" 
                  className="form-control bg-transparent text-white" 
                  style={{ 
                    borderRadius: "4px", 
                    border: "1px solid #00ff00", 
                    padding: "10px 12px" 
                  }} 
                />
                <ErrorMessage name="password" component="div" className="text-danger small mt-1" />
              </div>
              <button 
                type="submit" 
                className="btn w-100 py-2 mb-3" 
                disabled={loading || loginSuccess} 
                style={{ 
                  backgroundColor: "#00ff00", 
                  color: "#000", 
                  fontWeight: "bold", 
                  borderRadius: "4px", 
                  border: "none" 
                }}
              >
                {loading ? "Logging in..." : loginSuccess ? "Success!" : "Login"}
              </button>
            </Form>
          </Formik>
          <div className="text-center">
            <p className="mb-2">
              Don't have an account? <span 
                onClick={() => navigate("/register")} 
                style={{ color: "#00ff00", fontWeight: "bold", cursor: "pointer" }}
              >Sign Up</span>
            </p>
            <p className="mb-0">
              Forgot password? <span 
                onClick={() => navigate("/forgot-password")} 
                style={{ color: "#00ff00", fontWeight: "bold", cursor: "pointer" }}
              >Reset Password</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;