import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { 
  People, 
  PersonBadge, 
  Calendar, 
  GraphUpArrow, // Changed from CashStack to GraphUpArrow for better revenue representation
  Activity,
  Bell,
  CardChecklist
} from 'react-bootstrap-icons';
import { getMembers, getTrainers, getMembershipPlans, fetchRevenueData } from '../../features/auth/authApi';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminHome = () => {
  const dispatch = useDispatch();
  const { members, trainers, membershipPlans, revenueData, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Fetch all necessary data on component mount
    dispatch(getMembers());
    dispatch(getTrainers());
    dispatch(getMembershipPlans());
    dispatch(fetchRevenueData({ startDate: null, endDate: null }));
  }, [dispatch]);

  // Calculate stats
  const totalUsers = members?.length || 0;
  const totalTrainers = trainers?.length || 0;
  const totalRevenue = revenueData?.total_revenue || 0;
  const totalMembershipPlans = membershipPlans?.length || 0;

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Dashboard</h3>
        <div className="d-flex align-items-center">
          <div className="me-3">
            <Bell color="white" />
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#7747ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white' }}>A</span>
          </div>
          <div className="ms-2 text-white">
            Admin User
          </div>
        </div>
      </header>
      
      <Row className="mb-4">
        <Col md={3}>
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <div className="me-2" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(119, 71, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <People color="#7747ff" size={20} />
                  </div>
                  <span className="text-white">Total Users</span>
                </div>
                <Button variant="link" className="text-white">...</Button>
              </div>
              <h2 className="text-white mb-0">{totalUsers}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <div className="me-2" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233, 30, 99, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PersonBadge color="#e91e63" size={20} />
                  </div>
                  <span className="text-white">Total Trainers</span>
                </div>
                <Button variant="link" className="text-white">...</Button>
              </div>
              <h2 className="text-white mb-0">{totalTrainers}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <div className="me-2" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(255, 193, 7, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GraphUpArrow color="#ffc107" size={20} /> {/* Changed from CashStack to GraphUpArrow */}
                  </div>
                  <span className="text-white">Total Revenue</span>
                </div>
                <Button variant="link" className="text-white">...</Button>
              </div>
              <h2 className="text-white mb-0">₹{totalRevenue.toFixed(2)}</h2>
              {/* <span className="text-success">
                <span className="me-1">7.3%</span>
                <span>↑</span>
              </span> */}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <div className="me-2" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(0, 188, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CardChecklist color="#00bcd4" size={20} />
                  </div>
                  <span className="text-white">Membership Plans</span>
                </div>
                <Button variant="link" className="text-white">...</Button>
              </div>
              <h2 className="text-white mb-0">{totalMembershipPlans}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminHome;