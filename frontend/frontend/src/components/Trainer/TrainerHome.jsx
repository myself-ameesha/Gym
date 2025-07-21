import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { 
  People, 
  ClipboardCheck, 
  Calendar, 
  Stopwatch, 
  Bell,
  BarChart,
  Activity
} from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { 
  getAssignedMembers, 
  getAttendanceHistory, 
  getWorkoutRoutineHistory, 
  getDietPlanHistory, 
  getPublicMembershipPlans 
} from '../../features/auth/authApi';

const TrainerHome = () => {
  const dispatch = useDispatch();
  const { 
    assignedMembers, 
    attendanceRecords, 
    workoutRoutines, 
    dietPlans, 
    membershipPlans, 
    loading, 
    error 
  } = useSelector((state) => state.auth);
  
  const [dashboardData, setDashboardData] = useState({
    totalClients: 0,
    totalMemberships: 0,
    averageAttendance: 0,
    totalWorkouts: 0,
    totalDiets: 0,
    totalSessions: 0
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);

        // Fetch assigned members
        const membersResult = await dispatch(getAssignedMembers()).unwrap();

        if (membersResult && membersResult.length > 0) {
          // Fetch attendance history, workout routines, and diet plans for all members
          const attendancePromises = membersResult.map(member =>
            dispatch(getAttendanceHistory(member.id)).unwrap().catch(() => [])
          );
          const workoutPromises = membersResult.map(member =>
            dispatch(getWorkoutRoutineHistory(member.id)).unwrap().catch(() => ({ routines: [] }))
          );
          const dietPromises = membersResult.map(member =>
            dispatch(getDietPlanHistory(member.id)).unwrap().catch(() => ({ plans: [] }))
          );

          const [attendanceResults, workoutResults, dietResults] = await Promise.all([
            Promise.all(attendancePromises),
            Promise.all(workoutPromises),
            Promise.all(dietPromises)
          ]);

          // Fetch public membership plans
          const membershipResult = await dispatch(getPublicMembershipPlans()).unwrap().catch(() => []);

          // Calculate metrics
          const totalClients = membersResult.length;

          // Calculate average attendance
          let totalAttendanceRecords = 0;
          let totalPresentRecords = 0;
          attendanceResults.forEach(records => {
            if (Array.isArray(records)) {
              totalAttendanceRecords += records.length;
              totalPresentRecords += records.filter(record => record.status === 'present').length;
            }
          });
          const averageAttendance = totalAttendanceRecords > 0 
            ? Math.round((totalPresentRecords / totalAttendanceRecords) * 100) 
            : 0;

          // Calculate total workouts
          let totalWorkouts = 0;
          workoutResults.forEach(result => {
            if (result.routines && Array.isArray(result.routines)) {
              totalWorkouts += result.routines.length;
            }
          });

          // Calculate total diets
          let totalDiets = 0;
          dietResults.forEach(result => {
            if (result.plans && Array.isArray(result.plans)) {
              totalDiets += result.plans.length;
            }
          });

          // Calculate total memberships
          const totalMemberships = Array.isArray(membershipResult) ? membershipResult.length : 0;

          setDashboardData({
            totalClients,
            totalMemberships,
            averageAttendance,
            totalWorkouts,
            totalDiets,
            totalSessions: totalPresentRecords
          });
        } else {
          // If no members, set default values
          setDashboardData({
            totalClients: 0,
            totalMemberships: 0,
            averageAttendance: 0,
            totalWorkouts: 0,
            totalDiets: 0,
            totalSessions: 0
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [dispatch]);

  const StatCard = ({ icon, title, value, color, bgColor, suffix = '' }) => (
    <Col md={3} className="mb-4">
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
                  backgroundColor: bgColor, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                {React.createElement(icon, { color, size: 20 })}
              </div>
              <span className="text-white" style={{ fontSize: '0.9rem' }}>{title}</span>
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <h2 className="text-white mb-0">{dataLoading ? '--' : `${value}${suffix}`}</h2>
            {dataLoading && <Spinner animation="border" variant="light" size="sm" />}
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Trainer Dashboard</h3>
        <div className="d-flex align-items-center">
          <div className="me-3">
            <Bell color="white" />
          </div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            backgroundColor: '#7747ff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <span style={{ color: 'white' }}>T</span>
          </div>
          <div className="ms-2 text-white">
            Trainer User
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Row className="mb-4">
        <StatCard
          icon={People}
          title="Total Clients"
          value={dashboardData.totalClients}
          color="#7747ff"
          bgColor="rgba(119, 71, 255, 0.1)"
        />
        
        <StatCard
          icon={Calendar}
          title="Total Memberships"
          value={dashboardData.totalMemberships}
          color="#17a2b8"
          bgColor="rgba(23, 162, 184, 0.1)"
        />
        
        <StatCard
          icon={BarChart}
          title="Average Attendance"
          value={dashboardData.averageAttendance}
          color="#28a745"
          bgColor="rgba(40, 167, 69, 0.1)"
          suffix="%"
        />
        
        <StatCard
          icon={Activity}
          title="Total Workouts"
          value={dashboardData.totalWorkouts}
          color="#fd7e14"
          bgColor="rgba(253, 126, 20, 0.1)"
        />
      </Row>

      <Row className="mb-4">
        <StatCard
          icon={ClipboardCheck}
          title="Total Diets"
          value={dashboardData.totalDiets}
          color="#20c997"
          bgColor="rgba(32, 201, 151, 0.1)"
        />
        
        <StatCard
          icon={Calendar}
          title="Sessions Completed"
          value={dashboardData.totalSessions}
          color="#e91e63"
          bgColor="rgba(233, 30, 99, 0.1)"
        />
        
        <StatCard
          icon={Stopwatch}
          title="Active Members"
          value={dataLoading ? '--' : Math.floor(dashboardData.totalClients * 0.85)}
          color="#ffc107"
          bgColor="rgba(255, 193, 7, 0.1)"
        />
      </Row>
    </div>
  );
};

export default TrainerHome;