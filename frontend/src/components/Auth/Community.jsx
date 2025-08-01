import React, { useEffect, useState } from 'react';
import { Card, ListGroup, Spinner } from 'react-bootstrap';
import { FaComment } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import ChatInterface from '../Auth/ChatInterface';
import { getChatRooms } from '../../features/chat/chatApi';
import { getCurrentMember } from '../../features/auth/authApi';

const Community = () => {
  const dispatch = useDispatch();
  const { currentMember, loading } = useSelector((state) => state.auth);
  const { communityChatRooms, chatLoading } = useSelector((state) => state.chat);
  const [selectedCommunityRoom, setSelectedCommunityRoom] = useState(null);

  useEffect(() => {
    if (currentMember?.id) {
      dispatch(getChatRooms());
    } else {
      dispatch(getCurrentMember());
    }
  }, [dispatch, currentMember?.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const handleSelectCommunityRoom = (room) => {
    setSelectedCommunityRoom(room);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="light" />
        <p className="text-white mt-2">Loading your data...</p>
      </div>
    );
  }

  return (
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
            <FaComment color="#7747ff" size={20} />
          </div>
          <span className="text-white">Community Chats</span>
        </div>
        {chatLoading ? (
          <div className="text-center">
            <Spinner animation="border" variant="light" />
          </div>
        ) : communityChatRooms && communityChatRooms.length > 0 ? (
          <>
            <ListGroup className="mb-4">
              {communityChatRooms.map(room => (
                <ListGroup.Item
                  key={room.id}
                  action
                  onClick={() => handleSelectCommunityRoom(room)}
                  style={{
                    backgroundColor: selectedCommunityRoom?.id === room.id ? '#1a2a44' : '#0c1427',
                    color: 'white',
                    border: '1px solid #2a3b6a',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    padding: '15px',
                    cursor: 'pointer'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{room.name}</h6>
                      <p className="mb-0 text-white-50">
                        Members: {room.members.length} | Created: {formatDate(room.created_at)}
                      </p>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
            {selectedCommunityRoom ? (
              <ChatInterface
                userType="member"
                roomType="community"
                roomId={selectedCommunityRoom.id}
              />
            ) : (
              <p className="text-white">Select a community chat to start chatting.</p>
            )}
          </>
        ) : (
          <p className="text-white">No community chats available.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default Community;