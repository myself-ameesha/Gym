// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Card, Table, Spinner, Alert, Button, Form, Modal } from 'react-bootstrap';
// import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
// import { format, parse, startOfWeek, getDay, addDays, setHours, setMinutes } from 'date-fns';
// import enUS from 'date-fns/locale/en-US';
// import 'react-big-calendar/lib/css/react-big-calendar.css';
// import { getAssignedMembers, createWorkoutRoutine, getWorkoutRoutineHistory, getDailyWorkout } from '../../features/auth/authApi';

// const locales = { 'en-US': enUS };
// const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// const WorkoutManagement = () => {
//   const dispatch = useDispatch();
//   const { assignedMembers, workoutRoutines, dailyWorkout, loading, workoutLoading, error, workoutError } = useSelector((state) => state.auth);
//   const [showWorkoutModal, setShowWorkoutModal] = useState(false);
//   const [showCalendarModal, setShowCalendarModal] = useState(false);
//   const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
//   const [currentMember, setCurrentMember] = useState(null);
//   const [selectedWorkout, setSelectedWorkout] = useState(null);
//   const [workoutTitle, setWorkoutTitle] = useState('');
//   const [workoutDescription, setWorkoutDescription] = useState('');
//   const [dayNumber, setDayNumber] = useState('');
//   const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
//   const [endDate, setEndDate] = useState('');
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [events, setEvents] = useState([]);

//   useEffect(() => {
//     dispatch(getAssignedMembers());
//   }, [dispatch]);

//   useEffect(() => {
//     if (currentMember) {
//       dispatch(getWorkoutRoutineHistory(currentMember.id));
//     }
//   }, [dispatch, currentMember]);

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

//   const handleCreateWorkout = (member) => {
//     setCurrentMember(member);
//     setShowWorkoutModal(true);
//   };

//   const handleSubmitWorkout = () => {
//     if (currentMember) {
//       dispatch(createWorkoutRoutine({
//         memberId: currentMember.id,
//         title: workoutTitle,
//         description: workoutDescription,
//         dayNumber: dayNumber ? parseInt(dayNumber) : null,
//         startDate,
//         endDate: endDate || null,
//       })).then((result) => {
//         if (result.error) {
//           console.error('Failed to create workout:', result.error.message);
//         } else {
//           setShowWorkoutModal(false);
//           setWorkoutTitle('');
//           setWorkoutDescription('');
//           setDayNumber('');
//           setStartDate(new Date().toISOString().split('T')[0]);
//           setEndDate('');
//         }
//       });
//     }
//   };

//   const handleViewCalendar = (member) => {
//     setCurrentMember(member);
//     setShowCalendarModal(true);
//     dispatch(getWorkoutRoutineHistory(member.id));
//   };

//   const handleViewWorkoutDetails = (event) => {
//     setSelectedWorkout(event.resource);
//     setShowWorkoutDetailsModal(true);
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not available';
//     const date = new Date(dateString);
//     return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
//   };

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

//   return (
//     <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
//       <style>{calendarStyles}</style>
//       <header className="d-flex justify-content-between align-items-center mb-4">
//         <h3 className="text-white">Workout Management</h3>
//       </header>

//       {(error || workoutError) && (
//         <Alert variant="danger" onClose={() => dispatch({ type: 'auth/clearError' })} dismissible>
//           {error || workoutError || 'An error occurred while processing your request.'}
//         </Alert>
//       )}

//       <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
//         <Card.Body>
//           <h5 className="text-white mb-3">Assigned Members</h5>
//           {loading ? (
//             <div className="text-center my-5">
//               <Spinner animation="border" variant="light" />
//               <p className="text-white mt-2">Loading members...</p>
//             </div>
//           ) : !Array.isArray(assignedMembers) || assignedMembers.length === 0 ? (
//             <div className="text-center my-5">
//               <p className="text-white">No members assigned to you.</p>
//             </div>
//           ) : (
//             <div className="table-responsive">
//               <Table bordered hover variant="dark">
//                 <thead>
//                   <tr>
//                     <th>ID</th>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {assignedMembers.map((member) => (
//                     <tr key={member.id}>
//                       <td>{member.id}</td>
//                       <td>{member.first_name} {member.last_name}</td>
//                       <td>{member.email}</td>
//                       <td>
//                         <Button
//                           variant="outline-success"
//                           size="sm"
//                           onClick={() => handleCreateWorkout(member)}
//                           className="me-2"
//                         >
//                           Add Workout
//                         </Button>
//                         <Button
//                           variant="outline-info"
//                           size="sm"
//                           onClick={() => handleViewCalendar(member)}
//                         >
//                           View Calendar
//                         </Button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//             </div>
//           )}
//         </Card.Body>
//       </Card>

//       {/* Workout Creation Modal */}
//       <Modal show={showWorkoutModal} onHide={() => setShowWorkoutModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Create Workout for {currentMember?.first_name} {currentMember?.last_name}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group className="mb-3">
//               <Form.Label>Day Number</Form.Label>
//               <Form.Select
//                 value={dayNumber}
//                 onChange={(e) => setDayNumber(e.target.value)}
//               >
//                 <option value="">None</option>
//                 <option value="1">Day 1 (Monday)</option>
//                 <option value="2">Day 2 (Tuesday)</option>
//                 <option value="3">Day 3 (Wednesday)</option>
//                 <option value="4">Day 4 (Thursday)</option>
//                 <option value="5">Day 5 (Friday)</option>
//                 <option value="6">Day 6 (Saturday)</option>
//                 <option value="7">Day 7 (Sunday - Recovery)</option>
//               </Form.Select>
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Title</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={workoutTitle}
//                 onChange={(e) => setWorkoutTitle(e.target.value)}
//                 placeholder="e.g., Strength Training"
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Description</Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={4}
//                 value={workoutDescription}
//                 onChange={(e) => setWorkoutDescription(e.target.value)}
//                 placeholder="e.g., Bench Press 3x10\nSquats 3x12..."
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Start Date</Form.Label>
//               <Form.Control
//                 type="date"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>End Date (Optional)</Form.Label>
//               <Form.Control
//                 type="date"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />
//             </Form.Group>
//           </Form>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowWorkoutModal(false)}>
//             Cancel
//           </Button>
//           <Button
//             variant="primary"
//             onClick={handleSubmitWorkout}
//             disabled={workoutLoading}
//           >
//             {workoutLoading ? 'Saving...' : 'Save Workout'}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Calendar Modal */}
//       <Modal show={showCalendarModal} onHide={() => setShowCalendarModal(false)} size="lg">
//         <Modal.Header closeButton>
//           <Modal.Title>Workout Calendar for {currentMember?.first_name} {currentMember?.last_name}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {workoutLoading ? (
//             <div className="text-center">
//               <Spinner animation="border" />
//             </div>
//           ) : (
//             <Calendar
//               localizer={localizer}
//               events={events}
//               startAccessor="start"
//               endAccessor="end"
//               style={{ height: 500 }}
//               onSelectEvent={handleViewWorkoutDetails}
//               defaultView="month" // Changed from "week" to "month"
//             />
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowCalendarModal(false)}>
//             Close
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Workout Details Modal */}
//       <Modal show={showWorkoutDetailsModal} onHide={() => setShowWorkoutDetailsModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Workout Details</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {selectedWorkout ? (
//             <>
//               <h5>{selectedWorkout.title}</h5>
//               <p><strong>Description:</strong> {selectedWorkout.description}</p>
//               <p><strong>Day Number:</strong> {selectedWorkout.day_number || 'Not specified'}</p>
//               <p><strong>Start Date:</strong> {formatDate(selectedWorkout.start_date)}</p>
//               <p><strong>End Date:</strong> {formatDate(selectedWorkout.end_date)}</p>
//             </>
//           ) : (
//             <p>No workout details available.</p>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowWorkoutDetailsModal(false)}>
//             Close
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default WorkoutManagement;



import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Table, Spinner, Alert, Button, Form, Modal, ButtonGroup } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, setHours, setMinutes, addWeeks, startOfDay, endOfDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getAssignedMembers, createWorkoutRoutine, getWorkoutRoutineHistory, getDailyWorkout } from '../../features/auth/authApi';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const WorkoutManagement = () => {
  const dispatch = useDispatch();
  const { assignedMembers, workoutRoutines, dailyWorkout, loading, workoutLoading, error, workoutError } = useSelector((state) => state.auth);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [dayNumber, setDayNumber] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [calendarView, setCalendarView] = useState('week'); // Default to week view
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    dispatch(getAssignedMembers());
  }, [dispatch]);

  useEffect(() => {
    if (currentMember) {
      dispatch(getWorkoutRoutineHistory(currentMember.id));
    }
  }, [dispatch, currentMember]);

  // Enhanced calendar events generation with better weekly support
  useEffect(() => {
    if (currentMember && workoutRoutines[currentMember.id]) {
      const calendarEvents = [];
      
      workoutRoutines[currentMember.id].forEach(routine => {
        if (routine.day_number && routine.start_date) {
          const startDate = new Date(routine.start_date);
          const endDate = routine.end_date ? new Date(routine.end_date) : addWeeks(startDate, 12); // Default to 12 weeks if no end date
          
          // Convert your day numbers to JavaScript day numbers
          // Your system: 1=Monday, 2=Tuesday, ..., 7=Sunday
          // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
          const jsDay = routine.day_number === 7 ? 0 : routine.day_number;
          
          // Generate recurring events for each week
          let currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            // Find the next occurrence of the target day
            const currentDayOfWeek = getDay(currentDate);
            const daysToAdd = (jsDay - currentDayOfWeek + 7) % 7;
            const eventDate = addDays(currentDate, daysToAdd);
            
            // Only add if the event date is within the range and not before start date
            if (eventDate >= startDate && eventDate <= endDate) {
              const eventStart = setHours(setMinutes(eventDate, 0), 9);
              const eventEnd = setHours(setMinutes(eventDate, 0), 10);

              calendarEvents.push({
                title: routine.title,
                start: eventStart,
                end: eventEnd,
                allDay: false,
                resource: {
                  ...routine,
                  weekNumber: Math.floor((eventDate - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1
                },
              });
            }
            
            // Move to next week
            currentDate = addWeeks(currentDate, 1);
          }
        }
      });
      
      console.log('Generated calendar events:', calendarEvents);
      setEvents(calendarEvents);
    }
  }, [workoutRoutines, currentMember]);

  const handleCreateWorkout = (member) => {
    setCurrentMember(member);
    setShowWorkoutModal(true);
  };

  const handleSubmitWorkout = () => {
    if (currentMember) {
      dispatch(createWorkoutRoutine({
        memberId: currentMember.id,
        title: workoutTitle,
        description: workoutDescription,
        dayNumber: dayNumber ? parseInt(dayNumber) : null,
        startDate,
        endDate: endDate || null,
      })).then((result) => {
        if (result.error) {
          console.error('Failed to create workout:', result.error.message);
        } else {
          setShowWorkoutModal(false);
          setWorkoutTitle('');
          setWorkoutDescription('');
          setDayNumber('');
          setStartDate(new Date().toISOString().split('T')[0]);
          setEndDate('');
        }
      });
    }
  };

  const handleViewCalendar = (member) => {
    setCurrentMember(member);
    setShowCalendarModal(true);
    setCurrentWeek(new Date()); // Reset to current week
    dispatch(getWorkoutRoutineHistory(member.id));
  };

  const handleViewWorkoutDetails = (event) => {
    setSelectedWorkout(event.resource);
    setShowWorkoutDetailsModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  // Navigate to previous week
  const handlePrevWeek = () => {
    setCurrentWeek(prevWeek => addWeeks(prevWeek, -1));
  };

  // Navigate to next week
  const handleNextWeek = () => {
    setCurrentWeek(prevWeek => addWeeks(prevWeek, 1));
  };

  // Navigate to current week
  const handleCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Get week range for display
  const getWeekRange = (date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
    const end = addDays(start, 6);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  // Custom week header component
  const WeekHeader = ({ date }) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    
    return (
      <div className="d-flex justify-content-between align-items-center mb-3 p-3" 
           style={{ backgroundColor: '#1a2a56', borderRadius: '5px' }}>
        <div>
          <h6 className="text-white mb-0">Week: {getWeekRange(date)}</h6>
          <small className="text-light">
            Week {Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))} of {date.getFullYear()}
          </small>
        </div>
        <ButtonGroup>
          <Button variant="outline-light" size="sm" onClick={handlePrevWeek}>
            ← Previous
          </Button>
          <Button variant="outline-light" size="sm" onClick={handleCurrentWeek}>
            This Week
          </Button>
          <Button variant="outline-light" size="sm" onClick={handleNextWeek}>
            Next →
          </Button>
        </ButtonGroup>
      </div>
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
      padding: 10px;
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
    .rbc-toolbar button.rbc-active {
      background-color: #3a5bff !important;
    }
    .rbc-toolbar-label {
      color: #ffffff;
      font-size: 18px;
      font-weight: bold;
    }
    .rbc-week-view {
      background-color: #101c36;
    }
    .rbc-time-view {
      background-color: #101c36;
    }
    .rbc-allday-cell {
      background-color: #1a2a56;
    }
    .rbc-row-bg {
      background-color: #0c1427;
    }
  `;

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <style>{calendarStyles}</style>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Workout Management</h3>
      </header>

      {(error || workoutError) && (
        <Alert variant="danger" onClose={() => dispatch({ type: 'auth/clearError' })} dismissible>
          {error || workoutError || 'An error occurred while processing your request.'}
        </Alert>
      )}

      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
        <Card.Body>
          <h5 className="text-white mb-3">Assigned Members</h5>
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading members...</p>
            </div>
          ) : !Array.isArray(assignedMembers) || assignedMembers.length === 0 ? (
            <div className="text-center my-5">
              <p className="text-white">No members assigned to you.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered hover variant="dark">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.id}</td>
                      <td>{member.first_name} {member.last_name}</td>
                      <td>{member.email}</td>
                      <td>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleCreateWorkout(member)}
                          className="me-2"
                        >
                          Add Workout
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewCalendar(member)}
                        >
                          View Calendar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Workout Creation Modal */}
      <Modal show={showWorkoutModal} onHide={() => setShowWorkoutModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Workout for {currentMember?.first_name} {currentMember?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Day Number</Form.Label>
              <Form.Select
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value)}
              >
                <option value="">None</option>
                <option value="1">Day 1 (Monday)</option>
                <option value="2">Day 2 (Tuesday)</option>
                <option value="3">Day 3 (Wednesday)</option>
                <option value="4">Day 4 (Thursday)</option>
                <option value="5">Day 5 (Friday)</option>
                <option value="6">Day 6 (Saturday)</option>
                <option value="7">Day 7 (Sunday - Recovery)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={workoutTitle}
                onChange={(e) => setWorkoutTitle(e.target.value)}
                placeholder="e.g., Strength Training"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                placeholder="e.g., Bench Press 3x10\nSquats 3x12..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Date (Optional)</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWorkoutModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitWorkout}
            disabled={workoutLoading}
          >
            {workoutLoading ? 'Saving...' : 'Save Workout'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced Calendar Modal with Weekly View */}
      <Modal show={showCalendarModal} onHide={() => setShowCalendarModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Workout Calendar for {currentMember?.first_name} {currentMember?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {workoutLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <div>
              {/* Custom Week Navigation Header */}
              <WeekHeader date={currentWeek} />
              
              {/* View Toggle Buttons */}
              <div className="d-flex justify-content-center mb-3">
                <ButtonGroup>
                  <Button 
                    variant={calendarView === 'week' ? 'primary' : 'outline-primary'}
                    onClick={() => setCalendarView('week')}
                  >
                    Week View
                  </Button>
                  <Button 
                    variant={calendarView === 'month' ? 'primary' : 'outline-primary'}
                    onClick={() => setCalendarView('month')}
                  >
                    Month View
                  </Button>
                </ButtonGroup>
              </div>

              {/* Calendar Component */}
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                onSelectEvent={handleViewWorkoutDetails}
                view={calendarView}
                views={['week', 'month']}
                onView={setCalendarView}
                date={currentWeek}
                onNavigate={setCurrentWeek}
                defaultView="week"
                step={60}
                timeslots={1}
                min={new Date(0, 0, 0, 6, 0, 0)} // Start at 6 AM
                max={new Date(0, 0, 0, 22, 0, 0)} // End at 10 PM
                formats={{
                  timeGutterFormat: (date, culture, localizer) =>
                    localizer.format(date, 'h:mm a', culture),
                  eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                    localizer.format(start, 'h:mm a', culture) + ' - ' + 
                    localizer.format(end, 'h:mm a', culture),
                }}
                components={{
                  event: ({ event }) => (
                    <div style={{ padding: '2px 5px' }}>
                      <strong>{event.title}</strong>
                      {event.resource.weekNumber && (
                        <div style={{ fontSize: '0.8em', opacity: 0.8 }}>
                          Week {event.resource.weekNumber}
                        </div>
                      )}
                    </div>
                  ),
                }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCalendarModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced Workout Details Modal */}
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
              {selectedWorkout.weekNumber && (
                <p><strong>Week Number:</strong> {selectedWorkout.weekNumber}</p>
              )}
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
  );
};

export default WorkoutManagement;



