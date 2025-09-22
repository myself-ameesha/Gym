// Create a new component: MembershipHistory.jsx

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaHistory, FaCreditCard } from 'react-icons/fa';
import { getMembershipHistory } from '../../features/auth/authApi';

const MembershipHistory = () => {
  const dispatch = useDispatch();
  
  const {
    membershipHistory,
    membershipHistoryLoading,
    membershipHistoryError,
    currentMember
  } = useSelector((state) => state.auth);

  // Ensure membershipHistory is always an array
  const historyData = Array.isArray(membershipHistory) 
    ? membershipHistory 
    : (membershipHistory?.data && Array.isArray(membershipHistory.data)) 
      ? membershipHistory.data 
      : [];

  useEffect(() => {
    if (currentMember?.id) {
      dispatch(getMembershipHistory());
    }
  }, [dispatch, currentMember?.id]);

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

  const formatAmount = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const getTransactionBadge = (isUpgrade, isRenewal) => {
    if (isUpgrade) {
      return <Badge bg="info">Upgrade</Badge>;
    }
    if (isRenewal) {
      return <Badge bg="success">Renewal</Badge>;
    }
    return <Badge bg="primary">New Purchase</Badge>;
  };

  const getStatusBadge = (isActive, endDate) => {
    if (!isActive) {
      return <Badge bg="danger">Inactive</Badge>;
    }
    
    if (endDate && new Date(endDate) < new Date()) {
      return <Badge bg="warning">Expired</Badge>;
    }
    
    return <Badge bg="success">Active</Badge>;
  };

  if (membershipHistoryLoading) {
    return (
      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
        <Card.Body>
          <div className="text-center">
            <Spinner animation="border" variant="light" />
            <p className="text-white mt-2">Loading membership history...</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (membershipHistoryError) {
    return (
      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
        <Card.Body>
          <Alert variant="danger">
            <strong>Error:</strong> {membershipHistoryError}
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
      <Card.Body>
        <div className="d-flex align-items-center mb-4">
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
            <FaHistory color="#7747ff" size={20} />
          </div>
          <h5 className="text-white mb-0">Membership History</h5>
        </div>

        {!historyData || historyData.length === 0 ? (
          <Alert variant="info" style={{ backgroundColor: '#1a2a44', borderColor: '#2a3b6a', color: '#ffffff' }}>
            <FaCreditCard size={20} className="me-2" />
            No membership history found. Your first membership purchase will appear here.
          </Alert>
        ) : (
          <>
            <div className="mb-3">
              <small className="text-white-50">
                Total Records: {historyData.length}
              </small>
            </div>
            
            <div className="table-responsive">
              <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    {/* <th>Transaction Type</th> */}
                    <th>Amount Paid</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    {/* <th>Payment ID</th> */}
                    {/* <th>Created At</th> */}
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((record) => (
                    <tr key={record.id}>
                      {/* <td className="text-white">
                        <strong>{record.plan_name || 'Unknown Plan'}</strong>
                        {record.description && (
                          <div>
                            <small className="text-white-50">
                              {record.description.length > 50 
                                ? `${record.description.substring(0, 50)}...`
                                : record.description
                              }
                            </small>
                          </div>
                        )}
                      </td> */}
                      <td className="text-white">
                        <strong>{record.plan_name || 'Unknown Plan'}</strong>
                        </td>

                      {/* <td>
                        {getTransactionBadge(record.is_upgrade, record.is_renewal)}
                      </td> */}
                      <td className="text-white">
                        <strong>{formatAmount(record.price)}</strong>
                      </td>
                      <td className="text-white">
                        {formatDate(record.start_date)}
                      </td>
                      <td className="text-white">
                        {formatDate(record.end_date)}
                      </td>
                      <td>
                        {getStatusBadge(record.is_active, record.end_date)}
                      </td>
                      {/* <td className="text-white">
                        <small className="font-monospace">
                          {record.id || 'N/A'}
                        </small>
                      </td> */}
                      {/* <td className="text-white">
                        <small>{formatDateTime(record.start_date)}</small>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default MembershipHistory;