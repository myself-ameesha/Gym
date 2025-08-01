import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  House,
  People,
  ClipboardCheck,
  Lightning,
  BoxArrowRight,
  Chat,
  Star as StarIcon,
  Calendar
} from 'react-bootstrap-icons';
import { FaBell } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';

const TrainerNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Access notifications from the notifications slice
  const { notifications } = useSelector((state) => state.notifications || { notifications: [] });
  // Calculate unread notifications count
  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const isActive = (path, section) => {
    const params = new URLSearchParams(location.search);
    const currentSection = params.get('section');
    return location.pathname === path && (!section || currentSection === section);
  };

  return (
    <div className="sidebar" style={{ width: '280px', height: '100vh', backgroundColor: '#0c1427', borderRight: '1px solid #1a2235', padding: '20px' }}>
      <div className="d-flex align-items-center mb-4">
        <div className="me-2" style={{ backgroundColor: '#7747ff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 'bold' }}>T</span>
        </div>
        <h4 className="mb-0 text-white">Welcome Trainer</h4>
      </div>
      
      <div className="mb-4">
        <input 
          type="text" 
          className="form-control"
          placeholder="Search..." 
          style={{ backgroundColor: '#101c36', border: '1px solid #1a2235', color: 'white' }}
        />
      </div>
      
      <Nav className="flex-column mb-4">

      <Nav.Link 
          as={Link} 
          to="/Trainer/TrainerHome" 
          className={`d-flex align-items-center mb-3 ${isActive('/Trainer/TrainerHome', 'profile') ? 'text-white' : 'text-white-50'}`}
        >
          <House className="me-3" />
          Home
        </Nav.Link>

        <Nav.Link 
          as={Link} 
          to="/Trainer/TrainerDashboard?section=profile" 
          className={`d-flex align-items-center mb-3 ${isActive('/Trainer/TrainerDashboard', 'profile') ? 'text-white' : 'text-white-50'}`}
        >
          <House className="me-3" />
          Profile
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Trainer/TrainerMembers" 
          className={`d-flex align-items-center mb-3 ${isActive('/Trainer/TrainerMembers') ? 'text-white' : 'text-white-50'}`}
        >
          <People className="me-3" />
          Clients
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Trainer/DietPlanManagement" 
          className={`d-flex align-items-center mb-3 ${isActive('/Trainer/DietPlanManagement') ? 'text-white' : 'text-white-50'}`}
        >
          <ClipboardCheck className="me-3" />
          Diet Plan
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Trainer/WorkoutManagement" 
          className={`d-flex align-items-center mb-3 ${isActive('/Trainer/WorkoutManagement') ? 'text-white' : 'text-white-50'}`}
        >
          <Lightning className="me-3" />
          Workout Management
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Trainer/TrainerDashboard?section=community" 
          className={`d-flex align-items-center mb-3 ${isActive('/Trainer/TrainerDashboard', 'community') ? 'text-white' : 'text-white-50'}`}
        >
          <Chat className="me-3" />
          Manage Chats
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Trainer/Notifications" 
          className={`d-flex align-items-center mb-3 ${isActive('/Trainer/Notifications') ? 'text-white' : 'text-white-50'}`}
        >
          <FaBell className="me-3" />
          Notifications
          {unreadCount > 0 && (
            <span 
              className="ms-2 badge rounded-pill bg-danger" 
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              {unreadCount}
            </span>
          )}
        </Nav.Link>

          <Nav.Link 
          as={Link} 
          to="/Trainer/TrainerRatingsView" 
          className={`d-flex align-items-center mb-3 ${isActive('/Trainer/TrainerRatingsView') ? 'text-white' : 'text-white-50'}`}
        >
          <StarIcon className="me-3" />
          Rating & Review
        </Nav.Link>
        
          <Nav.Link 
          as={Link} 
          to="/Trainer/TrainerAttendance" 
          className={`d-flex align-items-center mb-3 ${isActive('/Trainer/TrainerAttendance') ? 'text-white' : 'text-white-50'}`}
        >
          <Calendar className="me-3" />
         Attendance
        </Nav.Link>
          

      </Nav>
      
      <Nav className="flex-column mt-auto">
        <Nav.Link 
          onClick={handleLogout} 
          className="text-white-50 d-flex align-items-center mb-3" 
          style={{ cursor: 'pointer' }}
        >
          <BoxArrowRight className="me-3" />
          Logout
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default TrainerNavbar;
