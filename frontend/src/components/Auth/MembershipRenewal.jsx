// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Card, Button, Modal, Table, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap';
// import { FaCalendarAlt, FaCreditCard, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
// import { 
//   getPublicMembershipPlans, 
//   createRenewalRazorpayOrder, 
//   verifyRenewalRazorpayPayment,
//   getMembershipStatus,
//   getCurrentMember
// } from '../../features/auth/authApi';

// const MembershipRenewal = ({ currentMember }) => {
//   const dispatch = useDispatch();
//   const [showRenewalModal, setShowRenewalModal] = useState(false);
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const [isProcessingPayment, setIsProcessingPayment] = useState(false);
//   const [paymentError, setPaymentError] = useState('');
//   const [showPlanComparison, setShowPlanComparison] = useState(false);

//   const { 
//     membershipPlans, 
//     membershipPlansLoading,
//     renewalOrderLoading,
//     renewalPaymentLoading,
//     renewalPaymentSuccess,
//     membershipStatus,
//     membershipStatusLoading,
//     renewalPaymentError
//   } = useSelector((state) => state.auth);

//   useEffect(() => {
//     // Load membership status when component mounts
//     if (currentMember?.id) {
//       dispatch(getMembershipStatus());
//     }
//   }, [dispatch, currentMember?.id]);

//   useEffect(() => {
//     // Load membership plans when renewal modal opens
//     if (showRenewalModal && (!membershipPlans || membershipPlans.length === 0)) {
//       dispatch(getPublicMembershipPlans());
//     }
//   }, [showRenewalModal, dispatch, membershipPlans]);

//   useEffect(() => {
//     // Handle successful payment
//     if (renewalPaymentSuccess) {
//       setShowRenewalModal(false);
//       setSelectedPlan(null);
//       setPaymentError('');
//       // Refresh member data and membership status
//       dispatch(getCurrentMember());
//       dispatch(getMembershipStatus());
//       // Show success message
//       setTimeout(() => {
//         alert('Membership renewed successfully! Your new plan is now active.');
//       }, 500);
//     }
//   }, [renewalPaymentSuccess, dispatch]);

//   useEffect(() => {
//     // Handle payment errors
//     if (renewalPaymentError) {
//       setPaymentError(renewalPaymentError);
//       setIsProcessingPayment(false);
//     }
//   }, [renewalPaymentError]);

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not available';
//     const date = new Date(dateString);
//     return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric'
//     });
//   };

//   // Helper function to check if renewal should be enabled
//   const isRenewalAllowed = () => {
//     if (!currentMember || currentMember.user_type !== 'member') {
//       return false;
//     }

//     // Use membershipStatus from Redux if available, otherwise use currentMember data
//     const status = membershipStatus?.membership_status || currentMember.membership_status;
//     const daysRemaining = membershipStatus?.days_until_expiration || currentMember.days_until_expiration;

//     // Always allow renewal for expired or no_plan status
//     if (!status || status === 'expired' || status === 'no_plan' || status === 'not_activated') {
//       return true;
//     }

//     // For active memberships, only allow renewal if 3 or fewer days remaining
//     if (status === 'active' || status.status === 'active') {
//       const remainingDays = daysRemaining || status.days_remaining;
//       return remainingDays !== undefined && remainingDays <= 3;
//     }

//     // For expiring_soon status, check if it's within 3 days
//     if (status === 'expiring_soon' || status.status === 'expiring_soon') {
//       const remainingDays = daysRemaining || status.days_remaining;
//       return remainingDays !== undefined && remainingDays <= 3;
//     }

//     return false;
//   };

//   const getMembershipStatusInfo = () => {
//     if (!currentMember || currentMember.user_type !== 'member') {
//       return { 
//         status: 'not_applicable', 
//         message: 'Not a member', 
//         variant: 'secondary',
//         showRenewal: false
//       };
//     }

//     // Use membershipStatus from Redux if available, otherwise use currentMember data
//     const status = membershipStatus?.membership_status || currentMember.membership_status;
//     const expirationDate = membershipStatus?.membership_expiration_date || currentMember.membership_expiration_date;
//     const daysRemaining = membershipStatus?.days_until_expiration || currentMember.days_until_expiration;

//     if (!status) {
//       return { 
//         status: 'unknown', 
//         message: 'Status unknown', 
//         variant: 'secondary',
//         showRenewal: false
//       };
//     }

//     const renewalAllowed = isRenewalAllowed();

//     switch (status.status || status) {
//       case 'expired':
//         return { 
//           status: 'expired', 
//           message: 'Membership has expired', 
//           variant: 'danger',
//           icon: <FaExclamationTriangle />,
//           showRenewal: true,
//           renewalAllowed: true,
//           urgency: 'high'
//         };
//       case 'expiring_soon':
//         const remainingDays = daysRemaining || status.days_remaining;
//         return { 
//           status: 'expiring_soon', 
//           message: `Expires in ${remainingDays} days`, 
//           variant: 'warning',
//           icon: <FaCalendarAlt />,
//           showRenewal: true,
//           renewalAllowed: renewalAllowed,
//           urgency: remainingDays <= 3 ? 'high' : 'medium'
//         };
//       case 'active':
//         const activeDaysRemaining = daysRemaining || status.days_remaining;
//         return { 
//           status: 'active', 
//           message: activeDaysRemaining ? `Active (${activeDaysRemaining} days remaining)` : 'Active', 
//           variant: 'success',
//           icon: <FaCheckCircle />,
//           showRenewal: true, // Always show the button, but control enabled state
//           renewalAllowed: renewalAllowed,
//           urgency: activeDaysRemaining <= 3 ? 'high' : 'low'
//         };
//       case 'no_plan':
//       case 'not_activated':
//         return { 
//           status: 'no_plan', 
//           message: 'Membership plan not activated', 
//           variant: 'warning',
//           icon: <FaExclamationTriangle />,
//           showRenewal: true,
//           renewalAllowed: true,
//           urgency: 'high'
//         };
//       default:
//         return { 
//           status: 'unknown', 
//           message: status.message || 'Status unknown', 
//           variant: 'secondary',
//           showRenewal: false,
//           renewalAllowed: false
//         };
//     }
//   };

//   const handleRenewMembership = () => {
//     // Double-check renewal is allowed before opening modal
//     if (!isRenewalAllowed()) {
//       setPaymentError('Renewal is only available 3 days before expiration or for expired/inactive plans');
//       return;
//     }
    
//     setShowRenewalModal(true);
//     setPaymentError('');
//     setSelectedPlan(null);
//   };

//   const handlePlanSelection = (plan) => {
//     setSelectedPlan(plan);
//   };

//   const loadRazorpayScript = () => {
//     return new Promise((resolve) => {
//       if (window.Razorpay) {
//         resolve(true);
//         return;
//       }
      
//       const script = document.createElement('script');
//       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//       script.onload = () => resolve(true);
//       script.onerror = () => resolve(false);
//       document.body.appendChild(script);
//     });
//   };

//   const handlePayment = async () => {
//     if (!selectedPlan) {
//       setPaymentError('Please select a membership plan');
//       return;
//     }

//     setIsProcessingPayment(true);
//     setPaymentError('');

//     try {
//       // Load Razorpay script
//       const scriptLoaded = await loadRazorpayScript();
//       if (!scriptLoaded) {
//         throw new Error('Failed to load payment gateway. Please check your internet connection.');
//       }

//       // Create Razorpay order
//       const orderResponse = await dispatch(createRenewalRazorpayOrder({
//         membership_plan_id: selectedPlan.id
//       })).unwrap();

//       // Configure Razorpay options
//       const options = {
//         key: orderResponse.key,
//         amount: orderResponse.amount,
//         currency: orderResponse.currency,
//         name: 'Gym Membership Renewal',
//         description: `${selectedPlan.name} Plan - ${selectedPlan.duration_days} days`,
//         order_id: orderResponse.order_id,
//         prefill: {
//           name: orderResponse.user?.name || `${currentMember?.first_name} ${currentMember?.last_name}`.trim(),
//           email: orderResponse.user?.email || currentMember?.email,
//           contact: orderResponse.user?.contact || currentMember?.phone_number || '',
//         },
//         handler: async (response) => {
//           try {
//             // Verify payment
//             await dispatch(verifyRenewalRazorpayPayment({
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_signature: response.razorpay_signature,
//             })).unwrap();

//             // Success handling is done in useEffect
//           } catch (error) {
//             console.error('Payment verification error:', error);
//             setPaymentError(error.message || 'Payment verification failed');
//             setIsProcessingPayment(false);
//           }
//         },
//         modal: {
//           ondismiss: () => {
//             setIsProcessingPayment(false);
//           },
//         },
//         theme: {
//           color: '#7747ff',
//         },
//       };

//       // Open Razorpay checkout
//       const razorpay = new window.Razorpay(options);
//       razorpay.on('payment.failed', function (response) {
//         setPaymentError(`Payment failed: ${response.error.description}`);
//         setIsProcessingPayment(false);
//       });
      
//       razorpay.open();

//     } catch (error) {
//       console.error('Payment initiation error:', error);
//       setIsProcessingPayment(false);
//       setPaymentError(error.message || 'Failed to initiate payment');
//     }
//   };

//   const getPlanRecommendation = (plan) => {
//     if (!currentMember?.membership_plan) return null;
    
//     if (plan.id === currentMember.membership_plan.id) {
//       return { type: 'current', text: 'Your Current Plan' };
//     }
    
//     const currentPrice = parseFloat(currentMember.membership_plan.price);
//     const planPrice = parseFloat(plan.price);
    
//     if (planPrice > currentPrice) {
//       return { type: 'upgrade', text: 'Upgrade' };
//     } else if (planPrice < currentPrice) {
//       return { type: 'downgrade', text: 'Downgrade' };
//     }
    
//     return null;
//   };

//   const statusInfo = getMembershipStatusInfo();

//   // Get renewal restriction message
//   const getRenewalRestrictionMessage = () => {
//     if (statusInfo.renewalAllowed) return null;
    
//     const daysRemaining = membershipStatus?.days_until_expiration || currentMember?.days_until_expiration;
    
//     if (statusInfo.status === 'active' && daysRemaining > 3) {
//       return `Renewal will be available when ${daysRemaining - 3} days remain (${daysRemaining - 3} days from now)`;
//     }
    
//     return 'Renewal not available at this time';
//   };

//   return (
//     <div className="membership-renewal-section">
//       {/* Membership Status Card */}
//       <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }} className="mb-4">
//         <Card.Body>
//           <div className="d-flex justify-content-between align-items-center">
//             <div className="d-flex align-items-start">
//               <div className="me-3 mt-1">
//                 {statusInfo.icon}
//               </div>
//               <div className="flex-grow-1">
//                 <div className="d-flex align-items-center mb-2">
//                   <h6 className="text-white mb-0 me-2">Membership Status</h6>
//                   {membershipStatusLoading && (
//                     <Spinner animation="border" size="sm" variant="light" />
//                   )}
//                 </div>
//                 <Badge bg={statusInfo.variant} className="me-2 mb-2">
//                   {statusInfo.message}
//                 </Badge>
                
//                 {/* Current Plan Information */}
//                 <div className="text-white-50 small">
//                   {currentMember?.membership_plan ? (
//                     <>
//                       <div className="mb-1">
//                         <strong>Current Plan:</strong> {currentMember.membership_plan.name} 
//                         <span className="ms-2">(₹{currentMember.membership_plan.price} for {currentMember.membership_plan.duration_days} days)</span>
//                       </div>
//                       {(membershipStatus?.membership_start_date || currentMember.membership_start_date) && (
//                         <div className="mb-1">
//                           <strong>Started:</strong> {formatDate(membershipStatus?.membership_start_date || currentMember.membership_start_date)}
//                         </div>
//                       )}
//                       {(membershipStatus?.membership_expiration_date || currentMember.membership_expiration_date) && (
//                         <div className="mb-1">
//                           <strong>Expires:</strong> {formatDate(membershipStatus?.membership_expiration_date || currentMember.membership_expiration_date)}
//                         </div>
//                       )}
                      
//                       {/* Show renewal restriction message */}
//                       {!statusInfo.renewalAllowed && getRenewalRestrictionMessage() && (
//                         <div className="mt-2 p-2" style={{ backgroundColor: '#1a2a44', borderRadius: '6px', border: '1px solid #4a5568' }}>
//                           <div className="text-warning small">
//                             <FaInfoCircle className="me-1" />
//                             {getRenewalRestrictionMessage()}
//                           </div>
//                         </div>
//                       )}
//                     </>
//                   ) : (
//                     <div className="text-warning">
//                       <FaInfoCircle className="me-1" />
//                       No active membership plan
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
            
//             {/* Action Buttons */}
//             <div className="d-flex flex-column align-items-end">
//               {statusInfo.showRenewal && (
//                 <div className="mb-2">
//                   <Button 
//                     variant={statusInfo.urgency === 'high' ? 'danger' : 'primary'}
//                     size="sm" 
//                     onClick={handleRenewMembership}
//                     className="d-flex align-items-center"
//                     disabled={!statusInfo.renewalAllowed || renewalOrderLoading || renewalPaymentLoading || membershipStatusLoading}
//                     style={{ 
//                       opacity: !statusInfo.renewalAllowed ? 0.6 : 1,
//                       cursor: !statusInfo.renewalAllowed ? 'not-allowed' : 'pointer'
//                     }}
//                     title={!statusInfo.renewalAllowed ? getRenewalRestrictionMessage() : ''}
//                   >
//                     <FaCreditCard className="me-2" />
//                     {statusInfo.status === 'no_plan' ? 'Activate Plan' : 'Renew Membership'}
//                   </Button>
//                   {!statusInfo.renewalAllowed && (
//                     <div className="text-warning small text-center mt-1" style={{ fontSize: '0.7rem' }}>
//                       Available in {(membershipStatus?.days_until_expiration || currentMember?.days_until_expiration || 0) - 3} days
//                     </div>
//                   )}
//                 </div>
//               )}
              
//               <Button 
//                 variant="outline-info"
//                 size="sm"
//                 onClick={() => setShowPlanComparison(true)}
//                 className="d-flex align-items-center"
//               >
//                 <FaInfoCircle className="me-2" />
//                 View Plans
//               </Button>
//             </div>
//           </div>
//         </Card.Body>
//       </Card>

//       {/* Renewal Modal */}
//       <Modal 
//         show={showRenewalModal} 
//         onHide={() => !isProcessingPayment && setShowRenewalModal(false)}
//         size="xl"
//         backdrop={isProcessingPayment ? 'static' : true}
//         keyboard={!isProcessingPayment}
//       >
//         <Modal.Header closeButton={!isProcessingPayment} style={{ backgroundColor: '#101c36', borderBottom: '1px solid #2a3b6a' }}>
//           <Modal.Title className="text-white">
//             {statusInfo.status === 'no_plan' ? 'Select Membership Plan' : 'Renew Your Membership'}
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ backgroundColor: '#0c1427', maxHeight: '70vh', overflowY: 'auto' }}>
//           {paymentError && (
//             <Alert variant="danger" className="mb-3" dismissible onClose={() => setPaymentError('')}>
//               <FaExclamationTriangle className="me-2" />
//               {paymentError}
//             </Alert>
//           )}

//           {membershipPlansLoading ? (
//             <div className="text-center py-4">
//               <Spinner animation="border" variant="light" />
//               <p className="text-white mt-2">Loading membership plans...</p>
//             </div>
//           ) : membershipPlans && membershipPlans.length > 0 ? (
//             <>
//               <div className="mb-4">
//                 <h5 className="text-white mb-2">
//                   {statusInfo.status === 'no_plan' ? 'Choose a membership plan to get started:' : 'Choose a plan to renew your membership:'}
//                 </h5>
//                 <p className="text-white-50">
//                   {statusInfo.status === 'no_plan' 
//                     ? 'Select a plan that best fits your fitness goals and schedule.'
//                     : 'Your new membership will start from the expiration date of your current plan.'
//                   }
//                 </p>
//               </div>
              
//               <Row>
//                 {membershipPlans.map((plan) => {
//                   const recommendation = getPlanRecommendation(plan);
//                   const isSelected = selectedPlan?.id === plan.id;
                  
//                   return (
//                     <Col md={6} lg={4} key={plan.id} className="mb-3">
//                       <Card 
//                         className={`h-100 ${isSelected ? 'border-primary' : ''}`}
//                         style={{ 
//                           backgroundColor: isSelected ? '#1a2a44' : '#1a2a56', 
//                           border: isSelected ? '2px solid #7747ff' : '1px solid #2a3b6a',
//                           cursor: 'pointer',
//                           transition: 'all 0.3s ease'
//                         }}
//                         onClick={() => handlePlanSelection(plan)}
//                       >
//                         <Card.Body className="d-flex flex-column">
//                           <div className="d-flex justify-content-between align-items-start mb-3">
//                             <div>
//                               <h6 className="text-white mb-1">{plan.name}</h6>
//                               {recommendation && (
//                                 <Badge 
//                                   bg={recommendation.type === 'current' ? 'success' : recommendation.type === 'upgrade' ? 'info' : 'secondary'}
//                                   className="mb-2"
//                                 >
//                                   {recommendation.text}
//                                 </Badge>
//                               )}
//                             </div>
//                             <input
//                               type="radio"
//                               name="membershipPlan"
//                               checked={isSelected}
//                               onChange={() => handlePlanSelection(plan)}
//                               disabled={isProcessingPayment}
//                               className="form-check-input"
//                             />
//                           </div>
                          
//                           <div className="mb-3">
//                             <div className="text-white display-6 fw-bold mb-1">₹{plan.price}</div>
//                             <div className="text-white-50 small">{plan.duration_days} days</div>
//                             <div className="text-white-50 small">
//                               ₹{(parseFloat(plan.price) / plan.duration_days).toFixed(2)} per day
//                             </div>
//                           </div>
                          
//                           <div className="flex-grow-1">
//                             <p className="text-white-50 small mb-0">
//                               {plan.description || 'Complete gym access with all facilities'}
//                             </p>
//                           </div>
                          
//                           {isSelected && (
//                             <div className="mt-3 pt-3 border-top" style={{ borderColor: '#2a3b6a' }}>
//                               <div className="text-success small">
//                                 <FaCheckCircle className="me-1" />
//                                 Selected Plan
//                               </div>
//                             </div>
//                           )}
//                         </Card.Body>
//                       </Card>
//                     </Col>
//                   );
//                 })}
//               </Row>

//               {selectedPlan && (
//                 <div className="mt-4 p-4" style={{ backgroundColor: '#1a2a44', borderRadius: '12px', border: '1px solid #7747ff' }}>
//                   <h6 className="text-white mb-3">Payment Summary</h6>
//                   <Row>
//                     <Col md={8}>
//                       <div className="text-white mb-2">
//                         <strong>Selected Plan:</strong> {selectedPlan.name}
//                       </div>
//                       <div className="text-white-50 mb-2">
//                         Duration: {selectedPlan.duration_days} days
//                       </div>
//                       <div className="text-white-50 mb-2">
//                         {selectedPlan.description}
//                       </div>
//                     </Col>
//                     <Col md={4} className="text-md-end">
//                       <div className="text-white display-6 fw-bold">₹{selectedPlan.price}</div>
//                       <div className="text-success small">
//                         <FaCheckCircle className="me-1" />
//                         Secure Payment with Razorpay
//                       </div>
//                     </Col>
//                   </Row>
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="text-center py-4">
//               <FaExclamationTriangle className="text-warning mb-3" size={48} />
//               <p className="text-white">No membership plans available at the moment.</p>
//               <p className="text-white-50">Please contact the gym administration.</p>
//             </div>
//           )}
//         </Modal.Body>
//         <Modal.Footer style={{ backgroundColor: '#101c36', borderTop: '1px solid #2a3b6a' }}>
//           <Button 
//             variant="secondary" 
//             onClick={() => setShowRenewalModal(false)}
//             disabled={isProcessingPayment}
//           >
//             Cancel
//           </Button>
//           <Button 
//             variant="primary" 
//             onClick={handlePayment}
//             disabled={!selectedPlan || isProcessingPayment || membershipPlansLoading || renewalOrderLoading}
//             className="d-flex align-items-center"
//           >
//             {isProcessingPayment || renewalOrderLoading || renewalPaymentLoading ? (
//               <>
//                 <Spinner animation="border" size="sm" className="me-2" />
//                 Processing Payment...
//               </>
//             ) : (
//               <>
//                 <FaCreditCard className="me-2" />
//                 Pay ₹{selectedPlan?.price || 0}
//               </>
//             )}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Plan Comparison Modal */}
//       <Modal 
//         show={showPlanComparison} 
//         onHide={() => setShowPlanComparison(false)}
//         size="xl"
//       >
//         <Modal.Header closeButton style={{ backgroundColor: '#101c36', borderBottom: '1px solid #2a3b6a' }}>
//           <Modal.Title className="text-white">Available Membership Plans</Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ backgroundColor: '#0c1427' }}>
//           {membershipPlansLoading ? (
//             <div className="text-center py-4">
//               <Spinner animation="border" variant="light" />
//               <p className="text-white mt-2">Loading plans...</p>
//             </div>
//           ) : membershipPlans && membershipPlans.length > 0 ? (
//             <div className="table-responsive">
//               <Table variant="dark" className="mb-0">
//                 <thead>
//                   <tr>
//                     <th>Plan Name</th>
//                     <th>Duration</th>
//                     <th>Price</th>
//                     <th>Price per Day</th>
//                     <th>Description</th>
//                     <th>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {membershipPlans.map((plan) => {
//                     const recommendation = getPlanRecommendation(plan);
//                     const pricePerDay = (parseFloat(plan.price) / plan.duration_days).toFixed(2);
                    
//                     return (
//                       <tr key={plan.id}>
//                         <td className="fw-bold">{plan.name}</td>
//                         <td>{plan.duration_days} days</td>
//                         <td>₹{plan.price}</td>
//                         <td>₹{pricePerDay}</td>
//                         <td>{plan.description || 'Standard gym access'}</td>
//                         <td>
//                           {recommendation && (
//                             <Badge 
//                               bg={recommendation.type === 'current' ? 'success' : recommendation.type === 'upgrade' ? 'info' : 'secondary'}
//                             >
//                               {recommendation.text}
//                             </Badge>
//                           )}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </Table>
//             </div>
//           ) : (
//             <p className="text-white text-center">No plans available</p>
//           )}
//         </Modal.Body>
//         <Modal.Footer style={{ backgroundColor: '#101c36', borderTop: '1px solid #2a3b6a' }}>
//           <Button variant="secondary" onClick={() => setShowPlanComparison(false)}>
//             Close
//           </Button>
//           {statusInfo.showRenewal && statusInfo.renewalAllowed && (
//             <Button 
//               variant="primary" 
//               onClick={() => {
//                 setShowPlanComparison(false);
//                 setShowRenewalModal(true);
//               }}
//             >
//               Start Renewal Process
//             </Button>
//           )}
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default MembershipRenewal;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Modal, Table, Spinner, Alert, Badge, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { FaCalendarAlt, FaCreditCard, FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaArrowUp, FaStar, FaBolt } from 'react-icons/fa';
import { 
  getPublicMembershipPlans, 
  createRenewalRazorpayOrder, 
  verifyRenewalRazorpayPayment,
  getMembershipStatus,
  getCurrentMember,
  getAvailableUpgrades,
  calculateUpgradeAmount
} from '../../features/auth/authApi';

const MembershipRenewal = ({ currentMember }) => {
  const dispatch = useDispatch();
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [activeTab, setActiveTab] = useState('renewal');
  const [upgradeCalculations, setUpgradeCalculations] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Success message state - simplified
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Add ref to track payment completion state
  const paymentCompletedRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const memberIdRef = useRef(currentMember?.id);
  const successTimeoutRef = useRef(null);

  const { 
    membershipPlans, 
    membershipPlansLoading,
    renewalOrderLoading,
    renewalPaymentLoading,
    renewalPaymentSuccess,
    membershipStatus,
    membershipStatusLoading,
    renewalPaymentError,
    availableUpgrades,
    upgradeLoading,
    upgradeError,
    upgradeCalculation,
    calculationLoading
  } = useSelector((state) => state.auth);

  // Memoize the refresh data function to prevent infinite loops
  const refreshDataAfterPayment = useCallback(async () => {
    if (isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    try {
      // Use Promise.allSettled to prevent errors from stopping both requests
      const results = await Promise.allSettled([
        dispatch(getCurrentMember()),
        dispatch(getMembershipStatus())
      ]);
      
      // Log any errors but don't throw them to prevent UI disruption
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Data refresh ${index === 0 ? 'getCurrentMember' : 'getMembershipStatus'} failed:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Error refreshing data after payment:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [dispatch]);

  // Only fetch membership status when currentMember.id changes or on mount
  useEffect(() => {
    const currentMemberId = currentMember?.id;
    
    if (currentMemberId && currentMemberId !== memberIdRef.current) {
      memberIdRef.current = currentMemberId;
      dispatch(getMembershipStatus());
    }
  }, [dispatch, currentMember?.id]);

  useEffect(() => {
    if (showRenewalModal && (!membershipPlans || membershipPlans.length === 0)) {
      dispatch(getPublicMembershipPlans());
    }
  }, [showRenewalModal, dispatch, membershipPlans]);

  useEffect(() => {
    if (showPlanComparison && (!membershipPlans || membershipPlans.length === 0)) {
      dispatch(getPublicMembershipPlans());
    }
  }, [showPlanComparison, dispatch, membershipPlans]);

  useEffect(() => {
    if (activeTab === 'upgrade' && currentMember?.membership_plan) {
      dispatch(getAvailableUpgrades());
    }
  }, [activeTab, dispatch, currentMember?.membership_plan]);

  // FIXED: Improved payment success handling with debouncing
  useEffect(() => {
    if (renewalPaymentSuccess && !paymentCompletedRef.current) {
      paymentCompletedRef.current = true;
      
      // Clear any existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      
      // Immediately close modal and reset form state
      setShowRenewalModal(false);
      setSelectedPlan(null);
      setPaymentError('');
      setUpgradeCalculations({});
      setIsProcessingPayment(false);
      
      // Set success message
      const actionType = activeTab === 'upgrade' ? 'upgraded' : 'renewed';
      const activationMessage = activeTab === 'upgrade' 
        ? 'Your upgraded plan is now active immediately!' 
        : 'Your renewed membership is now active!';
      
      setSuccessMessage(`Membership ${actionType} successfully! ${activationMessage}`);
      setShowSuccessAlert(true);
      
      // Debounced data refresh to prevent multiple rapid updates
      successTimeoutRef.current = setTimeout(() => {
        refreshDataAfterPayment().finally(() => {
          // Reset payment completion flag after data refresh
          paymentCompletedRef.current = false;
        });
      }, 1000); // Increased delay to reduce flicker
      
      // Auto-hide success message
      const hideTimer = setTimeout(() => {
        setShowSuccessAlert(false);
        setSuccessMessage('');
      }, 6000); // Reduced from 8 seconds
      
      // Cleanup function
      return () => {
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        clearTimeout(hideTimer);
      };
    }
  }, [renewalPaymentSuccess, activeTab, refreshDataAfterPayment]);

  // FIXED: Better error handling
  useEffect(() => {
    if (renewalPaymentError && !paymentCompletedRef.current) {
      setPaymentError(renewalPaymentError);
      setIsProcessingPayment(false);
    }
  }, [renewalPaymentError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      paymentCompletedRef.current = false;
      isRefreshingRef.current = false;
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isRenewalAllowed = useCallback(() => {
    if (!currentMember || currentMember.user_type !== 'member') {
      return false;
    }

    const status = membershipStatus?.membership_status || currentMember.membership_status;
    const daysRemaining = membershipStatus?.days_until_expiration || currentMember.days_until_expiration;

    if (!status || status === 'expired' || status === 'no_plan' || status === 'not_activated') {
      return true;
    }

    if (status === 'active' || status.status === 'active') {
      const remainingDays = daysRemaining || status.days_remaining;
      return remainingDays !== undefined && remainingDays <= 3;
    }

    if (status === 'expiring_soon' || status.status === 'expiring_soon') {
      const remainingDays = daysRemaining || status.days_remaining;
      return remainingDays !== undefined && remainingDays <= 3;
    }

    return false;
  }, [currentMember, membershipStatus]);

  const isUpgradeAvailable = useCallback(() => {
    if (!currentMember || currentMember.user_type !== 'member' || !currentMember.membership_plan) {
      return false;
    }

    const status = membershipStatus?.membership_status || currentMember.membership_status;
    return status === 'active' || (status && status.status === 'active');
  }, [currentMember, membershipStatus]);

  const getMembershipStatusInfo = useCallback(() => {
    if (!currentMember || currentMember.user_type !== 'member') {
      return { 
        status: 'not_applicable', 
        message: 'Not a member', 
        variant: 'secondary',
        showRenewal: false,
        showUpgrade: false
      };
    }

    const status = membershipStatus?.membership_status || currentMember.membership_status;
    const expirationDate = membershipStatus?.membership_expiration_date || currentMember.membership_expiration_date;
    const daysRemaining = membershipStatus?.days_until_expiration || currentMember.days_until_expiration;

    if (!status) {
      return { 
        status: 'unknown', 
        message: 'Status unknown', 
        variant: 'secondary',
        showRenewal: false,
        showUpgrade: false
      };
    }

    const renewalAllowed = isRenewalAllowed();
    const upgradeAvailable = isUpgradeAvailable();

    switch (status.status || status) {
      case 'expired':
        return { 
          status: 'expired', 
          message: 'Membership has expired', 
          variant: 'danger',
          icon: <FaExclamationTriangle />,
          showRenewal: true,
          showUpgrade: false,
          renewalAllowed: true,
          upgradeAvailable: false,
          urgency: 'high'
        };
      case 'expiring_soon':
        const remainingDays = daysRemaining || status.days_remaining;
        return { 
          status: 'expiring_soon', 
          message: `Expires in ${remainingDays} days`, 
          variant: 'warning',
          icon: <FaCalendarAlt />,
          showRenewal: true,
          showUpgrade: upgradeAvailable,
          renewalAllowed: renewalAllowed,
          upgradeAvailable: upgradeAvailable,
          urgency: remainingDays <= 3 ? 'high' : 'medium'
        };
      case 'active':
        const activeDaysRemaining = daysRemaining || status.days_remaining;
        return { 
          status: 'active', 
          message: activeDaysRemaining ? `Active (${activeDaysRemaining} days remaining)` : 'Active', 
          variant: 'success',
          icon: <FaCheckCircle />,
          showRenewal: true,
          showUpgrade: upgradeAvailable,
          renewalAllowed: renewalAllowed,
          upgradeAvailable: upgradeAvailable,
          urgency: activeDaysRemaining <= 3 ? 'high' : 'low'
        };
      case 'no_plan':
      case 'not_activated':
        return { 
          status: 'no_plan', 
          message: 'Membership plan not activated', 
          variant: 'warning',
          icon: <FaExclamationTriangle />,
          showRenewal: true,
          showUpgrade: false,
          renewalAllowed: true,
          upgradeAvailable: false,
          urgency: 'high'
        };
      default:
        return { 
          status: 'unknown', 
          message: status.message || 'Status unknown', 
          variant: 'secondary',
          showRenewal: false,
          showUpgrade: false,
          renewalAllowed: false,
          upgradeAvailable: false
        };
    }
  }, [currentMember, membershipStatus, isRenewalAllowed, isUpgradeAvailable]);

  const handleOpenRenewalModal = (tabKey = 'renewal') => {
    const statusInfo = getMembershipStatusInfo();
    
    if (tabKey === 'renewal' && !statusInfo.renewalAllowed) {
      setPaymentError('Renewal is only available 3 days before expiration or for expired/inactive plans');
      return;
    }
    
    if (tabKey === 'upgrade' && !statusInfo.upgradeAvailable) {
      setPaymentError('Upgrade is only available for active memberships');
      return;
    }
    
    setActiveTab(tabKey);
    setShowRenewalModal(true);
    setPaymentError('');
    setSelectedPlan(null);
    setUpgradeCalculations({});
  };

  const handlePlanSelection = async (plan) => {
    setSelectedPlan(plan);
    
    if (activeTab === 'upgrade' && !upgradeCalculations[plan.id]) {
      setIsCalculating(true);
      try {
        const result = await dispatch(calculateUpgradeAmount({ newPlanId: plan.id })).unwrap();
        setUpgradeCalculations(prev => ({
          ...prev,
          [plan.id]: result
        }));
      } catch (error) {
        console.error('Error calculating upgrade amount:', error);
        setPaymentError('Failed to calculate upgrade amount');
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      setPaymentError('Please select a membership plan');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError('');
    
    // Reset payment completion flag when starting new payment
    paymentCompletedRef.current = false;

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please check your internet connection.');
      }

      let paymentAmount = selectedPlan.price;
      let isUpgrade = activeTab === 'upgrade';
      
      if (isUpgrade && upgradeCalculations[selectedPlan.id]) {
        paymentAmount = upgradeCalculations[selectedPlan.id].upgrade_amount;
      }

      const orderData = {
        membership_plan_id: selectedPlan.id,
        is_upgrade: isUpgrade,
      };

      if (isUpgrade && upgradeCalculations[selectedPlan.id]) {
        orderData.upgrade_amount = upgradeCalculations[selectedPlan.id].upgrade_amount;
      }

      const orderResponse = await dispatch(createRenewalRazorpayOrder(orderData)).unwrap();

      // Updated Razorpay options with better upgrade messaging
      const options = {
        key: orderResponse.key,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: `Gym Membership ${isUpgrade ? 'Upgrade' : 'Renewal'}`,
        order_id: orderResponse.order_id,
        prefill: {
          name: orderResponse.user?.name || `${currentMember?.first_name} ${currentMember?.last_name}`.trim(),
          email: orderResponse.user?.email || currentMember?.email,
          contact: orderResponse.user?.contact || currentMember?.phone_number || '',
        },
        handler: async (response) => {
          try {
            await dispatch(verifyRenewalRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              membership_plan_id: selectedPlan.id,
              is_upgrade: isUpgrade
            })).unwrap();

            // Success handling is done in useEffect
          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentError(error.message || 'Payment verification failed');
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
        theme: {
          color: '#7747ff',
        },
        notes: {
          plan_name: selectedPlan.name,
          duration: `${selectedPlan.duration_days} days`,
          type: isUpgrade ? 'upgrade' : 'renewal',
          activation: isUpgrade ? 'immediate' : 'standard'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        setPaymentError(`Payment failed: ${response.error.description}`);
        setIsProcessingPayment(false);
      });
      
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      setIsProcessingPayment(false);
      setPaymentError(error.message || 'Failed to initiate payment');
    }
  };

  const getPlanRecommendation = (plan) => {
    if (!currentMember?.membership_plan) return null;
    
    if (plan.id === currentMember.membership_plan.id) {
      return { type: 'current', text: 'Your Current Plan' };
    }
    
    const currentPrice = parseFloat(currentMember.membership_plan.price);
    const planPrice = parseFloat(plan.price);
    
    if (planPrice > currentPrice) {
      return { type: 'upgrade', text: 'Upgrade' };
    }
    
    return null;
  };

  const getUpgradePlans = () => {
    if (!availableUpgrades?.upgrade_options) return [];
    return availableUpgrades.upgrade_options;
  };

  const statusInfo = getMembershipStatusInfo();

  const getRenewalRestrictionMessage = () => {
    if (statusInfo.renewalAllowed) return null;
    
    const daysRemaining = membershipStatus?.days_until_expiration || currentMember?.days_until_expiration;
    
    if (statusInfo.status === 'active' && daysRemaining > 3) {
      return `Renewal will be available when 3 days remain (${daysRemaining - 3} days from now)`;
    }
    
    return 'Renewal not available at this time';
  };

  return (
    <div className="membership-renewal-section">
      {/* FIXED: Enhanced Success Alert with better positioning and styling */}
      {showSuccessAlert && successMessage && (
        <Alert 
          variant="success" 
          className="position-fixed top-0 end-0 m-3 shadow-lg" 
          style={{ 
            zIndex: 1060, 
            minWidth: '350px',
            animation: 'slideInRight 0.3s ease-out'
          }}
          dismissible 
          onClose={() => {
            setShowSuccessAlert(false);
            setSuccessMessage('');
          }}
        >
          <div className="d-flex align-items-center">
            {activeTab === 'upgrade' ? (
              <FaBolt className="me-2 text-warning" />
            ) : (
              <FaCheckCircle className="me-2" />
            )}
            <div>
              <div className="fw-bold">{successMessage}</div>
              {activeTab === 'upgrade' && (
                <small className="text-success">
                  Your new plan benefits are available immediately.
                </small>
              )}
            </div>
          </div>
        </Alert>
      )}

      {/* Membership Status Card */}
      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }} className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div className="d-flex align-items-start flex-grow-1">
              <div className="me-3 mt-1">
                {statusInfo.icon}
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="text-white mb-0 me-2">Membership Status</h6>
                  {membershipStatusLoading && !paymentCompletedRef.current && (
                    <Spinner animation="border" size="sm" variant="light" />
                  )}
                </div>
                <Badge bg={statusInfo.variant} className="me-2 mb-2">
                  {statusInfo.message}
                </Badge>
                
                {/* Current Plan Information */}
                <div className="text-white-50 small">
                  {currentMember?.membership_plan ? (
                    <>
                      <div className="mb-1">
                        <strong>Current Plan:</strong> {currentMember.membership_plan.name} 
                        <span className="ms-2">(₹{currentMember.membership_plan.price} for {currentMember.membership_plan.duration_days} days)</span>
                      </div>
                      {(membershipStatus?.membership_start_date || currentMember.membership_start_date) && (
                        <div className="mb-1">
                          <strong>Started:</strong> {formatDate(membershipStatus?.membership_start_date || currentMember.membership_start_date)}
                        </div>
                      )}
                      {(membershipStatus?.membership_expiration_date || currentMember.membership_expiration_date) && (
                        <div className="mb-1">
                          <strong>Expires:</strong> {formatDate(membershipStatus?.membership_expiration_date || currentMember.membership_expiration_date)}
                        </div>
                      )}
                      
                      {/* Show renewal restriction message */}
                      {!statusInfo.renewalAllowed && getRenewalRestrictionMessage() && (
                        <div className="mt-2 p-2" style={{ backgroundColor: '#1a2a44', borderRadius: '6px', border: '1px solid #4a5568' }}>
                          <div className="text-warning small">
                            <FaInfoCircle className="me-1" />
                            {getRenewalRestrictionMessage()}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-warning">
                      <FaInfoCircle className="me-1" />
                      No active membership plan
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="d-flex flex-column align-items-end gap-2">
              {(statusInfo.showRenewal || statusInfo.showUpgrade) && (
                <div className="d-flex flex-column gap-2">
                  {/* Renewal Button */}
                  {statusInfo.showRenewal && (
                    <Button 
                      variant={statusInfo.urgency === 'high' ? 'danger' : 'primary'}
                      size="sm" 
                      onClick={() => handleOpenRenewalModal('renewal')}
                      className="d-flex align-items-center"
                      disabled={!statusInfo.renewalAllowed || renewalOrderLoading || renewalPaymentLoading || membershipStatusLoading || paymentCompletedRef.current}
                      style={{ 
                        opacity: (!statusInfo.renewalAllowed || paymentCompletedRef.current) ? 0.6 : 1,
                        cursor: (!statusInfo.renewalAllowed || paymentCompletedRef.current) ? 'not-allowed' : 'pointer',
                        minWidth: '140px'
                      }}
                      title={!statusInfo.renewalAllowed ? getRenewalRestrictionMessage() : ''}
                    >
                      <FaCreditCard className="me-2" />
                      {statusInfo.status === 'no_plan' ? 'Activate Plan' : 'Renew Membership'}
                    </Button>
                  )}
                  
                  {/* Enhanced Upgrade Button with immediate activation indicator */}
                  {statusInfo.showUpgrade && statusInfo.upgradeAvailable && (
                    <Button 
                      variant="success"
                      size="sm" 
                      onClick={() => handleOpenRenewalModal('upgrade')}
                      className="d-flex align-items-center position-relative"
                      disabled={renewalOrderLoading || renewalPaymentLoading || membershipStatusLoading || paymentCompletedRef.current}
                      style={{ minWidth: '140px' }}
                      title="Your upgraded plan will activate immediately"
                    >
                      <FaArrowUp className="me-2" />
                      Upgrade Plan
                      <FaBolt className="ms-1" size={12} style={{ color: '#ffd700' }} />
                    </Button>
                  )}
                  
                  {!statusInfo.renewalAllowed && statusInfo.showRenewal && (
                    <div className="text-warning small text-end" style={{ fontSize: '0.7rem', maxWidth: '140px' }}>
                      Available in {Math.max(0, (membershipStatus?.days_until_expiration || currentMember?.days_until_expiration || 0) - 3)} days
                    </div>
                  )}
                </div>
              )}
              
              {/* View Plans Button */}
              <Button 
                variant="outline-info"
                size="sm"
                onClick={() => setShowPlanComparison(true)}
                className="d-flex align-items-center"
                disabled={paymentCompletedRef.current}
                style={{ minWidth: '140px' }}
              >
                <FaInfoCircle className="me-2" />
                View Plans
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Enhanced Renewal/Upgrade Modal */}
      <Modal 
        show={showRenewalModal} 
        onHide={() => !isProcessingPayment && !paymentCompletedRef.current && setShowRenewalModal(false)}
        size="xl"
        backdrop={isProcessingPayment || paymentCompletedRef.current ? 'static' : true}
        keyboard={!isProcessingPayment && !paymentCompletedRef.current}
      >
        <Modal.Header closeButton={!isProcessingPayment && !paymentCompletedRef.current} style={{ backgroundColor: '#101c36', borderBottom: '1px solid #2a3b6a' }}>
          <Modal.Title className="text-white d-flex align-items-center">
            {activeTab === 'upgrade' && <FaBolt className="me-2 text-warning" />}
            {activeTab === 'upgrade' ? 'Upgrade Your Membership' : (statusInfo.status === 'no_plan' ? 'Select Membership Plan' : 'Renew Your Membership')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', maxHeight: '70vh', overflowY: 'auto' }}>
          {paymentError && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setPaymentError('')}>
              <FaExclamationTriangle className="me-2" />
              {paymentError}
            </Alert>
          )}

          <Tabs 
            activeKey={activeTab} 
            onSelect={(k) => {
              if (paymentCompletedRef.current) return; // Prevent tab change during processing
              setActiveTab(k);
              setSelectedPlan(null);
              setUpgradeCalculations({});
              setPaymentError('');
            }}
            className="mb-4"
            variant="pills"
          >
            <Tab 
              eventKey="renewal" 
              title={
                <span className="d-flex align-items-center">
                  <FaCreditCard className="me-2" />
                  {statusInfo.status === 'no_plan' ? 'Activate Plan' : 'Renewal'}
                </span>
              }
              disabled={!statusInfo.renewalAllowed || paymentCompletedRef.current}
            >
              {membershipPlansLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="light" />
                  <p className="text-white mt-2">Loading membership plans...</p>
                </div>
              ) : membershipPlans && membershipPlans.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h5 className="text-white mb-2">
                      {statusInfo.status === 'no_plan' ? 'Choose a membership plan to get started:' : 'Choose a plan to renew your membership:'}
                    </h5>
                    <p className="text-white-50">
                      {statusInfo.status === 'no_plan' 
                        ? 'Select a plan that best fits your fitness goals and schedule.'
                        : 'Your new membership will start from the expiration date of your current plan.'
                      }
                    </p>
                  </div>
                  
                  <Row>
                    {membershipPlans.map((plan) => {
                      const recommendation = getPlanRecommendation(plan);
                      const isSelected = selectedPlan?.id === plan.id;
                      
                      return (
                        <Col md={6} lg={4} key={plan.id} className="mb-3">
                          <Card 
                            className={`h-100 ${isSelected ? 'border-primary' : ''}`}
                            style={{ 
                              backgroundColor: isSelected ? '#1a2a44' : '#1a2a56', 
                              border: isSelected ? '2px solid #7747ff' : '1px solid #2a3b6a',
                              cursor: paymentCompletedRef.current ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease',
                              opacity: paymentCompletedRef.current ? 0.7 : 1
                            }}
                            onClick={() => !paymentCompletedRef.current && handlePlanSelection(plan)}
                          >
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                  <h6 className="text-white mb-1">{plan.name}</h6>
                                  {recommendation && (
                                    <Badge 
                                      bg={recommendation.type === 'current' ? 'success' : recommendation.type === 'upgrade' ? 'info' : 'secondary'}
                                      className="mb-2"
                                    >
                                      {recommendation.text}
                                    </Badge>
                                  )}
                                </div>
                                <input
                                  type="radio"
                                  name="membershipPlan"
                                  checked={isSelected}
                                  onChange={() => !paymentCompletedRef.current && handlePlanSelection(plan)}
                                  disabled={isProcessingPayment || paymentCompletedRef.current}
                                  className="form-check-input"
                                />
                              </div>
                              
                              <div className="mb-3">
                                <div className="text-white display-6 fw-bold mb-1">₹{plan.price}</div>
                                <div className="text-white-50 small">{plan.duration_days} days</div>
                                <div className="text-white-50 small">
                                  ₹{(parseFloat(plan.price) / plan.duration_days).toFixed(2)} per day
                                </div>
                              </div>
                              
                              <div className="flex-grow-1">
                                <p className="text-white-50 small mb-0">
                                  {plan.description || 'Complete gym access with all facilities'}
                                </p>
                              </div>
                              
                              {isSelected && (
                                <div className="mt-3 pt-3 border-top" style={{ borderColor: '#2a3b6a' }}>
                                  <div className="text-success small">
                                    <FaCheckCircle className="me-1" />
                                    Selected Plan
                                  </div>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </>
              ) : (
                <div className="text-center py-4">
                  <FaExclamationTriangle className="text-warning mb-3" size={48} />
                  <p className="text-white">No membership plans available at the moment.</p>
                  <p className="text-white-50">Please contact the gym administration.</p>
                </div>
              )}
            </Tab>
            
            <Tab 
              eventKey="upgrade" 
              title={
                <span className="d-flex align-items-center">
                  <FaArrowUp className="me-2" />
                  Upgrade
                  <FaBolt className="ms-1 text-warning" size={12} />
                </span>
              }
              disabled={!statusInfo.upgradeAvailable || paymentCompletedRef.current}
            >
              {upgradeLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="light" />
                  <p className="text-white mt-2">Loading upgrade options...</p>
                </div>
              ) : availableUpgrades && availableUpgrades.upgrade_options && availableUpgrades.upgrade_options.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h5 className="text-white mb-2 d-flex align-items-center">
                      <FaBolt className="me-2 text-warning" />
                      Upgrade Your Current Plan (Instant Activation):
                    </h5>
                    <div className="p-3 mb-3" style={{ backgroundColor: '#1a4425', borderRadius: '8px', border: '1px solid #28a745' }}>
                      <div className="text-success small fw-bold mb-2">
                        <FaBolt className="me-1" />
                        Immediate Activation: Your upgraded plan will be active right after payment!
                      </div>
                      <div className="text-white-50 small">
                        You'll only pay the difference between your current plan and the new plan, adjusted for your remaining days.
                        Your upgraded benefits start immediately - no waiting for the current plan to expire.
                      </div>
                    </div>
                    {availableUpgrades.current_plan && (
                      <div className="p-3 mb-3" style={{ backgroundColor: '#1a2a44', borderRadius: '8px' }}>
                        <div className="text-white small">
                          <strong>Current Plan:</strong> {availableUpgrades.current_plan.name} - ₹{availableUpgrades.current_plan.price}
                        </div>
                        <div className="text-white-50 small">
                          <strong>Days Remaining:</strong> {availableUpgrades.days_remaining} days
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Row>
                    {availableUpgrades.upgrade_options.map((upgradeOption) => {
                      const plan = upgradeOption.plan;
                      const isSelected = selectedPlan?.id === plan.id;
                      const calculation = upgradeCalculations[plan.id];
                      
                      return (
                        <Col md={6} key={plan.id} className="mb-3">
                          <Card 
                            className={`h-100 ${isSelected ? 'border-success' : ''}`}
                            style={{ 
                              backgroundColor: isSelected ? '#1a2a44' : '#1a2a56', 
                              border: isSelected ? '2px solid #28a745' : '1px solid #2a3b6a',
                              cursor: paymentCompletedRef.current ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease',
                              opacity: paymentCompletedRef.current ? 0.7 : 1
                            }}
                            onClick={() => !paymentCompletedRef.current && handlePlanSelection(plan)}
                          >
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                  <h6 className="text-white mb-1 d-flex align-items-center">
                                    {plan.name}
                                    <FaBolt className="ms-2 text-warning" size={14} />
                                  </h6>
                                  <Badge bg="info" className="mb-2">
                                    <FaArrowUp className="me-1" />
                                    Instant Upgrade
                                  </Badge>
                                </div>
                                <input
                                  type="radio"
                                  name="upgradePlan"
                                  checked={isSelected}
                                  onChange={() => !paymentCompletedRef.current && handlePlanSelection(plan)}
                                  disabled={isProcessingPayment || isCalculating || paymentCompletedRef.current}
                                  className="form-check-input"
                                />
                              </div>
                              
                              <div className="mb-3">
                                <div className="text-white display-6 fw-bold mb-1">₹{plan.price}</div>
                                <div className="text-white-50 small">{plan.duration_days} days</div>
                                
                                {isCalculating && isSelected ? (
                                  <div className="text-info small">
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Calculating upgrade cost...
                                  </div>
                                ) : calculation ? (
                                  <div className="mt-2">
                                    <div className="text-success fw-bold">
                                      Upgrade Price: ₹{calculation.upgrade_amount}
                                    </div>
                                    <div className="text-warning small fw-bold">
                                      <FaBolt className="me-1" />
                                      Activates immediately!
                                    </div>
                                    <div className="text-white-50 small">
                                      You save: ₹{calculation.savings.toFixed(2)}
                                    </div>
                                    <div className="text-white-50 small">
                                      (₹{(calculation.upgrade_amount / plan.duration_days).toFixed(2)} per day)
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-white-50 small">
                                    Select to see upgrade pricing
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-grow-1">
                                <p className="text-white-50 small mb-0">
                                  {plan.description || 'Complete gym access with premium facilities'}
                                </p>
                              </div>
                              
                              {isSelected && (
                                <div className="mt-3 pt-3 border-top" style={{ borderColor: '#2a3b6a' }}>
                                  <div className="text-success small">
                                    <FaCheckCircle className="me-1" />
                                    Selected for Instant Upgrade
                                  </div>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </>
              ) : upgradeError ? (
                <div className="text-center py-4">
                  <FaExclamationTriangle className="text-warning mb-3" size={48} />
                  <p className="text-white">Unable to load upgrade options</p>
                  <p className="text-white-50">{upgradeError}</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaInfoCircle className="text-info mb-3" size={48} />
                  <p className="text-white">No upgrade options available</p>
                  <p className="text-white-50">Your current plan is already the highest tier available.</p>
                </div>
              )}
            </Tab>
          </Tabs>

          {selectedPlan && (
            <div className="mt-4 p-4" style={{ 
              backgroundColor: activeTab === 'upgrade' ? '#1a4425' : '#1a2a44', 
              borderRadius: '12px', 
              border: activeTab === 'upgrade' ? '1px solid #28a745' : '1px solid #7747ff' 
            }}>
              <h6 className="text-white mb-3 d-flex align-items-center">
                Payment Summary
                {activeTab === 'upgrade' && <FaBolt className="ms-2 text-warning" />}
              </h6>
              <Row>
                <Col md={8}>
                  <div className="text-white mb-2">
                    <strong>Selected Plan:</strong> {selectedPlan.name}
                  </div>
                  <div className="text-white-50 mb-2">
                    Duration: {selectedPlan.duration_days} days
                  </div>
                  <div className="text-white-50 mb-2">
                    {selectedPlan.description}
                  </div>
                  {activeTab === 'upgrade' && (
                    <div className="text-success mb-2 fw-bold">
                      <FaBolt className="me-1" />
                      Activates immediately after payment!
                    </div>
                  )}
                  {activeTab === 'upgrade' && upgradeCalculations[selectedPlan.id] && (
                    <div className="text-info mb-2">
                      <FaInfoCircle className="me-1" />
                      Upgrading from {currentMember?.membership_plan?.name}
                    </div>
                  )}
                </Col>
                <Col md={4} className="text-md-end">
                  {activeTab === 'upgrade' && upgradeCalculations[selectedPlan.id] ? (
                    <>
                      <div className="mb-2">
                        <div className="text-white-50 small">Full Price: ₹{selectedPlan.price}</div>
                        <div className="text-success small">Your Savings: ₹{upgradeCalculations[selectedPlan.id].savings.toFixed(2)}</div>
                      </div>
                      <div className="text-white display-6 fw-bold">₹{upgradeCalculations[selectedPlan.id].upgrade_amount}</div>
                      <div className="text-success small">
                        <FaBolt className="me-1" />
                        Instant Upgrade Price
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-white display-6 fw-bold">₹{selectedPlan.price}</div>
                      <div className="text-success small">
                        <FaCheckCircle className="me-1" />
                        {activeTab === 'upgrade' ? 'Full Plan Price' : 'Secure Payment with Razorpay'}
                      </div>
                    </>
                  )}
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#101c36', borderTop: '1px solid #2a3b6a' }}>
          <Button 
            variant="secondary" 
            onClick={() => setShowRenewalModal(false)}
            disabled={isProcessingPayment || paymentCompletedRef.current}
          >
            Cancel
          </Button>
          <Button 
            variant={activeTab === 'upgrade' ? 'success' : 'primary'}
            onClick={handlePayment}
            disabled={!selectedPlan || isProcessingPayment || membershipPlansLoading || renewalOrderLoading || isCalculating || paymentCompletedRef.current}
            className="d-flex align-items-center"
          >
            {isProcessingPayment || renewalOrderLoading || renewalPaymentLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing Payment...
              </>
            ) : paymentCompletedRef.current ? (
              <>
                <FaCheckCircle className="me-2" />
                Payment Completed
              </>
            ) : (
              <>
                <FaCreditCard className="me-2" />
                {activeTab === 'upgrade' 
                  ? (
                    <>
                      Upgrade Now for ₹{upgradeCalculations[selectedPlan?.id]?.upgrade_amount || selectedPlan?.price || 0}
                      <FaBolt className="ms-1" size={12} />
                    </>
                  )
                  : `Pay ₹${selectedPlan?.price || 0}`
                }
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Plan Comparison Modal */}
      <Modal 
        show={showPlanComparison} 
        onHide={() => !paymentCompletedRef.current && setShowPlanComparison(false)}
        size="xl"
        backdrop={paymentCompletedRef.current ? 'static' : true}
        keyboard={!paymentCompletedRef.current}
      >
        <Modal.Header closeButton={!paymentCompletedRef.current} style={{ backgroundColor: '#101c36', borderBottom: '1px solid #2a3b6a' }}>
          <Modal.Title className="text-white">Available Membership Plans</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427' }}>
          {membershipPlansLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading plans...</p>
            </div>
          ) : membershipPlans && membershipPlans.length > 0 ? (
            <div className="table-responsive">
              <Table variant="dark" className="mb-0">
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Price per Day</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipPlans.map((plan) => {
                    const recommendation = getPlanRecommendation(plan);
                    const pricePerDay = (parseFloat(plan.price) / plan.duration_days).toFixed(2);
                    
                    return (
                      <tr key={plan.id}>
                        <td className="fw-bold">{plan.name}</td>
                        <td>{plan.duration_days} days</td>
                        <td>₹{plan.price}</td>
                        <td>₹{pricePerDay}</td>
                        <td>{plan.description || 'Standard gym access'}</td>
                        <td>
                          {recommendation && (
                            <Badge 
                              bg={recommendation.type === 'current' ? 'success' : recommendation.type === 'upgrade' ? 'info' : 'secondary'}
                            >
                              {recommendation.text}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <p className="text-white text-center">No plans available</p>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#101c36', borderTop: '1px solid #2a3b6a' }}>
          <Button 
            variant="secondary" 
            onClick={() => setShowPlanComparison(false)}
            disabled={paymentCompletedRef.current}
          >
            Close
          </Button>
          {statusInfo.showRenewal && statusInfo.renewalAllowed && !paymentCompletedRef.current && (
            <Button 
              variant="primary" 
              onClick={() => {
                setShowPlanComparison(false);
                handleOpenRenewalModal('renewal');
              }}
              className="me-2"
            >
              Start Renewal Process
            </Button>
          )}
          {statusInfo.showUpgrade && statusInfo.upgradeAvailable && !paymentCompletedRef.current && (
            <Button 
              variant="success" 
              onClick={() => {
                setShowPlanComparison(false);
                handleOpenRenewalModal('upgrade');
              }}
            >
              <FaArrowUp className="me-1" />
              <FaBolt className="ms-1" />
              Instant Upgrade
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MembershipRenewal;

