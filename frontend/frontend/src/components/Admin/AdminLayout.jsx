import React from 'react';
import AdminNavbar from './AdminNavbar';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminLayout = ({ children }) => {
  return (
    <div className="d-flex" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <AdminNavbar />
      {children}
    </div>
  );
};

export default AdminLayout;