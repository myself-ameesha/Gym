import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button } from 'react-bootstrap';
import { getPublicMembershipPlans } from '../../features/auth/authApi';

const MembershipPlans = () => {
  const dispatch = useDispatch();
  const { membershipPlans, loading, error } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    dispatch(getPublicMembershipPlans())
      .unwrap()
      .then(data => setPlans(data))
      .catch(error => console.error('Failed to fetch plans:', error));
  }, [dispatch]);

  useEffect(() => {
    if (membershipPlans.length > 0) {
      setPlans(membershipPlans);
    }
  }, [membershipPlans]);

  if (loading) return <div className="text-center py-5">Loading plans...</div>;
  if (error) return <div className="text-center py-5 text-danger">Error loading plans: {error}</div>;

  return (
    <div 
      className="container-fluid py-5" 
      style={{ 
        backgroundColor: '#1a1a1a', 
        color: '#fff', 
        padding: '0',
        margin: '0',
        maxWidth: '100%',
        width: '100vw',
        overflowX: 'hidden'
      }}
    >
      <div className="px-4">  {/* Added padding inside for content spacing */}
        <h2 className="text-center mb-5" style={{ color: '#FFC107' }}>
          OUR PLAN
          <br />
          <span className="h3" style={{ color: '#fff' }}>CHOOSE YOUR PRICING PLAN </span>
        </h2>

        <div className="row justify-content-center mx-0">  {/* Removed horizontal margin */}
          {plans.map((plan, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4 mb-4">
              <Card
                className="text-center p-4"
                style={{
                  backgroundColor: '#2c2c2c',
                  border: 'none',
                  borderRadius: '15px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Card.Body>
                  <h3 className="mb-3" style={{ color: '#fff' }}>
                    {plan.name || 'Unnamed Plan'}
                  </h3>
                  <h2 className="mb-3" style={{ color: '#FFC107' }}>
                    ${plan.price || '0.0'}
                  </h2>
                  <p className="text-muted mb-4">
                    {plan.duration_days === 1 ? 'SINGLE CLASS' : `${plan.duration_days} Month${plan.duration_days > 1 ? 's' : ''} unlimited`}
                  </p>
                  <ul className="list-unstyled mb-4">
                    {[
                      'Free riding',
                      'Unlimited equipments',
                      'Personal trainer',
                      'Weight losing classes',
                      'Month to mouth',
                      'No time restriction',
                    ].map((feature, idx) => (
                      <li key={idx} className="mb-2" style={{ color: '#ccc' }}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="dark"
                    className="w-100"
                    style={{ backgroundColor: '#333', borderColor: '#444', color: '#fff' }}
                  >
                    ENROLL NOW
                  </Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembershipPlans;