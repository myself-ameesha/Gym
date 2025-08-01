import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { getPublicMembershipPlans } from "../../features/auth/authApi";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { membershipPlans, loading, error: reduxError } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getPublicMembershipPlans())
      .unwrap()
      .catch(error => setApiError({ type: "error", message: error }));
  }, [dispatch]);

  useEffect(() => {
    if (reduxError) {
      setApiError({ type: "error", message: reduxError });
    }
  }, [reduxError]);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required")
      .transform(value => value?.toLowerCase().trim()),
    first_name: Yup.string()
      .required("First name is required")
      .max(30, "First name must be at most 30 characters"),
    last_name: Yup.string()
      .required("Last name is required")
      .max(30, "Last name must be at most 30 characters"),
    date_of_birth: Yup.date()
      .required("Date of Birth is required")
      .max(new Date(), "Date of birth cannot be in the future"),
    phone_number: Yup.string()
      .matches(/^\d{10}$/, "Phone number must be 10 digits")
      .required("Phone number is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[0-9]/, "Password must contain at least one number")
      .required("Password is required"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    user_type: Yup.string()
      .oneOf(["member"], "Only members can register")
      .required("User type is required"),
    membership_plan_id: Yup.number()
      .required("Membership plan is required")
      .min(1, "Please select a valid membership plan"),
    fitness_goal: Yup.string()
      .required("Fitness goal is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        ...values,
        email: values.email.toLowerCase().trim(),
        user_type: "member",
        membership_plan_id: Number(values.membership_plan_id),
        fitness_goal: values.fitness_goal, 
      };
      delete payload.confirm_password;

      console.log("Form values being sent:", payload);

      const API_URL = `${import.meta.env.VITE_API_URL}`;
      const response = await axios.post(`${API_URL}/register/`, payload);
      console.log("Registration successful:", response.data);

      setApiError({ type: "success", message: "Registration successful! Redirecting to login..." });

      setTimeout(() => {
        navigate('/verify-email', { state: { email: values.email } });
      }, 2000);
    } catch (error) {
      console.error("Registration failed:", error);

      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error status:", error.response.status);

        if (error.response.status === 400 && error.response.data.email) {
          setApiError({ type: "error", message: "This email address is already registered." });
        } else if (error.response.status === 400 && error.response.data.error) {
          setApiError({ type: "error", message: error.response.data.error });
        } else {
          setApiError({ type: "error", message: "Registration failed. Please try again." });
        }
      } else if (error.request) {
        setApiError({
          type: "error",
          message: "Cannot connect to server. Please check your connection and try again.",
        });
      } else {
        setApiError({
          type: "error",
          message: "An error occurred during registration. Please try again.",
        });
      }
    } finally {
      setSubmitting(false);
      setIsSubmitting(false);
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
        className="position-relative text-white p-5 rounded shadow-lg w-100"
        style={{
          maxWidth: "550px",
          background: "rgba(0, 0, 0, 0.6)",
          border: "1px solid rgba(0, 255, 0, 0.2)",
          boxShadow: "0px 0px 20px rgba(0, 255, 0, 0.3)",
          marginTop: "580px",
          marginBottom: "80px",
          paddingTop: "30px",
          paddingBottom: "30px",
        }}
      >
        <h2 className="text-center fw-bold mb-4" style={{ color: "#00ff00" }}>Register</h2>

        {apiError && (
          <div
            className={`alert ${apiError.type === "success" ? "alert-success" : "alert-danger"}`}
            role="alert"
          >
            {apiError.message}
          </div>
        )}

        {loading && <p className="text-white text-center">Loading membership plans...</p>}

        <Formik
          initialValues={{
            email: "",
            first_name: "",
            last_name: "",
            date_of_birth: "",
            phone_number: "",
            password: "",
            confirm_password: "",
            user_type: "member",
            membership_plan_id: "",
            fitness_goal: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values }) => (
            <Form>
              {/* Email Field */}
              <div className="mb-3">
                <label htmlFor="email" className="form-label text-white mb-1">Email</label>
                <Field
                  type="email"
                  name="email"
                  id="email"
                  className="form-control bg-transparent text-white"
                  style={{ borderRadius: "10px", border: "1px solid #00ff00", padding: "10px" }}
                  placeholder="your.email@example.com"
                />
                <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
              </div>

              {/* First Name */}
              <div className="mb-3">
                <label htmlFor="first_name" className="form-label text-white mb-1">First Name</label>
                <Field
                  type="text"
                  name="first_name"
                  id="first_name"
                  className="form-control bg-transparent text-white"
                  style={{ borderRadius: "10px", border: "1px solid #00ff00", padding: "10px" }}
                />
                <ErrorMessage name="first_name" component="div" className="text-danger small mt-1" />
              </div>

              {/* Last Name */}
              <div className="mb-3">
                <label htmlFor="last_name" className="form-label text-white mb-1">Last Name</label>
                <Field
                  type="text"
                  name="last_name"
                  id="last_name"
                  className="form-control bg-transparent text-white"
                  style={{ borderRadius: "10px", border: "1px solid #00ff00", padding: "10px" }}
                />
                <ErrorMessage name="last_name" component="div" className="text-danger small mt-1" />
              </div>

              {/* Date of Birth */}
              <div className="mb-3">
                <label htmlFor="date_of_birth" className="form-label text-white mb-1">Date of Birth</label>
                <Field
                  type="date"
                  name="date_of_birth"
                  id="date_of_birth"
                  className="form-control bg-transparent text-white"
                  style={{ borderRadius: "10px", border: "1px solid #00ff00", padding: "10px" }}
                />
                <ErrorMessage name="date_of_birth" component="div" className="text-danger small mt-1" />
              </div>

              {/* Phone Number */}
              <div className="mb-3">
                <label htmlFor="phone_number" className="form-label text-white mb-1">Phone Number</label>
                <Field
                  type="text"
                  name="phone_number"
                  id="phone_number"
                  className="form-control bg-transparent text-white"
                  style={{ borderRadius: "10px", border: "1px solid #00ff00", padding: "10px" }}
                  placeholder="10 digits only"
                />
                <ErrorMessage name="phone_number" component="div" className="text-danger small mt-1" />
              </div>

              {/* Password */}
              <div className="mb-3">
                <label htmlFor="password" className="form-label text-white mb-1">Password</label>
                <Field
                  type="password"
                  name="password"
                  id="password"
                  className="form-control bg-transparent text-white"
                  style={{ borderRadius: "10px", border: "1px solid #00ff00", padding: "10px" }}
                />
                <ErrorMessage name="password" component="div" className="text-danger small mt-1" />
                <small className="text-white-50">
                  Password must be at least 8 characters with uppercase, lowercase, and numbers
                </small>
              </div>

              {/* Confirm Password */}
              <div className="mb-3">
                <label htmlFor="confirm_password" className="form-label text-white mb-1">Confirm Password</label>
                <Field
                  type="password"
                  name="confirm_password"
                  id="confirm_password"
                  className="form-control bg-transparent text-white"
                  style={{ borderRadius: "10px", border: "1px solid #00ff00", padding: "10px" }}
                />
                <ErrorMessage name="confirm_password" component="div" className="text-danger small mt-1" />
              </div>

              {/* Hidden user_type field */}
              <Field type="hidden" name="user_type" id="user_type" value="member" />

              {/* Membership Plan */}
              <div className="mb-3">
                <label htmlFor="membership_plan_id" className="form-label text-white mb-1">Membership Plan</label>
                <Field
                  as="select"
                  name="membership_plan_id"
                  id="membership_plan_id"
                  className="form-select bg-transparent text-white"
                  style={{ borderRadius: "10px", border: "1px solid #00ff00", padding: "10px" }}
                  disabled={loading}
                >
                  <option value="" className="bg-dark">Select Membership Plan</option>
                  {membershipPlans.map(plan => (
                    <option key={plan.id} value={plan.id} className="bg-dark">
                      {plan.name} (${plan.price} for {plan.duration_days} days)
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="membership_plan_id" component="div" className="text-danger small mt-1" />
              </div>

              {/* Fitness Goal */}
              <div className="mb-3">
                <label htmlFor="fitness_goal" className="form-label text-white mb-1">Fitness Goal</label>
                <Field
                  as="select"
                  name="fitness_goal"
                  id="fitness_goal"
                  className="form-select bg-transparent text-white"
                  style={{ borderRadius: "10px", border: "1px solid #00ff00", padding: "10px" }}
                >
                  <option value="" className="bg-dark">Select Goal</option>
                  <option value="weight_loss" className="bg-dark">Weight Loss</option>
                  <option value="weight_gain" className="bg-dark">Weight Gain</option>
                  <option value="general_fitness" className="bg-dark">General Fitness</option>
                </Field>
                <ErrorMessage name="fitness_goal" component="div" className="text-danger small mt-1" />
              </div>

              <button
                type="submit"
                className="btn w-100 py-2 mt-3 text-white"
                style={{ backgroundColor: "#00ff00" }}
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>
            </Form>
          )}
        </Formik>
        <div className="mt-4 text-center">
          <p>
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{ cursor: "pointer", color: "#00ff00", fontWeight: "bold" }}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
