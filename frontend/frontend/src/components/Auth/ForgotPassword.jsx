// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Formik, Field, Form, ErrorMessage } from "formik";
// import * as Yup from "yup";
// import axios from "axios";

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// const ForgotPassword = () => {
//   const [step, setStep] = useState(1); // 1: Email input, 2: OTP verification, 3: Password reset
//   const [email, setEmail] = useState("");
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   // Validation schemas for each step
//   const emailSchema = Yup.object({
//     email: Yup.string()
//       .email("Invalid email address")
//       .required("Email is required")
//       .transform(value => value?.toLowerCase().trim()),
//   });

//   const otpSchema = Yup.object({
//     otp_code: Yup.string()
//       .required("OTP code is required")
//       .matches(/^\d{6}$/, "OTP must be 6 digits"),
//   });

//   const passwordSchema = Yup.object({
//     new_password: Yup.string()
//       .min(8, "Password must be at least 8 characters")
//       .required("New password is required"),
//     confirm_password: Yup.string()
//       .oneOf([Yup.ref('new_password'), null], "Passwords must match")
//       .required("Confirm password is required"),
//   });

//   // Handle email submission
//   const handleEmailSubmit = async (values) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await axios.post(`${API_URL}/api/forgot-password/request/`, {
//         email: values.email,
//       });
//       setEmail(values.email);
//       setSuccess(response.data.message);
//       setStep(2);
//     } catch (err) {
//       setError(err.response?.data?.error || "An error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle OTP verification
//   const handleOTPSubmit = async (values) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await axios.post(`${API_URL}/api/forgot-password/verify-otp/`, {
//         email,
//         otp_code: values.otp_code,
//       });
//       setSuccess(response.data.message);
//       setStep(3);
//     } catch (err) {
//       setError(err.response?.data?.error || "An error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle password reset
//   const handlePasswordSubmit = async (values) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await axios.post(`${API_URL}/api/forgot-password/reset/`, {
//         email,
//         new_password: values.new_password,
//         confirm_password: values.confirm_password,
//       });
//       setSuccess(response.data.message);
//       setTimeout(() => navigate("/login"), 2000);
//     } catch (err) {
//       setError(err.response?.data?.error || "An error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
//       <div style={{ 
//         backgroundImage: "url('/bgimgg.jpg')", 
//         backgroundSize: "cover", 
//         backgroundPosition: "center", 
//         backgroundRepeat: "no-repeat", 
//         position: "fixed", 
//         top: 0, 
//         left: 0, 
//         right: 0, 
//         bottom: 0, 
//         width: "100vw", 
//         height: "100vh", 
//         overflow: "auto", 
//         margin: 0, 
//         padding: 0 
//       }}></div>
//       <div style={{ 
//         position: "absolute", 
//         top: 0, 
//         left: 0, 
//         width: "100%", 
//         height: "100%", 
//         backgroundColor: "rgba(0, 0, 0, 0.75)", 
//         zIndex: -1 
//       }}></div>
//       <div className="d-flex justify-content-center align-items-center w-100 h-100" style={{ position: "relative", zIndex: 1 }}>
//         <div className="text-white p-4 rounded w-100" style={{ 
//           maxWidth: "400px", 
//           background: "rgba(0, 0, 0, 0.7)", 
//           border: "1px solid rgba(30, 30, 30, 0.5)" 
//         }}>
//           <h2 className="text-center mb-4 fw-bold" style={{ fontSize: "2rem" }}>
//             {step === 1 ? "Forgot Password" : step === 2 ? "Verify OTP" : "Reset Password"}
//           </h2>
          
//           {error && <div className="alert alert-danger text-center">{error}</div>}
//           {success && (
//             <div className="alert text-center" style={{ 
//               backgroundColor: "rgba(0, 255, 0, 0.2)", 
//               color: "#00ff00", 
//               border: "1px solid #00ff00", 
//               borderRadius: "4px", 
//               padding: "10px", 
//               marginBottom: "15px" 
//             }}>
//               {success}
//             </div>
//           )}

//           {step === 1 && (
//             <Formik
//               initialValues={{ email: "" }}
//               validationSchema={emailSchema}
//               onSubmit={handleEmailSubmit}
//             >
//               <Form>
//                 <div className="mb-3">
//                   <label htmlFor="email" className="form-label text-white mb-2">Email Address</label>
//                   <Field 
//                     type="email" 
//                     name="email" 
//                     id="email" 
//                     className="form-control bg-transparent text-white" 
//                     style={{ 
//                       borderRadius: "4px", 
//                       border: "1px solid #00ff00", 
//                       padding: "10px 12px" 
//                     }} 
//                     placeholder="your.email@example.com" 
//                   />
//                   <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
//                 </div>
//                 <button 
//                   type="submit" 
//                   className="btn w-100 py-2 mb-3" 
//                   disabled={loading} 
//                   style={{ 
//                     backgroundColor: "#00ff00", 
//                     color: "#000", 
//                     fontWeight: "bold", 
//                     borderRadius: "4px", 
//                     border: "none" 
//                   }}
//                 >
//                   {loading ? "Sending..." : "Send OTP"}
//                 </button>
//                 <div className="text-center">
//                   <p className="mb-0">
//                     Back to <span 
//                       onClick={() => navigate("/login")} 
//                       style={{ color: "#00ff00", fontWeight: "bold", cursor: "pointer" }}
//                     >Login</span>
//                   </p>
//                 </div>
//               </Form>
//             </Formik>
//           )}

//           {step === 2 && (
//             <Formik
//               initialValues={{ otp_code: "" }}
//               validationSchema={otpSchema}
//               onSubmit={handleOTPSubmit}
//             >
//               <Form>
//                 <div className="mb-3">
//                   <label htmlFor="otp_code" className="form-label text-white mb-2">OTP Code</label>
//                   <Field 
//                     type="text" 
//                     name="otp_code" 
//                     id="otp_code" 
//                     className="form-control bg-transparent text-white" 
//                     style={{ 
//                       borderRadius: "4px", 
//                       border: "1px solid #00ff00", 
//                       padding: "10px 12px" 
//                     }} 
//                     placeholder="Enter 6-digit OTP" 
//                   />
//                   <ErrorMessage name="otp_code" component="div" className="text-danger small mt-1" />
//                 </div>
//                 <button 
//                   type="submit" 
//                   className="btn w-100 py-2 mb-3" 
//                   disabled={loading} 
//                   style={{ 
//                     backgroundColor: "#00ff00", 
//                     color: "#000", 
//                     fontWeight: "bold", 
//                     borderRadius: "4px", 
//                     border: "none" 
//                   }}
//                 >
//                   {loading ? "Verifying..." : "Verify OTP"}
//                 </button>
//                 <div className="text-center">
//                   <p className="mb-0">
//                     Back to <span 
//                       onClick={() => {
//                         setStep(1);
//                         setError(null);
//                         setSuccess(null);
//                       }} 
//                       style={{ color: "#00ff00", fontWeight: "bold", cursor: "pointer" }}
//                     >Email Input</span>
//                   </p>
//                 </div>
//               </Form>
//             </Formik>
//           )}

//           {step === 3 && (
//             <Formik
//               initialValues={{ new_password: "", confirm_password: "" }}
//               validationSchema={passwordSchema}
//               onSubmit={handlePasswordSubmit}
//             >
//               <Form>
//                 <div className="mb-3">
//                   <label htmlFor="new_password" className="form-label text-white mb-2">New Password</label>
//                   <Field 
//                     type="password" 
//                     name="new_password" 
//                     id="new_password" 
//                     className="form-control bg-transparent text-white" 
//                     style={{ 
//                       borderRadius: "4px", 
//                       border: "1px solid #00ff00", 
//                       padding: "10px 12px" 
//                     }} 
//                   />
//                   <ErrorMessage name="new_password" component="div" className="text-danger small mt-1" />
//                 </div>
//                 <div className="mb-3">
//                   <label htmlFor="confirm_password" className="form-label text-white mb-2">Confirm Password</label>
//                   <Field 
//                     type="password" 
//                     name="confirm_password" 
//                     id="confirm_password" 
//                     className="form-control bg-transparent text-white" 
//                     style={{ 
//                       borderRadius: "4px", 
//                       border: "1px solid #00ff00", 
//                       padding: "10px 12px" 
//                     }} 
//                   />
//                   <ErrorMessage name="confirm_password" component="div" className="text-danger small mt-1" />
//                 </div>
//                 <button 
//                   type="submit" 
//                   className="btn w-100 py-2 mb-3" 
//                   disabled={loading} 
//                   style={{ 
//                     backgroundColor: "#00ff00", 
//                     color: "#000", 
//                     fontWeight: "bold", 
//                     borderRadius: "4px", 
//                     border: "none" 
//                   }}
//                 >
//                   {loading ? "Resetting..." : "Reset Password"}
//                 </button>
//                 <div className="text-center">
//                   <p className="mb-0">
//                     Back to <span 
//                       onClick={() => navigate("/login")} 
//                       style={{ color: "#00ff00", fontWeight: "bold", cursor: "pointer" }}
//                     >Login</span>
//                   </p>
//                 </div>
//               </Form>
//             </Formik>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ForgotPassword;


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email input, 2: OTP verification, 3: Password reset
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // Timer for resend OTP cooldown
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Validation schemas for each step
  const emailSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required")
      .transform(value => value?.toLowerCase().trim()),
  });

  const otpSchema = Yup.object({
    otp_code: Yup.string()
      .required("OTP code is required")
      .matches(/^\d{6}$/, "OTP must be 6 digits"),
  });

  const passwordSchema = Yup.object({
    new_password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("New password is required"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref('new_password'), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  // Handle email submission
  const handleEmailSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/forgot-password/request/`, {
        email: values.email,
      });
      setEmail(values.email);
      setSuccess(response.data.message);
      setStep(2);
      setResendTimer(60); // Start 60-second cooldown
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/forgot-password/verify-otp/`, {
        email,
        otp_code: values.otp_code,
      });
      setSuccess(response.data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/forgot-password/reset/`, {
        email,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      setSuccess(response.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setResendLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/forgot-password/resend-otp/`, {
        email,
      });
      setSuccess(response.data.message);
      setResendTimer(60); // Reset cooldown
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setResendLoading(false);
    }
  };

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
          <h2 className="text-center mb-4 fw-bold" style={{ fontSize: "2rem" }}>
            {step === 1 ? "Forgot Password" : step === 2 ? "Verify OTP" : "Reset Password"}
          </h2>
          
          {error && <div className="alert alert-danger text-center">{error}</div>}
          {success && (
            <div className="alert text-center" style={{ 
              backgroundColor: "rgba(0, 255, 0, 0.2)", 
              color: "#00ff00", 
              border: "1px solid #00ff00", 
              borderRadius: "4px", 
              padding: "10px", 
              marginBottom: "15px" 
            }}>
              {success}
            </div>
          )}

          {step === 1 && (
            <Formik
              initialValues={{ email: "" }}
              validationSchema={emailSchema}
              onSubmit={handleEmailSubmit}
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
                <button 
                  type="submit" 
                  className="btn w-100 py-2 mb-3" 
                  disabled={loading} 
                  style={{ 
                    backgroundColor: "#00ff00", 
                    color: "#000", 
                    fontWeight: "bold", 
                    borderRadius: "4px", 
                    border: "none" 
                  }}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
                <div className="text-center">
                  <p className="mb-0">
                    Back to <span 
                      onClick={() => navigate("/login")} 
                      style={{ color: "#00ff00", fontWeight: "bold", cursor: "pointer" }}
                    >Login</span>
                  </p>
                </div>
              </Form>
            </Formik>
          )}

          {step === 2 && (
            <Formik
              initialValues={{ otp_code: "" }}
              validationSchema={otpSchema}
              onSubmit={handleOTPSubmit}
            >
              <Form>
                <div className="mb-3">
                  <label htmlFor="otp_code" className="form-label text-white mb-2">OTP Code</label>
                  <Field 
                    type="text" 
                    name="otp_code" 
                    id="otp_code" 
                    className="form-control bg-transparent text-white" 
                    style={{ 
                      borderRadius: "4px", 
                      border: "1px solid #00ff00", 
                      padding: "10px 12px" 
                    }} 
                    placeholder="Enter 6-digit OTP" 
                  />
                  <ErrorMessage name="otp_code" component="div" className="text-danger small mt-1" />
                </div>
                <button 
                  type="submit" 
                  className="btn w-100 py-2 mb-3" 
                  disabled={loading} 
                  style={{ 
                    backgroundColor: "#00ff00", 
                    color: "#000", 
                    fontWeight: "bold", 
                    borderRadius: "4px", 
                    border: "none" 
                  }}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                
                {/* Resend OTP Button */}
                <div className="text-center mb-3">
                  <button 
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendLoading || resendTimer > 0}
                    className="btn btn-link text-white p-0"
                    style={{ 
                      color: resendTimer > 0 ? "#999" : "#00ff00",
                      textDecoration: "none",
                      fontWeight: "bold",
                      fontSize: "0.9rem"
                    }}
                  >
                    {resendLoading 
                      ? "Resending..." 
                      : resendTimer > 0 
                        ? `Resend OTP in ${resendTimer}s`
                        : "Resend OTP"
                    }
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="mb-0">
                    Back to <span 
                      onClick={() => {
                        setStep(1);
                        setError(null);
                        setSuccess(null);
                        setResendTimer(0);
                      }} 
                      style={{ color: "#00ff00", fontWeight: "bold", cursor: "pointer" }}
                    >Email Input</span>
                  </p>
                </div>
              </Form>
            </Formik>
          )}

          {step === 3 && (
            <Formik
              initialValues={{ new_password: "", confirm_password: "" }}
              validationSchema={passwordSchema}
              onSubmit={handlePasswordSubmit}
            >
              <Form>
                <div className="mb-3">
                  <label htmlFor="new_password" className="form-label text-white mb-2">New Password</label>
                  <Field 
                    type="password" 
                    name="new_password" 
                    id="new_password" 
                    className="form-control bg-transparent text-white" 
                    style={{ 
                      borderRadius: "4px", 
                      border: "1px solid #00ff00", 
                      padding: "10px 12px" 
                    }} 
                  />
                  <ErrorMessage name="new_password" component="div" className="text-danger small mt-1" />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirm_password" className="form-label text-white mb-2">Confirm Password</label>
                  <Field 
                    type="password" 
                    name="confirm_password" 
                    id="confirm_password" 
                    className="form-control bg-transparent text-white" 
                    style={{ 
                      borderRadius: "4px", 
                      border: "1px solid #00ff00", 
                      padding: "10px 12px" 
                    }} 
                  />
                  <ErrorMessage name="confirm_password" component="div" className="text-danger small mt-1" />
                </div>
                <button 
                  type="submit" 
                  className="btn w-100 py-2 mb-3" 
                  disabled={loading} 
                  style={{ 
                    backgroundColor: "#00ff00", 
                    color: "#000", 
                    fontWeight: "bold", 
                    borderRadius: "4px", 
                    border: "none" 
                  }}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
                <div className="text-center">
                  <p className="mb-0">
                    Back to <span 
                      onClick={() => navigate("/login")} 
                      style={{ color: "#00ff00", fontWeight: "bold", cursor: "pointer" }}
                    >Login</span>
                  </p>
                </div>
              </Form>
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


