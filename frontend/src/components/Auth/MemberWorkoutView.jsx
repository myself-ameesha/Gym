import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Spinner, Alert, Form } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US'; // Import the en-US locale
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getCurrentMember, getDailyWorkout } from '../../features/auth/authApi';

// Define locales object with the imported locale
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const MemberWorkoutView = () => {
  const dispatch = useDispatch();
  const { currentMember, dailyWorkout, workoutLoading, workoutError } = useSelector((state) => state.auth);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  useEffect(() => {
    dispatch(getCurrentMember());
  }, [dispatch]);

  useEffect(() => {
    if (currentMember) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      dispatch(getDailyWorkout({ memberId: currentMember.id, date: formattedDate }));
    }
  }, [dispatch, currentMember, selectedDate]);

  useEffect(() => {
    if (dailyWorkout && dailyWorkout.workout) {
      setEvents([{
        title: dailyWorkout.workout.title,
        start: selectedDate,
        end: selectedDate,
        allDay: true,
        resource: dailyWorkout.workout,
      }]);
    } else {
      setEvents([]);
    }
  }, [dailyWorkout, selectedDate]);

  const handleDateSelect = (slotInfo) => {
    setSelectedDate(slotInfo.start);
  };

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="mb-4">
        <h3 className="text-white">My Workouts</h3>
      </header>

      {workoutError && (
        <Alert variant="danger" onClose={() => dispatch({ type: 'auth/clearWorkoutError' })} dismissible>
          {workoutError}
        </Alert>
      )}

      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
        <Card.Body>
          {workoutLoading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading workout...</p>
            </div>
          ) : (
            <>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500, marginBottom: '20px' }}
                onSelectSlot={handleDateSelect}
                selectable
                onSelectEvent={(event) => alert(`Workout: ${event.title}\nDescription: ${event.resource.description}`)}
              />
              {dailyWorkout ? (
                dailyWorkout.workout ? (
                  <div className="text-white">
                    <h5>Day {dailyWorkout.day_number} Workout</h5>
                    <p><strong>Title:</strong> {dailyWorkout.workout.title}</p>
                    <p><strong>Description:</strong> {dailyWorkout.workout.description}</p>
                  </div>
                ) : (
                  <p className="text-white">{dailyWorkout.message}</p>
                )
              ) : (
                <p className="text-white">Select a date to view your workout.</p>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MemberWorkoutView;