import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import { FaMoneyBillWave } from 'react-icons/fa';
import { getCurrentMember, getMembershipHistory } from '../../features/auth/authApi';
import { clearError } from '../../features/auth/authSlice';

const MembershipHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentMember, membershipHistory, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log('Component mounted, currentMember:', currentMember);
    console.log('Current membershipHistory state:', membershipHistory);
    
    // Always fetch membership history regardless of currentMember
    console.log('Fetching membership history...');
    dispatch(getMembershipHistory()).then((result) => {
      console.log('getMembershipHistory result:', result);
    }).catch((err) => {
      console.error('getMembershipHistory error:', err);
    });
  }, [dispatch]); // Removed currentMember dependency to avoid infinite loops

  // Add debug logging when membershipHistory changes
  useEffect(() => {
    console.log('Membership history updated:', membershipHistory);
    console.log('Type of membershipHistory:', typeof membershipHistory);
    console.log('Is array:', Array.isArray(membershipHistory));
    console.log('Length:', membershipHistory?.length);
  }, [membershipHistory]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? 'N/A' : numPrice.toFixed(2);
    }
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    return 'N/A';
  };

  const handleClearError = () => {
    if (error) dispatch(clearError());
  };

  // Enhanced debugging for membershipHistory
  const renderMembershipHistory = () => {
    console.log('Rendering membership history...');
    console.log('membershipHistory value:', membershipHistory);
    console.log('membershipHistory type:', typeof membershipHistory);
    console.log('Is membershipHistory an array?', Array.isArray(membershipHistory));
    
    if (loading) {
      return (
        <div className="text-center">
          <Spinner animation="border" variant="light" />
          <p className="text-white mt-2">Loading membership history...</p>
        </div>
      );
    }

    // Check if membershipHistory is null, undefined, or not an array
    if (!membershipHistory) {
      return (
        <div>
          <p className="text-white">No membership history found (null/undefined).</p>
          <small className="text-muted">
            Debug: membershipHistory = {JSON.stringify(membershipHistory)}
          </small>
        </div>
      );
    }

    if (!Array.isArray(membershipHistory)) {
      return (
        <div>
          <p className="text-white">Invalid membership history format (not an array).</p>
          <small className="text-muted">
            Debug: membershipHistory type = {typeof membershipHistory}, 
            value = {JSON.stringify(membershipHistory)}
          </small>
        </div>
      );
    }

    if (membershipHistory.length === 0) {
      return (
        <div>
          <p className="text-white">No membership history records found (empty array).</p>
          <small className="text-muted">
            Debug: Array length = {membershipHistory.length}
          </small>
        </div>
      );
    }

    // If we have valid data, render the table
    return (
      <div className="table-responsive">
        <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Duration (Days)</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {membershipHistory.map((record, index) => {
              console.log(`Rendering record ${index}:`, record);
              return (
                <tr key={record.id || index}>
                  <td>{record.plan_name || 'Not available'}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{record.description || 'Not available'}</td>
                  <td>₹{formatPrice(record.price)}</td>
                  <td>{record.duration_days || 'N/A'}</td>
                  <td>{formatDate(record.start_date)}</td>
                  <td>{formatDate(record.end_date)}</td>
                  <td>
                    <span className={record.is_active ? 'text-success' : 'text-danger'}>
                      {record.is_active ? 'Active' : 'Expired'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <div className="d-flex" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <div
        style={{
          width: '250px',
          backgroundColor: '#101c36',
          padding: '20px',
          borderRight: '1px solid #1a2a44',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <h4 className="text-white mb-4">Dashboard</h4>
        <ul className="list-unstyled">
          <li>
            <button
              className="btn btn-link text-white w-100 text-start"
              onClick={() => navigate('/MemberDashboard')}
            >
              Back to Dashboard
            </button>
          </li>
        </ul>
      </div>

      <div className="flex-grow-1 p-4">
        <header className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-white">Membership History</h3>
        </header>

        {error && (
          <Alert variant="danger" onClose={handleClearError} dismissible>
            {error}
          </Alert>
        )}

        <Container>
          <Row>
            <Col md={12} className="mb-4">
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
                      <FaMoneyBillWave color="#7747ff" size={20} />
                    </div>
                    <span className="text-white">Membership Plan History</span>
                  </div>
                  {renderMembershipHistory()}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default MembershipHistory;

