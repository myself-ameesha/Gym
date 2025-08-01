import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Add useLocation
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { 
  House, 
  People, 
  PersonBadge,
  Calendar,
  CreditCard,
  BoxArrowRight,
  CurrencyDollar,
  GraphUpArrow, // For Revenue - shows growth trend
  FileBarGraph // For Sales Report - represents data/reports
} from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation(); // Get current location
  
  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate('/Login');
  };

  // Function to check if the link is active
  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar" style={{ width: '280px', height: '100vh', backgroundColor: '#0c1427', borderRight: '1px solid #1a2235', padding: '20px' }}>
      <div className="d-flex align-items-center mb-4">
        <div className="me-2" style={{ backgroundColor: '#7747ff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 'bold' }}>A</span>
        </div>
        <h4 className="mb-0 text-white">Welcome Admin</h4>
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
          to="/Admin/AdminHome" 
          className={`d-flex align-items-center mb-3 ${isActive('/Admin/AdminHome') ? 'text-white' : 'text-white-50'}`}
        >
          <House className="me-3" />
          Dashboard
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Admin/AdminMembers" 
          className={`d-flex align-items-center mb-3 ${isActive('/Admin/AdminMembers') ? 'text-white' : 'text-white-50'}`}
        >
          <People className="me-3" />
          Users
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Admin/TrainerList" 
          className={`d-flex align-items-center mb-3 ${isActive('/Admin/TrainerList') ? 'text-white' : 'text-white-50'}`}
        >
          <PersonBadge className="me-3" />
          Trainers
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Admin/MembershipPlanList" 
          className={`d-flex align-items-center mb-3 ${isActive('/Admin/MembershipPlanList') ? 'text-white' : 'text-white-50'}`}
        >
          <CreditCard className="me-3" />
          Membership Plans
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Admin/AdminMarkTrainerAttendance" 
          className={`d-flex align-items-center mb-3 ${isActive('/Admin/AdminMarkTrainerAttendance') ? 'text-white' : 'text-white-50'}`}
        >
          <Calendar className="me-3" />
          Trainer Attendance
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/Admin/PaidMembersList" 
          className={`d-flex align-items-center mb-3 ${isActive('/Admin/PaidMembersList') ? 'text-white' : 'text-white-50'}`}
        >
          <CurrencyDollar className="me-3" />
          Payments
        </Nav.Link>

        <Nav.Link 
          as={Link} 
          to="/Admin/RevenuePage" 
          className={`d-flex align-items-center mb-3 ${isActive('/Admin/RevenuePage') ? 'text-white' : 'text-white-50'}`}
        >
          <GraphUpArrow className="me-3" />
          Revenue
        </Nav.Link>

        <Nav.Link 
          as={Link} 
          to="/Admin/SalesReportPage" 
          className={`d-flex align-items-center mb-3 ${isActive('/Admin/SalesReportPage') ? 'text-white' : 'text-white-50'}`}
        >
          <FileBarGraph className="me-3" />
         Sales Report
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
      
      <div className="mt-4">
        <div className="d-flex align-items-center">
          {/* Profile section is empty in original - keeping it this way */}
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;