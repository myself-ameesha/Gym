import React from 'react';
import TrainerNavbar from './TrainerNavbar';
import 'bootstrap/dist/css/bootstrap.min.css';

const TrainerLayout = ({ children }) => {
  return (
    <div className="d-flex" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <TrainerNavbar />
      {children}
    </div>
  );
};

export default TrainerLayout;
