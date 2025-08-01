import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Spinner, Alert, Pagination } from 'react-bootstrap';
import { Calendar } from 'react-bootstrap-icons';
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
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const formatMarkedBy = (record) => {
    if (record.admin_name && record.admin_name !== record.admin_email) {
      return record.admin_name;
    }
    if (record.admin_email) {
      return record.admin_email;
    }
    return 'Not available';
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Show loading if we're still fetching trainer data or attendance data
  const isLoading = loading || trainerAttendanceLoading || !currentTrainer;

  // Get attendance records for current trainer
  const attendanceData = trainerId ? trainerAttendanceRecords[trainerId] : null;
  const attendanceRecords = attendanceData?.results || attendanceData; // Handle both paginated and non-paginated responses

  // Generate pagination items
  const renderPaginationItems = () => {
    if (!paginationData || paginationData.totalPages <= 1) return null;

    const items = [];
    const { totalPages } = paginationData;
    
    // Previous button
    items.push(
      <Pagination.Prev
        key="prev"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
        style={{
          backgroundColor: currentPage === 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(119, 71, 255, 0.1)',
          borderColor: 'rgba(119, 71, 255, 0.3)',
          color: currentPage === 1 ? 'rgba(255, 255, 255, 0.5)' : '#7747ff'
        }}
      />
    );

    // Page numbers with ellipsis logic for large datasets
    const showEllipsis = totalPages > 7;
    let startPage = 1;
    let endPage = totalPages;

    if (showEllipsis) {
      if (currentPage <= 4) {
        endPage = 5;
      } else if (currentPage > totalPages - 4) {
        startPage = totalPages - 4;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }
    }

    // First page
    if (showEllipsis && startPage > 1) {
      items.push(
        <Pagination.Item
          key={1}
          active={1 === currentPage}
          onClick={() => handlePageChange(1)}
          style={{
            backgroundColor: 1 === currentPage ? '#7747ff' : 'rgba(119, 71, 255, 0.1)',
            borderColor: 'rgba(119, 71, 255, 0.3)',
            color: 1 === currentPage ? '#ffffff' : '#7747ff'
          }}
        >
          1
        </Pagination.Item>
      );
      
      if (startPage > 2) {
        items.push(
          <Pagination.Ellipsis 
            key="ellipsis-start"
            style={{
              backgroundColor: 'rgba(119, 71, 255, 0.1)',
              borderColor: 'rgba(119, 71, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.7)'
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
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
          style={{
            backgroundColor: page === currentPage ? '#7747ff' : 'rgba(119, 71, 255, 0.1)',
            borderColor: 'rgba(119, 71, 255, 0.3)',
            color: page === currentPage ? '#ffffff' : '#7747ff'
          }}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Last page
    if (showEllipsis && endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <Pagination.Ellipsis 
            key="ellipsis-end"
            style={{
              backgroundColor: 'rgba(119, 71, 255, 0.1)',
              borderColor: 'rgba(119, 71, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          />
        );
      }
      
      items.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === currentPage}
          onClick={() => handlePageChange(totalPages)}
          style={{
            backgroundColor: totalPages === currentPage ? '#7747ff' : 'rgba(119, 71, 255, 0.1)',
            borderColor: 'rgba(119, 71, 255, 0.3)',
            color: totalPages === currentPage ? '#ffffff' : '#7747ff'
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
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        style={{
          backgroundColor: currentPage === totalPages ? 'rgba(255, 255, 255, 0.1)' : 'rgba(119, 71, 255, 0.1)',
          borderColor: 'rgba(119, 71, 255, 0.3)',
          color: currentPage === totalPages ? 'rgba(255, 255, 255, 0.5)' : '#7747ff'
        }}
      />
    );

    return items;
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-3 pt-5">
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
      
      {error && (
        <Alert variant="danger" onClose={() => dispatch(clearError())} dismissible>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}
      
      {isLoading ? (
        <div className="text-center">
          <Spinner animation="border" variant="light" />
          <p className="text-white mt-2">
            {!currentTrainer ? 'Loading trainer data...' : 'Loading attendance records...'}
          </p>
        </div>
      ) : !trainerId ? (
        <div>
          <p className="text-white">Unable to load trainer information.</p>
          <p className="text-muted">Please try refreshing the page.</p>
        </div>
      ) : !attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0 ? (
        <div>
          <p className="text-white">No attendance records found.</p>
          {paginationData && (
            <p className="text-muted">
              Total records: {paginationData.count}
            </p>
          )}
          {/* Debug info - remove this in production */}
          <details className="mt-2">
            <summary className="text-muted" style={{ cursor: 'pointer' }}>
              Debug Info (Click to expand)
            </summary>
            <pre className="text-muted mt-2" style={{ fontSize: '0.8em' }}>
              {JSON.stringify({
                trainerId,
                attendanceRecords,
                attendanceData,
                paginationData,
                currentPage,
                hasRecords: !!attendanceRecords,
                isArray: Array.isArray(attendanceRecords),
                length: attendanceRecords?.length
              }, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <div>
          {/* Pagination info */}
          {paginationData && (
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="text-muted mb-0">
                Showing {((currentPage - 1) * 4) + 1} to {Math.min(currentPage * 4, paginationData.count)} of {paginationData.count} records
              </p>
              <p className="text-muted mb-0">
                Page {currentPage} of {paginationData.totalPages}
              </p>
            </div>
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
                {attendanceRecords.map((record) => (
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

          {/* Styled Pagination */}
          {paginationData && paginationData.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination 
                size="sm" 
                className="mb-0"
                style={{
                  '--bs-pagination-bg': 'rgba(119, 71, 255, 0.1)',
                  '--bs-pagination-border-color': 'rgba(119, 71, 255, 0.3)',
                  '--bs-pagination-color': '#7747ff',
                  '--bs-pagination-hover-bg': 'rgba(119, 71, 255, 0.2)',
                  '--bs-pagination-hover-border-color': 'rgba(119, 71, 255, 0.4)',
                  '--bs-pagination-hover-color': '#ffffff',
                  '--bs-pagination-focus-bg': 'rgba(119, 71, 255, 0.2)',
                  '--bs-pagination-focus-border-color': 'rgba(119, 71, 255, 0.4)',
                  '--bs-pagination-focus-color': '#ffffff',
                  '--bs-pagination-active-bg': '#7747ff',
                  '--bs-pagination-active-border-color': '#7747ff',
                  '--bs-pagination-active-color': '#ffffff',
                  '--bs-pagination-disabled-bg': 'rgba(255, 255, 255, 0.1)',
                  '--bs-pagination-disabled-border-color': 'rgba(119, 71, 255, 0.2)',
                  '--bs-pagination-disabled-color': 'rgba(255, 255, 255, 0.5)',
                }}
              >
                {renderPaginationItems()}
              </Pagination>
            </div>
          )}
        </div>
      )}
      
      {/* Add custom CSS for better hover effects */}
      <style jsx>{`
        .pagination .page-link {
          transition: all 0.2s ease-in-out;
        }
        
        .pagination .page-link:hover:not(.disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(119, 71, 255, 0.3);
        }
        
        .pagination .page-item.active .page-link {
          box-shadow: 0 2px 8px rgba(119, 71, 255, 0.4);
        }
        
        .pagination .page-item.disabled .page-link {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TrainerAttendance;

