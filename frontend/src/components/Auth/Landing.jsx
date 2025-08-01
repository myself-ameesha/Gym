import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  // Simulated authentication state
  const isAuthenticated = false; // Replace with actual authentication check

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      // Redirect to login page
      navigate('/login');
    } else {
      // Redirect to home
      navigate('/dashboard');
    }
  };

  return (
    <div
      className="relative w-screen h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/fitness-bg.jpg')` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black opacity-40"></div>

      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 w-full p-5 flex justify-between items-center z-20">
        <div className="text-2xl font-bold text-white flex items-center">
          <img src="/fitness-logo.png" alt="FitHub Logo" className="h-12 w-12 rounded-full mr-2" />
          FitHub
        </div>
        <div className="flex space-x-4">
          <Link to="/login">
            <button className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-teal-500 transition">
              Login
            </button>
          </Link>
          <Link to="/register">
            <button className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-teal-500 transition">
              Register
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Transform Your Body & Mind
        </h1>
        <p className="mb-8 text-lg md:text-xl">
          Join FitHub to get personalized training, expert guidance, and a supportive community!
        </p>

        {/* CTA Button */}
        <button
          onClick={handleGetStarted}
          className="bg-teal-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-teal-700 transition"
        >
          Get Started
        </button>

        {/* Stats */}
        <div className="flex justify-center space-x-8 mt-12">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold">50,000+</div>
            <div className="text-gray-300">Active Members</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold">1,500+</div>
            <div className="text-gray-300">Certified Trainers</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold">10,000+</div>
            <div className="text-gray-300">Workouts Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
