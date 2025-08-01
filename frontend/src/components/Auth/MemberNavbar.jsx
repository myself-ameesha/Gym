import React from 'react';
import { Navbar, Nav, Container, Badge } from 'react-bootstrap';
import { FaBell, FaComment, FaDumbbell, FaUtensils } from 'react-icons/fa';
import { Person, Calendar, StarFill } from 'react-bootstrap-icons';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';

const MemberNavbar = () => {
  const location = useLocation();
  const { notifications } = useSelector((state) => state.chat);
  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4" style={{ backgroundColor: '#101c36' }}>
      <Container>
        <Navbar.Brand as={Link} to="profile" className="text-white">
          Member Dashboard
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/dashboard/profile"
              active={location.pathname === '/dashboard/profile'}
              className="text-white d-flex align-items-center"
            >
              <Person size={20} className="me-2" />
              Profile
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard/attendance"
              active={location.pathname === '/dashboard/attendance'}
              className="text-white d-flex align-items-center"
            >
              <Calendar size={20} className="me-2" />
              Attendance
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard/diet"
              active={location.pathname === '/dashboard/diet'}
              className="text-white d-flex align-items-center"
            >
              <FaUtensils size={20} className="me-2" />
              Diet Plans
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard/workout"
              active={location.pathname === '/dashboard/workout'}
              className="text-white d-flex align-items-center"
            >
              <FaDumbbell size={20} className="me-2" />
              Workout Routines
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard/chat"
              active={location.pathname === '/dashboard/chat'}
              className="text-white d-flex align-items-center"
            >
              <FaComment size={20} className="me-2" />
              Chat with Trainer
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard/community"
              active={location.pathname === '/dashboard/community'}
              className="text-white d-flex align-items-center"
            >
              <FaComment size={20} className="me-2" />
              Community Chat
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/Notifications"
              active={location.pathname === '/Notifications'}
              className="text-white d-flex align-items-center"
            >
              <FaBell size={20} className="me-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge bg="danger" className="ms-2" style={{ fontSize: '0.75rem' }}>
                  {unreadCount}
                </Badge>
              )}
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/Rating"
              active={location.pathname === '/Rating'}
              className="text-white d-flex align-items-center"
            >
              <StarFill size={20} className="me-2" />
              Rating & Review
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MemberNavbar;