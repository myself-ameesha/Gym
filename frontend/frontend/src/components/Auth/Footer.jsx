import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <>
      {/* Contact Info Bar */}
      <div className="bg-black py-4 border-bottom border-dark">
        <div className="container">
          <div className="row justify-content-center">
            {/* Address */}
            <div className="col-md-4 d-flex align-items-center mb-3 mb-md-0">
              <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center me-3" style={{width: "60px", height: "60px"}}>
                <i className="fas fa-map-marker-alt text-white fs-4"></i>
              </div>
              <div>
                <p className="text-white mb-0">GYM FITNESS CENTRE 123 ALUWAYE </p>
                <p className="text-white mb-0">NH 17</p>
              </div>
            </div>
            
            {/* Phone */}
            <div className="col-md-4 d-flex align-items-center mb-3 mb-md-0">
              <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center me-3" style={{width: "60px", height: "60px"}}>
                <i className="fas fa-mobile-alt text-white fs-4"></i>
              </div>
              <div>
                <p className="text-white mb-0">8301949618</p>
              </div>
            </div>
            
            {/* Email */}
            <div className="col-md-4 d-flex align-items-center">
              <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center me-3" style={{width: "60px", height: "60px"}}>
                <i className="fas fa-envelope text-white fs-4"></i>
              </div>
              <div>
                <p className="text-white mb-0">gymcenter@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
{/* Main Footer */}
<footer className="bg-black py-5">
  <div className="container">
    <div className="row justify-content-center text-center">
      {/* Column 1: Logo and Description */}
      <div className="col-lg-6">
        {/* Logo */}
        <Link to="/" className="navbar-brand d-flex justify-content-center align-items-center mb-3">
          <i className="fas fa-dumbbell me-2" style={{color: "#FFC107", fontSize: "2rem"}}></i>
          <span className="fs-3 fw-bold text-white">GYM</span>
          <i className="fas fa-dumbbell ms-2" style={{color: "#FFC107", fontSize: "2rem"}}></i>
        </Link>
        <p className="text-secondary mb-4">
          Join our community and take the first step towards a healthier, stronger you!
        </p>
        {/* Social Media Links */}
        <div className="d-flex justify-content-center">
          <a href="#" className="text-secondary mx-2"><i className="fab fa-facebook-f"></i></a>
          <a href="#" className="text-secondary mx-2"><i className="fab fa-twitter"></i></a>
          <a href="#" className="text-secondary mx-2"><i className="fab fa-youtube"></i></a>
          <a href="#" className="text-secondary mx-2"><i className="fab fa-instagram"></i></a>
          <a href="#" className="text-secondary mx-2"><i className="fas fa-envelope"></i></a>
        </div>
      </div>
    </div>
  </div>
</footer>

      
      {/* Copyright */}
      <div className="bg-black py-3 border-top border-dark">
        <div className="container">
          <div className="text-center text-secondary">
            <small>© {new Date().getFullYear()} All rights reserved | GYM Fitness Center</small>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;