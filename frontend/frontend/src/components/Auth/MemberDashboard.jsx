import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Table, Spinner, Alert, Container, Row, Col, ListGroup, Modal, Button } from 'react-bootstrap';
import { Person, Calendar, StarFill } from 'react-bootstrap-icons';
import { FaDumbbell, FaUtensils, FaComment, FaMoneyBillWave, FaBell, FaExclamationTriangle } from 'react-icons/fa';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  getAttendanceHistory, 
  getCurrentMembershipDetails,
  getDietPlanHistory, 
  getWorkoutRoutineHistory, 
  getCurrentMember, 
  getCurrentDietPlan, 
  getPublicMembershipPlans,
  createMembershipPayment,
  verifyMembershipPayment
} from '../../features/auth/authApi';
import { 
  clearAttendanceError, 
  clearDietError, 
  clearWorkoutError, 
  clearError, 
  clearPaymentError 
} from '../../features/auth/authSlice';
import { clearChatError } from '../../features/chat/chatSlice';
import { getChatRooms } from '../../features/chat/chatApi';
import ChatInterface from '../Auth/ChatInterface';
import axios from 'axios';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const validSections = ['profile', 'attendance', 'diet', 'workout', 'chat', 'community', 'renew_membership', 'membership_history'];

const MemberDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const initialSection = queryParams.get('section') && validSections.includes(queryParams.get('section')) 
    ? queryParams.get('section') 
    : 'profile';
  
  const [activeSection, setActiveSection] = useState(initialSection);
  const [events, setEvents] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCommunityRoom, setSelectedCommunityRoom] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [showExpiredMembershipAlert, setShowExpiredMembershipAlert] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);

  const {
    currentMember,
    attendanceRecords,
    attendanceLoading,
    attendanceError,
    currentDietPlan,
    dietLoading,
    dietError,
    workoutRoutines,
    workoutLoading,
    workoutError,
    loading,
    error,
    membershipPlans,
    payment,
    currentMembershipDetails
  } = useSelector((state) => state.auth);
  const { communityChatRooms, chatLoading, chatError, notifications } = useSelector((state) => state.chat);
  
  const unreadCount = useMemo(() => {
    return notifications ? notifications.filter(n => !n.is_read).length : 0;
  }, [notifications]);

  const isMembershipExpiredOrNotAssigned = useCallback(() => {
    return !currentMember?.membership_plan || currentMember?.membership_expired;
  }, [currentMember]);

  useEffect(() => {
    if (activeSection !== initialSection) {
      navigate(`?section=${activeSection}`, { replace: true });
    }
  }, [activeSection, navigate, initialSection]);

  useEffect(() => {
    if (currentMember?.id && !dataLoaded) {
      const loadData = async () => {
        try {
          console.log('Loading member data...');
          await Promise.all([
            dispatch(getAttendanceHistory(currentMember.id)),
            dispatch(getCurrentDietPlan(currentMember.id)),
            dispatch(getWorkoutRoutineHistory(currentMember.id)),
            dispatch(getCurrentMembershipDetails())
          ]);
          
          if (activeSection === 'chat' || activeSection === 'community') {
            await dispatch(getChatRooms());
          }
          
          setDataLoaded(true);
        } catch (error) {
          console.error('Error loading member data:', error);
        }
      };
      
      loadData();
    } else if (!currentMember?.id && !loading) {
      console.log('Getting current member...');
      dispatch(getCurrentMember());
    }
  }, [dispatch, currentMember, dataLoaded, loading, activeSection]);

  useEffect(() => {
    if (currentMember?.id && dataLoaded) {
      if (isMembershipExpiredOrNotAssigned()) {
        dispatch(getPublicMembershipPlans());
        setShowExpiredMembershipAlert(true);
      }
    }
  }, [dispatch, currentMember, dataLoaded, isMembershipExpiredOrNotAssigned]);

  useEffect(() => {
    if (currentMember?.id && workoutRoutines[currentMember.id]) {
      const calendarEvents = [];
      const routines = workoutRoutines[currentMember.id];
      
      if (Array.isArray(routines)) {
        routines.forEach(routine => {
          if (routine.day_number && routine.start_date && routine.end_date) {
            const startDate = new Date(routine.start_date);
            const endDate = new Date(routine.end_date);
            
            const targetDayOfWeek = routine.day_number === 7 ? 0 : routine.day_number;
            
            let currentDate = new Date(startDate);
            const startDayOfWeek = currentDate.getDay();
            
            let daysToAdd = (targetDayOfWeek - startDayOfWeek + 7) % 7;
            currentDate.setDate(currentDate.getDate() + daysToAdd);
            
            while (currentDate <= endDate) {
              const eventStart = new Date(currentDate);
              eventStart.setHours(9, 0, 0, 0);
              
              const eventEnd = new Date(currentDate);
              eventEnd.setHours(10, 0, 0, 0);
              
              calendarEvents.push({
                title: `${routine.title} (Day ${routine.day_number})`,
                start: eventStart,
                end: eventEnd,
                allDay: false,
                resource: routine,
              });
              
              currentDate.setDate(currentDate.getDate() + 7);
            }
          }
        });
      }
      
      setEvents(calendarEvents);
    }
  }, [workoutRoutines, currentMember?.id]);

  const handleSelectPlan = useCallback((planId) => {
    console.log('Selecting plan:', planId);
    setSelectedPlanId(planId);
    const plan = membershipPlans.find(p => p.id === planId);
    console.log('Selected plan details:', plan);
    setSelectedPlanDetails(plan);
    setShowPaymentModal(true);
  }, [membershipPlans]);

  const handlePayment = useCallback(async () => {
    if (!selectedPlanId || !currentMember) {
      setPaymentError('Invalid user data or plan selection');
      return;
    }

    try {
      setPaymentError(null);
      
      const API_URL = `${import.meta.env.VITE_API_URL}`;
      const token = localStorage.getItem("accessToken");
      
      const loadingToast = document.createElement('div');
      loadingToast.className = 'position-fixed top-0 start-50 translate-middle-x';
      loadingToast.style.zIndex = '9999';
      loadingToast.innerHTML = `
        <div class="alert alert-info d-flex align-items-center mt-3">
          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
          Processing payment request...
        </div>
      `;
      document.body.appendChild(loadingToast);

      try {
        const orderData = await axios.post(
          `${API_URL}/api/members/create-membership-payment/`,
          { membership_plan_id: selectedPlanId },
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(res => res.data);

        document.body.removeChild(loadingToast);

        const selectedPlan = membershipPlans.find(p => p.id === selectedPlanId);

        const paymentPromise = new Promise((resolve, reject) => {
          const options = {
            key: orderData.key,
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.order_id,
            name: 'Gym Membership',
            description: `${selectedPlan?.name} - Membership Renewal`,
            image: '/logo.png',
            prefill: {
              email: orderData.user.email,
              name: `${orderData.user.first_name} ${orderData.user.last_name}`,
              contact: orderData.user.phone_number || '',
            },
            theme: {
              color: '#4a6bff'
            },
            handler: function (response) {
              resolve(response);
            },
            modal: {
              ondismiss: function () {
                reject(new Error('Payment cancelled by user'));
              }
            }
          };
          
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            reject(new Error(response.error.description || 'Payment failed'));
          });
          rzp.open();
        });

        const response = await paymentPromise;
        
        await axios.post(
          `${API_URL}/api/members/verify-membership-payment/`,
          {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            membership_plan_id: selectedPlanId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        await dispatch(getCurrentMember()).unwrap();
        await dispatch(getCurrentMembershipDetails()).unwrap();
        
        setShowPaymentModal(false);
        setSelectedPlanId(null);
        setPaymentError(null);
        setShowExpiredMembershipAlert(false);
        setDataLoaded(false);
        
        setActiveSection('profile');
        
        const successToast = document.createElement('div');
        successToast.className = 'position-fixed top-0 start-50 translate-middle-x';
        successToast.style.zIndex = '9999';
        successToast.innerHTML = `
          <div class="alert alert-success alert-dismissible fade show mt-3">
            <strong>Success!</strong> Membership renewed successfully with ${selectedPlan?.name}!
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
          </div>
        `;
        document.body.appendChild(successToast);
        
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 5000);
        
      } catch (orderError) {
        if (document.body.contains(loadingToast)) {
          document.body.removeChild(loadingToast);
        }
        throw orderError;
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Failed to process payment');
    }
  }, [selectedPlanId, currentMember, dispatch, membershipPlans]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  }, []);

  const formatMarkedBy = useCallback((record) => {
    if (record.trainer_name && record.trainer_name !== record.trainer_email) {
      return record.trainer_name;
    }
    if (record.trainer_email) {
      return record.trainer_email;
    }
    return 'Not available';
  }, []);

  const handleClearError = useCallback(() => {
    if (error) dispatch(clearError());
    if (attendanceError) dispatch(clearAttendanceError());
    if (dietError) dispatch(clearDietError());
    if (workoutError) dispatch(clearWorkoutError());
    if (chatError) dispatch(clearChatError());
    if (paymentError) dispatch(clearPaymentError());
    setPaymentError(null);
  }, [error, attendanceError, dietError, workoutError, chatError, paymentError, dispatch]);

  const handleViewWorkoutDetails = useCallback((event) => {
    setSelectedWorkout(event.resource);
    setShowWorkoutDetailsModal(true);
  }, []);

  const toggleCalendar = useCallback(() => {
    setShowCalendar(prev => !prev);
  }, []);

  const getCurrentDayWorkout = useCallback(() => {
    const today = new Date();
    const dayOfWeek = getDay(today);
    const currentDayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

    if (!currentMember || !workoutRoutines[currentMember.id] || !Array.isArray(workoutRoutines[currentMember.id])) {
      return [];
    }

    return workoutRoutines[currentMember.id].filter(routine => {
      if (!routine.day_number) return false;
      return routine.day_number === currentDayNumber;
    });
  }, [currentMember, workoutRoutines]);

  const handleSelectCommunityRoom = useCallback((room) => {
    setSelectedCommunityRoom(room);
  }, []);

  const calendarStyles = `
    .rbc-calendar {
      background-color: #101c36;
      color: #ffffff;
      border-radius: 10px;
      padding: 10px;
    }
    .rbc-header {
      background-color: #1a2a56;
      color: #ffffff;
      padding: 10px;
      border-bottom: 1px solid #2a3b6a !important;
      font-size: 16px;
      font-weight: bold;
    }
    .rbc-day-bg {
      background-color: #0c1427;
    }
    .rbc-today {
      background-color: #2a3b6a !important;
    }
    .rbc-event {
      background-color: #4a6bff !important;
      border: none !important;
      border-radius: 5px !important;
      padding: 5px !important;
      color: #ffffff !important;
      font-weight: 500;
      cursor: pointer;
    }
    .rbc-event-label {
      color: #ffffff !important;
    }
    .rbc-time-slot {
      background-color: #0c1427;
      border-top: 1px solid #2a3b6a;
    }
    .rbc-time-header {
      background-color: #1a2a56;
    }
    .rbc-time-content {
      background-color: #101c36;
    }
    .rbc-month-view {
      background-color: #101c36;
    }
    .rbc-month-row {
      background-color: #0c1427;
      border-top: 1px solid #2a3b6a;
    }
    .rbc-date-cell {
      color: #ffffff;
    }
    .rbc-off-range-bg {
      background-color: #1a2a56 !important;
    }
    .rbc-button-link {
      color: #ffffff !important;
    }
    .rbc-toolbar {
      background-color: #1a2a56;
      margin-bottom: 10px;
      border-radius: 5px;
    }
    .rbc-toolbar button {
      color: #ffffff !important;
      background-color: #4a6bff;
      border: none !important;
      border-radius: 5px;
      padding: 5px 10px;
      margin: 0 5px;
    }
    .rbc-toolbar button:hover {
      background-color: #3a5bff !important;
    }
    .rbc-toolbar-label {
      color: #ffffff;
      font-size: 18px;
      font-weight: bold;
    }
  `;

  const renderExpiredMembershipAlert = useCallback(() => {
    if (!showExpiredMembershipAlert || !isMembershipExpiredOrNotAssigned()) {
      return null;
    }

    return (
      <Alert 
        variant="warning" 
        className="mb-4" 
        style={{ backgroundColor: '#856404', borderColor: '#ffeaa7', color: '#fff' }}
      >
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <div className="flex-grow-1">
            <strong>Membership {currentMember?.membership_plan ? 'Expired' : 'Required'}!</strong>
            <p className="mb-2">
              {currentMember?.membership_plan 
                ? 'Your membership has expired. Please renew to continue accessing all features.'
                : 'You need an active membership to access gym features. Please select a plan below.'}
            </p>
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={() => setActiveSection('renew_membership')}
            >
              {currentMember?.membership_plan ? 'Renew Membership' : 'Choose Membership Plan'}
            </Button>
          </div>
          <Button 
            variant="outline-light" 
            size="sm"
            onClick={() => setShowExpiredMembershipAlert(false)}
          >
            ×
          </Button>
        </div>
      </Alert>
    );
  }, [showExpiredMembershipAlert, isMembershipExpiredOrNotAssigned, currentMember]);

  const renderPaymentModal = () => (
    <Modal 
      show={showPaymentModal} 
      onHide={() => setShowPaymentModal(false)}
      centered
    >
      <Modal.Header 
        closeButton
        style={{ backgroundColor: '#1a2a44', borderBottom: '1px solid #2a3b6a' }}
      >
        <Modal.Title style={{ color: '#fff' }}>
          Confirm Membership Purchase
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ backgroundColor: '#101c36', color: '#fff' }}>
        {selectedPlanDetails && (
          <Card className="mb-3" style={{ backgroundColor: '#1a2a44', border: '1px solid #2a3b6a' }}>
            <Card.Body>
              <h5 className="text-white mb-3">Selected Plan Details</h5>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-white mb-2">
                    <strong>Plan:</strong> {selectedPlanDetails.name}
                  </p>
                  <p className="text-white mb-2">
                    <strong>Price:</strong> ₹{selectedPlanDetails.price}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="text-white mb-2">
                    <strong>Duration:</strong> {Math.floor(selectedPlanDetails.duration_days / 30)} Month(s)
                  </p>
                </div>
              </div>
              {selectedPlanDetails.description && (
                <p className="text-white-50 mb-0">
                  <small>{selectedPlanDetails.description}</small>
                </p>
              )}
            </Card.Body>
          </Card>
        )}
        
        <p className="text-white">
          Clicking "Proceed to Payment" will open the secure payment gateway. Complete the payment to activate your membership immediately.
        </p>
        
        <div className="d-flex align-items-center p-3 rounded" style={{ backgroundColor: '#0c1427', border: '1px solid #2a3b6a' }}>
          <FaBell className="text-info me-2" />
          <small className="text-white-50">
            Payments are processed securely through Razorpay. Your data is protected with bank-level security.
          </small>
        </div>

        {paymentError && (
          <Alert variant="danger" className="mt-3" style={{ backgroundColor: '#721c24', borderColor: '#f5c6cb', color: '#fff' }}>
            <FaExclamationTriangle className="me-2" />
            <strong>Payment Error:</strong> {paymentError}
          </Alert>
        )}
      </Modal.Body>
      
      <Modal.Footer style={{ backgroundColor: '#1a2a44', borderTop: '1px solid #2a3b6a' }}>
        <Button 
          variant="outline-light" 
          onClick={() => setShowPaymentModal(false)}
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handlePayment}
          style={{ backgroundColor: '#4a6bff', borderColor: '#4a6bff' }}
        >
          Proceed to Payment
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const renderContent = () => {
    if (loading || !currentMember) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" variant="light" />
          <p className="text-white mt-2">Loading your data...</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'profile':
        return (
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <div
                    className="me-2"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(119, 71, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Person color="#7747ff" size={20} />
                  </div>
                  <span className="text-white">My Profile</span>
                </div>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => navigate('/edit-profile')}
                >
                  Edit
                </Button>
              </div>
              <p className="text-white">
                <strong>Name:</strong> {currentMember.first_name} {currentMember.last_name}<br />
                <strong>Email:</strong> {currentMember.email}<br />
                <strong>Membership Plan:</strong> {currentMember.membership_plan?.name || 'Not Assigned'}<br />
                <strong>Membership Status:</strong> 
                <span className={`ms-2 ${currentMember.membership_expired ? 'text-danger' : 'text-success'}`}>
                  {currentMember.membership_expired ? 'Expired' : 'Active'}
                </span><br />
                <strong>Phone Number:</strong> {currentMember.phone_number || 'Not provided'}<br />
                <strong>Fitness Goal:</strong> {currentMember.fitness_goal || 'Not Specified'}<br />
                <strong>Registration Date:</strong> {formatDate(currentMember.date_joined)}
              </p>
            </Card.Body>
          </Card>
        );

      case 'attendance':
        return (
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="me-2"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(119, 71, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar color="#7747ff" size={20} />
                </div>
                <span className="text-white">Attendance History</span>
              </div>
              {attendanceLoading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="light" />
                </div>
              ) : !attendanceRecords[currentMember.id] || !Array.isArray(attendanceRecords[currentMember.id]) || attendanceRecords[currentMember.id].length === 0 ? (
                <p className="text-white">No attendance records found.</p>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Marked By</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords[currentMember.id].map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.date)}</td>
                          <td>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                          <td>{formatMarkedBy(record)}</td>
                          <td>{formatDate(record.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        );

      case 'diet':
        return (
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="me-2"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(119, 71, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaUtensils color="#7747ff" size={20} />
                </div>
                <span className="text-white">Current Diet Plan</span>
              </div>
              {dietLoading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="light" />
                </div>
              ) : !currentDietPlan ? (
                <p className="text-white">No active diet plan found.</p>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr key={currentDietPlan.id}>
                        <td>{currentDietPlan.title}</td>
                        <td style={{ whiteSpace: 'pre-wrap' }}>{currentDietPlan.description}</td>
                        <td>{formatDate(currentDietPlan.start_date)}</td>
                        <td>{formatDate(currentDietPlan.end_date)}</td>
                        <td>{formatDate(currentDietPlan.created_at)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        );

      case 'workout':
        const currentDayWorkouts = getCurrentDayWorkout();
        return (
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <div
                    className="me-2"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(119, 71, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaDumbbell color="#7747ff" size={20} />
                  </div>
                  <span className="text-white">Workout Routines</span>
                </div>
                {(!workoutRoutines[currentMember.id] || !Array.isArray(workoutRoutines[currentMember.id]) || workoutRoutines[currentMember.id].length === 0) ? null : (
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={toggleCalendar}
                  >
                    {showCalendar ? 'Hide Calendar' : 'View Calendar'}
                  </Button>
                )}
              </div>
              {workoutLoading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="light" />
                </div>
              ) : !workoutRoutines[currentMember.id] || !Array.isArray(workoutRoutines[currentMember.id]) || workoutRoutines[currentMember.id].length === 0 ? (
                <p className="text-white">No workout routines found.</p>
              ) : currentDayWorkouts.length === 0 ? (
                <p className="text-white">No workout scheduled for today.</p>
              ) : (
                <>
                  <div className="table-responsive mb-4">
                    <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Description</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDayWorkouts.map((routine) => (
                          <tr key={routine.id}>
                            <td>{routine.title}</td>
                            <td style={{ whiteSpace: 'pre-wrap' }}>{routine.description}</td>
                            <td>{formatDate(routine.start_date)}</td>
                            <td>{formatDate(routine.end_date)}</td>
                            <td>{formatDate(routine.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  {showCalendar && (
                    <div className="mt-4">
                      <h5 className="text-white mb-3">Workout Calendar</h5>
                      <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500 }}
                        onSelectEvent={handleViewWorkoutDetails}
                        defaultView="month"
                      />
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        );

      case 'chat':
        return <ChatInterface userType="member" />;

      case 'community':
        return (
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="me-2"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(119, 71, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaComment color="#7747ff" size={20} />
                </div>
                <span className="text-white">Community Chats</span>
              </div>
              {chatLoading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="light" />
                </div>
              ) : communityChatRooms && communityChatRooms.length > 0 ? (
                <>
                  <ListGroup className="mb-4">
                    {communityChatRooms.map(room => (
                      <ListGroup.Item
                        key={room.id}
                        action
                        onClick={() => handleSelectCommunityRoom(room)}
                        style={{
                          backgroundColor: selectedCommunityRoom?.id === room.id ? '#1a2a44' : '#0c1427',
                          color: 'white',
                          border: '1px solid #2a3b6a',
                          borderRadius: '8px',
                          marginBottom: '10px',
                          padding: '15px',
                          cursor: 'pointer'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{room.name}</h6>
                            <p className="mb-0 text-white-50">
                              Members: {room.members.length} | Created: {formatDate(room.created_at)}
                            </p>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  {selectedCommunityRoom ? (
                    <ChatInterface
                      userType="member"
                      roomType="community"
                      roomId={selectedCommunityRoom.id}
                    />
                  ) : (
                    <p className="text-white">Select a community chat to start chatting.</p>
                  )}
                </>
              ) : (
                <p className="text-white">No community chats available.</p>
              )}
            </Card.Body>
          </Card>
        );

      case 'renew_membership':
        return (
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="me-2"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(119, 71, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaMoneyBillWave color="#7747ff" size={20} />
                </div>
                <span className="text-white">
                  {currentMember?.membership_plan ? 'Renew Membership' : 'Choose Membership Plan'}
                </span>
              </div>
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="light" />
                  <p className="text-white mt-2">Loading membership plans...</p>
                </div>
              ) : !membershipPlans || membershipPlans.length === 0 ? (
                <p className="text-white">No membership plans available at the moment.</p>
              ) : (
                <div className="row justify-content-center">
                  <h4 className="text-white mb-3 text-center">
                    Available Membership Plans
                  </h4>
                  {membershipPlans.map((plan) => (
                    <div key={plan.id} className="col-12 col-md-6 col-lg-4 mb-4">
                      <Card
                        className="text-center p-4"
                        style={{
                          backgroundColor: '#2c2c2c',
                          border: '2px solid transparent',
                          borderRadius: '15px',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#7747ff';
                          e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Card.Body>
                          <h3 className="mb-3" style={{ color: '#fff' }}>
                            {plan.name || 'Unnamed Plan'}
                          </h3>
                          <h2 className="mb-3" style={{ color: '#FFC107' }}>
                            ₹{typeof plan.price === 'number' && !isNaN(plan.price) 
                              ? plan.price.toFixed(2) 
                              : Number(plan.price || 0).toFixed(2)}
                          </h2>
                          <p className="text-muted mb-3">
                            {plan.duration_days === 1
                              ? 'Single Class'
                              : `${Math.floor(plan.duration_days / 30)} Month${Math.floor(plan.duration_days / 30) > 1 ? 's' : ''} Access`}
                          </p>
                          {plan.description && (
                            <p className="text-light mb-4" style={{ fontSize: '0.9rem' }}>
                              {plan.description}
                            </p>
                          )}
                          <Button
                            variant="primary"
                            className="w-100"
                            style={{ 
                              backgroundColor: '#7747ff', 
                              borderColor: '#7747ff', 
                              color: '#fff',
                              fontWeight: 'bold'
                            }}
                            onClick={() => handleSelectPlan(plan.id)}
                          >
                            {currentMember?.membership_plan ? 'Renew with This Plan' : 'Select This Plan'}
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        );

      case 'membership_history':
        return (
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="me-2"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(119, 71, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaMoneyBillWave color="#7747ff" size={20} />
                </div>
                <span className="text-white">Membership History</span>
              </div>
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="light" />
                </div>
              ) : !currentMember?.membership_history || currentMember.membership_history.length === 0 ? (
                <p className="text-white">No membership history found.</p>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr>
                        <th>Plan Name</th>
                        <th>Price</th>
                        <th>Duration</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMember.membership_history.map((record) => (
                        <tr key={record.id}>
                          <td>{record.plan_name || 'Unnamed Plan'}</td>
                          <td>₹{typeof record.price === 'number' ? record.price.toFixed(2) : Number(record.price || 0).toFixed(2)}</td>
                          <td>{record.duration_days === 1 ? 'Single Class' : `${Math.floor(record.duration_days / 30)} Month${Math.floor(record.duration_days / 30) > 1 ? 's' : ''}`}</td>
                          <td>{formatDate(record.start_date)}</td>
                          <td>{formatDate(record.end_date)}</td>
                          <td>{record.status || 'Unknown'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="d-flex" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <div
        style={{
          width: '250px',
          backgroundColor: '#101c36',
          padding: '20px',
          borderRight: '1px solid #1a2a44',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <h4 className="text-white mb-4">Dashboard</h4>
        <ListGroup variant="flush">
          <ListGroup.Item
            action
            onClick={() => setActiveSection('profile')}
            style={{
              backgroundColor: activeSection === 'profile' ? '#1a2a44' : 'transparent',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Person size={20} className="me-2" />
            Profile
          </ListGroup.Item>
          
          {isMembershipExpiredOrNotAssigned() && (
            <ListGroup.Item
              action
              onClick={() => setActiveSection('renew_membership')}
              style={{
                backgroundColor: activeSection === 'renew_membership' ? '#1a2a44' : 'transparent',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                borderLeft: '3px solid #dc3545',
              }}
            >
              <FaMoneyBillWave size={20} className="me-2" />
              {currentMember?.membership_plan ? 'Renew Membership' : 'Choose Plan'}
            </ListGroup.Item>
          )}
          
          {!isMembershipExpiredOrNotAssigned() && (
            <>
              <ListGroup.Item
                action
                onClick={() => setActiveSection('attendance')}
                style={{
                  backgroundColor: activeSection === 'attendance' ? '#1a2a44' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Calendar size={20} className="me-2" />
                Attendance
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => setActiveSection('diet')}
                style={{
                  backgroundColor: activeSection === 'diet' ? '#1a2a44' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FaUtensils size={20} className="me-2" />
                Diet Plans
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => setActiveSection('workout')}
                style={{
                  backgroundColor: activeSection === 'workout' ? '#1a2a44' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FaDumbbell size={20} className="me-2" />
                Workout Routines
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => setActiveSection('chat')}
                style={{
                  backgroundColor: activeSection === 'chat' ? '#1a2a44' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FaComment size={20} className="me-2" />
                Chat with Trainer
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => setActiveSection('community')}
                style={{
                  backgroundColor: activeSection === 'community' ? '#1a2a44' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FaComment size={20} className="me-2" />
                Community Chat
              </ListGroup.Item>
              {/* <ListGroup.Item
                action
                onClick={() => setActiveSection('membership_history')}
                style={{
                  backgroundColor: activeSection === 'membership_history' ? '#1a2a44' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FaMoneyBillWave size={20} className="me-2" />
                Membership History
              </ListGroup.Item> */}
              <ListGroup.Item
                action
                onClick={() => navigate('/Rating')}
                style={{
                  backgroundColor: location.pathname === '/Ratings' ? '#1a2a44' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <StarFill size={20} className="me-2" />
                Rating & Review
              </ListGroup.Item>
            </>
          )}
        </ListGroup>
      </div>

      <div className="flex-grow-1 p-4">
        <style>{calendarStyles}</style>
        <header className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-white">My Dashboard</h3>
        </header>

        {renderExpiredMembershipAlert()}

        {(error || attendanceError || dietError || workoutError || chatError || paymentError) && (
          <Alert variant="danger" onClose={handleClearError} dismissible>
            {error || attendanceError || dietError || workoutError || chatError || paymentError}
          </Alert>
        )}

        <Container>
          <Row>
            <Col md={12} className="mb-4">
              {renderContent()}
            </Col>
          </Row>
        </Container>

        <Modal show={showWorkoutDetailsModal} onHide={() => setShowWorkoutDetailsModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Workout Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedWorkout ? (
              <>
                <h5>{selectedWorkout.title}</h5>
                <p><strong>Description:</strong> {selectedWorkout.description}</p>
                <p><strong>Day Number:</strong> {selectedWorkout.day_number || 'Not specified'}</p>
                <p><strong>Start Date:</strong> {formatDate(selectedWorkout.start_date)}</p>
                <p><strong>End Date:</strong> {formatDate(selectedWorkout.end_date)}</p>
              </>
            ) : (
              <p>No workout details available.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWorkoutDetailsModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {renderPaymentModal()}
      </div>
    </div>
  );
};

export default MemberDashboard;

