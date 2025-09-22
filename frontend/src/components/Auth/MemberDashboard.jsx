// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Card, Table, Spinner, Alert, Container, Row, Col, ListGroup, Modal, Button, Form } from 'react-bootstrap';
// import { Person, Calendar, Search, X } from 'react-bootstrap-icons';
// import { FaDumbbell, FaUtensils, FaComment, FaCreditCard, FaStar, FaHistory  } from 'react-icons/fa';
// import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
// import { format, parse, startOfWeek, getDay, addDays, setHours, setMinutes } from 'date-fns';
// import enUS from 'date-fns/locale/en-US';
// import 'react-big-calendar/lib/css/react-big-calendar.css';
// import { 
//   getAttendanceHistory, 
//   getDietPlanHistory, 
//   getWorkoutRoutineHistory, 
//   getCurrentMember, 
//   getCurrentDietPlan,
//   submitTrainerRating,
//   updateTrainerRating,
//   getMemberRatings
// } from '../../features/auth/authApi';
// import { 
//   clearAttendanceError, 
//   clearDietError, 
//   clearWorkoutError, 
//   clearError,
//   clearRatingError
// } from '../../features/auth/authSlice';
// import { clearChatError } from '../../features/chat/chatSlice';
// import { getChatRooms } from '../../features/chat/chatApi';
// import ChatInterface from '../Auth/ChatInterface';
// import MembershipRenewal from './MembershipRenewal';
// import MembershipHistory from './MembershipHistory';

// const locales = { 'en-US': enUS };
// const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// const MemberDashboard = () => {
//   const dispatch = useDispatch();
//   const [activeSection, setActiveSection] = useState('profile');
//   const [events, setEvents] = useState([]);
//   const [selectedWorkout, setSelectedWorkout] = useState(null);
//   const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [selectedCommunityRoom, setSelectedCommunityRoom] = useState(null);
  
//   // Rating states
//   const [rating, setRating] = useState(0);
//   const [feedback, setFeedback] = useState('');
//   const [existingRating, setExistingRating] = useState(null);
//   const [isEditingRating, setIsEditingRating] = useState(false);
  
//   // Add new state for attendance date filtering
//   const [attendanceFilters, setAttendanceFilters] = useState({
//     startDate: '',
//     endDate: ''
//   });

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
//     memberRatings,
//     ratingLoading,
//     ratingError,
//     loading,
//     error
//   } = useSelector((state) => state.auth);
//   const { communityChatRooms, chatLoading, chatError } = useSelector((state) => state.chat);

//   useEffect(() => {
//     if (currentMember?.id) {
//       console.log('Dispatching API calls for memberId:', currentMember.id);
//       dispatch(getAttendanceHistory({ memberId: currentMember.id }));
//       dispatch(getCurrentDietPlan(currentMember.id));
//       dispatch(getWorkoutRoutineHistory(currentMember.id));
//       dispatch(getMemberRatings());
//       if (activeSection === 'chat' || activeSection === 'community') {
//         dispatch(getChatRooms());
//       }
//     } else {
//       console.log('Fetching current member');
//       dispatch(getCurrentMember());
//     }
//   }, [dispatch, currentMember?.id, activeSection]);

//   // Update rating states when memberRatings change
//   useEffect(() => {
//     if (memberRatings.length > 0 && currentMember?.assigned_trainer) {
//       const trainerRating = memberRatings.find(
//         (r) => r.trainer === currentMember.assigned_trainer.id
//       );
//       if (trainerRating) {
//         setExistingRating(trainerRating);
//         setRating(trainerRating.rating);
//         setFeedback(trainerRating.feedback || '');
//         setIsEditingRating(false);
//       } else {
//         setExistingRating(null);
//         setRating(0);
//         setFeedback('');
//         setIsEditingRating(true);
//       }
//     }
//   }, [memberRatings, currentMember]);

//   // Compute calendar events for workout routines
//   useEffect(() => {
//     if (currentMember && workoutRoutines[currentMember.id]) {
//       const calendarEvents = [];
//       workoutRoutines[currentMember.id].forEach(routine => {
//         if (routine.day_number && routine.start_date) {
//           const startDate = new Date(routine.start_date);
//           const dayOfWeek = routine.day_number === 7 ? 0 : routine.day_number;
//           const startDayOfWeek = getDay(startDate);
//           const daysToAdd = (dayOfWeek - startDayOfWeek + 7) % 7;
//           const eventDate = addDays(startDate, daysToAdd);
//           const eventStart = setHours(setMinutes(eventDate, 0), 9);
//           const eventEnd = setHours(setMinutes(eventDate, 0), 10);

//           calendarEvents.push({
//             title: routine.title,
//             start: eventStart,
//             end: eventEnd,
//             allDay: false,
//             resource: routine,
//           });
//         }
//       });
//       setEvents(calendarEvents);
//     }
//   }, [workoutRoutines, currentMember]);

//   // Attendance filter functions
//   const handleAttendanceFilter = () => {
//     if (currentMember?.id) {
//       dispatch(getAttendanceHistory({
//         memberId: currentMember.id,
//         startDate: attendanceFilters.startDate || undefined,
//         endDate: attendanceFilters.endDate || undefined
//       }));
//     }
//   };

//   const clearAttendanceFilters = () => {
//     setAttendanceFilters({
//       startDate: '',
//       endDate: ''
//     });
//     // Fetch all records without filters
//     if (currentMember?.id) {
//       dispatch(getAttendanceHistory({ memberId: currentMember.id }));
//     }
//   };

//   const handleFilterInputChange = (field, value) => {
//     setAttendanceFilters(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   // Rating functions
//   const handleRatingChange = (newRating) => {
//     setRating(newRating);
//   };

//   const handleEditRating = () => {
//     setIsEditingRating(true);
//   };

//   const handleCancelRating = () => {
//     if (existingRating) {
//       setRating(existingRating.rating);
//       setFeedback(existingRating.feedback || '');
//       setIsEditingRating(false);
//     }
//   };

//   const handleSubmitRating = (e) => {
//     e.preventDefault();
//     if (!rating || rating < 1 || rating > 5) {
//       alert('Please select a rating between 1 and 5 stars.');
//       return;
//     }

//     if (!currentMember?.assigned_trainer) {
//       alert('No assigned trainer found.');
//       return;
//     }

//     const ratingData = { 
//       rating, 
//       feedback,
//       trainer_id: currentMember.assigned_trainer.id
//     };
    
//     const action = existingRating
//       ? updateTrainerRating(ratingData)
//       : submitTrainerRating(ratingData);

//     dispatch(action)
//       .unwrap()
//       .then(() => {
//         dispatch(getMemberRatings());
//         setIsEditingRating(false);
//         alert(existingRating ? 'Rating updated successfully!' : 'Rating submitted successfully!');
//       })
//       .catch((error) => {
//         console.error('Rating submission error:', error);
//         alert(error || 'Failed to submit rating.');
//       });
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not available';
//     const date = new Date(dateString);
//     return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
//   };

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
//     if (ratingError) dispatch(clearRatingError());
//   };

//   const handleViewWorkoutDetails = (event) => {
//     setSelectedWorkout(event.resource);
//     setShowWorkoutDetailsModal(true);
//   };

//   const toggleCalendar = () => {
//     setShowCalendar(!showCalendar);
//   };

//   const getCurrentDayWorkout = () => {
//     const today = new Date();
//     const dayOfWeek = getDay(today);
//     const currentDayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

//     if (!currentMember || !workoutRoutines[currentMember.id] || !Array.isArray(workoutRoutines[currentMember.id])) {
//       return [];
//     }

//     return workoutRoutines[currentMember.id].filter(routine => {
//       if (!routine.day_number) return false;
//       return routine.day_number === currentDayNumber;
//     });
//   };

//   const handleSelectCommunityRoom = (room) => {
//     setSelectedCommunityRoom(room);
//   };

//   const renderRatingSection = () => {
//     if (!currentMember?.assigned_trainer) {
//       return (
//         <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//           <Card.Body>
//             <div className="d-flex align-items-center mb-3">
//               <div
//                 className="me-2"
//                 style={{
//                   width: '40px',
//                   height: '40px',
//                   borderRadius: '8px',
//                   backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}
//               >
//                 <FaStar color="#7747ff" size={20} />
//               </div>
//               <span className="text-white">Trainer Rating</span>
//             </div>
//             <Alert variant="info" style={{ backgroundColor: '#1a2a44', borderColor: '#2a3b6a', color: '#ffffff' }}>
//               <Alert.Heading className="text-white">No Assigned Trainer</Alert.Heading>
//               <p className="mb-0">You do not have an assigned trainer to rate. Please contact the admin to get a trainer assigned.</p>
//             </Alert>
//           </Card.Body>
//         </Card>
//       );
//     }

//     const { assigned_trainer } = currentMember;
//     const trainerName = `${assigned_trainer.first_name} ${assigned_trainer.last_name || ''}`.trim();

//     return (
//       <div>
//         {/* Trainer Info Card */}
//         <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }} className="mb-4">
//           <Card.Body>
//             <div className="d-flex align-items-center mb-3">
//               <div
//                 className="me-2"
//                 style={{
//                   width: '40px',
//                   height: '40px',
//                   borderRadius: '8px',
//                   backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}
//               >
//                 <Person color="#7747ff" size={20} />
//               </div>
//               <span className="text-white">Your Assigned Trainer</span>
//             </div>
//             <ListGroup variant="flush">
//               <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
//                 <div className="d-flex justify-content-between">
//                   <strong>Name:</strong>
//                   <span>{trainerName}</span>
//                 </div>
//               </ListGroup.Item>
//               <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
//                 <div className="d-flex justify-content-between">
//                   <strong>Email:</strong>
//                   <span>{assigned_trainer.email}</span>
//                 </div>
//               </ListGroup.Item>
//               {assigned_trainer.specialization && (
//                 <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
//                   <div className="d-flex justify-content-between">
//                     <strong>Specialization:</strong>
//                     <span>{assigned_trainer.specialization}</span>
//                   </div>
//                 </ListGroup.Item>
//               )}
//               {assigned_trainer.phone && (
//                 <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
//                   <div className="d-flex justify-content-between">
//                     <strong>Phone:</strong>
//                     <span>{assigned_trainer.phone}</span>
//                   </div>
//                 </ListGroup.Item>
//               )}
//             </ListGroup>
//           </Card.Body>
//         </Card>

//         {/* Rating Section */}
//         <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//           <Card.Body>
//             <div className="d-flex align-items-center mb-3">
//               <div
//                 className="me-2"
//                 style={{
//                   width: '40px',
//                   height: '40px',
//                   borderRadius: '8px',
//                   backgroundColor: 'rgba(119, 71, 255, 0.1)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}
//               >
//                 <FaStar color="#7747ff" size={20} />
//               </div>
//               <span className="text-white">
//                 {existingRating && !isEditingRating ? 'Your Rating' : 
//                  existingRating && isEditingRating ? 'Update Your Rating' : 
//                  'Rate Your Trainer'}: {trainerName}
//               </span>
//             </div>

//             {/* Display existing rating when not editing */}
//             {existingRating && !isEditingRating && (
//               <div className="mb-4">
//                 <Alert variant="success" style={{ backgroundColor: '#1a4a2a', borderColor: '#2a6a3a', color: '#ffffff' }}>
//                   <div className="d-flex justify-content-between align-items-start">
//                     <div>
//                       <h6 className="mb-2 text-white">Your Current Rating</h6>
//                       <div className="d-flex align-items-center mb-2">
//                         {[1, 2, 3, 4, 5].map((star) => (
//                           <FaStar
//                             key={star}
//                             className={`me-1 ${star <= existingRating.rating ? 'text-warning' : 'text-secondary'}`}
//                             style={{ fontSize: '20px' }}
//                           />
//                         ))}
//                         <span className="ms-2 text-white">{existingRating.rating}/5 stars</span>
//                       </div>
//                       {existingRating.feedback && (
//                         <div className="mb-2">
//                           <strong className="text-white">Your Feedback:</strong>
//                           <p className="mb-0 mt-1 text-break text-white">{existingRating.feedback}</p>
//                         </div>
//                       )}
//                       <small className="text-white-50">
//                         Submitted on {new Date(existingRating.created_at).toLocaleDateString()}
//                       </small>
//                     </div>
//                   </div>
//                 </Alert>
//                 <div className="text-center">
//                   <Button variant="outline-light" onClick={handleEditRating}>
//                     Update Rating & Feedback
//                   </Button>
//                 </div>
//               </div>
//             )}

//             {/* Rating form when editing or no existing rating */}
//             {(isEditingRating || !existingRating) && (
//               <>
//                 {existingRating && isEditingRating && (
//                   <Alert variant="info" style={{ backgroundColor: '#1a2a44', borderColor: '#2a3b6a', color: '#ffffff' }} className="mb-3">
//                     <small>You previously rated this trainer {existingRating.rating}/5 stars on {new Date(existingRating.created_at).toLocaleDateString()}</small>
//                   </Alert>
//                 )}

//                 <Form onSubmit={handleSubmitRating}>
//                   <Form.Group className="mb-3">
//                     <Form.Label className="fw-bold text-white">Rating *</Form.Label>
//                     <div className="d-flex align-items-center">
//                       {[1, 2, 3, 4, 5].map((star) => (
//                         <FaStar
//                           key={star}
//                           className={`me-1 ${star <= rating ? 'text-warning' : 'text-secondary'}`}
//                           style={{ fontSize: '24px', cursor: 'pointer' }}
//                           onClick={() => handleRatingChange(star)}
//                         />
//                       ))}
//                       <span className="ms-2 text-white-50">
//                         {rating > 0 ? `${rating}/5 stars` : 'Click to rate'}
//                       </span>
//                     </div>
//                   </Form.Group>

//                   <Form.Group className="mb-3">
//                     <Form.Label className="fw-bold text-white">Feedback</Form.Label>
//                     <Form.Control
//                       as="textarea"
//                       rows={4}
//                       value={feedback}
//                       onChange={(e) => setFeedback(e.target.value)}
//                       placeholder="Share your feedback about your trainer's performance, communication, and training methods..."
//                       style={{
//                         backgroundColor: '#1a2a44',
//                         border: '1px solid #2a3b6a',
//                         color: '#ffffff'
//                       }}
//                     />
//                     <Form.Text className="text-white-50">
//                       Optional: Help your trainer improve by providing specific feedback
//                     </Form.Text>
//                   </Form.Group>

//                   {ratingError && (
//                     <Alert variant="danger" onClose={() => dispatch(clearRatingError())} dismissible>
//                       <strong>Error:</strong> {ratingError}
//                     </Alert>
//                   )}

//                   <div className="d-flex gap-2">
//                     <Button
//                       type="submit"
//                       variant="primary"
//                       className="flex-grow-1"
//                       style={{ backgroundColor: '#4a6bff', border: 'none' }}
//                       disabled={ratingLoading || rating === 0}
//                     >
//                       {ratingLoading ? (
//                         <>
//                           <Spinner animation="border" size="sm" className="me-2" />
//                           {existingRating ? 'Updating...' : 'Submitting...'}
//                         </>
//                       ) : (
//                         existingRating ? 'Update Rating' : 'Submit Rating'
//                       )}
//                     </Button>
                    
//                     {existingRating && isEditingRating && (
//                       <Button
//                         type="button"
//                         variant="outline-secondary"
//                         onClick={handleCancelRating}
//                         disabled={ratingLoading}
//                         style={{ borderColor: '#2a3b6a', color: '#ffffff' }}
//                       >
//                         Cancel
//                       </Button>
//                     )}
//                   </div>
//                 </Form>
//               </>
//             )}
//           </Card.Body>
//         </Card>
//       </div>
//     );
//   };

// const renderAttendanceSection = () => {
//   // Get attendance records for current member
//   const memberAttendanceRecords = currentMember?.id ? attendanceRecords[currentMember.id] : [];
//   const hasRecords = Array.isArray(memberAttendanceRecords) && memberAttendanceRecords.length > 0;
  
//   return (
//     <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//       <Card.Body>
//         <div className="d-flex align-items-center mb-3">
//           <div
//             className="me-2"
//             style={{
//               width: '40px',
//               height: '40px',
//               borderRadius: '8px',
//               backgroundColor: 'rgba(119, 71, 255, 0.1)',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             <Calendar color="#7747ff" size={20} />
//           </div>
//           <span className="text-white">Attendance History</span>
//         </div>

//         {/* Date Filter Section */}
//         <Card style={{ backgroundColor: '#1a2a44', border: 'none', borderRadius: '8px' }} className="mb-4">
//           <Card.Body>
//             <h6 className="text-white mb-3">Filter by Date Range</h6>
//             <Row className="g-3">
//               <Col md={4}>
//                 <Form.Group>
//                   <Form.Label className="text-white-50 small">Start Date</Form.Label>
//                   <Form.Control
//                     type="date"
//                     value={attendanceFilters.startDate}
//                     onChange={(e) => handleFilterInputChange('startDate', e.target.value)}
//                     style={{
//                       backgroundColor: '#0c1427',
//                       border: '1px solid #2a3b6a',
//                       color: '#ffffff'
//                     }}
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={4}>
//                 <Form.Group>
//                   <Form.Label className="text-white-50 small">End Date</Form.Label>
//                   <Form.Control
//                     type="date"
//                     value={attendanceFilters.endDate}
//                     onChange={(e) => handleFilterInputChange('endDate', e.target.value)}
//                     style={{
//                       backgroundColor: '#0c1427',
//                       border: '1px solid #2a3b6a',
//                       color: '#ffffff'
//                     }}
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={4} className="d-flex align-items-end">
//                 <div className="d-flex gap-2 w-100">
//                   <Button
//                     variant="primary"
//                     onClick={handleAttendanceFilter}
//                     className="flex-grow-1"
//                     style={{ backgroundColor: '#4a6bff', border: 'none' }}
//                     disabled={attendanceLoading}
//                   >
//                     {attendanceLoading ? (
//                       <Spinner animation="border" size="sm" className="me-1" />
//                     ) : (
//                       <Search size={16} className="me-1" />
//                     )}
//                     Apply Filter
//                   </Button>
//                   <Button
//                     variant="outline-secondary"
//                     onClick={clearAttendanceFilters}
//                     style={{ borderColor: '#2a3b6a', color: '#ffffff' }}
//                     disabled={attendanceLoading}
//                   >
//                     <X size={16} />
//                   </Button>
//                 </div>
//               </Col>
//             </Row>
//           </Card.Body>
//         </Card>

//         {/* Attendance Records Table */}
//         {attendanceLoading ? (
//           <div className="text-center">
//             <Spinner animation="border" variant="light" />
//             <p className="text-white mt-2">Loading attendance records...</p>
//           </div>
//         ) : !hasRecords ? (
//           <Alert variant="info" style={{ backgroundColor: '#1a2a44', borderColor: '#2a3b6a', color: '#ffffff' }}>
//             <Calendar size={20} className="me-2" />
//             No attendance records found for the selected date range.
//             {(attendanceFilters.startDate || attendanceFilters.endDate) && (
//               <div className="mt-2 small">
//                 Try adjusting your date filters or clear them to see all records.
//               </div>
//             )}
//           </Alert>
//         ) : (
//           <>
//             {/* Results Summary */}
//             {(attendanceFilters.startDate || attendanceFilters.endDate) && (
//               <Alert variant="success" style={{ backgroundColor: '#1a4a2a', borderColor: '#2a6a3a', color: '#ffffff' }} className="mb-3">
//                 <strong>Filter Applied:</strong> 
//                 {attendanceFilters.startDate && (
//                   <span className="ms-2">From: {new Date(attendanceFilters.startDate).toLocaleDateString()}</span>
//                 )}
//                 {attendanceFilters.endDate && (
//                   <span className="ms-2">To: {new Date(attendanceFilters.endDate).toLocaleDateString()}</span>
//                 )}
//                 <div className="small mt-1">
//                   Showing {memberAttendanceRecords.length} record(s)
//                 </div>
//               </Alert>
//             )}

//             <div className="table-responsive">
//               <Table striped bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
//                 <thead>
//                   <tr>
//                     <th>Date</th>
//                     <th>Status</th>
//                     <th>Marked By</th>
//                     <th>Created At</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {memberAttendanceRecords.map((record) => (
//                     <tr key={record.id}>
//                       <td>{formatDate(record.date)}</td>
//                       <td>
//                         <span className={`badge ${record.status === 'present' ? 'bg-success' : 'bg-danger'}`}>
//                           {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
//                         </span>
//                       </td>
//                       <td>{formatMarkedBy(record)}</td>
//                       <td>{formatDate(record.created_at)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//             </div>
//           </>
//         )}
//       </Card.Body>
//     </Card>
//   );
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
//           <>
//             {/* Membership Renewal Section */}
//             <MembershipRenewal currentMember={currentMember} />
            
//             {/* Profile Card */}
//             <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//               <Card.Body>
//                 <div className="d-flex align-items-center mb-3">
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
//                     <Person color="#7747ff" size={20} />
//                   </div>
//                   <span className="text-white">My Profile</span>
//                 </div>
//                 <p className="text-white">
//                   <strong>Name:</strong> {currentMember.first_name} {currentMember.last_name}<br />
//                   <strong>Email:</strong> {currentMember.email}<br />
//                   <strong>Membership Plan:</strong> {currentMember.membership_plan?.name || 'Not Assigned'}<br />
//                   <strong>Fitness Goal:</strong> {currentMember.fitness_goal || 'Not Specified'}<br />
//                   <strong>Registration Date:</strong> {formatDate(currentMember.date_joined)}
//                 </p>
//               </Card.Body>
//             </Card>
//           </>
//         );

//       case 'membership':
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
//                   <FaCreditCard color="#7747ff" size={20} />
//                 </div>
//                 <span className="text-white">Membership Management</span>
//               </div>
//               <MembershipRenewal currentMember={currentMember} />
//             </Card.Body>
//           </Card>
//         );

//       case 'attendance':
//         return renderAttendanceSection();

//       case 'rating':
//         return renderRatingSection();

//       case 'history':
//         return <MembershipHistory />;

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
//             onClick={() => setActiveSection('membership')}
//             style={{
//               backgroundColor: activeSection === 'membership' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <FaCreditCard size={20} className="me-2" />
//             Membership
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
//           <ListGroup.Item
//             action
//             onClick={() => setActiveSection('rating')}
//             style={{
//               backgroundColor: activeSection === 'rating' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <FaStar size={20} className="me-2" />
//             Rate Trainer
//           </ListGroup.Item>
//           <ListGroup.Item
//             action
//             onClick={() => setActiveSection('history')}
//             style={{
//               backgroundColor: activeSection === 'history' ? '#1a2a44' : 'transparent',
//               color: 'white',
//               border: 'none',
//               padding: '10px 15px',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//             }}
//           >
//             <FaHistory size={20} className="me-2" />
//             Membership History
//           </ListGroup.Item>
//         </ListGroup>
//       </div>

//       {/* Main Content */}
//       <div className="flex-grow-1 p-4">
//         <style>{calendarStyles}</style>
//         <header className="d-flex justify-content-between align-items-center mb-4">
//           <h3 className="text-white">My Dashboard</h3>
//         </header>

//         {(error || attendanceError || dietError || workoutError || chatError || ratingError) && (
//           <Alert variant="danger" onClose={handleClearError} dismissible>
//             {error || attendanceError || dietError || workoutError || chatError || ratingError}
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
//       </div>
//     </div>
//   );
// };

// export default MemberDashboard;

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Table, Spinner, Alert, Container, Row, Col, ListGroup, Modal, Button, Form } from 'react-bootstrap';
import { Person, Calendar, Search, X, PencilSquare, Check2, XLg } from 'react-bootstrap-icons';
import { FaDumbbell, FaUtensils, FaComment, FaCreditCard, FaStar, FaHistory  } from 'react-icons/fa';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, setHours, setMinutes } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  getAttendanceHistory, 
  getDietPlanHistory, 
  getWorkoutRoutineHistory, 
  getCurrentMember, 
  getCurrentDietPlan,
  submitTrainerRating,
  updateTrainerRating,
  getMemberRatings,
  updateCurrentMember
} from '../../features/auth/authApi';
import { 
  clearAttendanceError, 
  clearDietError, 
  clearWorkoutError, 
  clearError,
  clearRatingError
} from '../../features/auth/authSlice';
import { clearChatError } from '../../features/chat/chatSlice';
import { getChatRooms } from '../../features/chat/chatApi';
import ChatInterface from '../Auth/ChatInterface';
import MembershipRenewal from './MembershipRenewal';
import MembershipHistory from './MembershipHistory';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const MemberDashboard = () => {
  const dispatch = useDispatch();
  const [activeSection, setActiveSection] = useState('profile');
  const [events, setEvents] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCommunityRoom, setSelectedCommunityRoom] = useState(null);
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    fitness_goal: '',
    date_of_birth: '',
    address: ''
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  
  // Rating states
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [existingRating, setExistingRating] = useState(null);
  const [isEditingRating, setIsEditingRating] = useState(false);
  
  // Add new state for attendance date filtering
  const [attendanceFilters, setAttendanceFilters] = useState({
    startDate: '',
    endDate: ''
  });

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
    memberRatings,
    ratingLoading,
    ratingError,
    loading,
    error
  } = useSelector((state) => state.auth);
  const { communityChatRooms, chatLoading, chatError } = useSelector((state) => state.chat);

  useEffect(() => {
    if (currentMember?.id) {
      console.log('Dispatching API calls for memberId:', currentMember.id);
      dispatch(getAttendanceHistory({ memberId: currentMember.id }));
      dispatch(getCurrentDietPlan(currentMember.id));
      dispatch(getWorkoutRoutineHistory(currentMember.id));
      dispatch(getMemberRatings());
      if (activeSection === 'chat' || activeSection === 'community') {
        dispatch(getChatRooms());
      }
      
      // Initialize profile form data when currentMember changes
      setProfileFormData({
        first_name: currentMember.first_name || '',
        last_name: currentMember.last_name || '',
        email: currentMember.email || '',
        phone: currentMember.phone || '',
        fitness_goal: currentMember.fitness_goal || '',
        date_of_birth: currentMember.date_of_birth || '',
        address: currentMember.address || ''
      });
    } else {
      console.log('Fetching current member');
      dispatch(getCurrentMember());
    }
  }, [dispatch, currentMember?.id, activeSection]);

  // Update rating states when memberRatings change
  useEffect(() => {
    if (memberRatings.length > 0 && currentMember?.assigned_trainer) {
      const trainerRating = memberRatings.find(
        (r) => r.trainer === currentMember.assigned_trainer.id
      );
      if (trainerRating) {
        setExistingRating(trainerRating);
        setRating(trainerRating.rating);
        setFeedback(trainerRating.feedback || '');
        setIsEditingRating(false);
      } else {
        setExistingRating(null);
        setRating(0);
        setFeedback('');
        setIsEditingRating(true);
      }
    }
  }, [memberRatings, currentMember]);

  // Profile editing functions
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    // Reset form data to current member data
    if (currentMember) {
      setProfileFormData({
        first_name: currentMember.first_name || '',
        last_name: currentMember.last_name || '',
        email: currentMember.email || '',
        phone: currentMember.phone || '',
        fitness_goal: currentMember.fitness_goal || '',
        date_of_birth: currentMember.date_of_birth || '',
        address: currentMember.address || ''
      });
    }
  };

  const handleProfileFormChange = (field, value) => {
    setProfileFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!currentMember?.id) return;
    
    setProfileUpdateLoading(true);
    try {
      await dispatch(updateCurrentMember({
        id: currentMember.id,
        data: profileFormData
      })).unwrap();
      
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      alert(error || 'Failed to update profile');
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  // Compute calendar events for workout routines
  useEffect(() => {
    if (currentMember && workoutRoutines[currentMember.id]) {
      const calendarEvents = [];
      workoutRoutines[currentMember.id].forEach(routine => {
        if (routine.day_number && routine.start_date) {
          const startDate = new Date(routine.start_date);
          const dayOfWeek = routine.day_number === 7 ? 0 : routine.day_number;
          const startDayOfWeek = getDay(startDate);
          const daysToAdd = (dayOfWeek - startDayOfWeek + 7) % 7;
          const eventDate = addDays(startDate, daysToAdd);
          const eventStart = setHours(setMinutes(eventDate, 0), 9);
          const eventEnd = setHours(setMinutes(eventDate, 0), 10);

          calendarEvents.push({
            title: routine.title,
            start: eventStart,
            end: eventEnd,
            allDay: false,
            resource: routine,
          });
        }
      });
      setEvents(calendarEvents);
    }
  }, [workoutRoutines, currentMember]);

  // Attendance filter functions
  const handleAttendanceFilter = () => {
    if (currentMember?.id) {
      dispatch(getAttendanceHistory({
        memberId: currentMember.id,
        startDate: attendanceFilters.startDate || undefined,
        endDate: attendanceFilters.endDate || undefined
      }));
    }
  };

  const clearAttendanceFilters = () => {
    setAttendanceFilters({
      startDate: '',
      endDate: ''
    });
    // Fetch all records without filters
    if (currentMember?.id) {
      dispatch(getAttendanceHistory({ memberId: currentMember.id }));
    }
  };

  const handleFilterInputChange = (field, value) => {
    setAttendanceFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Rating functions
  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleEditRating = () => {
    setIsEditingRating(true);
  };

  const handleCancelRating = () => {
    if (existingRating) {
      setRating(existingRating.rating);
      setFeedback(existingRating.feedback || '');
      setIsEditingRating(false);
    }
  };

  const handleSubmitRating = (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      alert('Please select a rating between 1 and 5 stars.');
      return;
    }

    if (!currentMember?.assigned_trainer) {
      alert('No assigned trainer found.');
      return;
    }

    const ratingData = { 
      rating, 
      feedback,
      trainer_id: currentMember.assigned_trainer.id
    };
    
    const action = existingRating
      ? updateTrainerRating(ratingData)
      : submitTrainerRating(ratingData);

    dispatch(action)
      .unwrap()
      .then(() => {
        dispatch(getMemberRatings());
        setIsEditingRating(false);
        alert(existingRating ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      })
      .catch((error) => {
        console.error('Rating submission error:', error);
        alert(error || 'Failed to submit rating.');
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
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
    if (ratingError) dispatch(clearRatingError());
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

  const renderRatingSection = () => {
    if (!currentMember?.assigned_trainer) {
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
                <FaStar color="#7747ff" size={20} />
              </div>
              <span className="text-white">Trainer Rating</span>
            </div>
            <Alert variant="info" style={{ backgroundColor: '#1a2a44', borderColor: '#2a3b6a', color: '#ffffff' }}>
              <Alert.Heading className="text-white">No Assigned Trainer</Alert.Heading>
              <p className="mb-0">You do not have an assigned trainer to rate. Please contact the admin to get a trainer assigned.</p>
            </Alert>
          </Card.Body>
        </Card>
      );
    }

    const { assigned_trainer } = currentMember;
    const trainerName = `${assigned_trainer.first_name} ${assigned_trainer.last_name || ''}`.trim();

    return (
      <div>
        {/* Trainer Info Card */}
        <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }} className="mb-4">
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
                <Person color="#7747ff" size={20} />
              </div>
              <span className="text-white">Your Assigned Trainer</span>
            </div>
            <ListGroup variant="flush">
              <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                <div className="d-flex justify-content-between">
                  <strong>Name:</strong>
                  <span>{trainerName}</span>
                </div>
              </ListGroup.Item>
              <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                <div className="d-flex justify-content-between">
                  <strong>Email:</strong>
                  <span>{assigned_trainer.email}</span>
                </div>
              </ListGroup.Item>
              {assigned_trainer.specialization && (
                <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                  <div className="d-flex justify-content-between">
                    <strong>Specialization:</strong>
                    <span>{assigned_trainer.specialization}</span>
                  </div>
                </ListGroup.Item>
              )}
              {assigned_trainer.phone && (
                <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                  <div className="d-flex justify-content-between">
                    <strong>Phone:</strong>
                    <span>{assigned_trainer.phone}</span>
                  </div>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card.Body>
        </Card>

        {/* Rating Section */}
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
                <FaStar color="#7747ff" size={20} />
              </div>
              <span className="text-white">
                {existingRating && !isEditingRating ? 'Your Rating' : 
                 existingRating && isEditingRating ? 'Update Your Rating' : 
                 'Rate Your Trainer'}: {trainerName}
              </span>
            </div>

            {/* Display existing rating when not editing */}
            {existingRating && !isEditingRating && (
              <div className="mb-4">
                <Alert variant="success" style={{ backgroundColor: '#1a4a2a', borderColor: '#2a6a3a', color: '#ffffff' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-2 text-white">Your Current Rating</h6>
                      <div className="d-flex align-items-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`me-1 ${star <= existingRating.rating ? 'text-warning' : 'text-secondary'}`}
                            style={{ fontSize: '20px' }}
                          />
                        ))}
                        <span className="ms-2 text-white">{existingRating.rating}/5 stars</span>
                      </div>
                      {existingRating.feedback && (
                        <div className="mb-2">
                          <strong className="text-white">Your Feedback:</strong>
                          <p className="mb-0 mt-1 text-break text-white">{existingRating.feedback}</p>
                        </div>
                      )}
                      <small className="text-white-50">
                        Submitted on {new Date(existingRating.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </Alert>
                <div className="text-center">
                  <Button variant="outline-light" onClick={handleEditRating}>
                    Update Rating & Feedback
                  </Button>
                </div>
              </div>
            )}

            {/* Rating form when editing or no existing rating */}
            {(isEditingRating || !existingRating) && (
              <>
                {existingRating && isEditingRating && (
                  <Alert variant="info" style={{ backgroundColor: '#1a2a44', borderColor: '#2a3b6a', color: '#ffffff' }} className="mb-3">
                    <small>You previously rated this trainer {existingRating.rating}/5 stars on {new Date(existingRating.created_at).toLocaleDateString()}</small>
                  </Alert>
                )}

                <Form onSubmit={handleSubmitRating}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-white">Rating *</Form.Label>
                    <div className="d-flex align-items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={`me-1 ${star <= rating ? 'text-warning' : 'text-secondary'}`}
                          style={{ fontSize: '24px', cursor: 'pointer' }}
                          onClick={() => handleRatingChange(star)}
                        />
                      ))}
                      <span className="ms-2 text-white-50">
                        {rating > 0 ? `${rating}/5 stars` : 'Click to rate'}
                      </span>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-white">Feedback</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your feedback about your trainer's performance, communication, and training methods..."
                      style={{
                        backgroundColor: '#1a2a44',
                        border: '1px solid #2a3b6a',
                        color: '#ffffff'
                      }}
                    />
                    <Form.Text className="text-white-50">
                      Optional: Help your trainer improve by providing specific feedback
                    </Form.Text>
                  </Form.Group>

                  {ratingError && (
                    <Alert variant="danger" onClose={() => dispatch(clearRatingError())} dismissible>
                      <strong>Error:</strong> {ratingError}
                    </Alert>
                  )}

                  <div className="d-flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-grow-1"
                      style={{ backgroundColor: '#4a6bff', border: 'none' }}
                      disabled={ratingLoading || rating === 0}
                    >
                      {ratingLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          {existingRating ? 'Updating...' : 'Submitting...'}
                        </>
                      ) : (
                        existingRating ? 'Update Rating' : 'Submit Rating'
                      )}
                    </Button>
                    
                    {existingRating && isEditingRating && (
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={handleCancelRating}
                        disabled={ratingLoading}
                        style={{ borderColor: '#2a3b6a', color: '#ffffff' }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Form>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderAttendanceSection = () => {
    // Get attendance records for current member
    const memberAttendanceRecords = currentMember?.id ? attendanceRecords[currentMember.id] : [];
    const hasRecords = Array.isArray(memberAttendanceRecords) && memberAttendanceRecords.length > 0;
    
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

          {/* Date Filter Section */}
          <Card style={{ backgroundColor: '#1a2a44', border: 'none', borderRadius: '8px' }} className="mb-4">
            <Card.Body>
              <h6 className="text-white mb-3">Filter by Date Range</h6>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="text-white-50 small">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={attendanceFilters.startDate}
                      onChange={(e) => handleFilterInputChange('startDate', e.target.value)}
                      style={{
                        backgroundColor: '#0c1427',
                        border: '1px solid #2a3b6a',
                        color: '#ffffff'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="text-white-50 small">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={attendanceFilters.endDate}
                      onChange={(e) => handleFilterInputChange('endDate', e.target.value)}
                      style={{
                        backgroundColor: '#0c1427',
                        border: '1px solid #2a3b6a',
                        color: '#ffffff'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <div className="d-flex gap-2 w-100">
                    <Button
                      variant="primary"
                      onClick={handleAttendanceFilter}
                      className="flex-grow-1"
                      style={{ backgroundColor: '#4a6bff', border: 'none' }}
                      disabled={attendanceLoading}
                    >
                      {attendanceLoading ? (
                        <Spinner animation="border" size="sm" className="me-1" />
                      ) : (
                        <Search size={16} className="me-1" />
                      )}
                      Apply Filter
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={clearAttendanceFilters}
                      style={{ borderColor: '#2a3b6a', color: '#ffffff' }}
                      disabled={attendanceLoading}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Attendance Records Table */}
          {attendanceLoading ? (
            <div className="text-center">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading attendance records...</p>
            </div>
          ) : !hasRecords ? (
            <Alert variant="info" style={{ backgroundColor: '#1a2a44', borderColor: '#2a3b6a', color: '#ffffff' }}>
              <Calendar size={20} className="me-2" />
              No attendance records found for the selected date range.
              {(attendanceFilters.startDate || attendanceFilters.endDate) && (
                <div className="mt-2 small">
                  Try adjusting your date filters or clear them to see all records.
                </div>
              )}
            </Alert>
          ) : (
            <>
              {/* Results Summary */}
              {(attendanceFilters.startDate || attendanceFilters.endDate) && (
                <Alert variant="success" style={{ backgroundColor: '#1a4a2a', borderColor: '#2a6a3a', color: '#ffffff' }} className="mb-3">
                  <strong>Filter Applied:</strong> 
                  {attendanceFilters.startDate && (
                    <span className="ms-2">From: {new Date(attendanceFilters.startDate).toLocaleDateString()}</span>
                  )}
                  {attendanceFilters.endDate && (
                    <span className="ms-2">To: {new Date(attendanceFilters.endDate).toLocaleDateString()}</span>
                  )}
                  <div className="small mt-1">
                    Showing {memberAttendanceRecords.length} record(s)
                  </div>
                </Alert>
              )}

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
                    {memberAttendanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{formatDate(record.date)}</td>
                        <td>
                          <span className={`badge ${record.status === 'present' ? 'bg-success' : 'bg-danger'}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td>{formatMarkedBy(record)}</td>
                        <td>{formatDate(record.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    );
  };

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
          <>
            {/* Membership Renewal Section */}
            <MembershipRenewal currentMember={currentMember} />
            
            {/* Profile Card */}
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
                  {!isEditingProfile && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleEditProfile}
                      style={{ borderColor: '#4a6bff', color: '#4a6bff' }}
                    >
                      <PencilSquare size={16} className="me-1" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {isEditingProfile ? (
                  // Edit Profile Form
                  <Form onSubmit={handleProfileSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-white fw-bold">First Name *</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileFormData.first_name}
                            onChange={(e) => handleProfileFormChange('first_name', e.target.value)}
                            required
                            style={{
                              backgroundColor: '#1a2a44',
                              border: '1px solid #2a3b6a',
                              color: '#ffffff'
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-white fw-bold">Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileFormData.last_name}
                            onChange={(e) => handleProfileFormChange('last_name', e.target.value)}
                            style={{
                              backgroundColor: '#1a2a44',
                              border: '1px solid #2a3b6a',
                              color: '#ffffff'
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="text-white fw-bold">Email *</Form.Label>
                          <Form.Control
                            type="email"
                            value={profileFormData.email}
                            onChange={(e) => handleProfileFormChange('email', e.target.value)}
                            required
                            style={{
                              backgroundColor: '#1a2a44',
                              border: '1px solid #2a3b6a',
                              color: '#ffffff'
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-white fw-bold">Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            value={profileFormData.phone}
                            onChange={(e) => handleProfileFormChange('phone', e.target.value)}
                            style={{
                              backgroundColor: '#1a2a44',
                              border: '1px solid #2a3b6a',
                              color: '#ffffff'
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-white fw-bold">Date of Birth</Form.Label>
                          <Form.Control
                            type="date"
                            value={formatDateForInput(profileFormData.date_of_birth)}
                            onChange={(e) => handleProfileFormChange('date_of_birth', e.target.value)}
                            style={{
                              backgroundColor: '#1a2a44',
                              border: '1px solid #2a3b6a',
                              color: '#ffffff'
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="text-white fw-bold">Fitness Goal</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={profileFormData.fitness_goal}
                            onChange={(e) => handleProfileFormChange('fitness_goal', e.target.value)}
                            placeholder="What are your fitness goals?"
                            style={{
                              backgroundColor: '#1a2a44',
                              border: '1px solid #2a3b6a',
                              color: '#ffffff'
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="text-white fw-bold">Address</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={profileFormData.address}
                            onChange={(e) => handleProfileFormChange('address', e.target.value)}
                            placeholder="Your address"
                            style={{
                              backgroundColor: '#1a2a44',
                              border: '1px solid #2a3b6a',
                              color: '#ffffff'
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2 mt-4">
                      <Button
                        type="submit"
                        variant="success"
                        disabled={profileUpdateLoading}
                        className="d-flex align-items-center"
                        style={{ backgroundColor: '#28a745', border: 'none' }}
                      >
                        {profileUpdateLoading ? (
                          <Spinner animation="border" size="sm" className="me-2" />
                        ) : (
                          <Check2 size={16} className="me-2" />
                        )}
                        {profileUpdateLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={handleCancelProfileEdit}
                        disabled={profileUpdateLoading}
                        style={{ borderColor: '#6c757d', color: '#6c757d' }}
                      >
                        <XLg size={14} className="me-2" />
                        Cancel
                      </Button>
                    </div>
                  </Form>
                ) : (
                  // Display Profile Info
                  <ListGroup variant="flush">
                    <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                      <div className="d-flex justify-content-between">
                        <strong>Name:</strong>
                        <span>{currentMember.first_name} {currentMember.last_name}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                      <div className="d-flex justify-content-between">
                        <strong>Email:</strong>
                        <span>{currentMember.email}</span>
                      </div>
                    </ListGroup.Item>
                    {currentMember.phone && (
                      <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                        <div className="d-flex justify-content-between">
                          <strong>Phone:</strong>
                          <span>{currentMember.phone}</span>
                        </div>
                      </ListGroup.Item>
                    )}
                    {currentMember.date_of_birth && (
                      <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                        <div className="d-flex justify-content-between">
                          <strong>Date of Birth:</strong>
                          <span>{formatDate(currentMember.date_of_birth)}</span>
                        </div>
                      </ListGroup.Item>
                    )}
                    <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                      <div className="d-flex justify-content-between">
                        <strong>Membership Plan:</strong>
                        <span>{currentMember.membership_plan?.name || 'Not Assigned'}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                      <div className="d-flex justify-content-between">
                        <strong>Fitness Goal:</strong>
                        <span>{currentMember.fitness_goal || 'Not Specified'}</span>
                      </div>
                    </ListGroup.Item>
                    {currentMember.address && (
                      <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                        <div className="d-flex justify-content-between">
                          <strong>Address:</strong>
                          <span style={{ whiteSpace: 'pre-wrap' }}>{currentMember.address}</span>
                        </div>
                      </ListGroup.Item>
                    )}
                    <ListGroup.Item style={{ backgroundColor: '#1a2a44', color: '#ffffff', border: '1px solid #2a3b6a' }}>
                      <div className="d-flex justify-content-between">
                        <strong>Registration Date:</strong>
                        <span>{formatDate(currentMember.date_joined)}</span>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </>
        );

      case 'membership':
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
                  <FaCreditCard color="#7747ff" size={20} />
                </div>
                <span className="text-white">Membership Management</span>
              </div>
              <MembershipRenewal currentMember={currentMember} />
            </Card.Body>
          </Card>
        );

      case 'attendance':
        return renderAttendanceSection();

      case 'rating':
        return renderRatingSection();

      case 'history':
        return <MembershipHistory />;

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

      default:
        return null;
    }
  };

  return (
    <div className="d-flex" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      {/* Sidebar */}
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
            onClick={() => setActiveSection('membership')}
            style={{
              backgroundColor: activeSection === 'membership' ? '#1a2a44' : 'transparent',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FaCreditCard size={20} className="me-2" />
            Membership
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
            onClick={() => setActiveSection('rating')}
            style={{
              backgroundColor: activeSection === 'rating' ? '#1a2a44' : 'transparent',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FaStar size={20} className="me-2" />
            Rate Trainer
          </ListGroup.Item>
          <ListGroup.Item
            action
            onClick={() => setActiveSection('history')}
            style={{
              backgroundColor: activeSection === 'history' ? '#1a2a44' : 'transparent',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FaHistory size={20} className="me-2" />
            Membership History
          </ListGroup.Item>
        </ListGroup>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <style>{calendarStyles}</style>
        <header className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-white">My Dashboard</h3>
        </header>

        {(error || attendanceError || dietError || workoutError || chatError || ratingError) && (
          <Alert variant="danger" onClose={handleClearError} dismissible>
            {error || attendanceError || dietError || workoutError || chatError || ratingError}
          </Alert>
        )}

        <Container>
          <Row>
            <Col md={12} className="mb-4">
              {renderContent()}
            </Col>
          </Row>
        </Container>

        {/* Workout Details Modal */}
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
      </div>
    </div>
  );
};

export default MemberDashboard;