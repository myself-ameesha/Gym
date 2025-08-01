import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";

const ResetPassword = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { accessToken, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const initialValues = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const validationSchema = Yup.object({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Please confirm your password"),
  });

  const handleResetPassword = async (values, { setSubmitting }) => {
    try {
      setError(null);
      setSuccess(false);

      // Use the redux thunk action instead of direct axios call
      const result = await dispatch(resetTrainerPassword({
        current_password: values.currentPassword,
        new_password: values.newPassword
      })).unwrap();

      setSuccess(true);
      
      // Wait for 2 seconds to show success message before redirecting
      setTimeout(() => {
        // Redirect based on user type
        if (user && user.user_type) {
          switch (user.user_type) {
            case 'trainer':
              navigate('/TrainerHome');
              break;
            case 'member':
              navigate('/');
              break;
            case 'admin':
              navigate('/AdminHome');
              break;
            default:
              navigate('/MemberDashboard');
          }
        } else {
          navigate('/MemberDashboard');
        }
      }, 2000);
      
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-center">Reset Password</h3>
              {user?.requires_password_reset && (
                <div className="alert alert-info mt-3">
                  You need to reset your temporary password before continuing.
                </div>
              )}
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">Password updated successfully! Redirecting...</div>}
              
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleResetPassword}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <label htmlFor="currentPassword" className="form-label">Current Password</label>
                      <Field name="currentPassword" type="password" className="form-control" />
                      <ErrorMessage name="currentPassword" component="div" className="text-danger" />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <Field name="newPassword" type="password" className="form-control" />
                      <ErrorMessage name="newPassword" component="div" className="text-danger" />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                      <Field name="confirmPassword" type="password" className="form-control" />
                      <ErrorMessage name="confirmPassword" component="div" className="text-danger" />
                    </div>

                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;