import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAssignedMembers, getDefaultDietPlans, createDietPlan, createDefaultDietPlan, getDietPlanHistory, getCurrentDietPlan, updateDietPlan, deleteDietPlan, assignDietPlan } from '../../features/auth/authApi';
import { clearDietError } from '../../features/auth/authSlice';
import { toast } from 'react-toastify';
import { Card, Form, Button, Modal, Table, Spinner, Alert } from 'react-bootstrap';
import { PersonBadge } from 'react-bootstrap-icons';

// Define fitness goal choices from the Django model
const FITNESS_GOAL_CHOICES = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'weight_gain', label: 'Weight Gain' },
  { value: 'general_fitness', label: 'General Fitness' },
];

const DietPlanManagement = () => {
  const dispatch = useDispatch();
  const { assignedMembers, defaultDietPlans, dietPlans, currentDietPlan, dietLoading, dietError } = useSelector(state => state.auth);
  const [selectedMember, setSelectedMember] = useState('');
  const [dietForm, setDietForm] = useState({
    fitness_goal: '',
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
    is_default: true,
    default_diet_plan_id: '',
  });
  const [showDietModal, setShowDietModal] = useState(false);
  const [showDefaultDietModal, setShowDefaultDietModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCurrentDietModal, setShowCurrentDietModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [editingDietPlan, setEditingDietPlan] = useState(null);
  const [deletingDietPlanId, setDeletingDietPlanId] = useState(null);

  useEffect(() => {
    dispatch(getAssignedMembers());
    dispatch(getDefaultDietPlans());
  }, [dispatch]);

  useEffect(() => {
    if (dietError) {
      toast.error(dietError);
      dispatch(clearDietError());
    }
  }, [dietError, dispatch]);

  const handleCreateDefaultDietPlan = () => {
    setDietForm({
      fitness_goal: '',
      title: '',
      description: '',
      is_default: true,
    });
    setShowDefaultDietModal(true);
  };

  const handleCreateDietPlan = (member) => {
    setCurrentMember(member);
    setSelectedMember(member.id);
    setDietForm({
      default_diet_plan_id: '',
      title: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true,
    });
    setEditingDietPlan(null);
    setShowDietModal(true);
  };

  const handleEditDietPlan = (member, plan) => {
    setCurrentMember(member);
    setSelectedMember(member.id);
    setDietForm({
      default_diet_plan_id: plan.default_diet_plan ? plan.default_diet_plan.id.toString() : '',
      title: plan.title,
      description: plan.description,
      start_date: plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : '',
      end_date: plan.end_date ? new Date(plan.end_date).toISOString().split('T')[0] : '',
      is_active: plan.is_active,
    });
    setEditingDietPlan(plan);
    setShowDietModal(true);
  };

  const handleDeleteDietPlan = (planId) => {
    let planExists = false;
    if (currentMember && dietPlans[currentMember.id]) {
      planExists = dietPlans[currentMember.id].some(plan => plan.id === planId);
    }
    if (!planExists) {
      toast.error('Cannot delete: Diet plan not found or you are not authorized.');
      return;
    }
    setDeletingDietPlanId(planId);
    setShowDeleteModal(true);
  };

  const handleViewCurrentDiet = (member) => {
    setCurrentMember(member);
    dispatch(getCurrentDietPlan(member.id)).then(() => {
      setShowCurrentDietModal(true);
    });
  };

  const confirmDeleteDietPlan = () => {
    dispatch(deleteDietPlan(deletingDietPlanId)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Diet plan deleted successfully');
        setShowDeleteModal(false);
        setDeletingDietPlanId(null);
        if (currentMember) {
          dispatch(getDietPlanHistory(currentMember.id));
        }
      }
    });
  };

  const handleDefaultPlanChange = (e) => {
    const planId = e.target.value;
    const selectedPlan = defaultDietPlans.find(plan => plan.id === parseInt(planId));
    if (selectedPlan) {
      setDietForm({
        ...dietForm,
        default_diet_plan_id: planId,
        title: selectedPlan.title,
        description: selectedPlan.description,
      });
    } else {
      setDietForm({
        ...dietForm,
        default_diet_plan_id: '',
        title: '',
        description: '',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDietForm({ ...dietForm, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    setDietForm({ ...dietForm, is_active: e.target.checked });
  };

  const handleSubmitDefaultDiet = () => {
    if (!dietForm.fitness_goal || !dietForm.title || !dietForm.description) {
      toast.error('Fitness goal, title, and description are required');
      return;
    }
    dispatch(createDefaultDietPlan({
      fitness_goal: dietForm.fitness_goal,
      title: dietForm.title,
      description: dietForm.description,
      is_default: true,
    })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Default diet plan created successfully');
        setShowDefaultDietModal(false);
        dispatch(getDefaultDietPlans());
      }
    });
  };

  const handleSubmitDiet = () => {
    if (!selectedMember) {
      toast.error('Please select a member');
      return;
    }
    if (!dietForm.title || !dietForm.description || !dietForm.start_date) {
      toast.error('Title, description, and start date are required');
      return;
    }
    const dietPlanData = {
      member: parseInt(selectedMember),
      default_diet_plan_id: dietForm.default_diet_plan_id ? parseInt(dietForm.default_diet_plan_id) : null,
      title: dietForm.title,
      description: dietForm.description,
      start_date: dietForm.start_date,
      end_date: dietForm.end_date || null,
      is_active: dietForm.is_active,
    };
    console.log('Diet Plan Data:', dietPlanData);
    const action = editingDietPlan
      ? updateDietPlan({ dietPlanId: editingDietPlan.id, dietPlanData })
      : createDietPlan(dietPlanData);
    dispatch(action).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success(editingDietPlan ? 'Diet plan updated successfully' : 'Diet plan created and assigned successfully');
        setDietForm({
          default_diet_plan_id: '',
          title: '',
          description: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          is_active: true,
        });
        setShowDietModal(false);
        setSelectedMember('');
        setEditingDietPlan(null);
        if (currentMember) {
          dispatch(getDietPlanHistory(currentMember.id));
        }
      }
    });
  };

  const handleViewHistory = (member) => {
    setCurrentMember(member);
    dispatch(getDietPlanHistory(member.id)).then(() => {
      setShowHistoryModal(true);
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const filteredDefaultDietPlans = currentMember
    ? defaultDietPlans.filter(plan => plan.fitness_goal === currentMember.fitness_goal)
    : defaultDietPlans;

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Diet Plan Management</h3>
        <Button variant="primary" onClick={handleCreateDefaultDietPlan}>
          Create Default Diet Plan
        </Button>
      </header>

      {dietError && (
        <Alert variant="danger" onClose={() => dispatch(clearDietError())} dismissible>
          {dietError}
        </Alert>
      )}

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
              <PersonBadge color="#7747ff" size={20} />
            </div>
            <span className="text-white">Member List</span>
          </div>

          {dietLoading && !selectedMember ? (
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
              <Table bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Membership Plan</th>
                    <th>Fitness Goal</th>
                    <th>Registration Date</th>
                    <th style={{ minWidth: '250px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.id}</td>
                      <td>{member.first_name} {member.last_name}</td>
                      <td>{member.email}</td>
                      <td>{member.membership_plan ? member.membership_plan.name : 'Not Assigned'}</td>
                      <td>{member.fitness_goal || 'Not Specified'}</td>
                      <td>{formatDate(member.date_joined)}</td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            maxWidth: '250px',
                          }}
                        >
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleCreateDietPlan(member)}
                            style={{ flex: '1 1 80px', minWidth: '80px' }}
                          >
                            Add Diet Plan
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleViewHistory(member)}
                            style={{ flex: '1 1 80px', minWidth: '80px' }}
                          >
                            View History
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleViewCurrentDiet(member)}
                            style={{ flex: '1 1 80px', minWidth: '80px' }}
                          >
                            View Current
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Default Diet Plan Creation Modal */}
      <Modal show={showDefaultDietModal} onHide={() => setShowDefaultDietModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Default Diet Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fitness Goal</Form.Label>
              <Form.Select
                name="fitness_goal"
                value={dietForm.fitness_goal}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Fitness Goal</option>
                {FITNESS_GOAL_CHOICES.map((goal) => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={dietForm.title}
                onChange={handleInputChange}
                placeholder="e.g., Low-Carb Diet"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={dietForm.description}
                onChange={handleInputChange}
                placeholder="e.g., Breakfast: Oatmeal\nLunch: Grilled Chicken..."
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDefaultDietModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitDefaultDiet}
            disabled={dietLoading}
          >
            {dietLoading ? 'Saving...' : 'Save Default Diet Plan'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Diet Plan Creation/Edit Modal */}
      <Modal show={showDietModal} onHide={() => setShowDietModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingDietPlan ? 'Edit Diet Plan' : 'Create Diet Plan'} for {currentMember?.first_name} {currentMember?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Default Diet Plan</Form.Label>
              <Form.Select
                value={dietForm.default_diet_plan_id}
                onChange={handleDefaultPlanChange}
                disabled={dietLoading}
              >
                <option value="">Custom plan or select a default plan</option>
                {filteredDefaultDietPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title} ({plan.fitness_goal})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={dietForm.title}
                onChange={handleInputChange}
                placeholder="e.g., Low-Carb Diet"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={dietForm.description}
                onChange={handleInputChange}
                placeholder="e.g., Breakfast: Oatmeal\nLunch: Grilled Chicken..."
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                name="start_date"
                value={dietForm.start_date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Date (Optional)</Form.Label>
              <Form.Control
                type="date"
                name="end_date"
                value={dietForm.end_date}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                name="is_active"
                checked={dietForm.is_active}
                onChange={handleCheckboxChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDietModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitDiet}
            disabled={dietLoading}
          >
            {dietLoading ? 'Saving...' : editingDietPlan ? 'Update Diet Plan' : 'Save Diet Plan'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Diet Plan History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Diet Plan History for {currentMember?.first_name} {currentMember?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {dietLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : !dietPlans[currentMember?.id] || dietPlans[currentMember?.id].length === 0 ? (
            <p>No diet plans found.</p>
          ) : (
            <Table striped bordered hover variant="dark">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Active</th>
                  <th>Default Plan</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dietPlans[currentMember?.id].map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.title}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{plan.description}</td>
                    <td>{formatDate(plan.start_date)}</td>
                    <td>{formatDate(plan.end_date)}</td>
                    <td>{plan.is_active ? 'Yes' : 'No'}</td>
                    <td>{plan.default_diet_plan ? `${plan.default_diet_plan.title} (${plan.default_diet_plan.fitness_goal})` : 'Custom'}</td>
                    <td>{formatDate(plan.created_at)}</td>
                    <td>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleEditDietPlan(currentMember, plan)}
                        className="me-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteDietPlan(plan.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Current Diet Plan Modal */}
      <Modal show={showCurrentDietModal} onHide={() => setShowCurrentDietModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Current Diet Plan for {currentMember?.first_name} {currentMember?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {dietLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : !currentDietPlan ? (
            <p>No active diet plan found.</p>
          ) : (
            <div>
              <h5>{currentDietPlan.title}</h5>
              <p><strong>Description:</strong></p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{currentDietPlan.description}</p>
              <p><strong>Start Date:</strong> {formatDate(currentDietPlan.start_date)}</p>
              <p><strong>End Date:</strong> {formatDate(currentDietPlan.end_date)}</p>
              <p><strong>Active:</strong> {currentDietPlan.is_active ? 'Yes' : 'No'}</p>
              <p><strong>Default Plan:</strong> {currentDietPlan.default_diet_plan ? `${currentDietPlan.default_diet_plan.title} (${currentDietPlan.default_diet_plan.fitness_goal})` : 'Custom'}</p>
              <p><strong>Created At:</strong> {formatDate(currentDietPlan.created_at)}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCurrentDietModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this diet plan? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteDietPlan} disabled={dietLoading}>
            {dietLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DietPlanManagement;