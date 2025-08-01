import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Table, Spinner, Alert, Button, Form, Modal } from 'react-bootstrap';
import { PersonBadge } from 'react-bootstrap-icons';
import { getAssignedMembers, markAttendance, getAttendanceHistory } from '../../features/auth/authApi';

const TrainerMembers = () => {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [localAttendanceError, setLocalAttendanceError] = useState(null);

  const dispatch = useDispatch();
  const { assignedMembers, loading, error, attendanceRecords, attendanceLoading, attendanceError } = useSelector((state) => state.auth);

  // Fetch assigned members and attendance history on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assigned members
        const membersResult = await dispatch(getAssignedMembers()).unwrap();
        console.log('Assigned Members fetched:', membersResult);

        // Fetch attendance history for each member
        if (membersResult && membersResult.length > 0) {
          const fetchPromises = membersResult.map((member) =>
            dispatch(getAttendanceHistory(member.id)).unwrap().then((result) => {
              console.log(`Attendance history for member ${member.id}:`, result);
              return result;
            }).catch((err) => {
              console.error(`Error fetching attendance history for member ${member.id}:`, err);
              throw err;
            })
          );
          await Promise.all(fetchPromises);
        }
      } catch (err) {
        console.error('Error fetching data on mount:', err);
        setLocalAttendanceError('Failed to fetch members or attendance history');
      }
    };

    fetchData();
  }, [dispatch]);

  const handleMarkAttendance = (member) => {
    setCurrentMember(member);
    setLocalAttendanceError(null);
    setShowAttendanceModal(true);
  };

  const handleSubmitAttendance = () => {
    if (currentMember) {
      const existingRecord = attendanceRecords[currentMember.id]?.find(
        (record) => record.date === attendanceDate
      );

      if (existingRecord) {
        setLocalAttendanceError('Attendance for this member on this date already exists.');
        return;
      }

      dispatch(markAttendance({
        memberId: currentMember.id,
        date: attendanceDate,
        status: attendanceStatus
      })).then((result) => {
        if (markAttendance.fulfilled.match(result)) {
          setShowAttendanceModal(false);
          setAttendanceStatus('present');
          setAttendanceDate(new Date().toISOString().split('T')[0]);
          // Refresh history for the member
          dispatch(getAttendanceHistory(currentMember.id)).unwrap().then((updatedRecords) => {
            console.log(`Updated attendance history for member ${currentMember.id}:`, updatedRecords);
          }).catch((err) => {
            console.error('Error refreshing attendance history:', err);
            setLocalAttendanceError('Failed to refresh attendance history');
          });
        } else {
          const errorMessage = result.payload || 'Failed to mark attendance';
          if (errorMessage.includes('already exists')) {
            setLocalAttendanceError('Attendance for this member on this date already exists.');
          } else if (errorMessage.includes('assigned members')) {
            setLocalAttendanceError('This member is not assigned to you.');
          } else if (errorMessage.includes('Invalid member')) {
            setLocalAttendanceError('Invalid member selected.');
          } else {
            setLocalAttendanceError(errorMessage);
          }
        }
      }).catch((err) => {
        console.error('Error marking attendance:', err);
        setLocalAttendanceError('An unexpected error occurred');
      });
    }
  };

  const handleViewHistory = (member) => {
    setCurrentMember(member);
    // Re-fetch attendance history to ensure the latest data
    dispatch(getAttendanceHistory(member.id))
      .unwrap()
      .then((result) => {
        console.log('Attendance Records for member', member.id, ':', result);
        setShowHistoryModal(true);
      })
      .catch((err) => {
        console.error('Error fetching attendance history:', err);
        setLocalAttendanceError('Failed to fetch attendance history');
        setShowHistoryModal(true); // Open modal to show error
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  // Helper function to format the "Marked By" field
  const formatMarkedBy = (record) => {
    // If trainer_name exists and is not the email, use it
    if (record.trainer_name && record.trainer_name !== record.trainer_email) {
      return record.trainer_name;
    }
    // Fallback to trainer_email if trainer_name is not available or is the email
    if (record.trainer_email) {
      return record.trainer_email;
    }
    return 'Not available';
  };

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">My Assigned Members</h3>
      </header>

      {(error || attendanceError || localAttendanceError) && (
        <Alert variant="danger" onClose={() => { dispatch({ type: 'auth/clearError' }); setLocalAttendanceError(null); }} dismissible>
          {error || attendanceError || localAttendanceError}
        </Alert>
      )}

      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
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
              <PersonBadge color="#7747ff" size={20} />
            </div>
            <span className="text-white">Member List</span>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading members...</p>
            </div>
          ) : !Array.isArray(assignedMembers) || assignedMembers.length === 0 ? (
            <div className="text-center my-5">
              <p className="text-white">No members assigned to you.</p>
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
                    <th>Fitness Goal</th>
                    <th>Registration Date</th>
                    <th style={{ minWidth: '220px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.id}</td>
                      <td>{member.first_name} {member.last_name}</td>
                      <td>{member.email}</td>
                      <td>{member.membership_plan ? member.membership_plan.name : 'Not Assigned'}</td>
                      <td>{member.fitness_goal || 'Not Specified'}</td>
                      <td>{formatDate(member.date_joined)}</td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px 8px',
                            maxWidth: '220px',
                          }}
                        >
                          <Button
                            key={`mark-attendance-${member.id}`}
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleMarkAttendance(member)}
                            style={{ flex: '1 1 100px', minWidth: '100px' }}
                          >
                            Mark Attendance
                          </Button>
                          <Button
                            key={`view-history-${member.id}`}
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleViewHistory(member)}
                            style={{ flex: '1 1 100px', minWidth: '100px' }}
                          >
                            View History
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Attendance Marking Modal */}
      <Modal show={showAttendanceModal} onHide={() => setShowAttendanceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mark Attendance for {currentMember?.first_name} {currentMember?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value)}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="excused">Excused</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAttendanceModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitAttendance}
            disabled={attendanceLoading}
          >
            {attendanceLoading ? 'Saving...' : 'Save Attendance'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Attendance History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Attendance History for {currentMember?.first_name} {currentMember?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {attendanceLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : !attendanceRecords[currentMember?.id] || attendanceRecords[currentMember?.id].length === 0 ? (
            <p>No attendance records found.</p>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Marked By</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords[currentMember?.id].map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                    <td>{formatMarkedBy(record)}</td>
                    <td>{formatDate(record.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TrainerMembers;




