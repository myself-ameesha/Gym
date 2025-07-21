import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Table, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { People, PersonBadge } from 'react-bootstrap-icons';
import TrainerAssignmentModal from './TrainerAssignmentModal';
import { getMembers, getTrainers } from '../../features/auth/authApi';

const AdminMembers = () => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const { members, trainers, loading, error: reduxError } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getMembers());
    dispatch(getTrainers());
  }, [dispatch]);

  useEffect(() => {
    if (reduxError) setError(reduxError);
  }, [reduxError]);

  const handleViewDetails = (member) => {
    setCurrentMember(member);
    setShowDetailModal(true);
  };

  const handleAssignTrainer = (member) => {
    setCurrentMember(member);
    setShowAssignmentModal(true);
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

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading members...</p>
            </div>
          ) : members?.length === 0 ? (
            <div className="text-center my-5">
              <p className="text-white">No members found.</p>
            </div>
          ) : (
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
                  {members?.map((member) => (
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
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleAssignTrainer(member)}
                          style={{ borderColor: '#7747ff' }}
                        >
                          Assign Trainer
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

      {/* Trainer Assignment Modal */}
      <TrainerAssignmentModal
        show={showAssignmentModal}
        handleClose={() => setShowAssignmentModal(false)}
        member={currentMember}
        trainers={trainers}
      />

      {/* Details Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
        backdrop="static"
        size="lg" // Increase modal size for better layout
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