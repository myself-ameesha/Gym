import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner, Image } from 'react-bootstrap';
import { updateTrainer } from '../../features/auth/authApi';

const TrainerEditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentTrainer, loading, error: reduxError } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    specialization: '',
    profile_img: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentTrainer) {
      setFormData({
        first_name: currentTrainer.first_name || '',
        last_name: currentTrainer.last_name || '',
        email: currentTrainer.email || '',
        phone_number: currentTrainer.phone_number || '',
        specialization: currentTrainer.specialization || '',
        profile_img: null,
      });
      // Set initial image preview if trainer has a profile image
      if (currentTrainer.trainer_profile?.profile_img) {
        setImagePreview(currentTrainer.trainer_profile.profile_img);
      }
    } else {
      setError('No trainer data available. Please go back to the dashboard.');
    }
  }, [currentTrainer]);

  useEffect(() => {
    if (reduxError) {
      setError(reduxError);
    }
  }, [reduxError]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_img' && files[0]) {
      setFormData({ ...formData, profile_img: files[0] });
      // Generate image preview
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    try {
      // Create FormData object to handle file upload
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('email', formData.email);
      data.append('phone_number', formData.phone_number);
      data.append('specialization', formData.specialization);
      if (formData.profile_img) {
        data.append('profile_img', formData.profile_img);
      }

      await dispatch(updateTrainer({
        trainerId: currentTrainer.id,
        data,
      })).unwrap();
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        navigate('/Trainer/TrainerDashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0c1427', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginLeft: '150px', padding: '20px', width: 'calc(100% - 250px)' }}>
        <h3 className="text-white mb-4">Edit Profile</h3>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="light" />
            <p className="text-white mt-2">Loading...</p>
          </div>
        ) : (
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white-50">Profile Image</Form.Label>
                      <Form.Control
                        type="file"
                        name="profile_img"
                        accept="image/*"
                        onChange={handleChange}
                        style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
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
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white-50">First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white-50">Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white-50">Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white-50">Phone Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white-50">Specialization</Form.Label>
                      <Form.Control
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                      />
                    </Form.Group>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/trainer/dashboard')}
                    className="me-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    style={{ backgroundColor: '#7747ff', border: 'none' }}
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrainerEditProfile;