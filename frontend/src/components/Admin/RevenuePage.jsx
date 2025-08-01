import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenueData } from '../../features/auth/authApi';
import { Card, Table, Spinner, Alert, Form, Button } from 'react-bootstrap';
import { CurrencyDollar, List } from 'react-bootstrap-icons';

const RevenuePage = () => {
  const dispatch = useDispatch();
  const { revenueData, loading, error } = useSelector((state) => state.auth);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchRevenueData({ startDate: null, endDate: null }));
  }, [dispatch]);

  const handleDateChange = () => {
    dispatch(fetchRevenueData({ startDate: startDate || null, endDate: endDate || null }));
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    dispatch(fetchRevenueData({ startDate: null, endDate: null }));
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
  };

  // Ensure payments is an array before mapping
  const paymentsList = Array.isArray(revenueData?.payments) ? revenueData.payments : [];

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Revenue Dashboard</h3>
      </header>

      {error && (
        <Alert variant="danger" onClose={() => dispatch({ type: 'auth/clearError' })} dismissible>
          {error}
        </Alert>
      )}

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
                <CurrencyDollar color="#7747ff" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Total Revenue (INR)</h6>
                <h3 className="text-white mb-0">₹{(revenueData?.total_revenue || 0).toFixed(2)}</h3>
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
                  backgroundColor: 'rgba(119, 71, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                }}
              >
                <List color="#7747ff" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Total Payments</h6>
                <h3 className="text-white mb-0">{revenueData?.payment_count || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-4">
        <Form className="d-flex align-items-center gap-3">
          <Form.Group>
            <Form.Label className="text-white">Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ backgroundColor: '#101c36', color: '#fff', borderColor: '#7747ff' }}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className="text-white">End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ backgroundColor: '#101c36', color: '#fff', borderColor: '#7747ff' }}
            />
          </Form.Group>
          <div className="align-self-end">
            <Button
              variant="primary"
              onClick={handleDateChange}
              style={{ backgroundColor: '#7747ff', borderColor: '#7747ff' }}
            >
              Apply Filter
            </Button>
            <Button
              variant="outline-light"
              onClick={clearFilters}
              className="ms-2"
            >
              Clear Filters
            </Button>
          </div>
        </Form>
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
                <CurrencyDollar color="#7747ff" size={20} />
              </div>
              <span className="text-white">Payment Records</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading payments...</p>
            </div>
          ) : paymentsList.length === 0 ? (
            <div className="text-center my-5">
              <p className="text-white">No payment records found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>User Email</th>
                    <th>User Name</th>
                    <th>Membership Plan</th>
                    <th>Amount (INR)</th>
                    <th>Date</th>
                    <th>Razorpay Payment ID</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.id}</td>
                      <td>{payment.user_email}</td>
                      <td>{payment.user_name}</td>
                      <td>{payment.membership_plan}</td>
                      <td>₹{payment.amount.toFixed(2)}</td>
                      <td>{formatDateTime(payment.created_at)}</td>
                      <td>{payment.razorpay_payment_id}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default RevenuePage;



