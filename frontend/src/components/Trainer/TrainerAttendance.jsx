import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Spinner, Alert, Pagination, Badge, Row, Col, Container } from 'react-bootstrap';
import { Calendar, Clock, Person, Eye, BarChart, Award, XCircle } from 'react-bootstrap-icons';
import { getCurrentTrainer, getTrainerAttendanceHistory } from '../../features/auth/authApi';
import { clearError } from '../../features/auth/authSlice';

const TrainerAttendance = () => {
  const dispatch = useDispatch();
  const { 
    currentTrainer, 
    trainerAttendanceRecords, 
    trainerAttendanceLoading, 
    loading, 
    error 
  } = useSelector((state) => state.auth);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState(null);
  const [localPageSize] = useState(8); // Items per page for local pagination
  const [showPerPageOptions, setShowPerPageOptions] = useState(false);
  
  const trainerId = currentTrainer?.id;

  // First, ensure we have the current trainer data
  useEffect(() => {
    if (!currentTrainer) {
      console.log('Fetching current trainer data...');
      dispatch(getCurrentTrainer());
    }
  }, [dispatch, currentTrainer]);

  // Fetch attendance data when trainer is available or page changes
  useEffect(() => {
    console.log('currentTrainer:', currentTrainer);
    console.log('trainerId:', trainerId);
    
    if (trainerId) {
      console.log('Fetching attendance history for trainer:', trainerId, 'page:', currentPage);
      dispatch(getTrainerAttendanceHistory({ trainerId, page: currentPage }));
    } else {
      console.log('No trainerId available, skipping attendance fetch');
    }
  }, [dispatch, trainerId, currentPage]);

  // Debug logs
  useEffect(() => {
    console.log('trainerAttendanceRecords state:', trainerAttendanceRecords);
    console.log('trainerAttendanceLoading:', trainerAttendanceLoading);
    console.log('loading:', loading);
    console.log('error:', error);
    if (trainerId && trainerAttendanceRecords[trainerId]) {
      console.log('Rendered attendanceRecords:', trainerAttendanceRecords[trainerId]);
    }
  }, [trainerAttendanceRecords, trainerAttendanceLoading, loading, error, trainerId]);

  // Update pagination data when attendance records change
  useEffect(() => {
    if (trainerId && trainerAttendanceRecords[trainerId]) {
      const data = trainerAttendanceRecords[trainerId];
      if (data.count !== undefined) {
        setPaginationData({
          count: data.count,
          next: data.next,
          previous: data.previous,
          totalPages: Math.ceil(data.count / 4) // Based on page_size = 4 in backend
        });
      }
    }
  }, [trainerAttendanceRecords, trainerId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid time';
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatMarkedBy = (record) => {
    if (record.admin_name && record.admin_name !== record.admin_email) {
      return record.admin_name;
    }
    if (record.admin_email) {
      return record.admin_email;
    }
    return 'System';
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Filter out future dates from attendance records
  const filterFutureDates = (records) => {
    if (!Array.isArray(records)) return records;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today to include today's records
    
    return records.filter(record => {
      if (!record.date) return true; // Keep records without dates for debugging
      const recordDate = new Date(record.date);
      return recordDate <= today;
    });
  };

  // Calculate attendance statistics
  const calculateStats = (records) => {
    if (!Array.isArray(records) || records.length === 0) {
      return { total: 0, present: 0, absent: 0, presentRate: 0 };
    }
    
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const presentRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    
    return { total, present, absent, presentRate };
  };

  // Show loading if we're still fetching trainer data or attendance data
  const isLoading = loading || trainerAttendanceLoading || !currentTrainer;

  // Get attendance records for current trainer and filter future dates
  const attendanceData = trainerId ? trainerAttendanceRecords[trainerId] : null;
  const rawAttendanceRecords = attendanceData?.results || attendanceData; // Handle both paginated and non-paginated responses
  const attendanceRecords = filterFutureDates(rawAttendanceRecords);
  const stats = calculateStats(attendanceRecords);

  // Local pagination logic
  const totalLocalPages = Math.ceil((attendanceRecords?.length || 0) / localPageSize);
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  
  // Get records for current local page
  const startIndex = (localCurrentPage - 1) * localPageSize;
  const endIndex = startIndex + localPageSize;
  const currentPageRecords = attendanceRecords?.slice(startIndex, endIndex) || [];

  // Reset local pagination when attendance records change
  useEffect(() => {
    setLocalCurrentPage(1);
  }, [attendanceRecords?.length]);

  const handleLocalPageChange = (pageNumber) => {
    setLocalCurrentPage(pageNumber);
    // Smooth scroll to table top
    document.querySelector('.table-responsive')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  // Enhanced pagination with better navigation
  const renderPaginationItems = (totalPages, currentPageNum, onPageChange, isPrimary = true) => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisiblePages = 5; // Reduced from 7 to 5 for smaller pagination
    
    // First button
    if (currentPageNum > 1) {
      items.push(
        <Pagination.First
          key="first"
          onClick={() => onPageChange(1)}
          className="text-white d-flex align-items-center justify-content-center"
          style={{
            background: 'rgba(102, 126, 234, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '0',
            fontSize: '0.8rem',
            minWidth: '32px',
            height: '32px',
            lineHeight: '1'
          }}
        />
      );
    }
    
    // Previous button
    items.push(
      <Pagination.Prev
        key="prev"
        disabled={currentPageNum === 1}
        onClick={() => onPageChange(currentPageNum - 1)}
        className="text-white d-flex align-items-center justify-content-center"
        style={{
          background: currentPageNum === 1 ? 'rgba(108, 117, 125, 0.3)' : 'rgba(102, 126, 234, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '6px',
          padding: '0',
          fontSize: '0.8rem',
          minWidth: '32px',
          height: '32px',
          lineHeight: '1'
        }}
      />
    );

    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      
      if (currentPageNum <= halfVisible) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPageNum + halfVisible >= totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPageNum - halfVisible;
        endPage = currentPageNum + halfVisible;
      }
    }

    // First page and ellipsis
    if (startPage > 1) {
      items.push(
        <Pagination.Item
          key={1}
          active={1 === currentPageNum}
          onClick={() => onPageChange(1)}
          className="text-white d-flex align-items-center justify-content-center"
          style={{
            background: 1 === currentPageNum 
              ? 'linear-gradient(135deg, #667eea, #764ba2)' 
              : 'rgba(30, 30, 30, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            margin: '0 1px',
            padding: '0',
            fontSize: '0.8rem',
            minWidth: '32px',
            height: '32px',
            lineHeight: '1',
            boxShadow: 1 === currentPageNum ? '0 2px 8px rgba(102, 126, 234, 0.4)' : 'none'
          }}
        >
          1
        </Pagination.Item>
      );
      
      if (startPage > 2) {
        items.push(
          <Pagination.Ellipsis 
            key="ellipsis-start" 
            className="text-white"
            style={{ 
              background: 'transparent', 
              border: 'none',
              fontSize: '0.8rem' // Smaller font for ellipsis
            }}
          />
        );
      }
    }

    // Page numbers
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPageNum}
          onClick={() => onPageChange(page)}
          className="text-white d-flex align-items-center justify-content-center"
          style={{
            background: page === currentPageNum 
              ? 'linear-gradient(135deg, #667eea, #764ba2)' 
              : 'rgba(30, 30, 30, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            margin: '0 1px',
            padding: '0',
            fontSize: '0.8rem',
            minWidth: '32px',
            height: '32px',
            lineHeight: '1',
            boxShadow: page === currentPageNum ? '0 2px 8px rgba(102, 126, 234, 0.4)' : 'none',
            transform: page === currentPageNum ? 'translateY(-1px)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <Pagination.Ellipsis 
            key="ellipsis-end" 
            className="text-white"
            style={{ 
              background: 'transparent', 
              border: 'none',
              fontSize: '0.8rem' // Smaller font for ellipsis
            }}
          />
        );
      }
      
      items.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === currentPageNum}
          onClick={() => onPageChange(totalPages)}
          className="text-white d-flex align-items-center justify-content-center"
          style={{
            background: totalPages === currentPageNum 
              ? 'linear-gradient(135deg, #667eea, #764ba2)' 
              : 'rgba(30, 30, 30, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            margin: '0 1px',
            padding: '0',
            fontSize: '0.8rem',
            minWidth: '32px',
            height: '32px',
            lineHeight: '1',
            boxShadow: totalPages === currentPageNum ? '0 2px 8px rgba(102, 126, 234, 0.4)' : 'none'
          }}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        disabled={currentPageNum === totalPages}
        onClick={() => onPageChange(currentPageNum + 1)}
        className="text-white d-flex align-items-center justify-content-center"
        style={{
          background: currentPageNum === totalPages ? 'rgba(108, 117, 125, 0.3)' : 'rgba(102, 126, 234, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '6px',
          padding: '0',
          fontSize: '0.8rem',
          minWidth: '32px',
          height: '32px',
          lineHeight: '1'
        }}
      />
    );

    // Last button
    if (currentPageNum < totalPages) {
      items.push(
        <Pagination.Last
          key="last"
          onClick={() => onPageChange(totalPages)}
          className="text-white d-flex align-items-center justify-content-center"
          style={{
            background: 'rgba(102, 126, 234, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '0',
            fontSize: '0.8rem',
            minWidth: '32px',
            height: '32px',
            lineHeight: '1'
          }}
        />
      );
    }

    return items;
  };

  return (
    <div className="pt-4" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)', minHeight: '100vh' }}>
      <Container fluid>
        {/* Header Section */}
        <Card className="mb-4 border-0 shadow-lg" style={{ 
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col lg={8}>
                <div className="d-flex align-items-center">
                  <div 
                    className="me-4 d-flex align-items-center justify-content-center"
                    style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '14px',
                      boxShadow: '0 6px 24px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    <Calendar size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-white mb-2 fw-bold">Attendance Dashboard</h2>
                    <p className="text-light mb-0 fs-5" style={{ opacity: 0.8 }}>
                      {currentTrainer ? (
                        <>
                          <Person size={16} className="me-2" />
                          {currentTrainer.first_name} {currentTrainer.last_name}
                        </>
                      ) : (
                        'Loading trainer information...'
                      )}
                    </p>
                  </div>
                </div>
              </Col>
              
              {/* Smaller Stats Cards */}
              {stats.total > 0 && (
                <Col lg={4}>
                  <Row className="g-2">
                    <Col xs={4} className="text-center">
                      <Card className="h-100 border-0 shadow-sm" style={{ 
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        minHeight: '55px'
                      }}>
                        <Card.Body className="p-2">
                          <div className="text-white mb-1">
                            <BarChart size={14} />
                          </div>
                          <h6 className="text-white fw-bold mb-0">{stats.presentRate}%</h6>
                          <small className="text-white-50" style={{ fontSize: '0.65rem' }}>Attendance</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={4} className="text-center">
                      <Card className="h-100 border-0 shadow-sm bg-success" style={{ minHeight: '55px' }}>
                        <Card.Body className="p-2">
                          <div className="text-white mb-1">
                            <Award size={14} />
                          </div>
                          <h6 className="text-white fw-bold mb-0">{stats.present}</h6>
                          <small className="text-white-50" style={{ fontSize: '0.65rem' }}>Present</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={4} className="text-center">
                      <Card className="h-100 border-0 shadow-sm bg-danger" style={{ minHeight: '55px' }}>
                        <Card.Body className="p-2">
                          <div className="text-white mb-1">
                            <XCircle size={14} />
                          </div>
                          <h6 className="text-white fw-bold mb-0">{stats.absent}</h6>
                          <small className="text-white-50" style={{ fontSize: '0.65rem' }}>Absent</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* Alert Section */}
        {error && (
          <Alert 
            variant="danger" 
            onClose={() => dispatch(clearError())} 
            dismissible
            className="mb-4 border-0"
            style={{
              background: 'rgba(220, 53, 69, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(220, 53, 69, 0.3)'
            }}
          >
            <div className="d-flex align-items-center text-white">
              <div className="me-3 fs-4">⚠️</div>
              <div>
                <strong>Error:</strong> {typeof error === 'string' ? error : JSON.stringify(error)}
              </div>
            </div>
          </Alert>
        )}

        {/* Main Content Card */}
        <Card className="border-0 shadow-lg" style={{ 
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Card.Body className="p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="mb-4">
                  <Spinner 
                    animation="border" 
                    variant="light" 
                    style={{ width: '3rem', height: '3rem', borderWidth: '3px' }}
                  />
                </div>
                <h4 className="text-white mb-2">
                  {!currentTrainer ? 'Loading trainer data...' : 'Loading attendance records...'}
                </h4>
                <p className="text-light" style={{ opacity: 0.7 }}>Please wait while we fetch your information</p>
              </div>
            ) : !trainerId ? (
              <div className="text-center py-5">
                <div 
                  className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: '120px',
                    height: '120px',
                    background: 'rgba(108, 117, 125, 0.2)',
                    borderRadius: '50%'
                  }}
                >
                  <Eye size={64} className="text-light" style={{ opacity: 0.6 }} />
                </div>
                <h4 className="text-white">Unable to load trainer information</h4>
                <p className="text-light" style={{ opacity: 0.7 }}>Please try refreshing the page or contact support.</p>
              </div>
            ) : !attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0 ? (
              <div className="text-center py-5">
                <div 
                  className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: '120px',
                    height: '120px',
                    background: 'rgba(108, 117, 125, 0.2)',
                    borderRadius: '50%'
                  }}
                >
                  <Calendar size={64} className="text-light" style={{ opacity: 0.6 }} />
                </div>
                <h4 className="text-white">No attendance records found</h4>
                <p className="text-light mb-3" style={{ opacity: 0.7 }}>
                  {paginationData ? `Total records in system: ${paginationData.count}` : 'No records available'}
                </p>
                <Badge bg="info" className="px-3 py-2">
                  <Eye size={14} className="me-1" />
                  Future attendance records are not displayed
                </Badge>
                
                {/* Debug info - remove this in production */}
                <details className="mt-4 text-start" style={{ maxWidth: '600px', margin: '2rem auto 0' }}>
                  <summary className="text-light" style={{ cursor: 'pointer', opacity: 0.7 }}>
                    Debug Information
                  </summary>
                  <Card className="mt-3 border-0" style={{ background: 'rgba(40, 40, 40, 0.8)' }}>
                    <Card.Body>
                      <pre className="text-light mb-0" style={{ fontSize: '0.75rem', maxHeight: '300px', overflowY: 'auto', opacity: 0.8 }}>
                        {JSON.stringify({
                          trainerId,
                          attendanceRecords,
                          rawRecordsLength: rawAttendanceRecords?.length,
                          filteredRecordsLength: attendanceRecords?.length,
                          attendanceData,
                          paginationData,
                          currentPage,
                          hasRecords: !!attendanceRecords,
                          isArray: Array.isArray(attendanceRecords),
                          length: attendanceRecords?.length
                        }, null, 2)}
                      </pre>
                    </Card.Body>
                  </Card>
                </details>
              </div>
            ) : (
              <div>
                {/* Records Info Bar with Enhanced Pagination Info */}
                <div className="border-bottom p-4" style={{ background: 'rgba(40, 40, 40, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1) !important' }}>
                  <Row className="align-items-center">
                    <Col md={6}>
                      <div className="d-flex align-items-center">
                        <div 
                          className="me-3 d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px',
                            height: '40px',
                            background: 'rgba(13, 110, 253, 0.2)',
                            borderRadius: '12px'
                          }}
                        >
                          <Eye size={20} className="text-info" />
                        </div>
                        <div>
                          <span className="text-white fw-medium">
                            Showing <span className="fw-bold text-info">{startIndex + 1}-{Math.min(endIndex, attendanceRecords.length)}</span> of <span className="fw-bold text-info">{attendanceRecords.length}</span> records
                          </span>
                          {rawAttendanceRecords && rawAttendanceRecords.length !== attendanceRecords.length && (
                            <Badge bg="warning" text="dark" className="ms-2">
                              {rawAttendanceRecords.length - attendanceRecords.length} future records hidden
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Col>
                    <Col md={6} className="text-md-end">
                      <div className="d-flex align-items-center justify-content-md-end">
                        <span className="text-light me-3" style={{ opacity: 0.7 }}>
                          Page <span className="fw-bold text-info">{localCurrentPage}</span> of <span className="fw-bold text-info">{totalLocalPages}</span>
                        </span>
                        <Badge bg="secondary" className="px-2 py-1">
                          <small>{localPageSize} per page</small>
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Enhanced Attendance Table */}
                <div className="table-responsive">
                  <Table className="mb-0 table-dark" hover>
                    <thead style={{ background: 'rgba(102, 126, 234, 0.2)' }}>
                      <tr>
                        <th className="border-0 py-3 px-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <div className="d-flex align-items-center text-white">
                            <Calendar size={18} className="me-2" />
                            <span className="fw-bold">Date</span>
                          </div>
                        </th>
                        <th className="border-0 py-3 px-4 fw-bold text-white" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>Status</th>
                        <th className="border-0 py-3 px-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <div className="d-flex align-items-center text-white">
                            <Person size={18} className="me-2" />
                            <span className="fw-bold">Marked By</span>
                          </div>
                        </th>
                        <th className="border-0 py-3 px-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <div className="d-flex align-items-center text-white">
                            <Clock size={18} className="me-2" />
                            <span className="fw-bold">Recorded At</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPageRecords.map((record, index) => (
                        <tr key={record.id} style={{ 
                          backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                          borderColor: 'rgba(255, 255, 255, 0.1)'
                        }}>
                          <td className="py-3 px-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <div className="fw-medium text-white">{formatDate(record.date)}</div>
                          </td>
                          <td className="py-3 px-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <Badge 
                              bg={record.status === 'present' ? 'success' : 'danger'}
                              className="px-3 py-2 fs-6 text-capitalize"
                              style={{ borderRadius: '25px' }}
                            >
                              <span className="d-inline-block me-2" style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)'
                              }}></span>
                              {record.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <div className="d-flex align-items-center">
                              <div 
                                className="me-3 d-flex align-items-center justify-content-center text-white fw-bold"
                                style={{
                                  width: '45px',
                                  height: '45px',
                                  background: 'transparent',
                                  border: '2px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '12px',
                                  fontSize: '1.1rem'
                                }}
                              >
                                {formatMarkedBy(record).charAt(0).toUpperCase()}
                              </div>
                              <span className="text-white fw-medium">{formatMarkedBy(record)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <div>
                              <div className="text-white fw-medium">{formatDate(record.created_at)}</div>
                              <small className="text-light" style={{ opacity: 0.7 }}>{formatTime(record.created_at)}</small>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Footer - removed the future records message */}
                <div className="border-top p-3 text-center" style={{ 
                  background: 'rgba(40, 40, 40, 0.5)',
                  borderColor: 'rgba(255, 255, 255, 0.1) !important'
                }}>
                  {/* Footer content removed */}
                </div>

                {/* Enhanced Local Pagination with Quick Navigation - SMALLER VERSION */}
                {totalLocalPages > 1 && (
                  <div className="p-3" style={{ background: 'rgba(40, 40, 40, 0.5)' }}>
                    <Row className="align-items-center">
                      <Col md={6}>
                        <div className="d-flex align-items-center">
                          <span className="text-light me-2" style={{ opacity: 0.8, fontSize: '0.8rem' }}>
                            <small>Quick Jump:</small>
                          </span>
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              type="button"
                              className={`btn btn-sm ${localCurrentPage === 1 ? 'btn-info' : 'btn-outline-info'}`}
                              onClick={() => handleLocalPageChange(1)}
                              style={{
                                background: localCurrentPage === 1 ? 'rgba(13, 202, 240, 0.2)' : 'transparent',
                                border: '1px solid rgba(13, 202, 240, 0.5)',
                                color: '#0dcaf0',
                                fontSize: '0.75rem',
                                padding: '3px 8px'
                              }}
                            >
                              First
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${localCurrentPage === totalLocalPages ? 'btn-info' : 'btn-outline-info'}`}
                              onClick={() => handleLocalPageChange(totalLocalPages)}
                              style={{
                                background: localCurrentPage === totalLocalPages ? 'rgba(13, 202, 240, 0.2)' : 'transparent',
                                border: '1px solid rgba(13, 202, 240, 0.5)',
                                color: '#0dcaf0',
                                fontSize: '0.75rem',
                                padding: '3px 8px'
                              }}
                            >
                              Last
                            </button>
                          </div>
                        </div>
                      </Col>
                      <Col md={6} className="text-md-end">
                        <Pagination size="sm" className="mb-0 justify-content-md-end">
                          {renderPaginationItems(totalLocalPages, localCurrentPage, handleLocalPageChange, true)}
                        </Pagination>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* API Pagination (if backend supports it) - SMALLER VERSION */}
                {paginationData && paginationData.totalPages > 1 && (
                  <div className="border-top p-3" style={{ 
                    background: 'rgba(30, 30, 30, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.1) !important'
                  }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white mb-1" style={{ fontSize: '0.9rem' }}>Server Pagination</h6>
                        <small className="text-light" style={{ opacity: 0.7, fontSize: '0.75rem' }}>
                          Total records: {paginationData.count}
                        </small>
                      </div>
                      <Pagination size="sm" className="mb-0">
                        {renderPaginationItems(paginationData.totalPages, currentPage, handlePageChange)}
                      </Pagination>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default TrainerAttendance;