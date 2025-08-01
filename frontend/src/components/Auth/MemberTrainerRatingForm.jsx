import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Spinner, Alert, Form, Button, ListGroup } from 'react-bootstrap';
import { submitTrainerRating, updateTrainerRating, getMemberRatings, getCurrentMember } from '../../features/auth/authApi';
import { clearRatingError } from '../../features/auth/authSlice';
import { StarIcon } from '@heroicons/react/24/solid';

const MemberTrainerRatingForm = () => {
  const dispatch = useDispatch();
  const { currentMember, memberRatings, ratingLoading, ratingError, loading } = useSelector((state) => state.auth);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [existingRating, setExistingRating] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    dispatch(getCurrentMember());
    dispatch(getMemberRatings());
    
    return () => {
      dispatch(clearRatingError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (memberRatings.length > 0 && currentMember?.assigned_trainer) {
      const trainerRating = memberRatings.find(
        (r) => r.trainer === currentMember.assigned_trainer.id
      );
      if (trainerRating) {
        setExistingRating(trainerRating);
        setRating(trainerRating.rating);
        setFeedback(trainerRating.feedback || '');
        setIsEditing(false);
      } else {
        setExistingRating(null);
        setRating(0);
        setFeedback('');
        setIsEditing(true);
      }
    }
  }, [memberRatings, currentMember]);

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (existingRating) {
      setRating(existingRating.rating);
      setFeedback(existingRating.feedback || '');
      setIsEditing(false);
    }
  };

  const handleSubmit = (e) => {
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
        setIsEditing(false);
        alert(existingRating ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      })
      .catch((error) => {
        console.error('Rating submission error:', error);
        alert(error || 'Failed to submit rating.');
      });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#121212', minHeight: '100vh' }}>
        <Card bg="dark" text="white" className="mx-auto" style={{ maxWidth: '600px' }}>
          <Card.Body className="text-center">
            <Spinner animation="border" variant="light" />
            <p className="mt-2 text-light">Loading your profile...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (!currentMember?.assigned_trainer) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#121212', minHeight: '100vh' }}>
        <Card bg="dark" text="white" className="mx-auto" style={{ maxWidth: '600px' }}>
          <Card.Body>
            <Card.Title className="mb-3 text-light">Trainer Rating</Card.Title>
            <Alert variant="info" className="bg-secondary text-light border-secondary">
              <Alert.Heading className="text-light">No Assigned Trainer</Alert.Heading>
              <p className="mb-0">You do not have an assigned trainer to rate. Please contact the admin to get a trainer assigned.</p>
            </Alert>
            <div className="mt-3">
              <small className="text-muted">
                Debug: Current member ID: {currentMember?.id || 'Not loaded'}
              </small>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const { assigned_trainer } = currentMember;
  const trainerName = `${assigned_trainer.first_name} ${assigned_trainer.last_name || ''}`.trim();

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#121212', minHeight: '100vh' }}>
      {/* Trainer Info Card */}
      <Card bg="dark" text="white" className="mx-auto mb-4" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <Card.Title className="mb-3 text-light">Your Assigned Trainer</Card.Title>
          <ListGroup variant="flush">
            <ListGroup.Item className="bg-secondary text-light d-flex justify-content-between">
              <strong>Name:</strong> 
              <span>{trainerName}</span>
            </ListGroup.Item>
            <ListGroup.Item className="bg-secondary text-light d-flex justify-content-between">
              <strong>Email:</strong> 
              <span>{assigned_trainer.email}</span>
            </ListGroup.Item>
            {assigned_trainer.specialization && (
              <ListGroup.Item className="bg-secondary text-light d-flex justify-content-between">
                <strong>Specialization:</strong> 
                <span>{assigned_trainer.specialization}</span>
              </ListGroup.Item>
            )}
            {assigned_trainer.phone && (
              <ListGroup.Item className="bg-secondary text-light d-flex justify-content-between">
                <strong>Phone:</strong> 
                <span>{assigned_trainer.phone}</span>
              </ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Rating Display/Form Card */}
      <Card bg="dark" text="white" className="mx-auto" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <Card.Title className="mb-4 text-light">
            {existingRating && !isEditing ? 'Your Rating' : 
             existingRating && isEditing ? 'Update Your Rating' : 
             'Rate Your Trainer'}: {trainerName}
          </Card.Title>
          
          {/* Display existing rating when not editing */}
          {existingRating && !isEditing && (
            <div className="mb-4">
              <Alert variant="success" className="bg-success text-white border-success">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-2">Your Current Rating</h6>
                    <div className="d-flex align-items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`me-1 ${star <= existingRating.rating ? 'text-warning' : 'text-secondary'}`}
                          style={{ width: '24px', height: '24px' }}
                        />
                      ))}
                      <span className="ms-2">{existingRating.rating}/5 stars</span>
                    </div>
                    {existingRating.feedback && (
                      <div className="mb-2">
                        <strong>Your Feedback:</strong>
                        <p className="mb-0 mt-1 text-break">{existingRating.feedback}</p>
                      </div>
                    )}
                    <small className="text-light opacity-75">
                      Submitted on {new Date(existingRating.created_at).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </Alert>
              <div className="text-center">
                <Button variant="outline-light" onClick={handleEdit}>
                  Update Rating & Feedback
                </Button>
              </div>
            </div>
          )}

          {/* Rating form when editing or no existing rating */}
          {(isEditing || !existingRating) && (
            <>
              {existingRating && isEditing && (
                <Alert variant="info" className="bg-secondary text-light border-secondary mb-3">
                  <small>You previously rated this trainer {existingRating.rating}/5 stars on {new Date(existingRating.created_at).toLocaleDateString()}</small>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-light">Rating *</Form.Label>
                  <div className="d-flex align-items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`me-1 ${star <= rating ? 'text-warning' : 'text-secondary'}`}
                        style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                        onClick={() => handleRatingChange(star)}
                      />
                    ))}
                    <span className="ms-2 text-muted">
                      {rating > 0 ? `${rating}/5 stars` : 'Click to rate'}
                    </span>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-light">Feedback</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your feedback about your trainer's performance, communication, and training methods..."
                    className="bg-secondary text-light border-secondary"
                    style={{ '::placeholder': { color: '#adb5bd' } }}
                  />
                  <Form.Text className="text-muted">
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
                  
                  {existingRating && isEditing && (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={handleCancel}
                      disabled={ratingLoading}
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

export default MemberTrainerRatingForm;