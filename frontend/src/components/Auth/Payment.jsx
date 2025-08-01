import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { createRazorpayOrder, verifyRazorpayPayment } from "../../features/auth/authApi";
import { clearPaymentError } from "../../features/auth/authSlice";

const Payment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { payment, membershipPlans } = useSelector((state) => state.auth);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const email = location.state?.email;
  const membership_plan_id = location.state?.membership_plan_id;

  useEffect(() => {
    if (!email || !membership_plan_id) {
      setError("Missing required information. Please go back to registration.");
      return;
    }

    dispatch(createRazorpayOrder({ email, membership_plan_id }))
      .unwrap()
      .catch((err) => setError(err));
  }, [dispatch, email, membership_plan_id]);

  useEffect(() => {
    if (payment.error) {
      setError(payment.error);
      dispatch(clearPaymentError());
    }
  }, [payment.error, dispatch]);

  const handlePayment = async () => {
    if (!payment.order) {
      setError("Payment order not ready. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const options = {
      key: payment.order.key,
      amount: payment.order.amount,
      currency: payment.order.currency,
      order_id: payment.order.order_id,
      name: "Fitness App",
      description: `Membership Payment for ${email}`,
      handler: async (response) => {
        try {
          const paymentData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          };

          const result = await dispatch(verifyRazorpayPayment(paymentData)).unwrap();
          setSuccess("Payment successful! Redirecting to login...");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } catch (error) {
          setError(error || "Payment verification failed. Please try again.");
        } finally {
          setIsLoading(false);
        }
      },
      prefill: {
        email: payment.order.user.email,
        name: payment.order.user.name,
        contact: payment.order.user.contact
      },
      theme: {
        color: "#00ff00"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const plan = membershipPlans.find(p => p.id === membership_plan_id);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        backgroundImage: "url('/bgimgg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        overflow: "auto",
        margin: 0,
        padding: 0,
      }}
    >
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-50"></div>
      <div
        className="position-relative text-white p-5 rounded shadow-lg"
        style={{
          maxWidth: "450px",
          background: "rgba(0, 0, 0, 0.6)",
          border: "1px solid rgba(0, 255, 0, 0.2)",
          boxShadow: "0px 0px 20px rgba(0, 255, 0, 0.3)",
        }}
      >
        <h2 className="text-center fw-bold mb-4" style={{ color: "#00ff00" }}>Complete Your Payment</h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        <div className="mb-4">
          <p className="text-center">
            Please complete the payment for your membership plan:
            <br />
            <strong>{plan ? plan.name : "Loading..."}</strong>
            <br />
            Amount: <strong>₹{plan ? plan.price : "N/A"}</strong>
          </p>
        </div>

        <button
          className="btn w-100 py-3 mt-3 text-white"
          style={{ backgroundColor: "#00ff00" }}
          onClick={handlePayment}
          disabled={isLoading || !payment.order || success}
        >
          {isLoading ? "Processing..." : "Pay Now"}
        </button>

        <div className="mt-4 text-center">
          <p>
            <span
              onClick={() => navigate("/login")}
              style={{ cursor: "pointer", color: "#00ff00" }}
            >
              Back to Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;