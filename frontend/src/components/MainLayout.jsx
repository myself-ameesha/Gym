import React from "react";
import Navbar from "./Auth/Navbar";
import Footer from "./Auth/Footer";
import MembershipPlans from "./Auth/MembershipPlan";

const MainLayout = ({ children }) => {
    return (
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">{children}</main>
        <MembershipPlans />
        <Footer />
      </div>
    );
  };

export default MainLayout;