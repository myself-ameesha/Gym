import React from "react";

const AuthLayout = ({ children }) => {
    return (
      <main className="vh-100 d-flex justify-content-center align-items-center bg-dark">
        {children}
      </main>
    );
  };

export default AuthLayout;