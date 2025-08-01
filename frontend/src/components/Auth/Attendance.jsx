import React, { useEffect } from 'react';
import { Card, Table, Spinner } from 'react-bootstrap';
import { Calendar } from 'react-bootstrap-icons';
import { useSelector, useDispatch } from 'react-redux';
import { getAttendanceHistory, getCurrentMember } from '../../features/auth/authApi';

const Attendance = () => {
  const dispatch = useDispatch();
  const { currentMember, attendanceRecords, attendanceLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (currentMember?.id) {
      dispatch(getAttendanceHistory(currentMember.id));
    } else {
      dispatch(getCurrentMember());
    }
  }, [dispatch, currentMember?.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const formatMarkedBy = (record) => {
    if (record.trainer_name && record.trainer_name !== record.trainer_email) {
      return record.trainer_name;
    }
    if (record.trainer_email) {
      return record.trainer_email;
    }
    return 'Not available';
  };

  return (
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
            <Calendar color="#7747ff" size={20} />
          </div>
          <span className="text-white">Attendance History</span>
        </div>
        {attendanceLoading ? (
          <div className="text-center">
            <Spinner animation="border" variant="light" />
          </div>
        ) : !attendanceRecords[currentMember?.id] || !Array.isArray(attendanceRecords[currentMember?.id]) || attendanceRecords[currentMember?.id].length === 0 ? (
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
                {attendanceRecords[currentMember.id].map((record) => (
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
      </Card.Body>
    </Card>
  );
};

export default Attendance;