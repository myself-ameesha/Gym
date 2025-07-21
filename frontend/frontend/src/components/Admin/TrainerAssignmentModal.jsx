import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { assignTrainerToMember } from '../../features/auth/authApi';

const TrainerAssignmentModal = ({ show, handleClose, member, trainers }) => {
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const dispatch = useDispatch();
  const { assignmentLoading, assignmentError } = useSelector((state) => state.auth);

  // Initialize selected trainer ID when modal opens
  useEffect(() => {
    if (show && member && member.assigned_trainer) {
      setSelectedTrainerId(member.assigned_trainer.id.toString());
    } else {
      setSelectedTrainerId('');
    }
    setError(null);
    setSuccess(false);
  }, [show, member]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!member || !member.id) {
      setError('No member selected');
      return;
    }

    try {
      await dispatch(
        assignTrainerToMember({
          memberId: member.id,
          trainerId: selectedTrainerId ? parseInt(selectedTrainerId) : null,
        })
      ).unwrap();

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to assign trainer');
    }
  };

  // Render loading state if trainers or member data is not available
  if (!member || !trainers) {
    return (
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Trainer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Loading data...</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
        <Modal.Title className="text-white">
          Assign Trainer to {member.first_name} {member.last_name}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          {(error || assignmentError) && (
            <Alert variant="danger">{error || assignmentError}</Alert>
          )}
          {success && <Alert variant="success">Trainer successfully assigned!</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Select Trainer</Form.Label>
            <Form.Select
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
            >
              <option value="">-- No Trainer (Remove Assignment) --</option>
              {trainers.length > 0 ? (
                trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.first_name} {trainer.last_name}{' '}
                    {trainer.specialization ? `(${trainer.specialization})` : ''}
                  </option>
                ))
              ) : (
                <option disabled>No trainers available</option>
              )}
            </Form.Select>
          </Form.Group>

          {member.assigned_trainer && (
            <div className="mb-3">
              <p className="text-info mb-1">Currently assigned trainer:</p>
              <p className="mb-0">
                <strong>
                  {member.assigned_trainer.first_name} {member.assigned_trainer.last_name}
                  {member.assigned_trainer.specialization
                    ? ` (${member.assigned_trainer.specialization})`
                    : ''}
                </strong>
              </p>
            </div>
          )}

          <div className="mb-2">
            <p className="text-muted mb-1">Member Information:</p>
            <p className="mb-0">
              <small>Email: {member.email}</small>
            </p>
            <p className="mb-0">
              <small>Membership: {member.membership_plan?.name || 'No Plan'}</small>
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={assignmentLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={assignmentLoading}
            style={{ backgroundColor: '#7747ff', border: 'none' }}
          >
            {assignmentLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Assigning...
              </>
            ) : (
              'Assign Trainer'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TrainerAssignmentModal;