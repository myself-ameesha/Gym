import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { Calendar } from 'react-bootstrap-icons';
import { getTrainerList, markTrainerAttendance, getTrainerAttendanceHistory } from '../../features/auth/authApi';
import { clearError } from '../../features/auth/authSlice';

const AdminMarkTrainerAttendance = () => {
  const dispatch = useDispatch();
  const { trainers, trainerListLoading, trainerAttendanceRecords, trainerAttendanceLoading, error } = useSelector((state) => state.auth);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0], // Default to today
    status: 'present'
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    dispatch(getTrainerList());
  }, [dispatch]);

  const handleMarkAttendance = (trainer) => {
    setSelectedTrainer(trainer);
    setShowMarkModal(true);
  };

  const handleViewAttendance = (trainer) => {
    setSelectedTrainer(trainer);
    dispatch(getTrainerAttendanceHistory(trainer.id));
    setShowViewModal(true);
  };

  const handleAttendanceChange = (e) => {
    const { name, value } = e.target;
    setAttendanceForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage('');

    try {
      await dispatch(markTrainerAttendance({
        trainerId: selectedTrainer.id,
        date: attendanceForm.date,
        status: attendanceForm.status
      })).unwrap();
      setSuccessMessage(`Attendance marked successfully for ${selectedTrainer.first_name} ${selectedTrainer.last_name}!`);
      setShowMarkModal(false);
      setAttendanceForm({ date: new Date().toISOString().split('T')[0], status: 'present' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setLocalError(err || 'Failed to mark attendance. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const formatMarkedBy = (record) => {
    if (record.admin_name && record.admin_name !== record.admin_email) {
      return record.admin_name;
    }
    if (record.admin_email) {
      return record.admin_email;
    }
    return 'Not available';
  };

  return (
    <Card style={{ backgroundColor: 'transparent', border: 'none' }}>
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
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
            <Calendar color="#7747ff" size={20} />
          </div>
          <span className="text-white">Manage Trainer Attendance</span>
        </div>
        {error && (
          <Alert variant="danger" onClose={() => dispatch(clearError())} dismissible>
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}
        {localError && (
          <Alert variant="danger" onClose={() => setLocalError(null)} dismissible>
            {typeof localError === 'string' ? localError : JSON.stringify(localError)}
          </Alert>
        )}
        {trainerListLoading ? (
          <div className="text-center">
            <Spinner animation="border" variant="light" />
            <p className="text-white mt-2">Loading trainers...</p>
          </div>
        ) : trainers.length === 0 ? (
          <p className="text-white">No trainers found.</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((trainer) => (
                  <tr key={trainer.id}>
                    <td>{trainer.first_name} {trainer.last_name}</td>
                    <td>{trainer.email}</td>
                    <td>{trainer.specialization || 'Not specified'}</td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkAttendance(trainer)}
                        style={{ backgroundColor: '#7747ff', border: 'none', marginRight: '10px' }}
                      >
                        Mark Attendance
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleViewAttendance(trainer)}
                        style={{ borderColor: '#0dcaf0' }}
                      >
                        View Attendance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {/* Modal for Marking Attendance */}
      <Modal show={showMarkModal} onHide={() => setShowMarkModal(false)} centered>
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">
            Mark Attendance for {selectedTrainer?.first_name} {selectedTrainer?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          <Form onSubmit={handleSubmitAttendance}>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={attendanceForm.date}
                onChange={handleAttendanceChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={attendanceForm.status}
                onChange={handleAttendanceChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowMarkModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: "#7747ff", border: "none" }}>
                Mark Attendance
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal for Viewing Attendance */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">
            Attendance History for {selectedTrainer?.first_name} {selectedTrainer?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          {trainerAttendanceLoading ? (
            <div className="text-center">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading attendance records...</p>
            </div>
          ) : !trainerAttendanceRecords[selectedTrainer?.id] || !Array.isArray(trainerAttendanceRecords[selectedTrainer?.id]) || trainerAttendanceRecords[selectedTrainer?.id].length === 0 ? (
            <p className="text-white">No attendance records found.</p>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Marked By</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {trainerAttendanceRecords[selectedTrainer?.id].map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                      <td>{formatMarkedBy(record)}</td>
                      <td>{formatDate(record.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          <div className="d-flex justify-content-end mt-4">
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
          </div>
        </Modal.Body>
      </Modal>
    </Card>
  );
};

export default AdminMarkTrainerAttendance;