// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { createTrainer } from "../../features/auth/authApi";
// import { Formik, Form, Field, ErrorMessage } from "formik";
// import * as Yup from "yup";
// import { Container, Row, Col, Card, Button, Alert, Image } from 'react-bootstrap';
// import { PersonAdd } from 'react-bootstrap-icons';
// import 'bootstrap/dist/css/bootstrap.min.css';

// const CreateTrainer = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [success, setSuccess] = useState(false);
//   const [tempPassword, setTempPassword] = useState("");
//   const [error, setError] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const { user, accessToken, isAuthenticated } = useSelector((state) => state.auth);

//   useEffect(() => {
//     if (!isAuthenticated || !accessToken) {
//       navigate("/login");
//     } else if (user && user.user_type !== "admin") {
//       navigate("/");
//     }
//   }, [isAuthenticated, accessToken, user, navigate]);

//   const validationSchema = Yup.object({
//     email: Yup.string()
//       .email("Invalid email address")
//       .required("Email is required"),
//     first_name: Yup.string().required("First name is required"),
//     last_name: Yup.string().required("Last name is required"),
//     specialization: Yup.string().required("Specialization is required"),
//     profile_img: Yup.mixed()
//       .nullable()
//       .test("fileType", "Only image files are allowed (JPEG, PNG, GIF)", (value) => {
//         if (!value) return true;
//         return ["image/jpeg", "image/png", "image/gif"].includes(value.type);
//       })
//       .test("fileSize", "File size too large (max 5MB)", (value) => {
//         if (!value) return true;
//         return value.size <= 5 * 1024 * 1024;
//       }),
//   });

//   const handleSubmit = async (values, { setSubmitting, resetForm }) => {
//     setError(null);
//     try {
//       const formData = new FormData();
//       formData.append("email", values.email);
//       formData.append("first_name", values.first_name);
//       formData.append("last_name", values.last_name);
//       formData.append("specialization", values.specialization);
//       if (values.profile_img) {
//         formData.append("profile_img", values.profile_img);
//       }

//       const result = await dispatch(createTrainer(formData)).unwrap();
//       setSuccess(true);
//       setTempPassword(result.temp_password);
//       setImagePreview(null);
//       resetForm();
//     } catch (error) {
//       setError(error.message || "Failed to create trainer");
//       if (error.message?.includes("No access token") || error.message?.includes("Authentication failed")) {
//         navigate('/login');
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (!isAuthenticated || !accessToken) {
//     return null;
//   }

//   return (
//     <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
//       <header className="d-flex justify-content-between align-items-center mb-4">
//         <h3 className="text-white">Create Trainer</h3>
//         <div className="d-flex align-items-center">
//           <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#7747ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//             <span style={{ color: 'white' }}>A</span>
//           </div>
//           <div className="ms-2 text-white">Admin User</div>
//         </div>
//       </header>

//       <Row className="justify-content-center">
//         <Col md={8}>
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Header className="d-flex align-items-center" style={{ backgroundColor: '#162040', border: 'none' }}>
//               <div className="me-3" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(119, 71, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <PersonAdd color="#7747ff" size={20} />
//               </div>
//               <h5 className="text-white mb-0">Create New Trainer Account</h5>
//             </Card.Header>
//             <Card.Body>
//               {success && (
//                 <Alert variant="success" style={{ backgroundColor: 'rgba(25, 135, 84, 0.2)', borderColor: '#198754', color: '#9ff5c9' }}>
//                   <h5 className="mb-2">Trainer Created Successfully!</h5>
//                   <p className="mb-2">
//                     Temporary password: <strong>{tempPassword}</strong>
//                   </p>
//                   <p className="mb-0">
//                     Please provide this password to the trainer. They will be required to change it on first login.
//                   </p>
//                 </Alert>
//               )}

//               {error && (
//                 <Alert variant="danger" style={{ backgroundColor: 'rgba(220, 53, 69, 0.2)', borderColor: '#dc3545', color: '#f8d7da' }}>
//                   {error}
//                 </Alert>
//               )}

//               <Formik
//                 initialValues={{
//                   email: "",
//                   first_name: "",
//                   last_name: "",
//                   specialization: "",
//                   profile_img: null,
//                 }}
//                 validationSchema={validationSchema}
//                 onSubmit={handleSubmit}
//               >
//                 {({ isSubmitting, setFieldValue }) => (
//                   <Form>
//                     <div className="mb-3">
//                       <label htmlFor="profile_img" className="form-label text-white">
//                         Profile Image (Optional)
//                       </label>
//                       <input
//                         type="file"
//                         name="profile_img"
//                         id="profile_img"
//                         accept="image/*"
//                         className="form-control"
//                         style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
//                         onChange={(event) => {
//                           const file = event.currentTarget.files[0];
//                           setFieldValue("profile_img", file);
//                           if (file) {
//                             const reader = new FileReader();
//                             reader.onload = () => setImagePreview(reader.result);
//                             reader.readAsDataURL(file);
//                           } else {
//                             setImagePreview(null);
//                           }
//                         }}
//                       />
//                       <ErrorMessage
//                         name="profile_img"
//                         component="div"
//                         className="text-danger small mt-1"
//                       />
//                       {imagePreview && (
//                         <div className="mt-2">
//                           <Image
//                             src={imagePreview}
//                             alt="Profile Preview"
//                             rounded
//                             style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
//                           />
//                         </div>
//                       )}
//                     </div>

//                     <div className="mb-3">
//                       <label htmlFor="email" className="form-label text-white">
//                         Email Address
//                       </label>
//                       <Field
//                         type="email"
//                         name="email"
//                         id="email"
//                         className="form-control"
//                         style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
//                       />
//                       <ErrorMessage
//                         name="email"
//                         component="div"
//                         className="text-danger small mt-1"
//                       />
//                     </div>

//                     <div className="mb-3">
//                       <label htmlFor="first_name" className="form-label text-white">
//                         First Name
//                       </label>
//                       <Field
//                         type="text"
//                         name="first_name"
//                         id="first_name"
//                         className="form-control"
//                         style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
//                       />
//                       <ErrorMessage
//                         name="first_name"
//                         component="div"
//                         className="text-danger small mt-1"
//                       />
//                     </div>

//                     <div className="mb-3">
//                       <label htmlFor="last_name" className="form-label text-white">
//                         Last Name
//                       </label>
//                       <Field
//                         type="text"
//                         name="last_name"
//                         id="last_name"
//                         className="form-control"
//                         style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
//                       />
//                       <ErrorMessage
//                         name="last_name"
//                         component="div"
//                         className="text-danger small mt-1"
//                       />
//                     </div>

//                     <div className="mb-4">
//                       <label htmlFor="specialization" className="form-label text-white">
//                         Specialization
//                       </label>
//                       <Field
//                         type="text"
//                         name="specialization"
//                         id="specialization"
//                         className="form-control"
//                         style={{ backgroundColor: '#1a2235', border: '1px solid #2c3344', color: 'white' }}
//                       />
//                       <ErrorMessage
//                         name="specialization"
//                         component="div"
//                         className="text-danger small mt-1"
//                       />
//                     </div>

//                     <div className="d-grid">
//                       <Button
//                         type="submit"
//                         disabled={isSubmitting}
//                         style={{
//                           backgroundColor: '#7747ff',
//                           border: 'none',
//                           padding: '10px 0'
//                         }}
//                       >
//                         {isSubmitting ? "Creating..." : "Create Trainer"}
//                       </Button>
//                     </div>
//                   </Form>
//                 )}
//               </Formik>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default CreateTrainer;



import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createTrainer } from "../../features/auth/authApi";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
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
  const [uploading, setUploading] = useState(false);
  const { user, accessToken, isAuthenticated } = useSelector((state) => state.auth);

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
    first_name: Yup.string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .required("First name is required"),
    last_name: Yup.string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .required("Last name is required"),
    specialization: Yup.string()
      .min(3, "Specialization must be at least 3 characters")
      .max(100, "Specialization must be less than 100 characters")
      .required("Specialization is required"),
    profile_img: Yup.mixed()
      .nullable()
      .test("fileType", "Only image files are allowed (JPEG, PNG, GIF, WebP)", (value) => {
        if (!value) return true;
        return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(value.type);
      })
      .test("fileSize", "File size too large (max 5MB)", (value) => {
        if (!value) return true;
        return value.size <= 5 * 1024 * 1024;
      }),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setFieldError }) => {
    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      // Log the data being sent
      console.log('Submitting trainer data:', {
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        specialization: values.specialization,
        has_profile_img: !!values.profile_img
      });

      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("specialization", values.specialization);
      
      if (values.profile_img) {
        formData.append("profile_img", values.profile_img);
        console.log('Profile image attached:', values.profile_img.name);
      }

      const result = await dispatch(createTrainer(formData)).unwrap();
      
      console.log('Trainer creation result:', result);
      
      setSuccess(true);
      setTempPassword(result.temp_password);
      setImagePreview(null);
      resetForm();
      
      // Auto-scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Create trainer error:', error);
      
      if (error.message?.includes("Email already exists")) {
        setFieldError("email", "This email is already registered");
      } else if (error.message?.includes("No access token")) {
        setError("Authentication failed. Please login again.");
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.message?.includes("Permission denied")) {
        setError("You don't have permission to create trainers. Admin access required.");
      } else {
        setError(error.message || "Failed to create trainer. Please try again.");
      }
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleImageChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    setFieldValue("profile_img", file);
    
    if (file) {
      // Validate file type
      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
        setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
        setImagePreview(null);
        return;
      }
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        setError("Image file size must be less than 5MB");
        setImagePreview(null);
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        setError(null); // Clear any previous errors
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const removeImage = (setFieldValue) => {
    setFieldValue("profile_img", null);
    setImagePreview(null);
    // Clear the file input
    const fileInput = document.getElementById('profile_img');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (!isAuthenticated || !accessToken) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#0c1427' }}>
        <div className="text-center">
          <Spinner animation="border" variant="light" />
          <p className="text-white mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="text-white mb-1">Create New Trainer</h3>
          <p className="text-white-50 mb-0">Add a new trainer to your fitness management system</p>
        </div>
        <div className="d-flex align-items-center">
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#7747ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold' }}>
              {user?.first_name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="ms-2 text-white">
            <small className="d-block">{user?.first_name} {user?.last_name}</small>
            <small className="text-white-50">Admin User</small>
          </div>
        </div>
      </header>

      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
            <Card.Header className="d-flex align-items-center" style={{ backgroundColor: '#162040', border: 'none', borderRadius: '15px 15px 0 0', padding: '20px' }}>
              <div className="me-3" style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'rgba(119, 71, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PersonAdd color="#7747ff" size={24} />
              </div>
              <div>
                <h5 className="text-white mb-1">Trainer Registration</h5>
                <p className="text-white-50 mb-0 small">Fill in the details to create a new trainer account</p>
              </div>
            </Card.Header>
            
            <Card.Body style={{ padding: '30px' }}>
              {success && (
                <Alert variant="success" style={{ backgroundColor: 'rgba(25, 135, 84, 0.15)', borderColor: '#198754', color: '#75b798', borderRadius: '10px' }}>
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#198754', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: '18px' }}>✓</span>
                      </div>
                    </div>
                    <div>
                      <h6 className="mb-2" style={{ color: '#198754' }}>Trainer Created Successfully!</h6>
                      <p className="mb-2">
                        <strong>Temporary Password:</strong> 
                        <code style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '4px 8px', borderRadius: '4px', marginLeft: '8px' }}>
                          {tempPassword}
                        </code>
                      </p>
                      <p className="mb-0 small">
                        Please provide this password to the trainer. They will be required to change it on first login.
                      </p>
                    </div>
                  </div>
                </Alert>
              )}

              {error && (
                <Alert variant="danger" style={{ backgroundColor: 'rgba(220, 53, 69, 0.15)', borderColor: '#dc3545', color: '#f1919a', borderRadius: '10px' }}>
                  <div className="d-flex align-items-center">
                    <div className="me-2">⚠️</div>
                    <div>{error}</div>
                  </div>
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
                {({ isSubmitting, setFieldValue, values }) => (
                  <Form>
                    {/* Profile Image Upload */}
                    <div className="mb-4">
                      <label htmlFor="profile_img" className="form-label text-white mb-2">
                        <strong>Profile Image</strong> <span className="text-white-50">(Optional)</span>
                      </label>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(119, 71, 255, 0.1)',
                            border: '2px dashed rgba(119, 71, 255, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            cursor: 'pointer'
                          }}
                          onClick={() => document.getElementById('profile_img').click()}
                        >
                          {imagePreview ? (
                            <Image
                              src={imagePreview}
                              alt="Profile Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <PersonAdd color="#7747ff" size={30} />
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <input
                            type="file"
                            name="profile_img"
                            id="profile_img"
                            accept="image/*"
                            className="form-control"
                            style={{ 
                              backgroundColor: '#1a2235', 
                              border: '1px solid #2c3344', 
                              color: 'white',
                              borderRadius: '8px'
                            }}
                            onChange={(event) => handleImageChange(event, setFieldValue)}
                          />
                          {imagePreview && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeImage(setFieldValue)}
                              className="mt-2"
                              style={{ borderRadius: '6px' }}
                            >
                              Remove Image
                            </Button>
                          )}
                        </div>
                      </div>
                      <ErrorMessage
                        name="profile_img"
                        component="div"
                        className="text-danger small mt-1"
                      />
                      <small className="text-white-50 mt-1 d-block">
                        Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                      </small>
                    </div>

                    {/* Personal Information */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label htmlFor="first_name" className="form-label text-white">
                          <strong>First Name</strong>
                        </label>
                        <Field
                          type="text"
                          name="first_name"
                          id="first_name"
                          className="form-control"
                          style={{ 
                            backgroundColor: '#1a2235', 
                            border: '1px solid #2c3344', 
                            color: 'white',
                            borderRadius: '8px'
                          }}
                          placeholder="Enter first name"
                        />
                        <ErrorMessage
                          name="first_name"
                          component="div"
                          className="text-danger small mt-1"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="last_name" className="form-label text-white">
                          <strong>Last Name</strong>
                        </label>
                        <Field
                          type="text"
                          name="last_name"
                          id="last_name"
                          className="form-control"
                          style={{ 
                            backgroundColor: '#1a2235', 
                            border: '1px solid #2c3344', 
                            color: 'white',
                            borderRadius: '8px'
                          }}
                          placeholder="Enter last name"
                        />
                        <ErrorMessage
                          name="last_name"
                          component="div"
                          className="text-danger small mt-1"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="email" className="form-label text-white">
                        <strong>Email Address</strong>
                      </label>
                      <Field
                        type="email"
                        name="email"
                        id="email"
                        className="form-control"
                        style={{ 
                          backgroundColor: '#1a2235', 
                          border: '1px solid #2c3344', 
                          color: 'white',
                          borderRadius: '8px'
                        }}
                        placeholder="trainer@example.com"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="specialization" className="form-label text-white">
                        <strong>Specialization</strong>
                      </label>
                      <Field
                        type="text"
                        name="specialization"
                        id="specialization"
                        className="form-control"
                        style={{ 
                          backgroundColor: '#1a2235', 
                          border: '1px solid #2c3344', 
                          color: 'white',
                          borderRadius: '8px'
                        }}
                        placeholder="e.g., Weight Training, Cardio, Yoga, Personal Training"
                      />
                      <ErrorMessage
                        name="specialization"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>

                    <div className="d-grid gap-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting || uploading}
                        style={{
                          backgroundColor: '#7747ff',
                          border: 'none',
                          padding: '12px 0',
                          borderRadius: '10px',
                          fontWeight: '600',
                          fontSize: '16px'
                        }}
                      >
                        {isSubmitting || uploading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {uploading ? "Uploading Image..." : "Creating Trainer..."}
                          </>
                        ) : (
                          "Create Trainer Account"
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() => navigate('/admin/trainers')}
                        disabled={isSubmitting || uploading}
                        style={{
                          borderColor: '#6c757d',
                          color: '#6c757d',
                          padding: '12px 0',
                          borderRadius: '10px',
                          fontWeight: '500'
                        }}
                      >
                        Back to Trainers List
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