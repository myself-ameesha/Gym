import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Table, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { People, CardChecklist, PencilSquare, Trash, PlusCircle } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { getMembershipPlans, updateMembershipPlan, deleteMembershipPlan } from '../../features/auth/authApi';

const MembershipPlanList = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', duration_days: '' });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const dispatch = useDispatch();
  const { membershipPlans, loading, error: reduxError } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getMembershipPlans()).unwrap().catch(err => setError(err));
  }, [dispatch]);

  useEffect(() => {
    if (reduxError) setError(reduxError);
  }, [reduxError]);

  const handleDeleteClick = (plan) => {
    setCurrentPlan(plan);
    setShowDeleteModal(true);
    setError(null);
    setSuccessMessage('');
  };

  const handleEditClick = (plan) => {
    setCurrentPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      duration_days: plan.duration_days
    });
    setShowEditModal(true);
    setError(null);
    setSuccessMessage('');
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteMembershipPlan(currentPlan.id)).unwrap();
      setShowDeleteModal(false);
      setSuccessMessage(`Membership plan ${currentPlan.name} deleted successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err || 'Failed to delete membership plan.');
      setShowDeleteModal(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateMembershipPlan({ planId: currentPlan.id, data: editForm })).unwrap();
      setShowEditModal(false);
      setSuccessMessage(`Membership plan ${editForm.name} updated successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err || 'Failed to update membership plan.');
    }
  };

  const activePlanCount = membershipPlans?.filter(plan => plan.is_active).length || 0;
  const inactivePlanCount = membershipPlans?.length - activePlanCount || 0;

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Membership Plan Management</h3>
        <Link to="/Admin/CreateMembershipPlan">
          <Button variant="primary" style={{ backgroundColor: "#7747ff", border: "none", display: "flex", alignItems: "center", gap: "8px" }}>
            <PlusCircle size={16} /> Create Membership Plan
          </Button>
        </Link>
      </header>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}

      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(119, 71, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                <CardChecklist color="#7747ff" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Total Plans</h6>
                <h3 className="text-white mb-0">{membershipPlans?.length || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                <CardChecklist color="#2ecc71" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Active Plans</h6>
                <h3 className="text-white mb-0">{activePlanCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(231, 76, 60, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                <CardChecklist color="#e74c3c" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Inactive Plans</h6>
                <h3 className="text-white mb-0">{inactivePlanCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <div className="me-2" style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233, 30, 99, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CardChecklist color="#e91e63" size={20} />
              </div>
              <span className="text-white">Membership Plan List</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading plans...</p>
            </div>
          ) : membershipPlans?.length === 0 ? (
            <div className="text-center my-5">
              <p className="text-white">No membership plans found. Create your first plan to get started.</p>
              <Link to="/Admin/CreateMembershipPlan">
                <Button variant="primary" style={{ backgroundColor: "#7747ff", border: "none" }}>Create Membership Plan</Button>
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Duration (Days)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipPlans?.map((plan) => (
                    <tr key={plan.id}>
                      <td>{plan.id}</td>
                      <td>{plan.name}</td>
                      <td>${plan.price}</td>
                      <td>{plan.duration_days}</td>
                      <td>
                        <span className={`badge ${plan.is_active ? 'bg-success' : 'bg-danger'}`}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Button variant="outline-info" size="sm" className="me-2" onClick={() => handleEditClick(plan)} style={{ borderColor: '#0dcaf0' }}>
                          <PencilSquare size={16} />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(plan)} style={{ borderColor: '#dc3545' }}>
                          <Trash size={16} />
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

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          Are you sure you want to delete the membership plan: <strong>{currentPlan?.name}</strong>?
          <p className="text-danger mt-2 mb-0">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Edit Membership Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" name="name" value={editForm.name} onChange={handleEditChange} style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" name="description" value={editForm.description} onChange={handleEditChange} style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control type="number" name="price" value={editForm.price} onChange={handleEditChange} style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }} required min="0" step="0.01" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Duration (Days)</Form.Label>
              <Form.Control type="number" name="duration_days" value={editForm.duration_days} onChange={handleEditChange} style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }} required min="1" />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: "#7747ff", border: "none" }}>Save Changes</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MembershipPlanList;