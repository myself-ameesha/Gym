// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Card, Table, Spinner, Alert, Container, Row, Col, ListGroup, Modal, Button } from 'react-bootstrap';
// import { Person, Calendar,StarFill } from 'react-bootstrap-icons';
// import { FaDumbbell, FaUtensils, FaComment, FaBell, FaMoneyBillWave } from 'react-icons/fa';
// import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
// import { format, parse, startOfWeek, getDay, addDays, setHours, setMinutes } from 'date-fns';
// import enUS from 'date-fns/locale/en-US';
// import 'react-big-calendar/lib/css/react-big-calendar.css';
// import { getAttendanceHistory, getDietPlanHistory, getWorkoutRoutineHistory, getCurrentMember, getCurrentDietPlan,  getPublicMembershipPlans, changeMembershipPlan, verifyChangeMembershipPayment } from '../../features/auth/authApi';
// import { clearAttendanceError, clearDietError, clearWorkoutError, clearError, clearPaymentError } from '../../features/auth/authSlice';
// import { clearChatError } from '../../features/chat/chatSlice';
// import { getChatRooms } from '../../features/chat/chatApi';
// import ChatInterface from '../Auth/ChatInterface';

// const locales = { 'en-US': enUS };
// const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// const MemberDashboard = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate(); // Added
//   const location = useLocation(); // Added
//   const [activeSection, setActiveSection] = useState('profile');
//   const [events, setEvents] = useState([]);
//   const [selectedWorkout, setSelectedWorkout] = useState(null);
//   const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [selectedCommunityRoom, setSelectedCommunityRoom] = useState(null); // Track selected community chat room
//   const [selectedPlanId, setSelectedPlanId] = useState(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);

//   const {
//     currentMember,
//     attendanceRecords,
//     attendanceLoading,
//     attendanceError,
//     currentDietPlan,
//     dietLoading,
//     dietError,
//     workoutRoutines,
//     workoutLoading,
//     workoutError,
//     loading,
//     error,
//     membershipPlans,
//     payment,
//   } = useSelector((state) => state.auth);
//   const { communityChatRooms, chatLoading, chatError, notifications } = useSelector((state) => state.chat);
//   const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0; 
 
//   useEffect(() => {
//     if (currentMember?.id) {
//       console.log('Dispatching API calls for memberId:', currentMember.id);
//       dispatch(getAttendanceHistory(currentMember.id));
//       dispatch(getCurrentDietPlan(currentMember.id));
//       dispatch(getWorkoutRoutineHistory(currentMember.id));
//       dispatch(getPublicMembershipPlans());
//       if (activeSection === 'chat' || activeSection === 'community') {
//         dispatch(getChatRooms());
//       }
//     } else {
//       console.log('Fetching current member');
//       dispatch(getCurrentMember());
//     }
//   }, [dispatch, currentMember?.id, activeSection]);

//   // Compute calendar events for workout routines
//   useEffect(() => {
//     if (currentMember && workoutRoutines[currentMember.id]) {
//       const calendarEvents = [];
//       workoutRoutines[currentMember.id].forEach(routine => {
//       if (routine.day_number && routine.start_date && routine.end_date) {
//         const startDate = new Date(routine.start_date);
//         const endDate = new Date(routine.end_date);
        
//         // Convert day_number to JavaScript day of week (0 = Sunday, 1 = Monday, etc.)
//         const targetDayOfWeek = routine.day_number === 7 ? 0 : routine.day_number;
        
//         // Find the first occurrence of the target day of week from start date
//         let currentDate = new Date(startDate);
//         const startDayOfWeek = currentDate.getDay();
        
//         // Calculate days to add to reach the target day of week
//         let daysToAdd = (targetDayOfWeek - startDayOfWeek + 7) % 7;
//         currentDate.setDate(currentDate.getDate() + daysToAdd);
        
//         // Generate weekly recurring events until end date
//         while (currentDate <= endDate) {
//           const eventStart = new Date(currentDate);
//           eventStart.setHours(9, 0, 0, 0); // Set to 9:00 AM
          
//           const eventEnd = new Date(currentDate);
//           eventEnd.setHours(10, 0, 0, 0); // Set to 10:00 AM
          
//           calendarEvents.push({
//             title: `${routine.title} (Day ${routine.day_number})`,
//             start: eventStart,
//             end: eventEnd,
//             allDay: false,
//             resource: routine,
//           });
          
//           // Move to next week (add 7 days)
//           currentDate.setDate(currentDate.getDate() + 7);
//         }
//       }
//     });
    
//     setEvents(calendarEvents);
//   }
// }, [workoutRoutines, currentMember]);


//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not available';
//     const date = new Date(dateString);
//     return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
//   };

//   // Helper function to format the "Marked By" field
//   const formatMarkedBy = (record) => {
//     if (record.trainer_name && record.trainer_name !== record.trainer_email) {
//       return record.trainer_name;
//     }
//     if (record.trainer_email) {
//       return record.trainer_email;
//     }
//     return 'Not available';
//   };

//   const handleClearError = () => {
//     if (error) dispatch(clearError());
//     if (attendanceError) dispatch(clearAttendanceError());
//     if (dietError) dispatch(clearDietError());
//     if (workoutError) dispatch(clearWorkoutError());
//     if (chatError) dispatch(clearChatError());
//     if (payment.error) dispatch(clearPaymentError());
//   };

//   const handleViewWorkoutDetails = (event) => {
//     setSelectedWorkout(event.resource);
//     setShowWorkoutDetailsModal(true);
//   };

//   const toggleCalendar = () => {
//     setShowCalendar(!showCalendar);
//   };

//   // Get the current day's workout based on the day of the week
//   const getCurrentDayWorkout = () => {
//     const today = new Date();
//     const dayOfWeek = getDay(today); // 0 (Sunday) to 6 (Saturday)
//     // Map dayOfWeek to day_number: Monday (1) = Day 1, ..., Sunday (0) = Day 7
//     const currentDayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

//     if (!currentMember || !workoutRoutines[currentMember.id] || !Array.isArray(workoutRoutines[currentMember.id])) {
//       return [];
//     }

//     // Filter workout routines for the current day
//     return workoutRoutines[currentMember.id].filter(routine => {
//       if (!routine.day_number) return false;
//       return routine.day_number === currentDayNumber;
//     });
//   };

//   // Handler for selecting a community chat room
//   const handleSelectCommunityRoom = (room) => {
//     setSelectedCommunityRoom(room);
//   };

//     const handleSelectPlan = (planId) => {
//     setSelectedPlanId(planId);
//     setShowPaymentModal(true);
//   };

// const handlePayment = () => {
//   if (!selectedPlanId || !currentMember) {
//     alert('Invalid user data or plan selection');
//     return;
//   }

//   console.log('Initiating payment with:', { membership_plan_id: selectedPlanId });

//   dispatch(changeMembershipPlan({ membership_plan_id: selectedPlanId }))
//     .unwrap()
//     .then((orderData) => {
//       console.log('Razorpay Order Data:', orderData);
//       const options = {
//         key: orderData.key,
//         amount: orderData.amount,
//         currency: orderData.currency,
//         order_id: orderData.order_id,
//         handler: function (response) {
//           dispatch(verifyChangeMembershipPayment({
//             razorpay_order_id: response.razorpay_order_id,
//             razorpay_payment_id: response.razorpay_payment_id,
//             razorpay_signature: response.razorpay_signature,
//           }))
//             .unwrap()
//             .then(() => {
//               dispatch(getCurrentMember());
//               setShowPaymentModal(false);
//               alert('Subscription changed successfully!');
//             })
//             .catch((err) => alert('Payment verification failed: ' + err));
//         },
//         prefill: {
//           email: orderData.user.email,
//           name: orderData.user.name,
//           contact: orderData.user.contact,
//         },
//       };
//       const rzp = new window.Razorpay(options);
//       rzp.open();
//     })
//     .catch((err) => alert('Failed to initiate payment: ' + err));
// };

//   const calendarStyles = `
//     .rbc-calendar {
//       background-color: #101c36;
//       color: #ffffff;
//       border-radius: 10px;
//       padding: 10px;
//     }
//     .rbc-header {
//       background-color: #1a2a56;
//       color: #ffffff;
//       padding: 10px;
//       border-bottom: 1px solid #2a3b6a !important;
//       font-size: 16px;
//       font-weight: bold;
//     }
//     .rbc-day-bg {
//       background-color: #0c1427;
//     }
//     .rbc-today {
//       background-color: #2a3b6a !important;
//     }
//     .rbc-event {
//       background-color: #4a6bff !important;
//       border: none !important;
//       border-radius: 5px !important;
//       padding: 5px !important;
//       color: #ffffff !important;
//       font-weight: 500;
//       cursor: pointer;
//     }
//     .rbc-event-label {
//       color: #ffffff !important;
//     }
//     .rbc-time-slot {
//       background-color: #0c1427;
//       border-top: 1px solid #2a3b6a;
//     }
//     .rbc-time-header {
//       background-color: #1a2a56;
//     }
//     .rbc-time-content {
//       background-color: #101c36;
//     }
//     .rbc-month-view {
//       background-color: #101c36;
//     }
//     .rbc-month-row {
//       background-color: #0c1427;
//       border-top: 1px solid #2a3b6a;
//     }
//     .rbc-date-cell {
//       color: #ffffff;
//     }
//     .rbc-off-range-bg {
//       background-color: #1a2a56 !important;
//     }
//     .rbc-button-link {
//       color: #ffffff !important;
//     }
//     .rbc-toolbar {
//       background-color: #1a2a56;
//       margin-bottom: 10px;
//       border-radius: 5px;
//     }
//     .rbc-toolbar button {
//       color: #ffffff !important;
//       background-color: #4a6bff;
//       border: none !important;
//       border-radius: 5px;
//       padding: 5px 10px;
//       margin: 0 5px;
//     }
//     .rbc-toolbar button:hover {
//       background-color: #3a5bff !important;
//     }
//     .rbc-toolbar-label {
//       color: #ffffff;
//       font-size: 18px;
//       font-weight: bold;
//     }
//   `;

//   const renderContent = () => {
//     if (loading || !currentMember) {
//       return (
//         <div className="text-center my-5">
//           <Spinner animation="border" variant="light" />
//           <p className="text-white mt-2">Loading your data...</p>
//         </div>
//       );
//     }

//     switch (activeSection) {
//       case 'profile':
//         return (
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body>
//               <div className="d-flex justify-content-between align-items-center mb-3">
//                 <div className="d-flex align-items-center">
//                 <div
//                   className="me-2"
//                   style={{
//                     width: '40px',
//                     height: '40px',
//                     borderRadius: '8px',
//                     backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Person color="#7747ff" size={20} />
               
//                 </div>
//                 <span className="text-white">My Profile</span>
//               </div>
//               <Button
//                   variant="outline-info"
//                   size="sm"
//                   onClick={() => navigate('/edit-profile')}
//                 >
//                   Edit
//                 </Button>
//                 </div>
//               <p className="text-white">
//                 <strong>Name:</strong> {currentMember.first_name} {currentMember.last_name}<br />
//                 <strong>Email:</strong> {currentMember.email}<br />
//                 <strong>Membership Plan:</strong> {currentMember.membership_plan?.name || 'Not Assigned'}<br />
//                 <strong>Phone Number:</strong> {currentMember.phone_number}<br />
//                 <strong>Fitness Goal:</strong> {currentMember.fitness_goal || 'Not Specified'}<br />
//                 <strong>Registration Date:</strong> {formatDate(currentMember.date_joined)}
//               </p>
//             </Card.Body>
//           </Card>
//         );

//       case 'attendance':
//         return (
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body>
//               <div className="d-flex align-items-center mb-3">
//                 <div
//                   className="me-2"
//                   style={{
//                     width: '40px',
//                     height: '40px',
//                     borderRadius: '8px',
//                     backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Calendar color="#7747ff" size={20} />
//                 </div>
//                 <span className="text-white">Attendance History</span>
//               </div>
//               {attendanceLoading ? (
//                 <div className="text-center">
//                   <Spinner animation="border" variant="light" />
//                 </div>
//               ) : !attendanceRecords[currentMember.id] || !Array.isArray(attendanceRecords[currentMember.id]) || attendanceRecords[currentMember.id].length === 0 ? (
//                 <p className="text-white">No attendance records found.</p>
//               ) : (
//                 <div className="table-responsive">
//                   <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
//                     <thead>
//                       <tr>
//                         <th>Date</th>
//                         <th>Status</th>
//                         <th>Marked By</th>
//                         <th>Created At</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {attendanceRecords[currentMember.id].map((record) => (
//                         <tr key={record.id}>
//                           <td>{formatDate(record.date)}</td>
//                           <td>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
//                           <td>{formatMarkedBy(record)}</td>
//                           <td>{formatDate(record.created_at)}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </Table>
//                 </div>
//               )}
//             </Card.Body>
//           </Card>
//         );

//       case 'diet':
//         return (
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body>
//               <div className="d-flex align-items-center mb-3">
//                 <div
//                   className="me-2"
//                   style={{
//                     width: '40px',
//                     height: '40px',
//                     borderRadius: '8px',
//                     backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <FaUtensils color="#7747ff" size={20} />
//                 </div>
//                 <span className="text-white">Current Diet Plan</span>
//               </div>
//               {dietLoading ? (
//                 <div className="text-center">
//                   <Spinner animation="border" variant="light" />
//                 </div>
//               ) : !currentDietPlan ? (
//                 <p className="text-white">No active diet plan found.</p>
//               ) : (
//                 <div className="table-responsive">
//                   <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
//                     <thead>
//                       <tr>
//                         <th>Title</th>
//                         <th>Description</th>
//                         <th>Start Date</th>
//                         <th>End Date</th>
//                         <th>Created At</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       <tr key={currentDietPlan.id}>
//                         <td>{currentDietPlan.title}</td>
//                         <td style={{ whiteSpace: 'pre-wrap' }}>{currentDietPlan.description}</td>
//                         <td>{formatDate(currentDietPlan.start_date)}</td>
//                         <td>{formatDate(currentDietPlan.end_date)}</td>
//                         <td>{formatDate(currentDietPlan.created_at)}</td>
//                       </tr>
//                     </tbody>
//                   </Table>
//                 </div>
//               )}
//             </Card.Body>
//           </Card>
//         );

//       case 'workout':
//         const currentDayWorkouts = getCurrentDayWorkout();
//         return (
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body>
//               <div className="d-flex justify-content-between align-items-center mb-3">
//                 <div className="d-flex align-items-center">
//                   <div
//                     className="me-2"
//                     style={{
//                       width: '40px',
//                       height: '40px',
//                       borderRadius: '8px',
//                       backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                     }}
//                   >
//                     <FaDumbbell color="#7747ff" size={20} />
//                   </div>
//                   <span className="text-white">Workout Routines</span>
//                 </div>
//                 {(!workoutRoutines[currentMember.id] || !Array.isArray(workoutRoutines[currentMember.id]) || workoutRoutines[currentMember.id].length === 0) ? null : (
//                   <Button
//                     variant="outline-info"
//                     size="sm"
//                     onClick={toggleCalendar}
//                   >
//                     {showCalendar ? 'Hide Calendar' : 'View Calendar'}
//                   </Button>
//                 )}
//               </div>
//               {workoutLoading ? (
//                 <div className="text-center">
//                   <Spinner animation="border" variant="light" />
//                 </div>
//               ) : !workoutRoutines[currentMember.id] || !Array.isArray(workoutRoutines[currentMember.id]) || workoutRoutines[currentMember.id].length === 0 ? (
//                 <p className="text-white">No workout routines found.</p>
//               ) : currentDayWorkouts.length === 0 ? (
//                 <p className="text-white">No workout scheduled for today.</p>
//               ) : (
//                 <>
//                   {/* Today's Workout Routines Table */}
//                   <div className="table-responsive mb-4">
//                     <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
//                       <thead>
//                         <tr>
//                           <th>Title</th>
//                           <th>Description</th>
//                           <th>Start Date</th>
//                           <th>End Date</th>
//                           <th>Created At</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {currentDayWorkouts.map((routine) => (
//                           <tr key={routine.id}>
//                             <td>{routine.title}</td>
//                             <td style={{ whiteSpace: 'pre-wrap' }}>{routine.description}</td>
//                             <td>{formatDate(routine.start_date)}</td>
//                             <td>{formatDate(routine.end_date)}</td>
//                             <td>{formatDate(routine.created_at)}</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </Table>
//                   </div>
//                   {/* Workout Calendar (conditionally rendered) */}
//                   {showCalendar && (
//                     <div className="mt-4">
//                       <h5 className="text-white mb-3">Workout Calendar</h5>
//                       <BigCalendar
//                         localizer={localizer}
//                         events={events}
//                         startAccessor="start"
//                         endAccessor="end"
//                         style={{ height: 500 }}
//                         onSelectEvent={handleViewWorkoutDetails}
//                         defaultView="month"
//                       />
//                     </div>
//                   )}
//                 </>
//               )}
//             </Card.Body>
//           </Card>
//         );

//       case 'chat':
//         return <ChatInterface userType="member" />;

//       case 'community':
//         return (
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body>
//               <div className="d-flex align-items-center mb-3">
//                 <div
//                   className="me-2"
//                   style={{
//                     width: '40px',
//                     height: '40px',
//                     borderRadius: '8px',
//                     backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <FaComment color="#7747ff" size={20} />
//                 </div>
//                 <span className="text-white">Community Chats</span>
//               </div>
//               {chatLoading ? (
//                 <div className="text-center">
//                   <Spinner animation="border" variant="light" />
//                 </div>
//               ) : communityChatRooms && communityChatRooms.length > 0 ? (
//                 <>
//                   {/* List of Community Chat Rooms */}
//                   <ListGroup className="mb-4">
//                     {communityChatRooms.map(room => (
//                       <ListGroup.Item
//                         key={room.id}
//                         action
//                         onClick={() => handleSelectCommunityRoom(room)}
//                         style={{
//                           backgroundColor: selectedCommunityRoom?.id === room.id ? '#1a2a44' : '#0c1427',
//                           color: 'white',
//                           border: '1px solid #2a3b6a',
//                           borderRadius: '8px',
//                           marginBottom: '10px',
//                           padding: '15px',
//                           cursor: 'pointer'
//                         }}
//                       >
//                         <div className="d-flex justify-content-between align-items-center">
//                           <div>
//                             <h6 className="mb-1">{room.name}</h6>
//                             <p className="mb-0 text-white-50">
//                               Members: {room.members.length} | Created: {formatDate(room.created_at)}
//                             </p>
//                           </div>
//                         </div>
//                       </ListGroup.Item>
//                     ))}
//                   </ListGroup>
//                   {/* Chat Interface for Selected Room */}
//                   {selectedCommunityRoom ? (
//                     <ChatInterface
//                       userType="member"
//                       roomType="community"
//                       roomId={selectedCommunityRoom.id}
//                     />
//                   ) : (
//                     <p className="text-white">Select a community chat to start chatting.</p>
//                   )}
//                 </>
//               ) : (
//                 <p className="text-white">No community chats available.</p>
//               )}
//             </Card.Body>
//           </Card>

//         );


        
//       case 'subscription':
//         // Filter out the current member's selected plan
//         const availablePlans = membershipPlans?.filter(
//           (plan) => plan.id !== currentMember?.membership_plan?.id
//         ) || [];
//         return (
//           <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//             <Card.Body>
//               <div className="d-flex align-items-center mb-3">
//                 <div
//                   className="me-2"
//                   style={{
//                     width: '40px',
//                     height: '40px',
//                     borderRadius: '8px',
//                     backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <FaMoneyBillWave color="#7747ff" size={20} />
//                 </div>
//                 <span className="text-white">Change Subscription</span>
//               </div>
//               {loading ? (
//                 <div className="text-center">
//                   <Spinner animation="border" variant="light" />
//                 </div>
//               ) : !availablePlans || availablePlans.length === 0 ? (
//                 <p className="text-white">No other membership plans available.</p>
//               ) : (
//                 <div className="row justify-content-center">
//                   {availablePlans.map((plan) => (
//                     <div key={plan.id} className="col-12 col-md-6 col-lg-4 mb-4">
//                       <Card
//                         className="text-center p-4"
//                         style={{
//                           backgroundColor: '#2c2c2c',
//                           border: 'none',
//                           borderRadius: '15px',
//                           boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
//                         }}
//                       >
//                         <Card.Body>
//                           <h3 className="mb-3" style={{ color: '#fff' }}>
//                             {plan.name || 'Unnamed Plan'}
//                           </h3>
//                           <h2 className="mb-3" style={{ color: '#FFC107' }}>
//                             ${plan.price || '0.0'}
//                           </h2>
//                           <p className="text-muted mb-4">
//                             {plan.duration_days === 1 ? 'SINGLE CLASS' : `${plan.duration_days} Month${plan.duration_days > 1 ? 's' : ''} unlimited`}
//                           </p>
//                           <Button
//                             variant="dark"
//                             className="w-100"
//                             style={{ backgroundColor: '#333', borderColor: '#444', color: '#fff' }}
//                             onClick={() => handleSelectPlan(plan.id)}
//                           >
//                             Select Plan
//                           </Button>
//                         </Card.Body>
//                       </Card>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </Card.Body>
//           </Card>
//         );


//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="d-flex" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
//       {/* Sidebar */}
//       <div
//         style={{
//           width: '250px',
//           backgroundColor: '#101c36',
//           padding: '20px',
//           borderRight: '1px solid #1a2a44',
//           height: '100vh',
//           position: 'sticky',
//           top: 0,
//         }}
//       >
//         <h4 className="text-white mb-4">Dashboard</h4>
//         <ListGroup variant="flush">
//           <ListGroup.Item
//             action
//             onClick={() => setActiveSection('profile')}
//             style={{
//               backgroundColor: activeSection === 'profile' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <Person size={20} className="me-2" />
//             Profile
//           </ListGroup.Item>
//           <ListGroup.Item
//             action
//             onClick={() => setActiveSection('attendance')}
//             style={{
//               backgroundColor: activeSection === 'attendance' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <Calendar size={20} className="me-2" />
//             Attendance
//           </ListGroup.Item>
//           <ListGroup.Item
//             action
//             onClick={() => setActiveSection('diet')}
//             style={{
//               backgroundColor: activeSection === 'diet' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <FaUtensils size={20} className="me-2" />
//             Diet Plans
//           </ListGroup.Item>
//           <ListGroup.Item
//             action
//             onClick={() => setActiveSection('workout')}
//             style={{
//               backgroundColor: activeSection === 'workout' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <FaDumbbell size={20} className="me-2" />
//             Workout Routines
//           </ListGroup.Item>
//           <ListGroup.Item
//             action
//             onClick={() => setActiveSection('chat')}
//             style={{
//               backgroundColor: activeSection === 'chat' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <FaComment size={20} className="me-2" />
//             Chat with Trainer
//           </ListGroup.Item>
//           <ListGroup.Item
//             action
//             onClick={() => setActiveSection('community')}
//             style={{
//               backgroundColor: activeSection === 'community' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <FaComment size={20} className="me-2" />
//             Community Chat
//           </ListGroup.Item>
//            <ListGroup.Item
//             action
//             onClick={() => setActiveSection('subscription')}
//             style={{
//               backgroundColor: activeSection === 'subscription' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <FaMoneyBillWave size={20} className="me-2" />
//             Change Subscription
//           </ListGroup.Item>
//           {/* Added Notifications Item */}
//     <ListGroup.Item
//       action
//       onClick={() => navigate('/Notifications')}
//       style={{
//         backgroundColor: location.pathname === '/Notifications' ? '#1a2a44' : 'transparent',
//         color: 'white',
//         border: 'none',
//         padding: '10px 15px',
//         cursor: 'pointer',
//         display: 'flex',
//         alignItems: 'center',
//       }}
//     >
//       <FaBell size={20} className="me-2" />
//       Notifications
//       {unreadCount > 0 && (
//         <span 
//           className="ms-2 badge rounded-pill bg-danger" 
//           style={{ fontSize: '0.75rem', padding: '4px 8px' }}
//         >
//           {unreadCount}
//         </span>
//       )}
//     </ListGroup.Item>
//     <ListGroup.Item
//             action
//             onClick={() => navigate('/Rating')}
//             style={{
//               backgroundColor: location.pathname === '/Ratings' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <StarFill size={20} className="me-2" />
//             Rating & Review
//           </ListGroup.Item>
//         </ListGroup>
//       </div>

//       {/* Main Content */}
//       <div className="flex-grow-1 p-4">
//         <style>{calendarStyles}</style>
//         <header className="d-flex justify-content-between align-items-center mb-4">
//           <h3 className="text-white">My Dashboard</h3>
//         </header>

//         {(error || attendanceError || dietError || workoutError || chatError) && (
//           <Alert variant="danger" onClose={handleClearError} dismissible>
//             {error || attendanceError || dietError || workoutError || chatError}
//           </Alert>
//         )}

//         <Container>
//           <Row>
//             <Col md={12} className="mb-4">
//               {renderContent()}
//             </Col>
//           </Row>
//         </Container>

//         {/* Workout Details Modal */}
//         <Modal show={showWorkoutDetailsModal} onHide={() => setShowWorkoutDetailsModal(false)}>
//           <Modal.Header closeButton>
//             <Modal.Title>Workout Details</Modal.Title>
//           </Modal.Header>
//           <Modal.Body>
//             {selectedWorkout ? (
//               <>
//                 <h5>{selectedWorkout.title}</h5>
//                 <p><strong>Description:</strong> {selectedWorkout.description}</p>
//                 <p><strong>Day Number:</strong> {selectedWorkout.day_number || 'Not specified'}</p>
//                 <p><strong>Start Date:</strong> {formatDate(selectedWorkout.start_date)}</p>
//                 <p><strong>End Date:</strong> {formatDate(selectedWorkout.end_date)}</p>
//               </>
//             ) : (
//               <p>No workout details available.</p>
//             )}
//           </Modal.Body>
//           <Modal.Footer>
//             <Button variant="secondary" onClick={() => setShowWorkoutDetailsModal(false)}>
//               Close
//             </Button>
//           </Modal.Footer>
//         </Modal>
//                <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
//           <Modal.Header closeButton>
//             <Modal.Title>Confirm Subscription Change</Modal.Title>
//           </Modal.Header>
//           <Modal.Body>
//             <p>Are you sure you want to change your subscription to the selected plan? You will be prompted to make a payment to complete the change.</p>
//             {payment.loading && (
//               <div className="text-center">
//                 <Spinner animation="border" variant="primary" />
//                 <p>Processing payment...</p>
//               </div>
//             )}
//           </Modal.Body>
//           <Modal.Footer>
//             <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
//               Cancel
//             </Button>
//             <Button variant="primary" onClick={handlePayment} disabled={payment.loading}>
//               Proceed to Payment
//             </Button>
//           </Modal.Footer>
//         </Modal>
//       </div>
//     </div>
//   );
// };

// export default MemberDashboard;


import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Table, Spinner, Alert, Container, Row, Col, ListGroup, Modal, Button } from 'react-bootstrap';
import { Person, Calendar, StarFill } from 'react-bootstrap-icons';
import { FaDumbbell, FaUtensils, FaComment, FaMoneyBillWave } from 'react-icons/fa';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, setHours, setMinutes } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getAttendanceHistory, getDietPlanHistory, getWorkoutRoutineHistory, getCurrentMember, getCurrentDietPlan, getPublicMembershipPlans, changeMembershipPlan, verifyChangeMembershipPayment } from '../../features/auth/authApi';
import { clearAttendanceError, clearDietError, clearWorkoutError, clearError, clearPaymentError } from '../../features/auth/authSlice';
import { clearChatError } from '../../features/chat/chatSlice';
import { getChatRooms } from '../../features/chat/chatApi';
import ChatInterface from '../Auth/ChatInterface';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const validSections = ['profile', 'attendance', 'diet', 'workout', 'chat', 'community', 'subscription', 'membership_history'];

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
  } = useSelector((state) => state.auth);
  const { communityChatRooms, chatLoading, chatError } = useSelector((state) => state.chat);

  useEffect(() => {
    if (activeSection !== initialSection) {
      navigate(`?section=${activeSection}`, { replace: true });
    }
  }, [activeSection, navigate, initialSection]);

  useEffect(() => {
    if (currentMember?.id) {
      dispatch(getAttendanceHistory(currentMember.id));
      dispatch(getCurrentDietPlan(currentMember.id));
      dispatch(getWorkoutRoutineHistory(currentMember.id));
      if (currentMember.membership_expired || !currentMember.membership_plan) {
        dispatch(getPublicMembershipPlans());
      }
      if (activeSection === 'chat' || activeSection === 'community') {
        dispatch(getChatRooms());
      }
    } else {
      dispatch(getCurrentMember());
    }
  }, [dispatch, currentMember?.id, activeSection, currentMember?.membership_expired, currentMember?.membership_plan]);

  useEffect(() => {
    if (currentMember && workoutRoutines[currentMember.id]) {
      const calendarEvents = [];
      workoutRoutines[currentMember.id].forEach(routine => {
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
      setEvents(calendarEvents);
    }
  }, [workoutRoutines, currentMember]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const formatMarkedBy = (record) => {
    if (record.trainer_name && record.trainer_name !== record.trainer_email) {
      return record.trainer_name;
    }
    if (record.trainer_email) {
      return record.trainer_email;
    }
    return 'Not available';
  };

  const handleClearError = () => {
    if (error) dispatch(clearError());
    if (attendanceError) dispatch(clearAttendanceError());
    if (dietError) dispatch(clearDietError());
    if (workoutError) dispatch(clearWorkoutError());
    if (chatError) dispatch(clearChatError());
    if (payment.error) dispatch(clearPaymentError());
    setPaymentError(null);
  };

  const handleViewWorkoutDetails = (event) => {
    setSelectedWorkout(event.resource);
    setShowWorkoutDetailsModal(true);
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  const getCurrentDayWorkout = () => {
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
  };

  const handleSelectCommunityRoom = (room) => {
    setSelectedCommunityRoom(room);
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPlanId || !currentMember) {
      setPaymentError('Invalid user data or plan selection');
      return;
    }

    try {
      const orderData = await dispatch(changeMembershipPlan({ membership_plan_id: selectedPlanId })).unwrap();
      
      const paymentPromise = new Promise((resolve, reject) => {
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.order_id,
          prefill: {
            email: orderData.user.email,
            name: orderData.user.name,
            contact: orderData.user.contact,
          },
          handler: function (response) {
            resolve(response);
          },
          modal: {
            ondismiss: function () {
              reject(new Error('Payment modal dismissed'));
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
      await dispatch(verifyChangeMembershipPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        membership_plan_id: selectedPlanId
      })).unwrap();
      
      await dispatch(getCurrentMember()).unwrap();
      
      setShowPaymentModal(false);
      setSelectedPlanId(null);
      setPaymentError(null);
      
      alert('Subscription changed successfully!');
    } catch (err) {
      setPaymentError(err.message || 'Failed to process payment');
    }
  };

  const calendarStyles = `
    .rbc-calendar { background-color: #101c36; color: #ffffff; border-radius: 10px; padding: 10px; }
    .rbc-header { background-color: #1a2a56; color: #ffffff; padding: 10px; border-bottom: 1px solid #2a3b6a !important; font-size: 16px; font-weight: bold; }
    .rbc-day-bg { background-color: #0c1427; }
    .rbc-today { background-color: #2a3b6a !important; }
    .rbc-event { background-color: #4a6bff !important; border: none !important; border-radius: 5px !important; padding: 5px !important; color: #ffffff !important; font-weight: 500; cursor: pointer; }
    .rbc-event-label { color: #ffffff !important; }
    .rbc-time-slot { background-color: #0c1427; border-top: 1px solid #2a3b6a; }
    .rbc-time-header { background-color: #1a2a56; }
    .rbc-time-content { background-color: #101c36; }
    .rbc-month-view { background-color: #101c36; }
    .rbc-month-row { background-color: #0c1427; border-top: 1px solid #2a3b6a; }
    .rbc-date-cell { color: #ffffff; }
    .rbc-off-range-bg { background-color: #1a2a56 !important; }
    .rbc-button-link { color: #ffffff !important; }
    .rbc-toolbar { background-color: #1a2a56; margin-bottom: 10px; border-radius: 5px; }
    .rbc-toolbar button { color: #ffffff !important; background-color: #4a6bff; border: none !important; border-radius: 5px; padding: 5px 10px; margin: 0 5px; }
    .rbc-toolbar button:hover { background-color: #3a5bff !important; }
    .rbc-toolbar-label { color: #ffffff; font-size: 18px; font-weight: bold; }
  `;

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

      case 'subscription':
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
                <span className="text-white">Subscription</span>
              </div>
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="light" />
                  <p className="text-white mt-2">Loading subscription data...</p>
                </div>
              ) : !currentMember ? (
                <p className="text-white">User data not available.</p>
              ) : (
                !currentMember.membership_expired && currentMember.membership_plan ? (
                  <div className="text-center">
                    <h4 className="text-white mb-3">Current Membership Plan</h4>
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
                          {currentMember.membership_plan.name || 'Unnamed Plan'}
                        </h3>
                        <h2 className="mb-3" style={{ color: '#FFC107' }}>
                          ₹{typeof currentMember.membership_plan.price === 'number' && !isNaN(currentMember.membership_plan.price) 
                            ? currentMember.membership_plan.price.toFixed(2) 
                            : Number(currentMember.membership_plan.price || 0).toFixed(2)}
                        </h2>
                        <p className="text-muted mb-4">
                          {currentMember.membership_plan.duration_days === 1
                            ? 'Single Class'
                            : `${currentMember.membership_plan.duration_days} Month${currentMember.membership_plan.duration_days > 1 ? 's' : ''} Unlimited`}
                        </p>
                        <p className="text-success mb-2">
                          <strong>Status:</strong> Active
                        </p>
                        <p className="text-white">
                          <strong>Start Date:</strong> {formatDate(currentMember.membership_start_date)}
                        </p>
                        <p className="text-white">
                          <strong>Expires On:</strong>{' '}
                          {currentMember.membership_start_date && currentMember.membership_plan
                            ? formatDate(
                                new Date(
                                  new Date(currentMember.membership_start_date).getTime() +
                                    currentMember.membership_plan.duration_days * 24 * 60 * 60 * 1000
                                )
                              )
                            : 'Not available'}
                        </p>
                      </Card.Body>
                    </Card>
                  </div>
                ) : (
                  !membershipPlans || membershipPlans.length === 0 ? (
                    <p className="text-white">No membership plans available to select.</p>
                  ) : (
                    <div className="row justify-content-center">
                      <h4 className="text-white mb-3 text-center">Available Membership Plans</h4>
                      {membershipPlans.map((plan) => (
                        <div key={plan.id} className="col-12 col-md-6 col-lg-4 mb-4">
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
                                ₹{typeof plan.price === 'number' && !isNaN(plan.price) ? plan.price.toFixed(2) : Number(plan.price || 0).toFixed(2)}
                              </h2>
                              <p className="text-muted mb-4">
                                {plan.duration_days === 1
                                  ? 'Single Class'
                                  : `${plan.duration_days} Month${plan.duration_days > 1 ? 's' : ''} Unlimited`}
                              </p>
                              <Button
                                variant="dark"
                                className="w-100"
                                style={{ backgroundColor: '#333', borderColor: '#444', color: '#fff' }}
                                onClick={() => handleSelectPlan(plan.id)}
                              >
                                Select Plan
                              </Button>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )
                )
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
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => navigate('/membership-history')}
              >
                View Full History
              </Button>
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
          <ListGroup.Item
            action
            onClick={() => setActiveSection('subscription')}
            style={{
              backgroundColor: activeSection === 'subscription' ? '#1a2a44' : 'transparent',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FaMoneyBillWave size={20} className="me-2" />
            Change Subscription
          </ListGroup.Item>
          <ListGroup.Item
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
          </ListGroup.Item>
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
        </ListGroup>
      </div>

      <div className="flex-grow-1 p-4">
        <style>{calendarStyles}</style>
        <header className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-white">My Dashboard</h3>
        </header>

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
        <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Subscription Change</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to change your subscription to the selected plan? You will be prompted to make a payment to complete the change.</p>
            {payment.loading && (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p>Processing payment...</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePayment} disabled={payment.loading}>
              Proceed to Payment
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default MemberDashboard;

