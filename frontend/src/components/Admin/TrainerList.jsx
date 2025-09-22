// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Card, Button, Table, Modal, Form, Spinner, Alert, Image } from 'react-bootstrap';
// import { People, PersonBadge, PencilSquare, Trash, PlusCircle } from 'react-bootstrap-icons';
// import { Link } from 'react-router-dom';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { getTrainers, updateTrainer, deleteTrainer } from '../../features/auth/authApi';

// const TrainerList = () => {
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [currentTrainer, setCurrentTrainer] = useState(null);
//   const [editForm, setEditForm] = useState({
//     first_name: '',
//     last_name: '',
//     email: '',
//     specialization: '',
//     profile_img: null,
//   });
//   const [imagePreview, setImagePreview] = useState(null);
//   const [error, setError] = useState(null);
//   const [successMessage, setSuccessMessage] = useState('');

//   const dispatch = useDispatch();
//   const { trainers, loading, error: reduxError } = useSelector((state) => state.auth);

//   const getImageUrl = (path) => {
//     if (!path) return null;
//     return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}${path}`;
//   };

//   useEffect(() => {
//     dispatch(getTrainers())
//       .unwrap()
//       .catch(error => setError(error.message || JSON.stringify(error)));
//   }, [dispatch]);

//   useEffect(() => {
//     if (reduxError) setError(reduxError.message || JSON.stringify(reduxError));
//   }, [reduxError]);

//   const handleDeleteClick = (trainer) => {
//     setCurrentTrainer(trainer);
//     setShowDeleteModal(true);
//     setError(null);
//     setSuccessMessage('');
//   };

//   const handleEditClick = (trainer) => {
//     setCurrentTrainer(trainer);
//     setEditForm({
//       first_name: trainer.first_name,
//       last_name: trainer.last_name,
//       email: trainer.email,
//       specialization: trainer.specialization || '',
//       profile_img: null,
//     });
//     setImagePreview(getImageUrl(trainer.trainer_profile?.profile_img) || null);
//     setShowEditModal(true);
//     setError(null);
//     setSuccessMessage('');
//   };

//   const handleDeleteConfirm = async () => {
//     try {
//       await dispatch(deleteTrainer(currentTrainer.id)).unwrap();
//       setShowDeleteModal(false);
//       setSuccessMessage(`Trainer ${currentTrainer.first_name} ${currentTrainer.last_name} deleted successfully.`);
//       setTimeout(() => setSuccessMessage(''), 3000);
//     } catch (err) {
//       setError(err.message || 'Failed to delete trainer. Please try again.');
//       setShowDeleteModal(false);
//     }
//   };

//   const handleEditChange = (e) => {
//     const { name, value, files } = e.target;
//     if (name === 'profile_img' && files[0]) {
//       setEditForm({ ...editForm, profile_img: files[0] });
//       const reader = new FileReader();
//       reader.onload = () => setImagePreview(reader.result);
//       reader.readAsDataURL(files[0]);
//     } else {
//       setEditForm({ ...editForm, [name]: value });
//     }
//   };

//   const handleEditSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const formData = new FormData();
//       formData.append('first_name', editForm.first_name);
//       formData.append('last_name', editForm.last_name);
//       formData.append('email', editForm.email);
//       formData.append('specialization', editForm.specialization);
//       if (editForm.profile_img) {
//         formData.append('profile_img', editForm.profile_img);
//       } else if (editForm.profile_img === '') {
//         formData.append('profile_img', '');
//       }

//       await dispatch(updateTrainer({
//         trainerId: currentTrainer.id,
//         data: formData,
//       })).unwrap();
//       setShowEditModal(false);
//       setSuccessMessage(`Trainer ${editForm.first_name} ${editForm.last_name} updated successfully.`);
//       setTimeout(() => setSuccessMessage(''), 3000);
//       setImagePreview(null);
//     } catch (err) {
//       setError(err.message || JSON.stringify(err) || 'Failed to update trainer. Please try again.');
//     }
//   };

//   const activeTrainerCount = trainers?.filter(trainer => trainer.is_active).length || 0;
//   const inactiveTrainerCount = trainers?.length - activeTrainerCount || 0;

//   return (
//     <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
//       <header className="d-flex justify-content-between align-items-center mb-4">
//         <h3 className="text-white">Trainer Management</h3>
//         <Link to="/Admin/CreateTrainer">
//           <Button
//             variant="primary"
//             style={{ backgroundColor: "#7747ff", border: "none", display: "flex", alignItems: "center", gap: "8px" }}
//           >
//             <PlusCircle size={16} /> Create Trainer
//           </Button>
//         </Link>
//       </header>

//       {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
//       {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}

//       {/* Stats Cards */}
//       <div className="row mb-4">
//         <div className="col-md-4 mb-3">
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body className="d-flex align-items-center">
//               <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(119, 71, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
//                 <People color="#7747ff" size={24} />
//               </div>
//               <div>
//                 <h6 className="text-white-50 mb-1">Total Trainers</h6>
//                 <h3 className="text-white mb-0">{trainers?.length || 0}</h3>
//               </div>
//             </Card.Body>
//           </Card>
//         </div>
//         <div className="col-md-4 mb-3">
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body className="d-flex align-items-center">
//               <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
//                 <People color="#2ecc71" size={24} />
//               </div>
//               <div>
//                 <h6 className="text-white-50 mb-1">Active Trainers</h6>
//                 <h3 className="text-white mb-0">{activeTrainerCount}</h3>
//               </div>
//             </Card.Body>
//           </Card>
//         </div>
//         <div className="col-md-4 mb-3">
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body className="d-flex align-items-center">
//               <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(231, 76, 60, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
//                 <People color="#e74c3c" size={24} />
//               </div>
//               <div>
//                 <h6 className="text-white-50 mb-1">Inactive Trainers</h6>
//                 <h3 className="text-white mb-0">{inactiveTrainerCount}</h3>
//               </div>
//             </Card.Body>
//           </Card>
//         </div>
//       </div>

//       <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//         <Card.Body>
//           <div className="d-flex justify-content-between align-items-center mb-3">
//             <div className="d-flex align-items-center">
//               <div className="me-2" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233, 30, 99, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <PersonBadge color="#e91e63" size={20} />
//               </div>
//               <span className="text-white">Trainer List</span>
//             </div>
//           </div>

//           {loading ? (
//             <div className="text-center my-5">
//               <Spinner animation="border" variant="light" />
//               <p className="text-white mt-2">Loading trainers...</p>
//             </div>
//           ) : trainers?.length === 0 ? (
//             <div className="text-center my-5">
//               <p className="text-white">No trainers found. Create your first trainer to get started.</p>
//               <Link to="/Admin/CreateTrainer">
//                 <Button variant="primary" style={{ backgroundColor: "#7747ff", border: "none" }}>
//                   Create Trainer
//                 </Button>
//               </Link>
//             </div>
//           ) : (
//             <div className="table-responsive">
//               <Table bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
//                 <thead>
//                   <tr>
//                     <th>ID</th>
//                     <th>Profile Picture</th>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Specialization</th>
//                     <th>Status</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {trainers?.map((trainer) => (
//                     <tr key={trainer.id}>
//                       <td>{trainer.id}</td>
//                       <td>
//                         {trainer.trainer_profile?.profile_img ? (
//                           <Image
//                             src={getImageUrl(trainer.trainer_profile.profile_img)}
//                             alt={`${trainer.first_name} ${trainer.last_name}`}
//                             roundedCircle
//                             style={{ width: '40px', height: '40px', objectFit: 'cover' }}
//                             onError={(e) => { e.target.src = '/path/to/fallback-image.png'; }}
//                           />
//                         ) : (
//                           <PersonBadge color="#6c757d" size={24} />
//                         )}
//                       </td>
//                       <td>{trainer.first_name} {trainer.last_name}</td>
//                       <td>{trainer.email}</td>
//                       <td>{trainer.specialization || 'Not Specified'}</td>
//                       <td>
//                         <span className={`badge ${trainer.is_active ? 'bg-success' : 'bg-danger'}`}>
//                           {trainer.is_active ? 'Active' : 'Inactive'}
//                         </span>
//                       </td>
//                       <td>
//                         <Button
//                           variant="outline-info"
//                           size="sm"
//                           className="me-2"
//                           onClick={() => handleEditClick(trainer)}
//                           style={{ borderColor: '#0dcaf0' }}
//                         >
//                           <PencilSquare size={16} />
//                         </Button>
//                         <Button
//                           variant="outline-danger"
//                           size="sm"
//                           onClick={() => handleDeleteClick(trainer)}
//                           style={{ borderColor: '#dc3545' }}
//                         >
//                           <Trash size={16} />
//                         </Button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//             </div>
//           )}
//         </Card.Body>
//       </Card>

//       {/* Delete Confirmation Modal */}
//       <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
//         <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
//           <Modal.Title className="text-white">Confirm Delete</Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
//           Are you sure you want to delete the trainer: <strong>{currentTrainer?.first_name} {currentTrainer?.last_name}</strong>?
//           <p className="text-danger mt-2 mb-0">This action cannot be undone.</p>
//         </Modal.Body>
//         <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
//           <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
//           <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Edit Trainer Modal */}
//       <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
//         <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
//           <Modal.Title className="text-white">Edit Trainer</Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
//           <Form onSubmit={handleEditSubmit}>
//             <Form.Group className="mb-3">
//               <Form.Label>Profile Picture (Optional)</Form.Label>
//               <Form.Control
//                 type="file"
//                 name="profile_img"
//                 accept="image/*"
//                 onChange={handleEditChange}
//                 style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
//               />
//               {imagePreview && (
//                 <div className="mt-2">
//                   <Image
//                     src={imagePreview}
//                     alt="Profile Preview"
//                     rounded
//                     style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
//                   />
//                 </div>
//               )}
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>First Name</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="first_name"
//                 value={editForm.first_name}
//                 onChange={handleEditChange}
//                 style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
//                 required
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Last Name</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="last_name"
//                 value={editForm.last_name}
//                 onChange={handleEditChange}
//                 style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
//                 required
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Email</Form.Label>
//               <Form.Control
//                 type="email"
//                 name="email"
//                 value={editForm.email}
//                 onChange={handleEditChange}
//                 style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
//                 required
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Specialization</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="specialization"
//                 value={editForm.specialization}
//                 onChange={handleEditChange}
//                 style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
//               />
//             </Form.Group>
//             <div className="d-flex justify-content-end gap-2 mt-4">
//               <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
//               <Button variant="primary" type="submit" style={{ backgroundColor: "#7747ff", border: "none" }}>
//                 Save Changes
//               </Button>
//             </div>
//           </Form>
//         </Modal.Body>
//       </Modal>
//     </div>
//   );
// };

// export default TrainerList;

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Spinner, Table, Image, Modal, Form, Badge } from 'react-bootstrap';
import { Person, PersonAdd, PencilSquare, Trash3, Eye } from 'react-bootstrap-icons';
import { getTrainers, deleteTrainer, updateTrainer } from '../../features/auth/authApi';

const TrainerList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trainers, loading, error: reduxError } = useSelector((state) => state.auth);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    specialization: '',
    profile_img: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    dispatch(getTrainers())
      .unwrap()
      .catch(err => {
        console.error('Failed to fetch trainers:', err);
        setError(err.message || 'Failed to fetch trainers');
      });
  }, [dispatch]);

  useEffect(() => {
    if (reduxError) {
      setError(reduxError.message || reduxError.error || 'An error occurred');
    }
  }, [reduxError]);

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // Cloudinary URLs are already complete, return as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // Fallback for any local images
    return imageUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL}${imageUrl}` : imageUrl;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleEditClick = (trainer) => {
    setSelectedTrainer(trainer);
    setEditForm({
      first_name: trainer.first_name || '',
      last_name: trainer.last_name || '',
      email: trainer.email || '',
      phone_number: trainer.phone_number || '',
      specialization: trainer.specialization || '',
      profile_img: null,
    });
    
    // Set image preview if trainer has profile image
    const imageUrl = getImageUrl(trainer.trainer_profile?.profile_img);
    if (imageUrl) {
      setImagePreview(imageUrl);
    } else {
      setImagePreview(null);
    }
    
    setShowEditModal(true);
  };

  const handleDeleteClick = (trainer) => {
    setSelectedTrainer(trainer);
    setShowDeleteModal(true);
  };

  const handleImageClick = (imageUrl) => {
    if (imageUrl) {
      setSelectedImageUrl(imageUrl);
      setShowImageModal(true);
    }
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_img' && files[0]) {
      setEditForm({ ...editForm, profile_img: files[0] });
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(files[0]);
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleRemoveImage = () => {
    setEditForm({ ...editForm, profile_img: '' });
    setImagePreview(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('first_name', editForm.first_name);
      formData.append('last_name', editForm.last_name);
      formData.append('email', editForm.email);
      formData.append('phone_number', editForm.phone_number || '');
      formData.append('specialization', editForm.specialization);
      
      if (editForm.profile_img) {
        formData.append('profile_img', editForm.profile_img);
      } else if (editForm.profile_img === '') {
        formData.append('profile_img', ''); // Handle image removal
      }

      await dispatch(updateTrainer({
        trainerId: selectedTrainer.id,
        data: formData,
      })).unwrap();

      setSuccessMessage('Trainer updated successfully!');
      setShowEditModal(false);
      
      // Refresh trainers list
      dispatch(getTrainers());
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Update trainer error:', err);
      setError(err.message || 'Failed to update trainer');
    }
  };

  const handleDeleteConfirm = async () => {
    setError(null);
    setSuccessMessage('');

    try {
      await dispatch(deleteTrainer(selectedTrainer.id)).unwrap();
      setSuccessMessage('Trainer deleted successfully!');
      setShowDeleteModal(false);
      
      // Refresh trainers list
      dispatch(getTrainers());
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Delete trainer error:', err);
      setError(err.message || 'Failed to delete trainer');
      setShowDeleteModal(false);
    }
  };

  const renderProfileImage = (trainer) => {
    const imageUrl = getImageUrl(trainer.trainer_profile?.profile_img);
    
    return (
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'rgba(119, 71, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(119, 71, 255, 0.2)',
          overflow: 'hidden',
          cursor: imageUrl ? 'pointer' : 'default'
        }}
        onClick={() => imageUrl && handleImageClick(imageUrl)}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${trainer.first_name} ${trainer.last_name}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <Person 
          color="#7747ff" 
          size={24} 
          style={{ display: imageUrl ? 'none' : 'block' }} 
        />
      </div>
    );
  };

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="text-white mb-1">Manage Trainers</h3>
          <p className="text-white-50 mb-0">View, edit, and manage trainer accounts</p>
        </div>
        <Button
          onClick={() => navigate('/Admin/CreateTrainer')}
          style={{ backgroundColor: '#7747ff', border: 'none', borderRadius: '8px' }}
          className="d-flex align-items-center gap-2"
        >
          <PersonAdd size={18} />
          Add New Trainer
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible className="mb-3">
          {successMessage}
        </Alert>
      )}

      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '15px' }}>
        <Card.Header style={{ backgroundColor: '#162040', border: 'none', borderRadius: '15px 15px 0 0' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="me-3" style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                backgroundColor: 'rgba(119, 71, 255, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Person color="#7747ff" size={20} />
              </div>
              <div>
                <h5 className="text-white mb-0">Trainers Overview</h5>
                <small className="text-white-50">
                  {loading ? 'Loading...' : `${trainers?.length || 0} trainers registered`}
                </small>
              </div>
            </div>
            <Badge bg="primary" style={{ backgroundColor: '#7747ff' }}>
              Total: {trainers?.length || 0}
            </Badge>
          </div>
        </Card.Header>
        
        <Card.Body style={{ padding: '0' }}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading trainers...</p>
            </div>
          ) : trainers && trainers.length > 0 ? (
            <div className="table-responsive">
              <Table style={{ margin: 0, backgroundColor: 'transparent' }} className="table-dark">
                <thead>
                  <tr style={{ backgroundColor: '#1a2540', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                    <th className="text-white border-0 py-3 ps-4" style={{ backgroundColor: 'transparent' }}>Profile</th>
                    <th className="text-white border-0 py-3" style={{ backgroundColor: 'transparent' }}>Name</th>
                    <th className="text-white border-0 py-3" style={{ backgroundColor: 'transparent' }}>Email</th>
                    <th className="text-white border-0 py-3" style={{ backgroundColor: 'transparent' }}>Phone</th>
                    <th className="text-white border-0 py-3" style={{ backgroundColor: 'transparent' }}>Specialization</th>
                    <th className="text-white border-0 py-3" style={{ backgroundColor: 'transparent' }}>Joined</th>
                    <th className="text-white border-0 py-3 text-center" style={{ backgroundColor: 'transparent' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map((trainer, index) => (
                    <tr 
                      key={trainer.id}
                      style={{ 
                        backgroundColor: index % 2 === 0 ? '#1a2540' : '#162040',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      className="table-row-hover"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#243457';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#1a2540' : '#162040';
                      }}
                    >
                      <td className="py-3 ps-4" style={{ backgroundColor: 'transparent', border: 'none' }}>
                        {renderProfileImage(trainer)}
                      </td>
                      <td className="py-3" style={{ backgroundColor: 'transparent', border: 'none' }}>
                        <div className="text-white fw-medium">
                          {trainer.first_name} {trainer.last_name}
                        </div>
                      </td>
                      <td className="py-3" style={{ backgroundColor: 'transparent', border: 'none' }}>
                        <div className="text-white-50 small">{trainer.email}</div>
                      </td>
                      <td className="py-3" style={{ backgroundColor: 'transparent', border: 'none' }}>
                        <div className="text-white-50 small">
                          {trainer.phone_number || 'Not provided'}
                        </div>
                      </td>
                      <td className="py-3" style={{ backgroundColor: 'transparent', border: 'none' }}>
                        <Badge 
                          style={{ 
                            backgroundColor: '#17a2b8', 
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          {trainer.specialization || 'General'}
                        </Badge>
                      </td>
                      <td className="py-3" style={{ backgroundColor: 'transparent', border: 'none' }}>
                        <div className="text-white-50 small">
                          {formatDate(trainer.date_joined)}
                        </div>
                      </td>
                      <td className="py-3 text-center" style={{ backgroundColor: 'transparent', border: 'none' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleEditClick(trainer)}
                            style={{ 
                              borderRadius: '6px',
                              borderColor: '#0dcaf0',
                              color: '#0dcaf0'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#0dcaf0';
                              e.target.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = '#0dcaf0';
                            }}
                          >
                            <PencilSquare size={14} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(trainer)}
                            style={{ 
                              borderRadius: '6px',
                              borderColor: '#dc3545',
                              color: '#dc3545'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#dc3545';
                              e.target.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = '#dc3545';
                            }}
                          >
                            <Trash3 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <Person color="#6c757d" size={60} />
              <h6 className="text-white-50 mt-3">No trainers found</h6>
              <p className="text-white-50">Create your first trainer to get started</p>
              <Button
                onClick={() => navigate('/admin/create-trainer')}
                style={{ backgroundColor: '#7747ff', border: 'none' }}
                className="mt-2"
              >
                <PersonAdd className="me-2" size={16} />
                Add First Trainer
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Edit Trainer Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Edit Trainer</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Profile Image</Form.Label>
              <Form.Control
                type="file"
                name="profile_img"
                accept="image/*"
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
              />
              {imagePreview && (
                <div className="mt-2 d-flex align-items-center">
                  <Image
                    src={imagePreview}
                    alt="Profile Preview"
                    rounded
                    style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="ms-2"
                  >
                    Remove Image
                  </Button>
                </div>
              )}
            </Form.Group>
            
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={editForm.first_name}
                    onChange={handleEditChange}
                    style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={editForm.last_name}
                    onChange={handleEditChange}
                    style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                name="phone_number"
                value={editForm.phone_number}
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                placeholder="Optional"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Specialization</Form.Label>
              <Form.Control
                type="text"
                name="specialization"
                value={editForm.specialization}
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: "#7747ff", border: "none" }}>
                Update Trainer
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          <div className="text-center">
            <div className="mb-3">
              <Trash3 color="#dc3545" size={48} />
            </div>
            <h6 className="mb-3">Are you sure you want to delete this trainer?</h6>
            {selectedTrainer && (
              <p className="text-white-50">
                <strong>{selectedTrainer.first_name} {selectedTrainer.last_name}</strong>
                <br />
                <small>{selectedTrainer.email}</small>
              </p>
            )}
            <p className="text-danger small">
              This action cannot be undone. All trainer data will be permanently removed.
            </p>
          </div>
          <div className="d-flex justify-content-center gap-2 mt-4">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Delete Trainer
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Image Preview Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }} closeButton>
          <Modal.Title className="text-white">Profile Image</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', display: 'flex', justifyContent: 'center', padding: '20px' }}>
          {selectedImageUrl ? (
            <Image
              src={selectedImageUrl}
              alt="Trainer Profile"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                objectFit: 'contain',
                borderRadius: '10px'
              }}
              onError={(e) => {
                e.target.src = '/placeholder-avatar.png'; // Fallback image
              }}
            />
          ) : (
            <p className="text-white">No image available</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TrainerList;