import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTrainerRatings, getCurrentTrainer } from '../../features/auth/authApi';
import { clearRatingError } from '../../features/auth/authSlice';
import { StarIcon } from '@heroicons/react/24/solid';

const TrainerRatingsView = () => {
  const dispatch = useDispatch();
  const { 
    currentTrainer, 
    trainerRatings, 
    ratingLoading, 
    ratingError, 
    loading 
  } = useSelector((state) => state.auth);
  
  const [retryCount, setRetryCount] = useState(0);
  
  const trainerId = currentTrainer?.id;
  
  // Handle different possible data structures for ratings
  let ratings = [];
  if (trainerRatings) {
    if (Array.isArray(trainerRatings)) {
      ratings = trainerRatings;
    } else if (trainerId && trainerRatings[trainerId]) {
      ratings = trainerRatings[trainerId];
    }
  }

  useEffect(() => {
    // First, ensure we have the current trainer loaded
    if (!currentTrainer) {
      dispatch(getCurrentTrainer());
    }
  }, [dispatch, currentTrainer]);

  useEffect(() => {
    // Once we have the trainer, fetch their ratings
    if (trainerId && retryCount === 0) {
      dispatch(getTrainerRatings(trainerId));
    }
    
    return () => {
      dispatch(clearRatingError());
    };
  }, [dispatch, trainerId, retryCount]);

  const handleRetryRatings = () => {
    setRetryCount(prev => prev + 1);
    dispatch(clearRatingError());
    if (trainerId) {
      dispatch(getTrainerRatings(trainerId));
    }
  };

  // Calculate average rating
  const averageRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
    : 0;

  // Loading state for trainer profile
  if (loading || (!currentTrainer && !ratingError)) {
    return (
      <div className="container mt-5" style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px' }}>
        <div className="card mx-auto bg-dark text-white" style={{ maxWidth: '500px' }}>
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-light">Loading trainer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // If trainer profile failed to load
  if (!currentTrainer) {
    return (
      <div className="container mt-5" style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px' }}>
        <div className="card mx-auto bg-dark text-white" style={{ maxWidth: '500px' }}>
          <div className="card-body">
            <div className="alert alert-warning" role="alert">
              <h5>Trainer Profile Not Available</h5>
              <p className="mb-0">Unable to load trainer profile. Please try refreshing the page or contact support.</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => dispatch(getCurrentTrainer())}
            >
              Retry Loading Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5" style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px' }}>
      <div className="card mx-auto bg-dark text-white" style={{ maxWidth: '700px' }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="card-title mb-0 text-white">Your Ratings</h2>
            <div className="text-muted">
              <small>Trainer: {currentTrainer.first_name} {currentTrainer.last_name}</small>
            </div>
          </div>

          {ratingLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-light mt-2">Loading your ratings...</p>
            </div>
          ) : ratingError ? (
            <div className="alert alert-danger" role="alert">
              <h5 className="alert-heading">Server Error</h5>
              <p>
                <strong>Error:</strong> {ratingError}
              </p>
              <hr />
              <div className="mb-3">
                <h6>Troubleshooting Steps:</h6>
                <ul className="mb-0">
                  <li>Check if your backend server is running on port 8000</li>
                  <li>Verify the API endpoint exists: <code>/api/trainer/{trainerId}/ratings/</code></li>
                  <li>Check backend logs for detailed error information</li>
                  <li>Ensure the trainer has proper permissions</li>
                  <li>Verify database connection and table structure</li>
                </ul>
              </div>
              <button 
                className="btn btn-outline-danger"
                onClick={handleRetryRatings}
              >
                Retry {retryCount > 0 && `(${retryCount})`}
              </button>
            </div>
          ) : ratings.length === 0 ? (
            <div className="alert alert-info" role="alert">
              <h5 className="alert-heading">No Ratings Yet</h5>
              <p className="mb-0">You haven't received any ratings from members yet. Keep up the great work!</p>
            </div>
          ) : (
            <>
              {/* Rating Summary Cards - Reordered: Total first, then Average */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card bg-success text-white" style={{ minHeight: '130px' }}>
                    <div className="card-body text-center py-2">
                      <h6 className="card-title mb-2">Total Ratings</h6>
                      <div className="h3 fw-bold mb-1">{ratings.length}</div>
                      <small>From your members</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-primary text-white" style={{ minHeight: '130px' }}>
                    <div className="card-body text-center py-2">
                      <h6 className="card-title mb-2">Average Rating</h6>
                      <div className="h3 fw-bold mb-1">{averageRating}</div>
                      <div className="d-flex justify-content-center mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={star <= Math.round(averageRating) ? 'text-warning' : 'text-light'}
                            style={{ width: '16px', height: '16px' }}
                          />
                        ))}
                      </div>
                      <small>Based on {ratings.length} rating{ratings.length !== 1 ? 's' : ''}</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Ratings */}
              <h6 className="mb-3 text-white">Member Feedback</h6>
              <div className="row">
                {ratings.map((rating, index) => (
                  <div key={rating.id || index} className="col-md-6 mb-3">
                    <div className="card bg-secondary text-white h-100">
                      <div className="card-body py-2 px-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                className={star <= rating.rating ? 'text-warning' : 'text-muted'}
                                style={{ width: '16px', height: '16px' }}
                              />
                            ))}
                            <span className="ms-2 fw-bold">{rating.rating}/5</span>
                          </div>
                          <small className="text-muted">
                            {rating.created_at ? new Date(rating.created_at).toLocaleDateString() : 'N/A'}
                          </small>
                        </div>
                        
                        {rating.member_name && (
                          <div className="mb-2">
                            <span className="badge bg-info text-dark fw-bold">{rating.member_name}</span>
                          </div>
                        )}
                        
                        {rating.feedback ? (
                          <div className="mb-2">
                            <p className="card-text text-white mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>{rating.feedback}</p>
                          </div>
                        ) : (
                          <p className="card-text text-muted fst-italic mb-0" style={{ fontSize: '0.85rem' }}>No written feedback provided.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerRatingsView;


