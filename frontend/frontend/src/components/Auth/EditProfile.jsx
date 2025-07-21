// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { Form, Button, Container, Row, Col, Alert, Card } from 'react-bootstrap';
// import { updateCurrentMember, getCurrentMember } from '../../features/auth/authApi';
// import { clearError } from '../../features/auth/authSlice';

// const EditProfile = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { currentMember, loading, error } = useSelector((state) => state.auth);

//   const [formData, setFormData] = useState({
//     first_name: '',
//     last_name: '',
//     email: '',
//     phone_number: '',
//     date_of_birth: '',
//     fitness_goal: '',
//   });

//   const [formErrors, setFormErrors] = useState({});
//   const [submitError, setSubmitError] = useState(null);

//   useEffect(() => {
//     if (!currentMember) {
//       dispatch(getCurrentMember());
//     } else {
//       setFormData({
//         first_name: currentMember.first_name || '',
//         last_name: currentMember.last_name || '',
//         email: currentMember.email || '',
//         phone_number: currentMember.phone_number || '',
//         date_of_birth: currentMember.date_of_birth
//           ? new Date(currentMember.date_of_birth).toISOString().split('T')[0]
//           : '',
//         fitness_goal: currentMember.fitness_goal || '',
//       });
//     }
//   }, [currentMember, dispatch]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//     setFormErrors({ ...formErrors, [name]: '' });
//   };

//   const validateForm = () => {
//     const errors = {};
//     if (!formData.first_name.trim()) errors.first_name = 'First name is required';
//     if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
//     if (!formData.email.trim()) {
//       errors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       errors.email = 'Email is invalid';
//     }
//     if (formData.phone_number && !/^\+?\d{10,15}$/.test(formData.phone_number)) {
//       errors.phone_number = 'Phone number is invalid';
//     }
//     if (formData.date_of_birth && new Date(formData.date_of_birth) > new Date()) {
//       errors.date_of_birth = 'Date of birth cannot be in the future';
//     }
//     if (
//       formData.fitness_goal &&
//       !['weight_loss', 'weight_gain', 'general_fitness'].includes(formData.fitness_goal)
//     ) {
//       errors.fitness_goal = 'Invalid fitness goal';
//     }
//     return errors;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const errors = validateForm();
//     if (Object.keys(errors).length > 0) {
//       setFormErrors(errors);
//       return;
//     }

//     try {
//       const updatedData = {
//         first_name: formData.first_name,
//         last_name: formData.last_name,
//         email: formData.email,
//         phone_number: formData.phone_number || null,
//         date_of_birth: formData.date_of_birth || null,
//         fitness_goal: formData.fitness_goal || null,
//       };

//       await dispatch(updateCurrentMember({ id: currentMember.id, data: updatedData })).unwrap();
//       navigate('/MemberDashboard');
//     } catch (err) {
//       setSubmitError(err || 'Failed to update profile');
//     }
//   };

//   const handleCancel = () => {
//     dispatch(clearError());
//     navigate('/MemberDashboard');
//   };

//   if (!currentMember && loading) {
//     return (
//       <div style={{ 
//         backgroundColor: '#0c1427', 
//         minHeight: '100vh', 
//         padding: '20px',
//         margin: 0,
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center'
//       }}>
//         <div className="text-center">
//           <div className="spinner-border text-light" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p className="text-white mt-2">Loading profile...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ 
//       backgroundColor: '#0c1427', 
//       minHeight: '100vh', 
//       padding: 0,
//       margin: 0,
//       width: '100%'
//     }}>
//       <Container fluid style={{ padding: '20px', margin: 0 }}>
//         <Row className="justify-content-center" style={{ margin: 0 }}>
//           <Col md={8} lg={6} style={{ padding: '0 15px' }}>
//             <Card style={{ 
//               backgroundColor: '#101c36', 
//               border: 'none', 
//               borderRadius: '10px',
//               boxShadow: 'none'
//             }}>
//               <Card.Body className="p-4">
//                 <h3 className="text-white mb-4">Edit Profile</h3>
//                 {(error || submitError) && (
//                   <Alert variant="danger" onClose={() => { dispatch(clearError()); setSubmitError(null); }} dismissible>
//                     {error || submitError}
//                   </Alert>
//                 )}
//                 <Form onSubmit={handleSubmit}>
//                   <Form.Group className="mb-3" controlId="formFirstName">
//                     <Form.Label className="text-white">First Name</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="first_name"
//                       value={formData.first_name}
//                       onChange={handleChange}
//                       isInvalid={!!formErrors.first_name}
//                       style={{
//                         backgroundColor: '#1a2332',
//                         color: 'white',
//                         border: '1px solid #2d3748',
//                         borderRadius: '5px'
//                       }}
//                     />
//                     <Form.Control.Feedback type="invalid">
//                       {formErrors.first_name}
//                     </Form.Control.Feedback>
//                   </Form.Group>

//                   <Form.Group className="mb-3" controlId="formLastName">
//                     <Form.Label className="text-white">Last Name</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="last_name"
//                       value={formData.last_name}
//                       onChange={handleChange}
//                       isInvalid={!!formErrors.last_name}
//                       style={{
//                         backgroundColor: '#1a2332',
//                         color: 'white',
//                         border: '1px solid #2d3748',
//                         borderRadius: '5px'
//                       }}
//                     />
//                     <Form.Control.Feedback type="invalid">
//                       {formErrors.last_name}
//                     </Form.Control.Feedback>
//                   </Form.Group>

//                   <Form.Group className="mb-3" controlId="formEmail">
//                     <Form.Label className="text-white">Email</Form.Label>
//                     <Form.Control
//                       type="email"
//                       name="email"
//                       value={formData.email}
//                       onChange={handleChange}
//                       isInvalid={!!formErrors.email}
//                       style={{
//                         backgroundColor: '#1a2332',
//                         color: 'white',
//                         border: '1px solid #2d3748',
//                         borderRadius: '5px'
//                       }}
//                     />
//                     <Form.Control.Feedback type="invalid">
//                       {formErrors.email}
//                     </Form.Control.Feedback>
//                   </Form.Group>

//                   <Form.Group className="mb-3" controlId="formPhoneNumber">
//                     <Form.Label className="text-white">Phone Number (Optional)</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="phone_number"
//                       value={formData.phone_number}
//                       onChange={handleChange}
//                       isInvalid={!!formErrors.phone_number}
//                       style={{
//                         backgroundColor: '#1a2332',
//                         color: 'white',
//                         border: '1px solid #2d3748',
//                         borderRadius: '5px'
//                       }}
//                     />
//                     <Form.Control.Feedback type="invalid">
//                       {formErrors.phone_number}
//                     </Form.Control.Feedback>
//                   </Form.Group>

//                   <Form.Group className="mb-3" controlId="formDateOfBirth">
//                     <Form.Label className="text-white">Date of Birth (Optional)</Form.Label>
//                     <Form.Control
//                       type="date"
//                       name="date_of_birth"
//                       value={formData.date_of_birth}
//                       onChange={handleChange}
//                       isInvalid={!!formErrors.date_of_birth}
//                       style={{
//                         backgroundColor: '#1a2332',
//                         color: 'white',
//                         border: '1px solid #2d3748',
//                         borderRadius: '5px'
//                       }}
//                     />
//                     <Form.Control.Feedback type="invalid">
//                       {formErrors.date_of_birth}
//                     </Form.Control.Feedback>
//                   </Form.Group>

//                   <Form.Group className="mb-3" controlId="formFitnessGoal">
//                     <Form.Label className="text-white">Fitness Goal (Optional)</Form.Label>
//                     <Form.Select
//                       name="fitness_goal"
//                       value={formData.fitness_goal}
//                       onChange={handleChange}
//                       isInvalid={!!formErrors.fitness_goal}
//                       style={{
//                         backgroundColor: '#1a2332',
//                         color: 'white',
//                         border: '1px solid #2d3748',
//                         borderRadius: '5px'
//                       }}
//                     >
//                       <option value="">Select Fitness Goal</option>
//                       <option value="weight_loss">Weight Loss</option>
//                       <option value="weight_gain">Weight Gain</option>
//                       <option value="general_fitness">General Fitness</option>
//                     </Form.Select>
//                     <Form.Control.Feedback type="invalid">
//                       {formErrors.fitness_goal}
//                     </Form.Control.Feedback>
//                   </Form.Group>

//                   <div className="d-flex justify-content-between">
//                     <Button 
//                       variant="primary" 
//                       type="submit" 
//                       disabled={loading}
//                       style={{
//                         backgroundColor: '#007bff',
//                         border: 'none',
//                         borderRadius: '5px'
//                       }}
//                     >
//                       {loading ? 'Saving...' : 'Save Changes'}
//                     </Button>
//                     <Button 
//                       variant="secondary" 
//                       onClick={handleCancel}
//                       style={{
//                         backgroundColor: '#6c757d',
//                         border: 'none',
//                         borderRadius: '5px'
//                       }}
//                     >
//                       Cancel
//                     </Button>
//                   </div>
//                 </Form>
//               </Card.Body>
//             </Card>
//           </Col>
//         </Row>
//       </Container>
//     </div>
//   );
// };

// export default EditProfile;



import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Alert, Card } from 'react-bootstrap';
import { updateCurrentMember, getCurrentMember } from '../../features/auth/authApi';
import { clearError } from '../../features/auth/authSlice';

const EditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentMember, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    fitness_goal: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!currentMember) {
      dispatch(getCurrentMember());
    } else {
      setFormData({
        first_name: currentMember.first_name || '',
        last_name: currentMember.last_name || '',
        email: currentMember.email || '',
        phone_number: currentMember.phone_number || '',
        date_of_birth: currentMember.date_of_birth
          ? new Date(currentMember.date_of_birth).toISOString().split('T')[0]
          : '',
        fitness_goal: currentMember.fitness_goal || '',
      });
    }
  }, [currentMember, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field-specific errors when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // First name validation
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      errors.first_name = 'First name must be at least 2 characters long';
    }
    
    // Last name validation
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      errors.last_name = 'Last name must be at least 2 characters long';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone number validation (optional field)
    if (formData.phone_number && formData.phone_number.trim()) {
      const phoneRegex = /^(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
      if (!phoneRegex.test(formData.phone_number)) {
        errors.phone_number = 'Please enter a valid phone number';
      }
    }
    
    // Date of birth validation
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (birthDate > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future';
      } else if (age < 13 || (age === 13 && monthDiff < 0)) {
        errors.date_of_birth = 'You must be at least 13 years old';
      }
    }
    
    // Fitness goal validation
    if (formData.fitness_goal && 
        !['weight_loss', 'weight_gain', 'general_fitness'].includes(formData.fitness_goal)) {
      errors.fitness_goal = 'Please select a valid fitness goal';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    setSubmitError(null);
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const updatedData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        fitness_goal: formData.fitness_goal || null,
      };

      await dispatch(updateCurrentMember({ id: currentMember.id, data: updatedData })).unwrap();
      navigate('/MemberDashboard');
    } catch (err) {
      console.error('Update error:', err);
      
      // Handle server validation errors
      if (err && typeof err === 'object' && err !== null) {
        const serverErrors = {};
        let hasFieldErrors = false;
        
        // Check for field-specific errors
        Object.keys(err).forEach(field => {
          if (Array.isArray(err[field]) && err[field].length > 0) {
            serverErrors[field] = err[field][0]; // Take the first error message
            hasFieldErrors = true;
          } else if (typeof err[field] === 'string' && err[field].trim() !== '') {
            serverErrors[field] = err[field];
            hasFieldErrors = true;
          }
        });
        
        if (hasFieldErrors) {
          setFormErrors(serverErrors);
          // Clear any general error when we have field-specific errors
          setSubmitError(null);
        } else {
          // Handle general error messages
          const generalError = err.detail || 
                             err.message || 
                             (err.non_field_errors && Array.isArray(err.non_field_errors) ? err.non_field_errors[0] : null) ||
                             'Failed to update profile. Please try again.';
          setSubmitError(generalError);
        }
      } else if (typeof err === 'string') {
        setSubmitError(err);
      } else {
        setSubmitError('Failed to update profile. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    dispatch(clearError());
    navigate('/MemberDashboard');
  };

  if (!currentMember && loading) {
    return (
      <div style={{ 
        backgroundColor: '#0c1427', 
        minHeight: '100vh', 
        padding: '20px',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-center">
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#0c1427', 
      minHeight: '100vh', 
      padding: 0,
      margin: 0,
      width: '100%'
    }}>
      <Container fluid style={{ padding: '20px', margin: 0 }}>
        <Row className="justify-content-center" style={{ margin: 0 }}>
          <Col md={8} lg={6} style={{ padding: '0 15px' }}>
            <Card style={{ 
              backgroundColor: '#101c36', 
              border: 'none', 
              borderRadius: '10px',
              boxShadow: 'none'
            }}>
              <Card.Body className="p-4">
                <h3 className="text-white mb-4">Edit Profile</h3>
                
                {/* General error alert */}
                {(error || submitError) && (
                  <Alert variant="danger" onClose={() => { 
                    dispatch(clearError()); 
                    setSubmitError(null); 
                  }} dismissible>
                    {error || submitError}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="formFirstName">
                    <Form.Label className="text-white">First Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      isInvalid={!!formErrors.first_name}
                      style={{
                        backgroundColor: '#1a2332',
                        color: 'white',
                        border: `1px solid ${formErrors.first_name ? '#dc3545' : '#2d3748'}`,
                        borderRadius: '5px'
                      }}
                      placeholder="Enter your first name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.first_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formLastName">
                    <Form.Label className="text-white">Last Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      isInvalid={!!formErrors.last_name}
                      style={{
                        backgroundColor: '#1a2332',
                        color: 'white',
                        border: `1px solid ${formErrors.last_name ? '#dc3545' : '#2d3748'}`,
                        borderRadius: '5px'
                      }}
                      placeholder="Enter your last name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.last_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label className="text-white">Email *</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!formErrors.email}
                      style={{
                        backgroundColor: '#1a2332',
                        color: 'white',
                        border: `1px solid ${formErrors.email ? '#dc3545' : '#2d3748'}`,
                        borderRadius: '5px'
                      }}
                      placeholder="Enter your email address"
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formPhoneNumber">
                    <Form.Label className="text-white">Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      isInvalid={!!formErrors.phone_number}
                      style={{
                        backgroundColor: '#1a2332',
                        color: 'white',
                        border: `1px solid ${formErrors.phone_number ? '#dc3545' : '#2d3748'}`,
                        borderRadius: '5px'
                      }}
                      placeholder="Enter your phone number (optional)"
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.phone_number}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formDateOfBirth">
                    <Form.Label className="text-white">Date of Birth</Form.Label>
                    <Form.Control
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      isInvalid={!!formErrors.date_of_birth}
                      style={{
                        backgroundColor: '#1a2332',
                        color: 'white',
                        border: `1px solid ${formErrors.date_of_birth ? '#dc3545' : '#2d3748'}`,
                        borderRadius: '5px'
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.date_of_birth}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formFitnessGoal">
                    <Form.Label className="text-white">Fitness Goal</Form.Label>
                    <Form.Select
                      name="fitness_goal"
                      value={formData.fitness_goal}
                      onChange={handleChange}
                      isInvalid={!!formErrors.fitness_goal}
                      style={{
                        backgroundColor: '#1a2332',
                        color: 'white',
                        border: `1px solid ${formErrors.fitness_goal ? '#dc3545' : '#2d3748'}`,
                        borderRadius: '5px'
                      }}
                    >
                      <option value="">Select Fitness Goal</option>
                      <option value="weight_loss">Weight Loss</option>
                      <option value="weight_gain">Weight Gain</option>
                      <option value="general_fitness">General Fitness</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {formErrors.fitness_goal}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-flex justify-content-between">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                      style={{
                        backgroundColor: '#007bff',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '10px 20px'
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={handleCancel}
                      style={{
                        backgroundColor: '#6c757d',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '10px 20px'
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EditProfile;


