// import React from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import { logout } from "../../features/auth/authSlice";

// const Navbar = () => {
//   const { isAuthenticated } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const handleLogout = (e) => {
//     e.preventDefault();
//     dispatch(logout());
//     navigate("/Login");
//   };

//   return (
//     <nav className="navbar navbar-expand-lg navbar-dark bg-black py-3">
//       <div className="container">
//         {/* Logo */}
//         <Link to="/" className="navbar-brand d-flex align-items-center">
//           <i className="fas fa-dumbbell me-2" style={{color: "#FFC107", fontSize: "2rem"}}></i>
//           <span className="fs-3 fw-bold text-white">GYM</span>
//           <i className="fas fa-dumbbell ms-2" style={{color: "#FFC107", fontSize: "2rem"}}></i>
//         </Link>

//         {/* Hamburger Menu */}
//         <button
//           className="navbar-toggler"
//           type="button"
//           data-bs-toggle="collapse"
//           data-bs-target="#navbarNav"
//           aria-controls="navbarNav"
//           aria-expanded="false"
//           aria-label="Toggle navigation"
//         >
//           <span className="navbar-toggler-icon"></span>
//         </button>

//         {/* Navigation Links */}
//         <div className="collapse navbar-collapse" id="navbarNav">
//           <ul className="navbar-nav ms-auto">
//             <li className="nav-item">
//               <Link to="/" className="nav-link text-white">HOME</Link>
//             </li>
//             <li className="nav-item">
//               <Link to="/about" className="nav-link text-white">ABOUT US</Link>
//             </li>
//             <li className="nav-item">
//               <Link to="/services" className="nav-link text-white">SERVICES</Link>
//             </li>
//             <li className="nav-item">
//               <Link to="/our-team" className="nav-link text-white">OUR TEAM</Link>
//             </li>
//             <li className="nav-item">
//               <Link to="/BMICalculator" className="nav-link text-white">BMI</Link>
//             </li>
            
//             {isAuthenticated ? (
//               <>
//                 <li className="nav-item">
//                   <Link to="/MemberDashboard" className="nav-link text-white">DASHBOARD</Link>
//                 </li>
//                 <li className="nav-item">
//                   <a href="#" onClick={handleLogout} className="nav-link text-white">LOGOUT</a>
//                 </li>
//               </>
//             ) : (
//               <li className="nav-item">
//                 <Link to="/login" className="nav-link text-white">SIGNUP</Link>
//               </li>
//             )}
//           </ul>
          
//           {/* Social Media Icons */}
//           <div className="ms-lg-4 d-none d-lg-flex">
//             <a href="#" className="text-white mx-2"><i className="fab fa-facebook-f"></i></a>
//             <a href="#" className="text-white mx-2"><i className="fab fa-twitter"></i></a>
//             <a href="#" className="text-white mx-2"><i className="fab fa-youtube"></i></a>
//             <a href="#" className="text-white mx-2"><i className="fab fa-instagram"></i></a>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { FaBell } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.notifications); // Use notifications slice
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate("/Login");
  };

  // Calculate unread notifications count
  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-black py-3">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <i className="fas fa-dumbbell me-2" style={{ color: "#FFC107", fontSize: "2rem" }}></i>
          <span className="fs-3 fw-bold text-white">GYM</span>
          <i className="fas fa-dumbbell ms-2" style={{ color: "#FFC107", fontSize: "2rem" }}></i>
        </Link>

        {/* Hamburger Menu */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link to="/" className="nav-link text-white">HOME</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link text-white">ABOUT US</Link>
            </li>
            <li className="nav-item">
              <Link to="/services" className="nav-link text-white">SERVICES</Link>
            </li>
            <li className="nav-item">
              <Link to="/our-team" className="nav-link text-white">OUR TEAM</Link>
            </li>
            <li className="nav-item">
              <Link to="/BMICalculator" className="nav-link text-white">BMI</Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link to="/MemberDashboard" className="nav-link text-white">DASHBOARD</Link>
                </li>
                <li className="nav-item">
                  <Link to="/Notifications" className="nav-link text-white d-flex align-items-center">
                    {/* <FaBell className="me-2" /> */}
                    NOTIFICATIONS
                    {unreadCount > 0 && (
                      <span
                        className="ms-2 badge rounded-pill bg-danger"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
                <li className="nav-item">
                  <a href="#" onClick={handleLogout} className="nav-link text-white">LOGOUT</a>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link to="/login" className="nav-link text-white">SIGNUP</Link>
              </li>
            )}
          </ul>

          {/* Social Media Icons */}
          <div className="ms-lg-4 d-none d-lg-flex">
            <a href="#" className="text-white mx-2"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="text-white mx-2"><i className="fab fa-twitter"></i></a>
            <a href="#" className="text-white mx-2"><i className="fab fa-youtube"></i></a>
            <a href="#" className="text-white mx-2"><i className="fab fa-instagram"></i></a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

