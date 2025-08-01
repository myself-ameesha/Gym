import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createMembershipPlan } from "../../features/auth/authApi";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { CardChecklist } from 'react-bootstrap-icons';

const CreateMembershipPlan = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { user, accessToken, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      navigate("/login");
    } else if (user && user.user_type !== "admin") {
      navigate("/");
    }
  }, [isAuthenticated, accessToken, user, navigate]);

  const validationSchema = Yup.object({
    name: Yup.string().required("Plan name is required"),
    description: Yup.string(),
    price: Yup.number().required("Price is required").min(0, "Price cannot be negative"),
    duration_days: Yup.number().required("Duration is required").min(1, "Duration must be at least 1 day"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setError(null);
    try {
      const result = await dispatch(createMembershipPlan(values)).unwrap();
      setSuccess(true);
      resetForm();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err || "An unexpected error occurred");
      if (err?.includes("No access token") || err?.includes("Authentication failed")) {
        navigate('/login');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !accessToken) return null;

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Create Membership Plan</h3>
        <div className="d-flex align-items-center">
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#7747ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white' }}>A</span>
          </div>
          <div className="ms-2 text-white">Admin User</div>
        </div>
      </header>

      <Row className="justify-content-center">
        <Col md={8}>
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Header className="d-flex align-items-center" style={{ backgroundColor: '#162040', border: 'none' }}>
              <div className="me-3" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(119, 71, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CardChecklist color="#7747ff" size={20} />
              </div>
              <h5 className="text-white mb-0">Create New Membership Plan</h5>
            </Card.Header>
            <Card.Body>
              {success && (
                <Alert variant="success" style={{ backgroundColor: 'rgba(25, 135, 84, 0.2)', borderColor: '#198754', color: '#9ff5c9' }}>
                  Membership plan created successfully!
                </Alert>
              )}
              {error && (
                <Alert variant="danger" style={{ backgroundColor: 'rgba(220, 53, 69, 0.2)', borderColor: '#dc3545', color: '#f8d7da' }}>
                  {error}
                </Alert>
              )}

              <Formik
                initialValues={{ name: "", description: "", price: "", duration_days: "" }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label text-white">Plan Name</label>
                      <Field type="text" name="name" id="name" className="form-control" style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }} />
                      <ErrorMessage name="name" component="div" className="text-danger small mt-1" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="description" className="form-label text-white">Description</label>
                      <Field as="textarea" name="description" id="description" className="form-control" style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }} />
                      <ErrorMessage name="description" component="div" className="text-danger small mt-1" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="price" className="form-label text-white">Price ($)</label>
                      <Field type="number" name="price" id="price" className="form-control" style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }} step="0.01" />
                      <ErrorMessage name="price" component="div" className="text-danger small mt-1" />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="duration_days" className="form-label text-white">Duration (Days)</label>
                      <Field type="number" name="duration_days" id="duration_days" className="form-control" style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }} />
                      <ErrorMessage name="duration_days" component="div" className="text-danger small mt-1" />
                    </div>
                    <div className="d-grid">
                      <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#7747ff', border: 'none', padding: '10px 0' }}>
                        {isSubmitting ? "Creating..." : "Create Membership Plan"}
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

export default CreateMembershipPlan;