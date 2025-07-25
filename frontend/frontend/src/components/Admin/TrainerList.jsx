// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Card, Button, Table, Modal, Form, Spinner, Alert } from 'react-bootstrap';
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
//     specialization: ''  // Added specialization to edit form
//   });
//   const [error, setError] = useState(null);
//   const [successMessage, setSuccessMessage] = useState('');

//   const dispatch = useDispatch();
//   const { trainers, loading, error: reduxError } = useSelector((state) => state.auth);

//   useEffect(() => {
//     dispatch(getTrainers())
//       .unwrap()
//       .catch(error => setError(error));
//   }, [dispatch]);

//   useEffect(() => {
//     if (reduxError) setError(reduxError);
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
//       specialization: trainer.specialization || ''
//     });
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
//       setError(err || 'Failed to delete trainer. Please try again.');
//       setShowDeleteModal(false);
//     }
//   };

//   const handleEditChange = (e) => {
//     const { name, value } = e.target;
//     setEditForm({ ...editForm, [name]: value });
//   };

//   const handleEditSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await dispatch(updateTrainer({
//         trainerId: currentTrainer.id,
//         data: editForm
//       })).unwrap();
//       setShowEditModal(false);
//       setSuccessMessage(`Trainer ${editForm.first_name} ${editForm.last_name} updated successfully.`);
//       setTimeout(() => setSuccessMessage(''), 3000);
//     } catch (err) {
//       setError(err || 'Failed to update trainer. Please try again.');
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
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Table, Modal, Form, Spinner, Alert, Image } from 'react-bootstrap';
import { People, PersonBadge, PencilSquare, Trash, PlusCircle } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getTrainers, updateTrainer, deleteTrainer } from '../../features/auth/authApi';

const TrainerList = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTrainer, setCurrentTrainer] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    specialization: '',
    profile_img: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const dispatch = useDispatch();
  const { trainers, loading, error: reduxError } = useSelector((state) => state.auth);

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `http://localhost:8000${path}`;
  };

  useEffect(() => {
    dispatch(getTrainers())
      .unwrap()
      .catch(error => setError(error.message || JSON.stringify(error)));
  }, [dispatch]);

  useEffect(() => {
    if (reduxError) setError(reduxError.message || JSON.stringify(reduxError));
  }, [reduxError]);

  const handleDeleteClick = (trainer) => {
    setCurrentTrainer(trainer);
    setShowDeleteModal(true);
    setError(null);
    setSuccessMessage('');
  };

  const handleEditClick = (trainer) => {
    setCurrentTrainer(trainer);
    setEditForm({
      first_name: trainer.first_name,
      last_name: trainer.last_name,
      email: trainer.email,
      specialization: trainer.specialization || '',
      profile_img: null,
    });
    setImagePreview(getImageUrl(trainer.trainer_profile?.profile_img) || null);
    setShowEditModal(true);
    setError(null);
    setSuccessMessage('');
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteTrainer(currentTrainer.id)).unwrap();
      setShowDeleteModal(false);
      setSuccessMessage(`Trainer ${currentTrainer.first_name} ${currentTrainer.last_name} deleted successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete trainer. Please try again.');
      setShowDeleteModal(false);
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('first_name', editForm.first_name);
      formData.append('last_name', editForm.last_name);
      formData.append('email', editForm.email);
      formData.append('specialization', editForm.specialization);
      if (editForm.profile_img) {
        formData.append('profile_img', editForm.profile_img);
      } else if (editForm.profile_img === '') {
        formData.append('profile_img', '');
      }

      await dispatch(updateTrainer({
        trainerId: currentTrainer.id,
        data: formData,
      })).unwrap();
      setShowEditModal(false);
      setSuccessMessage(`Trainer ${editForm.first_name} ${editForm.last_name} updated successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setImagePreview(null);
    } catch (err) {
      setError(err.message || JSON.stringify(err) || 'Failed to update trainer. Please try again.');
    }
  };

  const activeTrainerCount = trainers?.filter(trainer => trainer.is_active).length || 0;
  const inactiveTrainerCount = trainers?.length - activeTrainerCount || 0;

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Trainer Management</h3>
        <Link to="/Admin/CreateTrainer">
          <Button
            variant="primary"
            style={{ backgroundColor: "#7747ff", border: "none", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <PlusCircle size={16} /> Create Trainer
          </Button>
        </Link>
      </header>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(119, 71, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                <People color="#7747ff" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Total Trainers</h6>
                <h3 className="text-white mb-0">{trainers?.length || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                <People color="#2ecc71" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Active Trainers</h6>
                <h3 className="text-white mb-0">{activeTrainerCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(231, 76, 60, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                <People color="#e74c3c" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Inactive Trainers</h6>
                <h3 className="text-white mb-0">{inactiveTrainerCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <div className="me-2" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233, 30, 99, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PersonBadge color="#e91e63" size={20} />
              </div>
              <span className="text-white">Trainer List</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading trainers...</p>
            </div>
          ) : trainers?.length === 0 ? (
            <div className="text-center my-5">
              <p className="text-white">No trainers found. Create your first trainer to get started.</p>
              <Link to="/Admin/CreateTrainer">
                <Button variant="primary" style={{ backgroundColor: "#7747ff", border: "none" }}>
                  Create Trainer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Profile Picture</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Specialization</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers?.map((trainer) => (
                    <tr key={trainer.id}>
                      <td>{trainer.id}</td>
                      <td>
                        {trainer.trainer_profile?.profile_img ? (
                          <Image
                            src={getImageUrl(trainer.trainer_profile.profile_img)}
                            alt={`${trainer.first_name} ${trainer.last_name}`}
                            roundedCircle
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = '/path/to/fallback-image.png'; }}
                          />
                        ) : (
                          <PersonBadge color="#6c757d" size={24} />
                        )}
                      </td>
                      <td>{trainer.first_name} {trainer.last_name}</td>
                      <td>{trainer.email}</td>
                      <td>{trainer.specialization || 'Not Specified'}</td>
                      <td>
                        <span className={`badge ${trainer.is_active ? 'bg-success' : 'bg-danger'}`}>
                          {trainer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditClick(trainer)}
                          style={{ borderColor: '#0dcaf0' }}
                        >
                          <PencilSquare size={16} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(trainer)}
                          style={{ borderColor: '#dc3545' }}
                        >
                          <Trash size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          Are you sure you want to delete the trainer: <strong>{currentTrainer?.first_name} {currentTrainer?.last_name}</strong>?
          <p className="text-danger mt-2 mb-0">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Trainer Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Edit Trainer</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Profile Picture (Optional)</Form.Label>
              <Form.Control
                type="file"
                name="profile_img"
                accept="image/*"
                onChange={handleEditChange}
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
              <Form.Label>Specialization</Form.Label>
              <Form.Control
                type="text"
                name="specialization"
                value={editForm.specialization}
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: "#7747ff", border: "none" }}>
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TrainerList;



