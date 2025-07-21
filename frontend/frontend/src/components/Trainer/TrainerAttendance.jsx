import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Spinner, Alert } from 'react-bootstrap';
import { Calendar } from 'react-bootstrap-icons';
import { getCurrentTrainer, getTrainerAttendanceHistory } from '../../features/auth/authApi';
import { clearError } from '../../features/auth/authSlice';

const TrainerAttendance = () => {
  const dispatch = useDispatch();
  const { 
    currentTrainer, 
    trainerAttendanceRecords, 
    trainerAttendanceLoading, 
    loading, 
    error 
  } = useSelector((state) => state.auth);
  
  const trainerId = currentTrainer?.id;

  // First, ensure we have the current trainer data
  useEffect(() => {
    if (!currentTrainer) {
      console.log('Fetching current trainer data...');
      dispatch(getCurrentTrainer());
    }
  }, [dispatch, currentTrainer]);

  // Then, fetch attendance data when trainer is available
  useEffect(() => {
    console.log('currentTrainer:', currentTrainer);
    console.log('trainerId:', trainerId);
    
    if (trainerId) {
      console.log('Fetching attendance history for trainer:', trainerId);
      dispatch(getTrainerAttendanceHistory(trainerId));
    } else {
      console.log('No trainerId available, skipping attendance fetch');
    }
  }, [dispatch, trainerId]);

  // Debug logs
  useEffect(() => {
    console.log('trainerAttendanceRecords state:', trainerAttendanceRecords);
    console.log('trainerAttendanceLoading:', trainerAttendanceLoading);
    console.log('loading:', loading);
    console.log('error:', error);
    if (trainerId && trainerAttendanceRecords[trainerId]) {
      console.log('Rendered attendanceRecords:', trainerAttendanceRecords[trainerId]);
    }
  }, [trainerAttendanceRecords, trainerAttendanceLoading, loading, error, trainerId]);

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

  // Show loading if we're still fetching trainer data or attendance data
  const isLoading = loading || trainerAttendanceLoading || !currentTrainer;

  // Get attendance records for current trainer
  const attendanceRecords = trainerId ? trainerAttendanceRecords[trainerId] : null;

  return (
    <div>
      <div className="d-flex align-items-center mb-3 pt-5">
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
      
      {error && (
        <Alert variant="danger" onClose={() => dispatch(clearError())} dismissible>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}
      
      {isLoading ? (
        <div className="text-center">
          <Spinner animation="border" variant="light" />
          <p className="text-white mt-2">
            {!currentTrainer ? 'Loading trainer data...' : 'Loading attendance records...'}
          </p>
        </div>
      ) : !trainerId ? (
        <div>
          <p className="text-white">Unable to load trainer information.</p>
          <p className="text-muted">Please try refreshing the page.</p>
        </div>
      ) : !attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0 ? (
        <div>
          <p className="text-white">No attendance records found.</p>
          {/* Debug info - remove this in production */}
          <details className="mt-2">
            <summary className="text-muted" style={{ cursor: 'pointer' }}>
              Debug Info (Click to expand)
            </summary>
            <pre className="text-muted mt-2" style={{ fontSize: '0.8em' }}>
              {JSON.stringify({
                trainerId,
                attendanceRecords,
                hasRecords: !!attendanceRecords,
                isArray: Array.isArray(attendanceRecords),
                length: attendanceRecords?.length
              }, null, 2)}
            </pre>
          </details>
        </div>
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
              {attendanceRecords.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.date)}</td>
                  <td>
                    <span className={`badge ${record.status === 'present' ? 'bg-success' : 'bg-danger'}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td>{formatMarkedBy(record)}</td>
                  <td>{formatDate(record.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TrainerAttendance;