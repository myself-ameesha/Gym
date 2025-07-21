import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Card, Button, Spinner, Alert, Modal, Form, Image, Container, Row, Col, ListGroup } from 'react-bootstrap';
import { Person } from 'react-bootstrap-icons';
import { getCurrentTrainer, updateOwnProfile, getAssignedMembers } from '../../features/auth/authApi';
import { getChatRooms, createCommunityChat } from '../../features/chat/chatApi';
import { clearChatError } from '../../features/chat/chatSlice';
import ChatInterface from '../Auth/ChatInterface';
import axios from 'axios';

const TrainerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTrainer, assignedMembers, loading, error: reduxError } = useSelector((state) => state.auth);
  const { chatRooms, communityChatRooms, chatLoading, chatError } = useSelector((state) => state.chat);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    specialization: ''
  });
  const [imageValid, setImageValid] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [communityForm, setCommunityForm] = useState({
    name: '',
    member_ids: []
  });
  const [manageRoom, setManageRoom] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    setActiveSection(section === 'chat' || section === 'community' ? section : 'profile');
  }, [location.search]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No access token found. Please log in.');
      navigate('/login');
      return;
    }
if (!currentTrainer) {
    dispatch(getCurrentTrainer())
      .unwrap()
      .then(data => {
        console.log('Fetched current trainer:', data);
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setEditForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            phone_number: data.trainer_profile?.phone_number || data.phone_number || '',
            specialization: data.trainer_profile?.specialization || data.specialization || ''
          });
          if (!data.trainer_profile?.profile_img) {
            setImageValid(false);
          }
        } else {
          setError('Invalid trainer data received');
        }
      })
      .catch(err => setError(err.message || 'Failed to fetch trainer details'));
  } else {
    // Update editForm when currentTrainer is already available
    setEditForm({
      first_name: currentTrainer.first_name || '',
      last_name: currentTrainer.last_name || '',
      email: currentTrainer.email || '',
      phone_number: currentTrainer.trainer_profile?.phone_number || currentTrainer.phone_number || '',
      specialization: currentTrainer.trainer_profile?.specialization || currentTrainer.specialization || ''
    });
    if (!currentTrainer.trainer_profile?.profile_img) {
      setImageValid(false);
    }
  }

  if (activeSection === 'community' && currentTrainer?.id) {
    console.log('Dispatching getAssignedMembers for trainer ID:', currentTrainer.id);
    dispatch(getAssignedMembers(currentTrainer.id))
      .unwrap()
      .then(data => {
        console.log('Assigned members fetched:', data);
      })
      .catch(err => {
        console.error('Failed to fetch assigned members:', err);
        setError(err.message || 'Failed to fetch assigned members');
      });
  }

  if (activeSection === 'chat' || activeSection === 'community') {
    dispatch(getChatRooms());
  }
}, [dispatch, navigate, activeSection, currentTrainer]);


  useEffect(() => {
    if (reduxError) {
      setError(reduxError.message || reduxError.toString() || 'An error occurred');
    }
  }, [reduxError]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    try {
      await dispatch(updateOwnProfile(editForm)).unwrap();
      setShowEditModal(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err || 'Failed to update profile. Please try again.');
    }
  };

  const handleImageError = () => {
    setImageValid(false);
  };

  const handleClearChatError = () => {
    dispatch(clearChatError());
  };

  const handleCommunityFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setCommunityForm(prev => {
        const member_ids = checked
          ? [...prev.member_ids, value]
          : prev.member_ids.filter(id => id !== value);
        return { ...prev, member_ids };
      });
    } else {
      setCommunityForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateCommunityChat = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    if (communityForm.member_ids.length === 0) {
      setError('Please select at least one member to create a community chat.');
      return;
    }

    try {
      await dispatch(createCommunityChat({
        trainerId: currentTrainer.id,
        memberIds: communityForm.member_ids,
        roomName: communityForm.name || `${currentTrainer.first_name}'s Community Chat`,
      })).unwrap();
      setSuccessMessage('Community chat created successfully!');
      dispatch(getChatRooms());
      setShowCommunityModal(false);
      setCommunityForm({ name: '', member_ids: [] });
    } catch (err) {
      setError(err || 'Failed to create community chat.');
    }
  };

  const handleManageMembers = (room) => {
    setManageRoom(room);
    setCommunityForm({ name: room.name, member_ids: room.members.map(m => m.id.toString()) });
    setShowManageModal(true);
  };

  const handleUpdateCommunityChat = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    const token = localStorage.getItem('accessToken');
    const addedMembers = communityForm.member_ids.filter(id => !manageRoom.members.some(m => m.id.toString() === id));
    const removedMembers = manageRoom.members.filter(m => !communityForm.member_ids.includes(m.id.toString())).map(m => m.id.toString());

    try {
      for (const member_id of addedMembers) {
        await axios.patch(`http://localhost:8000/api/chats/community/${manageRoom.id}/`, {
          action: 'add',
          member_id,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      for (const member_id of removedMembers) {
        await axios.patch(`http://localhost:8000/api/chats/community/${manageRoom.id}/`, {
          action: 'remove',
          member_id,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setSuccessMessage('Community chat updated successfully!');
      dispatch(getChatRooms());
      setShowManageModal(false);
      setManageRoom(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update community chat.');
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div style={{ height: 'calc(100vh - 160px)', overflowY: 'auto', paddingRight: '10px' }}>
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="light" />
                <p className="text-white mt-2">Loading trainer details...</p>
              </div>
            ) : currentTrainer ? (
              <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-center mb-4">
                    <div
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(255, 193, 7, 0.3)',
                        overflow: 'hidden'
                      }}
                    >
                      {imageValid && currentTrainer.trainer_profile?.profile_img ? (
                        <Image
                          src={currentTrainer.trainer_profile.profile_img}
                          alt="Trainer Profile"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={handleImageError}
                        />
                      ) : (
                        <Person color="#ffc107" size={60} />
                      )}
                    </div>
                  </div>

                  <h4 className="text-center text-white mb-4">
                    {currentTrainer.first_name} {currentTrainer.last_name}
                  </h4>

                  <div className="row g-3">
                    <div className="col-md-6 mb-3">
                      <Card style={{ backgroundColor: '#1a2a4a', border: 'none', borderRadius: '8px' }}>
                        <Card.Body className="p-3">
                          <h6 className="text-white-50 mb-2">Email</h6>
                          <p className="text-white mb-0">{currentTrainer.email || 'Not provided'}</p>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-6 mb-3">
                      <Card style={{ backgroundColor: '#1a2a4a', border: 'none', borderRadius: '8px' }}>
                        <Card.Body className="p-3">
                          <h6 className="text-white-50 mb-2">Phone Number</h6>
                          <p className="text-white mb-0">{currentTrainer.phone_number || 'Not provided'}</p>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-6 mb-3">
                      <Card style={{ backgroundColor: '#1a2a4a', border: 'none', borderRadius: '8px' }}>
                        <Card.Body className="p-3">
                          <h6 className="text-white-50 mb-2">Registration Date</h6>
                          <p className="text-white mb-0">{formatDate(currentTrainer.date_joined)}</p>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-6 mb-3">
                      <Card style={{ backgroundColor: '#1a2a4a', border: 'none', borderRadius: '8px' }}>
                        <Card.Body className="p-3">
                          <h6 className="text-white-50 mb-2">Specialization</h6>
                          <div>
                            <span className="badge bg-success px-3 py-2">
                              {currentTrainer.specialization || 'Not Specified'}
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <Button
                      variant="outline-info"
                      onClick={() => setShowEditModal(true)}
                      style={{ borderColor: '#0dcaf0', fontSize: '0.9rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
                      className="px-4 py-2"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <div className="text-center my-5 p-5 bg-dark rounded">
                <p className="text-white">No trainer data available. Please log in.</p>
                <Button variant="primary" onClick={() => handleNavigate('/login')} className="mt-3">
                  Go to Login
                </Button>
              </div>
            )}
          </div>
        );
      case 'chat':
        return (
          <Container fluid style={{ height: 'calc(100vh - 160px)', padding: 0 }}>
            <Row style={{ height: '100%', margin: 0 }}>
              <Col md={12} style={{ padding: 0, height: '100%' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    backgroundColor: 'transparent',
                    position: 'relative'
                  }}
                >
                  <ChatInterface userType="trainer" />
                </div>
              </Col>
            </Row>
          </Container>
        );
      case 'community':
        return (
          <Container fluid style={{ height: 'calc(100vh - 160px)', padding: 0 }}>
            <Row style={{ height: '100%', margin: 0 }}>
              <Col md={12} style={{ padding: 0, height: '100%' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingRight: '10px'
                  }}
                >
                  <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px', marginBottom: '20px' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="text-white">Community Chats</h5>
                        <Button variant="primary" onClick={() => setShowCommunityModal(true)}>
                          Create Community Chat
                        </Button>
                      </div>
                      {chatLoading ? (
                        <div className="text-center">
                          <Spinner animation="border" variant="light" />
                        </div>
                      ) : communityChatRooms && communityChatRooms.length > 0 ? (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <ListGroup>
                            {communityChatRooms.map(room => (
                              <ListGroup.Item
                                key={room.id}
                                style={{
                                  backgroundColor: '#1a2a44',
                                  color: 'white',
                                  border: '1px solid #2a3b6a',
                                  borderRadius: '8px',
                                  marginBottom: '10px',
                                  padding: '15px'
                                }}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <h6 className="mb-1">{room.name}</h6>
                                    <p className="mb-0 text-white-50">
                                      Members: {room.members.length} | Created: {formatDate(room.created_at)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => handleManageMembers(room)}
                                    className="ms-2"
                                  >
                                    Manage Members
                                  </Button>
                                </div>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </div>
                      ) : (
                        <p className="text-white">No community chats available.</p>
                      )}
                    </Card.Body>
                  </Card>
                  
                  {/* Chat Interface Container with transparent background */}
                  <div 
                    style={{ 
                      height: 'calc(100vh - 460px)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      position: 'relative'
                    }}
                  >
                    <ChatInterface userType="trainer" />
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100vh', backgroundColor: '#0c1427', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>
        {`
          /* Custom scrollbar styles */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(26, 42, 58, 0.3);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          
          /* Firefox scrollbar */
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) rgba(26, 42, 58, 0.3);
          }
          
          @media (max-width: 768px) {
            .chat-container {
              flex-direction: column !important;
              height: auto !important;
            }
            .chat-container > div:first-child {
              width: 100% !important;
              border-right: none !important;
              border-bottom: 1px solid #1a2235;
              max-height: 30vh !important;
            }
            .chat-container > div:last-child {
              width: 100% !important;
              height: 50vh !important;
            }
          }
          
          /* Prevent body scroll when in chat sections */
          body {
            overflow: hidden !important;
            height: 100vh;
            margin: 0;
            padding: 0;
          }
          
          /* Smooth scrolling */
          * {
            scroll-behavior: smooth;
          }

          /* Remove background boxes from chat interface elements */
          .chat-interface-container {
            background: transparent !important;
          }
          
          .chat-interface-container * {
            background: transparent !important;
            border: none !important;
          }
          
          /* Ensure chat interface has no background styling */
          .chat-interface-container .card,
          .chat-interface-container .list-group-item,
          .chat-interface-container .bg-dark,
          .chat-interface-container .bg-light,
          .chat-interface-container .bg-secondary {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '20px 20px 0 20px' }}>
        <Navbar bg="transparent" variant="dark" expand="lg" className="mb-4 px-0">
          <Navbar.Brand style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            {activeSection === 'profile' ? 'Trainer Profile' : activeSection === 'chat' ? 'Chats with Members' : 'Community Chat Management'}
          </Navbar.Brand>
        </Navbar>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}
        {chatError && (
          <Alert variant="danger" onClose={handleClearChatError} dismissible>
            {chatError}
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 20px 20px 20px' }}>
        {renderContent()}
      </div>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="first_name"
                value={editForm.first_name}
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="last_name"
                value={editForm.last_name}
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                name="phone_number"
                value={editForm.phone_number}
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Specialization</Form.Label>
              <Form.Control
                type="text"
                name="specialization"
                value={editForm.specialization}
                onChange={handleEditChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: "#7747ff", border: "none" }}>
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showCommunityModal} onHide={() => setShowCommunityModal(false)} centered>
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Create Community Chat</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          <Form onSubmit={handleCreateCommunityChat}>
            <Form.Group className="mb-3">
              <Form.Label>Chat Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={communityForm.name}
                onChange={handleCommunityFormChange}
                placeholder="Enter chat name (optional)"
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Members</Form.Label>
              {loading ? (
                <Spinner animation="border" variant="light" size="sm" />
              ) : assignedMembers.length > 0 ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #1a2235', borderRadius: '4px', padding: '10px' }}>
                  {assignedMembers.map(member => (
                    <Form.Check
                      key={member.id}
                      type="checkbox"
                      label={`${member.first_name} ${member.last_name}`}
                      value={member.id.toString()}
                      checked={communityForm.member_ids.includes(member.id.toString())}
                      onChange={handleCommunityFormChange}
                      style={{ color: 'white', marginBottom: '8px' }}
                    />
                  ))}
                </div>
              ) : (
                <p>No assigned members available to add.</p>
              )}
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowCommunityModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: "#7747ff", border: "none" }}>
                Create Chat
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showManageModal} onHide={() => setShowManageModal(false)} centered>
        <Modal.Header style={{ backgroundColor: '#101c36', border: '1px solid #1a2235' }}>
          <Modal.Title className="text-white">Manage Members</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#0c1427', color: 'white' }}>
          <Form onSubmit={handleUpdateCommunityChat}>
            <Form.Group className="mb-3">
              <Form.Label>Chat Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={communityForm.name}
                onChange={handleCommunityFormChange}
                style={{ backgroundColor: 'rgba(16, 28, 54, 0.5)', color: 'white', border: '1px solid #1a2235' }}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Members</Form.Label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #1a2235', borderRadius: '4px', padding: '10px' }}>
                {assignedMembers.map(member => (
                  <Form.Check
                    key={member.id}
                    type="checkbox"
                    label={`${member.first_name} ${member.last_name}`}
                    value={member.id.toString()}
                    checked={communityForm.member_ids.includes(member.id.toString())}
                    onChange={handleCommunityFormChange}
                    style={{ color: 'white', marginBottom: '8px' }}
                  />
                ))}
              </div>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowManageModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: "#7747ff", border: "none" }}>
                Update Members
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TrainerDashboard;




