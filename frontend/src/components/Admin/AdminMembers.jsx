// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Card, Button, Table, Modal, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
// import { People, PersonBadge, PencilSquare, Trash } from 'react-bootstrap-icons';
// import TrainerAssignmentModal from './TrainerAssignmentModal';
// import { getMembers, getTrainers, updateMember, deleteMember } from '../../features/auth/authApi';

// const AdminMembers = () => {
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [showAssignmentModal, setShowAssignmentModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [currentMember, setCurrentMember] = useState(null);
//   const [editFormData, setEditFormData] = useState({});
//   const [error, setError] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const dispatch = useDispatch();
//   const { members, trainers, loading, error: reduxError } = useSelector((state) => state.auth);

//   useEffect(() => {
//     dispatch(getMembers());
//     dispatch(getTrainers());
//   }, [dispatch]);

//   useEffect(() => {
//     if (reduxError) setError(reduxError);
//   }, [reduxError]);

//   const handleViewDetails = (member) => {
//     setCurrentMember(member);
//     setShowDetailModal(true);
//   };

//   const handleAssignTrainer = (member) => {
//     setCurrentMember(member);
//     setShowAssignmentModal(true);
//   };

//   const handleEditMember = (member) => {
//     setCurrentMember(member);
//     setEditFormData({
//       first_name: member.first_name || '',
//       last_name: member.last_name || '',
//       email: member.email || '',
//       phone_number: member.phone_number || '',
//       date_of_birth: member.date_of_birth || '',
//       fitness_goal: member.fitness_goal || '',
//       is_active: member.is_active
//     });
//     setShowEditModal(true);
//   };

//   const handleDeleteMember = (member) => {
//     setCurrentMember(member);
//     setShowDeleteModal(true);
//   };

//   const handleEditFormChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setEditFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleEditSubmit = async (e) => {
//     e.preventDefault();
//     if (!currentMember) return;

//     setIsSubmitting(true);
//     try {
//       await dispatch(updateMember({ id: currentMember.id, data: editFormData })).unwrap();
//       setShowEditModal(false);
//       setCurrentMember(null);
//       setEditFormData({});
//       // Refresh the members list
//       dispatch(getMembers());
//     } catch (error) {
//       setError(error || 'Failed to update member');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDeleteConfirm = async () => {
//     if (!currentMember) return;

//     setIsSubmitting(true);
//     try {
//       await dispatch(deleteMember(currentMember.id)).unwrap();
//       setShowDeleteModal(false);
//       setCurrentMember(null);
//       // Refresh the members list
//       dispatch(getMembers());
//     } catch (error) {
//       setError(error || 'Failed to delete member');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not available';
//     const date = new Date(dateString);
//     return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
//   };

//   const formatDateTime = (dateString) => {
//     if (!dateString) return 'Not available';
//     const date = new Date(dateString);
//     return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
//   };

//   const formatDateForInput = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
//   };

//   const calculateAge = (dateString) => {
//     if (!dateString) return 'Not available';
//     const birthDate = new Date(dateString);
//     const today = new Date();
//     if (isNaN(birthDate.getTime())) return 'Invalid date';
//     let age = today.getFullYear() - birthDate.getFullYear();
//     const monthDiff = today.getMonth() - birthDate.getMonth();
//     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//       age--;
//     }
//     return age;
//   };

//   const activeMembersCount = members?.filter((member) => member.is_active).length || 0;
//   const inactiveMembersCount = members?.length - activeMembersCount || 0;

//   return (
//     <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
//       <header className="d-flex justify-content-between align-items-center mb-4">
//         <h3 className="text-white">Member Management</h3>
//       </header>

//       {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

//       {/* Stats Cards */}
//       <div className="row mb-4">
//         <div className="col-md-4 mb-3">
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body className="d-flex align-items-center">
//               <div
//                 style={{
//                   width: '48px',
//                   height: '48px',
//                   borderRadius: '8px',
//                   backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   marginRight: '16px',
//                 }}
//               >
//                 <People color="#7747ff" size={24} />
//               </div>
//               <div>
//                 <h6 className="text-white-50 mb-1">Total Members</h6>
//                 <h3 className="text-white mb-0">{members?.length || 0}</h3>
//               </div>
//             </Card.Body>
//           </Card>
//         </div>
//         <div className="col-md-4 mb-3">
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body className="d-flex align-items-center">
//               <div
//                 style={{
//                   width: '48px',
//                   height: '48px',
//                   borderRadius: '8px',
//                   backgroundColor: 'rgba(46, 204, 113, 0.1)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   marginRight: '16px',
//                 }}
//               >
//                 <People color="#2ecc71" size={24} />
//               </div>
//               <div>
//                 <h6 className="text-white-50 mb-1">Active Members</h6>
//                 <h3 className="text-white mb-0">{activeMembersCount}</h3>
//               </div>
//             </Card.Body>
//           </Card>
//         </div>
//         <div className="col-md-4 mb-3">
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body className="d-flex align-items-center">
//               <div
//                 style={{
//                   width: '48px',
//                   height: '48px',
//                   borderRadius: '8px',
//                   backgroundColor: 'rgba(231, 76, 60, 0.1)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   marginRight: '16px',
//                 }}
//               >
//                 <People color="#e74c3c" size={24} />
//               </div>
//               <div>
//                 <h6 className="text-white-50 mb-1">Inactive Members</h6>
//                 <h3 className="text-white mb-0">{inactiveMembersCount}</h3>
//               </div>
//             </Card.Body>
//           </Card>
//         </div>
//       </div>

//       <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//         <Card.Body>
//           <div className="d-flex justify-content-between align-items-center mb-3">
//             <div className="d-flex align-items-center">
//               <div
//                 className="me-2"
//                 style={{
//                   width: '40px',
//                   height: '40px',
//                   borderRadius: '8px',
//                   backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}
//               >
//                 <PersonBadge color="#7747ff" size={20} />
//               </div>
//               <span className="text-white">Member List</span>
//             </div>
//           </div>

//           {loading ? (
//             <div className="text-center my-5">
//               <Spinner animation="border" variant="light" />
//               <p className="text-white mt-2">Loading members...</p>
//             </div>
//           ) : members?.length === 0 ? (
//             <div className="text-center my-5">
//               <p className="text-white">No members found.</p>
//             </div>
//           ) : (
//             <div className="table-responsive">
//               <Table bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
//                 <thead>
//                   <tr>
//                     <th>ID</th>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Membership Plan</th>
//                     <th>Status</th>
//                     <th>Registration Date</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {members?.map((member) => (
//                     <tr key={member.id}>
//                       <td>{member.id}</td>
//                       <td>
//                         {member.first_name} {member.last_name}
//                       </td>
//                       <td>{member.email}</td>
//                       <td>{member.membership_plan ? member.membership_plan.name : 'Not Assigned'}</td>
//                       <td>
//                         <span className={`badge ${member.is_active ? 'bg-success' : 'bg-danger'}`}>
//                           {member.is_active ? 'Active' : 'Inactive'}
//                         </span>
//                       </td>
//                       <td>{formatDate(member.date_joined)}</td>
//                       <td>
//                         <Button
//                           variant="outline-info"
//                           size="sm"
//                           onClick={() => handleViewDetails(member)}
//                           style={{ borderColor: '#0dcaf0', marginRight: '5px' }}
//                         >
//                           View Details
//                         </Button>
//                         <Button
//                           variant="outline-warning"
//                           size="sm"
//                           onClick={() => handleEditMember(member)}
//                           style={{ borderColor: '#ffc107', marginRight: '5px' }}
//                         >
//                           <PencilSquare size={14} />
//                         </Button>
//                         <Button
//                           variant="outline-primary"
//                           size="sm"
//                           onClick={() => handleAssignTrainer(member)}
//                           style={{ borderColor: '#7747ff', marginRight: '5px' }}
//                         >
//                           Assign Trainer
//                         </Button>
//                         <Button
//                           variant="outline-danger"
//                           size="sm"
//                           onClick={() => handleDeleteMember(member)}
//                           style={{ borderColor: '#dc3545' }}
//                         >
//                           <Trash size={14} />
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

//       {/* Trainer Assignment Modal */}
//       <TrainerAssignmentModal
//         show={showAssignmentModal}
//         handleClose={() => setShowAssignmentModal(false)}
//         member={currentMember}
//         trainers={trainers}
//       />

//       {/* Edit Member Modal */}
//       <Modal
//         show={showEditModal}
//         onHide={() => setShowEditModal(false)}
//         centered
//         backdrop="static"
//         size="lg"
//       >
//         <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
//           <Modal.Title className="text-white">Edit Member</Modal.Title>
//         </Modal.Header>
//         <Form onSubmit={handleEditSubmit}>
//           <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white', padding: '20px' }}>
//             <Row>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>First Name</Form.Label>
//                   <Form.Control
//                     type="text"
//                     name="first_name"
//                     value={editFormData.first_name || ''}
//                     onChange={handleEditFormChange}
//                     style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Last Name</Form.Label>
//                   <Form.Control
//                     type="text"
//                     name="last_name"
//                     value={editFormData.last_name || ''}
//                     onChange={handleEditFormChange}
//                     style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
//                   />
//                 </Form.Group>
//               </Col>
//             </Row>
//             <Row>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Email</Form.Label>
//                   <Form.Control
//                     type="email"
//                     name="email"
//                     value={editFormData.email || ''}
//                     onChange={handleEditFormChange}
//                     style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Phone Number</Form.Label>
//                   <Form.Control
//                     type="tel"
//                     name="phone_number"
//                     value={editFormData.phone_number || ''}
//                     onChange={handleEditFormChange}
//                     style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
//                   />
//                 </Form.Group>
//               </Col>
//             </Row>
//             <Row>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Date of Birth</Form.Label>
//                   <Form.Control
//                     type="date"
//                     name="date_of_birth"
//                     value={formatDateForInput(editFormData.date_of_birth) || ''}
//                     onChange={handleEditFormChange}
//                     style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Fitness Goal</Form.Label>
//                   <Form.Select
//                     name="fitness_goal"
//                     value={editFormData.fitness_goal || ''}
//                     onChange={handleEditFormChange}
//                     style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
//                   >
//                     <option value="">Select Goal</option>
//                     <option value="Weight Loss">Weight Loss</option>
//                     <option value="Muscle Gain">Muscle Gain</option>
//                     <option value="Endurance">Endurance</option>
//                     <option value="Strength Training">Strength Training</option>
//                     <option value="General Fitness">General Fitness</option>
//                   </Form.Select>
//                 </Form.Group>
//               </Col>
//             </Row>
//             <Form.Group className="mb-3">
//               <Form.Check
//                 type="checkbox"
//                 name="is_active"
//                 label="Active Member"
//                 checked={editFormData.is_active || false}
//                 onChange={handleEditFormChange}
//                 style={{ color: 'white' }}
//               />
//             </Form.Group>
//           </Modal.Body>
//           <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
//             <Button variant="secondary" onClick={() => setShowEditModal(false)}>
//               Cancel
//             </Button>
//             <Button 
//               variant="primary" 
//               type="submit"
//               disabled={isSubmitting}
//               style={{ backgroundColor: '#7747ff', borderColor: '#7747ff' }}
//             >
//               {isSubmitting ? (
//                 <>
//                   <Spinner animation="border" size="sm" className="me-2" />
//                   Updating...
//                 </>
//               ) : (
//                 'Update Member'
//               )}
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal
//         show={showDeleteModal}
//         onHide={() => setShowDeleteModal(false)}
//         centered
//         backdrop="static"
//         size="md"
//       >
//         <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
//           <Modal.Title className="text-white">Confirm Delete</Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white', padding: '20px' }}>
//           <div className="text-center">
//             <div
//               style={{
//                 width: '60px',
//                 height: '60px',
//                 borderRadius: '50%',
//                 backgroundColor: 'rgba(231, 76, 60, 0.1)',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 margin: '0 auto 20px',
//               }}
//             >
//               <Trash color="#e74c3c" size={30} />
//             </div>
//             <h5>Delete Member</h5>
//             <p>
//               Are you sure you want to delete member{' '}
//               <strong>{currentMember?.first_name} {currentMember?.last_name}</strong>?
//             </p>
//             <p className="text-warning">
//               <small>This action cannot be undone.</small>
//             </p>
//           </div>
//         </Modal.Body>
//         <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
//           <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
//             Cancel
//           </Button>
//           <Button 
//             variant="danger" 
//             onClick={handleDeleteConfirm}
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? (
//               <>
//                 <Spinner animation="border" size="sm" className="me-2" />
//                 Deleting...
//               </>
//             ) : (
//               'Delete Member'
//             )}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Details Modal */}
//       <Modal
//         show={showDetailModal}
//         onHide={() => setShowDetailModal(false)}
//         centered
//         backdrop="static"
//         size="lg"
//       >
//         <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
//           <Modal.Title className="text-white">Member Details</Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white', padding: '20px' }}>
//           {currentMember ? (
//             <div>
//               <div className="d-flex justify-content-center mb-3">
//                 <div
//                   style={{
//                     width: '60px',
//                     height: '60px',
//                     borderRadius: '50%',
//                     backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <PersonBadge color="#7747ff" size={30} />
//                 </div>
//               </div>

//               <h4 className="text-center mb-4">
//                 {currentMember.first_name} {currentMember.last_name}
//               </h4>

//               <div
//                 style={{
//                   display: 'grid',
//                   gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//                   gap: '15px',
//                   fontSize: '0.9rem',
//                 }}
//               >
//                 <Form.Group>
//                   <Form.Label className="text-white-50 mb-1">Email</Form.Label>
//                   <p className="mb-0">{currentMember.email}</p>
//                 </Form.Group>

//                 <Form.Group>
//                   <Form.Label className="text-white-50 mb-1">Phone Number</Form.Label>
//                   <p className="mb-0">{currentMember.phone_number || 'Not provided'}</p>
//                 </Form.Group>

//                 <Form.Group>
//                   <Form.Label className="text-white-50 mb-1">Age</Form.Label>
//                   <p className="mb-0">{calculateAge(currentMember.date_of_birth)} years old</p>
//                 </Form.Group>

//                 <Form.Group>
//                   <Form.Label className="text-white-50 mb-1">Registration Date</Form.Label>
//                   <p className="mb-0">{formatDate(currentMember.date_joined)}</p>
//                 </Form.Group>

//                 <Form.Group>
//                   <Form.Label className="text-white-50 mb-1">Status</Form.Label>
//                   <p className="mb-0">
//                     <span className={`badge ${currentMember.is_active ? 'bg-success' : 'bg-danger'}`}>
//                       {currentMember.is_active ? 'Active' : 'Inactive'}
//                     </span>
//                   </p>
//                 </Form.Group>

//                 <Form.Group>
//                   <Form.Label className="text-white-50 mb-1">Membership Plan</Form.Label>
//                   <p className="mb-0">
//                     <span className="badge bg-primary">
//                       {currentMember.membership_plan?.name || 'Not Assigned'}
//                     </span>
//                     {currentMember.membership_plan && (
//                       <small className="d-block mt-1 text-white-50">
//                         ${currentMember.membership_plan.price} for {currentMember.membership_plan.duration_days} days
//                       </small>
//                     )}
//                   </p>
//                 </Form.Group>

//                 <Form.Group>
//                   <Form.Label className="text-white-50 mb-1">Fitness Goal</Form.Label>
//                   <p className="mb-0">
//                     <span className="badge bg-info">{currentMember.fitness_goal || 'Not Specified'}</span>
//                   </p>
//                 </Form.Group>

//                 <Form.Group>
//                   <Form.Label className="text-white-50 mb-1">Assigned Trainer</Form.Label>
//                   <p className="mb-0">
//                     {currentMember.assigned_trainer ? (
//                       <span className="badge bg-warning text-dark">
//                         {currentMember.assigned_trainer.first_name} {currentMember.assigned_trainer.last_name}
//                         {currentMember.assigned_trainer.specialization
//                           ? ` (${currentMember.assigned_trainer.specialization})`
//                           : ''}
//                       </span>
//                     ) : (
//                       <span className="badge bg-secondary">No Trainer Assigned</span>
//                     )}
//                   </p>
//                 </Form.Group>

//                 {currentMember.last_login && (
//                   <Form.Group>
//                     <Form.Label className="text-white-50 mb-1">Last Login</Form.Label>
//                     <p className="mb-0">{formatDateTime(currentMember.last_login)}</p>
//                   </Form.Group>
//                 )}
//               </div>
//             </div>
//           ) : (
//             <p className="text-center">No member selected</p>
//           )}
//         </Modal.Body>
//         <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
//           <Button
//             variant="outline-warning"
//             onClick={() => {
//               setShowDetailModal(false);
//               handleEditMember(currentMember);
//             }}
//             style={{ borderColor: '#ffc107', marginRight: '5px' }}
//             disabled={!currentMember}
//           >
//             <PencilSquare size={14} className="me-1" />
//             Edit
//           </Button>
//           <Button
//             variant="outline-primary"
//             onClick={() => {
//               setShowDetailModal(false);
//               handleAssignTrainer(currentMember);
//             }}
//             style={{ borderColor: '#7747ff', marginRight: '5px' }}
//             disabled={!currentMember}
//           >
//             Assign Trainer
//           </Button>
//           <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
//             Close
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default AdminMembers;

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Table, Modal, Form, Spinner, Alert, Row, Col, Pagination } from 'react-bootstrap';
import { People, PersonBadge, PencilSquare, Trash, Search } from 'react-bootstrap-icons';
import TrainerAssignmentModal from './TrainerAssignmentModal';
import { getMembers, getTrainers, updateMember, deleteMember } from '../../features/auth/authApi';

const AdminMembers = () => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive

  const dispatch = useDispatch();
  const { members, trainers, loading, error: reduxError } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getMembers());
    dispatch(getTrainers());
  }, [dispatch]);

  useEffect(() => {
    if (reduxError) setError(reduxError);
  }, [reduxError]);

  // Filter and search logic
  const filteredMembers = React.useMemo(() => {
    let filtered = members || [];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        (member.phone_number && member.phone_number.includes(searchTerm))
      );
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(member => member.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(member => !member.is_active);
    }

    return filtered;
  }, [members, searchTerm, statusFilter]);

  // Pagination logic
  const totalItems = filteredMembers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  const handleViewDetails = (member) => {
    setCurrentMember(member);
    setShowDetailModal(true);
  };

  const handleAssignTrainer = (member) => {
    setCurrentMember(member);
    setShowAssignmentModal(true);
  };

  const handleEditMember = (member) => {
    setCurrentMember(member);
    setEditFormData({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone_number: member.phone_number || '',
      date_of_birth: member.date_of_birth || '',
      fitness_goal: member.fitness_goal || '',
      is_active: member.is_active
    });
    setShowEditModal(true);
  };

  const handleDeleteMember = (member) => {
    setCurrentMember(member);
    setShowDeleteModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentMember) return;

    setIsSubmitting(true);
    try {
      await dispatch(updateMember({ id: currentMember.id, data: editFormData })).unwrap();
      setShowEditModal(false);
      setCurrentMember(null);
      setEditFormData({});
      dispatch(getMembers());
    } catch (error) {
      setError(error || 'Failed to update member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentMember) return;

    setIsSubmitting(true);
    try {
      await dispatch(deleteMember(currentMember.id)).unwrap();
      setShowDeleteModal(false);
      setCurrentMember(null);
      dispatch(getMembers());
    } catch (error) {
      setError(error || 'Failed to delete member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  const calculateAge = (dateString) => {
    if (!dateString) return 'Not available';
    const birthDate = new Date(dateString);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return 'Invalid date';
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const activeMembersCount = members?.filter((member) => member.is_active).length || 0;
  const inactiveMembersCount = members?.length - activeMembersCount || 0;

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    } else {
      // Always show first page
      items.push(
        <Pagination.Item
          key={1}
          active={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </Pagination.Item>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(
          <Pagination.Item
            key={totalPages}
            active={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </Pagination.Item>
        );
      }
    }

    return items;
  };

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Member Management</h3>
      </header>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(119, 71, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                }}
              >
                <People color="#7747ff" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Total Members</h6>
                <h3 className="text-white mb-0">{members?.length || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(46, 204, 113, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                }}
              >
                <People color="#2ecc71" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Active Members</h6>
                <h3 className="text-white mb-0">{activeMembersCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(231, 76, 60, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                }}
              >
                <People color="#e74c3c" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Inactive Members</h6>
                <h3 className="text-white mb-0">{inactiveMembersCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <div
                className="me-2"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(119, 71, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PersonBadge color="#7747ff" size={20} />
              </div>
              <span className="text-white">Member List</span>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <Row className="mb-3">
            <Col md={4}>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    backgroundColor: '#0c1427',
                    border: '1px solid #1a2235',
                    color: 'white',
                    paddingLeft: '40px'
                  }}
                />
                <Search
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6c757d'
                  }}
                  size={16}
                />
              </div>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  backgroundColor: '#0c1427',
                  border: '1px solid #1a2235',
                  color: 'white'
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                style={{
                  backgroundColor: '#0c1427',
                  border: '1px solid #1a2235',
                  color: 'white'
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="text-white d-flex align-items-center h-100">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} members
              </div>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading members...</p>
            </div>
          ) : currentMembers.length === 0 ? (
            <div className="text-center my-5">
              <p className="text-white">
                {filteredMembers.length === 0 && members?.length > 0
                  ? 'No members match your search criteria.'
                  : 'No members found.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Membership Plan</th>
                      <th>Status</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMembers.map((member) => (
                      <tr key={member.id}>
                        <td>{member.id}</td>
                        <td>
                          {member.first_name} {member.last_name}
                        </td>
                        <td>{member.email}</td>
                        <td>{member.membership_plan ? member.membership_plan.name : 'Not Assigned'}</td>
                        <td>
                          <span className={`badge ${member.is_active ? 'bg-success' : 'bg-danger'}`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{formatDate(member.date_joined)}</td>
                        <td>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleViewDetails(member)}
                            style={{ borderColor: '#0dcaf0', marginRight: '5px' }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                            style={{ borderColor: '#ffc107', marginRight: '5px' }}
                          >
                            <PencilSquare size={14} />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleAssignTrainer(member)}
                            style={{ borderColor: '#7747ff', marginRight: '5px' }}
                          >
                            Assign Trainer
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteMember(member)}
                            style={{ borderColor: '#dc3545' }}
                          >
                            <Trash size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-white-50">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Pagination className="mb-0">
                    <Pagination.First
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    {generatePaginationItems()}
                    <Pagination.Next
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Trainer Assignment Modal */}
      <TrainerAssignmentModal
        show={showAssignmentModal}
        handleClose={() => setShowAssignmentModal(false)}
        member={currentMember}
        trainers={trainers}
      />

      {/* Edit Member Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Edit Member</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white', padding: '20px' }}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={editFormData.first_name || ''}
                    onChange={handleEditFormChange}
                    style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={editFormData.last_name || ''}
                    onChange={handleEditFormChange}
                    style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={editFormData.email || ''}
                    onChange={handleEditFormChange}
                    style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone_number"
                    value={editFormData.phone_number || ''}
                    onChange={handleEditFormChange}
                    style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={formatDateForInput(editFormData.date_of_birth) || ''}
                    onChange={handleEditFormChange}
                    style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fitness Goal</Form.Label>
                  <Form.Select
                    name="fitness_goal"
                    value={editFormData.fitness_goal || ''}
                    onChange={handleEditFormChange}
                    style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
                  >
                    <option value="">Select Goal</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Endurance">Endurance</option>
                    <option value="Strength Training">Strength Training</option>
                    <option value="General Fitness">General Fitness</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_active"
                label="Active Member"
                checked={editFormData.is_active || false}
                onChange={handleEditFormChange}
                style={{ color: 'white' }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: '#7747ff', borderColor: '#7747ff' }}
            >
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Updating...
                </>
              ) : (
                'Update Member'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        backdrop="static"
        size="md"
      >
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white', padding: '20px' }}>
          <div className="text-center">
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Trash color="#e74c3c" size={30} />
            </div>
            <h5>Delete Member</h5>
            <p>
              Are you sure you want to delete member{' '}
              <strong>{currentMember?.first_name} {currentMember?.last_name}</strong>?
            </p>
            <p className="text-warning">
              <small>This action cannot be undone.</small>
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Member'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Details Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Member Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white', padding: '20px' }}>
          {currentMember ? (
            <div>
              <div className="d-flex justify-content-center mb-3">
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(119, 71, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PersonBadge color="#7747ff" size={30} />
                </div>
              </div>

              <h4 className="text-center mb-4">
                {currentMember.first_name} {currentMember.last_name}
              </h4>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px',
                  fontSize: '0.9rem',
                }}
              >
                <Form.Group>
                  <Form.Label className="text-white-50 mb-1">Email</Form.Label>
                  <p className="mb-0">{currentMember.email}</p>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="text-white-50 mb-1">Phone Number</Form.Label>
                  <p className="mb-0">{currentMember.phone_number || 'Not provided'}</p>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="text-white-50 mb-1">Age</Form.Label>
                  <p className="mb-0">{calculateAge(currentMember.date_of_birth)} years old</p>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="text-white-50 mb-1">Registration Date</Form.Label>
                  <p className="mb-0">{formatDate(currentMember.date_joined)}</p>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="text-white-50 mb-1">Status</Form.Label>
                  <p className="mb-0">
                    <span className={`badge ${currentMember.is_active ? 'bg-success' : 'bg-danger'}`}>
                      {currentMember.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="text-white-50 mb-1">Membership Plan</Form.Label>
                  <p className="mb-0">
                    <span className="badge bg-primary">
                      {currentMember.membership_plan?.name || 'Not Assigned'}
                    </span>
                    {currentMember.membership_plan && (
                      <small className="d-block mt-1 text-white-50">
                        ${currentMember.membership_plan.price} for {currentMember.membership_plan.duration_days} days
                      </small>
                    )}
                  </p>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="text-white-50 mb-1">Fitness Goal</Form.Label>
                  <p className="mb-0">
                    <span className="badge bg-info">{currentMember.fitness_goal || 'Not Specified'}</span>
                  </p>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="text-white-50 mb-1">Assigned Trainer</Form.Label>
                  <p className="mb-0">
                    {currentMember.assigned_trainer ? (
                      <span className="badge bg-warning text-dark">
                        {currentMember.assigned_trainer.first_name} {currentMember.assigned_trainer.last_name}
                        {currentMember.assigned_trainer.specialization
                          ? ` (${currentMember.assigned_trainer.specialization})`
                          : ''}
                      </span>
                    ) : (
                      <span className="badge bg-secondary">No Trainer Assigned</span>
                    )}
                  </p>
                </Form.Group>

                {currentMember.last_login && (
                  <Form.Group>
                    <Form.Label className="text-white-50 mb-1">Last Login</Form.Label>
                    <p className="mb-0">{formatDateTime(currentMember.last_login)}</p>
                  </Form.Group>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center">No member selected</p>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Button
            variant="outline-warning"
            onClick={() => {
              setShowDetailModal(false);
              handleEditMember(currentMember);
            }}
            style={{ borderColor: '#ffc107', marginRight: '5px' }}
            disabled={!currentMember}
          >
            <PencilSquare size={14} className="me-1" />
            Edit
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => {
              setShowDetailModal(false);
              handleAssignTrainer(currentMember);
            }}
            style={{ borderColor: '#7747ff', marginRight: '5px' }}
            disabled={!currentMember}
          >
            Assign Trainer
          </Button>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminMembers;