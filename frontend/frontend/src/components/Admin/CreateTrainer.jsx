import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTrainer } from "../../features/auth/authApi";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Alert, Image } from 'react-bootstrap';
import { PersonAdd } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateTrainer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { user, accessToken, isAuthenticated } = useSelector((state) => state.auth);

  // Check authentication status and redirect if needed
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      navigate("/login");
    } else if (user && user.user_type !== "admin") {
      navigate("/");
    }
  }, [isAuthenticated, accessToken, user, navigate]);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    specialization: Yup.string().required("Specialization is required"),
    profile_img: Yup.mixed()
      .nullable()
      .test("fileType", "Only image files are allowed", (value) => {
        if (!value) return true; // Allow null (optional)
        return ["image/jpeg", "image/png", "image/gif"].includes(value.type);
      })
      .test("fileSize", "File size too large (max 5MB)", (value) => {
        if (!value) return true; // Allow null (optional)
        return value.size <= 5 * 1024 * 1024; // 5MB
      }),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    setError(null);
    try {
      // Create FormData object to handle file upload
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("specialization", values.specialization);
      if (values.profile_img) {
        formData.append("profile_img", values.profile_img);
      }

      const result = await dispatch(createTrainer(formData));

      if (createTrainer.fulfilled.match(result)) {
        setSuccess(true);
        setTempPassword(result.payload.temp_password);
        setImagePreview(null);
        resetForm();
      } else if (createTrainer.rejected.match(result)) {
        setError(result.payload);
        if (result.payload?.includes("No access token") || result.payload?.includes("Authentication failed")) {
          navigate('/login');
        }
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Render nothing until authentication is confirmed
  if (!isAuthenticated || !accessToken) {
    return null;
  }

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Create Trainer</h3>
        <div className="d-flex align-items-center">
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#7747ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white' }}>A</span>
          </div>
          <div className="ms-2 text-white">
            Admin User
          </div>
        </div>
      </header>

      <Row className="justify-content-center">
        <Col md={8}>
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Header className="d-flex align-items-center" style={{ backgroundColor: '#162040', border: 'none' }}>
              <div className="me-3" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(119, 71, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PersonAdd color="#7747ff" size={20} />
              </div>
              <h5 className="text-white mb-0">Create New Trainer Account</h5>
            </Card.Header>
            <Card.Body>
              {success && (
                <Alert variant="success" style={{ backgroundColor: 'rgba(25, 135, 84, 0.2)', borderColor: '#198754', color: '#9ff5c9' }}>
                  <h5 className="mb-2">Trainer Created Successfully!</h5>
                  <p className="mb-2">
                    Temporary password: <strong>{tempPassword}</strong>
                  </p>
                  <p className="mb-0">
                    Please provide this password to the trainer. They will be required to change it on first login.
                  </p>
                </Alert>
              )}

              {error && (
                <Alert variant="danger" style={{ backgroundColor: 'rgba(220, 53, 69, 0.2)', borderColor: '#dc3545', color: '#f8d7da' }}>
                  {error}
                </Alert>
              )}

              <Formik
                initialValues={{
                  email: "",
                  first_name: "",
                  last_name: "",
                  specialization: "",
                  profile_img: null,
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, setFieldValue }) => (
                  <Form>
                    <div className="mb-3">
                      <label htmlFor="profile_img" className="form-label text-white">
                        Profile Image (Optional)
                      </label>
                      <input
                        type="file"
                        name="profile_img"
                        id="profile_img"
                        accept="image/*"
                        className="form-control"
                        style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
                        onChange={(event) => {
                          const file = event.currentTarget.files[0];
                          setFieldValue("profile_img", file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setImagePreview(reader.result);
                            reader.readAsDataURL(file);
                          } else {
                            setImagePreview(null);
                          }
                        }}
                      />
                      <ErrorMessage
                        name="profile_img"
                        component="div"
                        className="text-danger small mt-1"
                      />
                      {imagePreview && (
                        <div className="mt-2">
                          <Image
                            src={imagePreview}
                            alt="Profile Preview"
                            rounded
                            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label text-white">
                        Email Address
                      </label>
                      <Field
                        type="email"
                        name="email"
                        id="email"
                        className="form-control"
                        style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="first_name" className="form-label text-white">
                        First Name
                      </label>
                      <Field
                        type="text"
                        name="first_name"
                        id="first_name"
                        className="form-control"
                        style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
                      />
                      <ErrorMessage
                        name="first_name"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="last_name" className="form-label text-white">
                        Last Name
                      </label>
                      <Field
                        type="text"
                        name="last_name"
                        id="last_name"
                        className="form-control"
                        style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
                      />
                      <ErrorMessage
                        name="last_name"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="specialization" className="form-label text-white">
                        Specialization
                      </label>
                      <Field
                        type="text"
                        name="specialization"
                        id="specialization"
                        className="form-control"
                        style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
                      />
                      <ErrorMessage
                        name="specialization"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>

                    <div className="d-grid">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          backgroundColor: '#7747ff',
                          border: 'none',
                          padding: '10px 0'
                        }}
                      >
                        {isSubmitting ? "Creating..." : "Create Trainer"}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateTrainer;