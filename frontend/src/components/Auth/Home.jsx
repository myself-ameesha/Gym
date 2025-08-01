import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="position-relative">
        <div className="hero-slider">
          <div className="slide position-relative">
            <div 
              className="w-100 vh-100" 
              style={{
                backgroundImage: "url('/hero-1.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(0.7)"
              }}
            >
            </div>
            <div className="position-absolute top-50 end-0 translate-middle-y pe-5 text-start" style={{width: "40%"}}>
                  <p className="text-white text-uppercase mb-4 fw-light">S H A P E &nbsp; Y O U R &nbsp; B O D Y</p>
                  <h1 className="display-1 fw-bold text-white mb-0 lh-1">
                    BE <span className="text-warning">STRONG</span>
                  </h1>
                  <h2 className="display-2 fw-bold text-white mb-5 lh-1">
                    TRANING HARD
                  </h2>
                  <a href="/login" className="btn btn-warning py-2 px-4 text-white fw-bold text-uppercase">JOIN NOW</a>
                </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container-fluid py-5 bg-black">
        <div className="container">
          {/* Section Title */}
          <div className="text-center mb-5">
            <h5 className="text-warning mb-2">WHY CHOSE US?</h5>
            <h1 className="text-white text-uppercase fw-bold">PUSH YOUR LIMITS FORWARD</h1>
          </div>
          
          {/* Features */}
          <div className="row justify-content-center">
            {/* Feature 1 */}
            <div className="col-md-3 mb-4 text-center">
              <div className="mb-4">
                <div className="rounded-circle bg-dark d-inline-flex align-items-center justify-content-center" style={{width: "120px", height: "120px"}}>
                  <i className="fas fa-dumbbell" style={{color: "#FFC107", fontSize: "2.5rem"}}></i>
                </div>
              </div>
              <h5 className="text-white text-uppercase fw-bold mb-3">Expert Trainers</h5>
              <p className="text-secondary px-4">
              Our certified trainers are here to guide, motivate, and support you on your fitness journey with personalized workout plans and expert advice.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="col-md-3 mb-4 text-center">
              <div className="mb-4">
                <div className="rounded-circle bg-dark d-inline-flex align-items-center justify-content-center" style={{width: "120px", height: "120px"}}>
                  <i className="fas fa-apple-alt" style={{color: "#FFC107", fontSize: "2.5rem"}}></i>
                </div>
              </div>
              <h5 className="text-white text-uppercase fw-bold mb-3">HEALTHY NUTRITION PLAN</h5>
              <p className="text-secondary px-4">
              Achieve your fitness goals with a personalized nutrition plan designed to fuel your body and enhance performance.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="col-md-3 mb-4 text-center">
              <div className="mb-4">
                <div className="rounded-circle bg-dark d-inline-flex align-items-center justify-content-center" style={{width: "120px", height: "120px"}}>
                  <i className="fas fa-dumbbell" style={{color: "#FFC107", fontSize: "2.5rem"}}></i>
                </div>
              </div>
              <h5 className="text-white text-uppercase fw-bold mb-3">PROFESSIONAL TRAINING PLAN</h5>
              <p className="text-secondary px-4">
              Our expert trainers create customized workout plans tailored to your fitness level and goals, ensuring steady progress.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="col-md-3 mb-4 text-center">
              <div className="mb-4">
                <div className="rounded-circle bg-dark d-inline-flex align-items-center justify-content-center" style={{width: "120px", height: "120px"}}>
                  <i className="fas fa-heartbeat" style={{color: "#FFC107", fontSize: "2.5rem"}}></i>
                </div>
              </div>
              <h5 className="text-white text-uppercase fw-bold mb-3">UNIQUE TO YOUR NEEDS</h5>
              <p className="text-secondary px-4">
              Every fitness journey is different. Our programs are personalized to suit your needs, whether you're a beginner or a pro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;