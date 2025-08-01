import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, ListGroup, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { getChatRooms, getMessages } from '../../features/chat/chatApi';
import { addMessage } from '../../features/chat/chatSlice';
import { refreshAccessToken } from '../../features/auth/authApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';
import EmojiPicker from 'emoji-picker-react';

const CommunityChatInterface = () => {
    const dispatch = useDispatch();
    const { currentMember, currentTrainer, accessToken, refresh } = useSelector((state) => state.auth);
    const { chatRooms, messages, chatLoading, chatError } = useSelector((state) => state.chat);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [file, setFile] = useState(null);
    const [reactionMessageId, setReactionMessageId] = useState(null);
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 3;

    const currentUser = currentMember || currentTrainer;
    const isMember = !!currentMember;

    useEffect(() => {
        if (currentUser) {
            dispatch(getChatRooms());
        } else {
            console.log("No current user found. Ensure user is logged in.");
        }
    }, [dispatch, currentUser]);

    const isTokenExpired = (token) => {
        if (!token) return true;
        try {
            const decoded = jwtDecode(token);
            const now = Math.floor(Date.now() / 1000);
            return decoded.exp < now;
        } catch (error) {
            console.error("Error decoding token:", error);
            return true;
        }
    };

    const getValidToken = async () => {
        let token = accessToken || localStorage.getItem('accessToken');
        const refreshTok = refresh || localStorage.getItem('refreshToken');

        if (isTokenExpired(token) && refreshTok) {
            console.log("Access token expired, refreshing...");
            try {
                const response = await dispatch(refreshAccessToken({ refresh: refreshTok })).unwrap();
                token = response;
                console.log("New access token:", token);
                localStorage.setItem('accessToken', token);
            } catch (error) {
                console.error("Failed to refresh token:", error);
                toast.error("Session expired. Please log in again.");
                return null;
            }
        }

        return token;
    };

    const connectWebSocket = async () => {
        if (!selectedRoom) return;

        const token = await getValidToken();
        if (!token) {
            console.error("No valid access token available");
            toast.error("Please log in again to continue chatting.");
            return;
        }

        const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/chat/${selectedRoom.id}/?token=${token}`;
        console.log("Connecting to WebSocket with URL:", wsUrl);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log('WebSocket connected for room:', selectedRoom.id);
            reconnectAttempts.current = 0;
            toast.success('Community chat connected!');
            dispatch(getMessages(selectedRoom.id));
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
            if (data.type === 'chat_message') {
                dispatch(addMessage({
                    roomId: selectedRoom.id,
                    message: {
                        id: data.message_id,
                        chat_room: selectedRoom,
                        sender: data.sender,
                        content: data.message,
                        file_url: data.file_url,
                        timestamp: data.timestamp,
                        reactions: data.reactions || [],
                    },
                }));
            } else if (data.type === 'reaction_update') {
                dispatch(addMessage({
                    roomId: selectedRoom.id,
                    message: {
                        id: data.message_id,
                        reactions: data.reactions,
                    },
                }));
            }
        };

        wsRef.current.onclose = (event) => {
            console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
            if (reconnectAttempts.current < maxReconnectAttempts) {
                reconnectAttempts.current += 1;
                console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
                setTimeout(connectWebSocket, 3000);
            } else {
                toast.error('Unable to connect to chat server after multiple attempts.');
            }
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            toast.error('Failed to connect to chat server');
        };
    };

    useEffect(() => {
        if (selectedRoom) {
            dispatch(getMessages(selectedRoom.id));
            connectWebSocket();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [dispatch, selectedRoom]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFile({
                    data: reader.result,
                    name: selectedFile.name,
                });
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() && !file) {
            toast.error('Please enter a message or attach a file.');
            return;
        }
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log("Sending message:", messageInput, "File:", file);
            const messageData = {
                type: 'chat_message',
                message: messageInput,
                file: file?.data || null,
                file_name: file?.name || null,
            };
            wsRef.current.send(JSON.stringify(messageData));
            setMessageInput('');
            setFile(null);
        } else {
            console.log("Cannot send message. WebSocket state:", wsRef.current?.readyState);
            toast.error('Chat is disconnected. Trying to reconnect...');
        }
    };

    const handleEmojiSelect = (emojiObject) => {
        setMessageInput(messageInput + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleAddReaction = (messageId, emojiObject) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log("Adding reaction to message:", messageId, "Reaction:", emojiObject.emoji);
            wsRef.current.send(
                JSON.stringify({
                    type: 'reaction',
                    message_id: messageId,
                    reaction: emojiObject.emoji,
                })
            );
            setReactionMessageId(null);
        } else {
            toast.error('Chat is disconnected. Cannot add reaction.');
        }
    };

    const renderChatRooms = () => {
        const communityRooms = chatRooms.filter(room => room.chat_type === 'community');
        if (communityRooms.length === 0 && !chatLoading) {
            return (
                <div style={{ height: '100%' }}>
                    <h5 className="text-white mb-3">Community Chats</h5>
                    <Card style={{ 
                        backgroundColor: '#101c36', 
                        border: '1px solid #1a2235', 
                        borderRadius: '10px',
                        height: '300px'
                    }}>
                        <Card.Body className="d-flex align-items-center justify-content-center">
                            <p className="text-white text-center">No community chats available.</p>
                        </Card.Body>
                    </Card>
                </div>
            );
        }

        return (
            <div style={{ height: '100%' }}>
                <h5 className="text-white mb-3">Community Chats</h5>
                <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {communityRooms.map((room) => (
                        <ListGroup.Item
                            key={room.id}
                            action
                            onClick={() => setSelectedRoom(room)}
                            style={{
                                backgroundColor: selectedRoom?.id === room.id ? '#1a2a44' : '#101c36',
                                color: 'white',
                                border: '1px solid #1a2235',
                                borderRadius: '8px',
                                marginBottom: '8px',
                                padding: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedRoom?.id !== room.id) e.target.style.backgroundColor = '#1a2a44';
                            }}
                            onMouseLeave={(e) => {
                                if (selectedRoom?.id !== room.id) e.target.style.backgroundColor = '#101c36';
                            }}
                        >
                            <div className="d-flex align-items-center">
                                <div 
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#7747ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '12px',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {room.trainer.first_name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '500', fontSize: '16px' }}>
                                        {room.trainer.first_name} {room.trainer.last_name}'s Group
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: '0.7' }}>
                                        Members: {room.members.length}
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
        );
    };

    const renderMessages = () => {
        if (!selectedRoom) {
            return null;
        }

        return (
            <div>
                <div style={{ 
                    height: '500px',
                    width: '800px',
                    overflowY: 'auto', 
                    backgroundColor: '#1a2a44', 
                    padding: '15px', 
                    borderRadius: '10px',
                    border: '1px solid #2a3b6a'
                }}>
                    {messages[selectedRoom.id]?.length === 0 ? (
                        <div className="text-center text-white" style={{ paddingTop: '200px' }}>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages[selectedRoom.id]?.map((msg) => (
                            <div
                                key={msg.id}
                                style={{
                                    textAlign: msg.sender.id === currentUser.id ? 'right' : 'left',
                                    marginBottom: '15px',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'inline-block',
                                        backgroundColor: msg.sender.id === currentUser.id ? '#007bff' : '#343a40',
                                        color: 'white',
                                        padding: '12px 16px',
                                        borderRadius: '18px',
                                        maxWidth: '70%',
                                        wordWrap: 'break-word',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                        {msg.sender.first_name}
                                    </div>
                                    <div>{msg.content}</div>
                                    {msg.file_url && (
                                        <div style={{ marginTop: '8px' }}>
                                            {msg.file_url.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                                <img
                                                    src={msg.file_url}
                                                    alt="attachment"
                                                    style={{ maxWidth: '200px', borderRadius: '8px' }}
                                                />
                                            ) : (
                                                <a href={msg.file_url} download style={{ color: '#0dcaf0' }}>
                                                    Download File
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <div style={{ 
                                        fontSize: '0.75em', 
                                        opacity: '0.7', 
                                        marginTop: '4px',
                                        textAlign: msg.sender.id === currentUser.id ? 'right' : 'left'
                                    }}>
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </div>
                                    <div style={{ marginTop: '8px' }}>
                                        <Button
                                            variant="link"
                                            onClick={() => setReactionMessageId(reactionMessageId === msg.id ? null : msg.id)}
                                            style={{ padding: 0, color: '#0dcaf0', fontSize: '1em' }}
                                        >
                                            😊
                                        </Button>
                                    </div>
                                    {msg.reactions?.length > 0 && (
                                        <div style={{ marginTop: '4px', fontSize: '0.9em', opacity: '0.8' }}>
                                            {msg.reactions.map((reaction, index) => (
                                                <span key={index} style={{ marginRight: '8px' }}>
                                                    {reaction.reaction} ({reaction.user.first_name})
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <Form onSubmit={handleSendMessage} className="mt-3">
                    <div className="d-flex gap-2 align-items-center">
                        <Form.Control
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type your message..."
                            style={{ 
                                backgroundColor: '#101c36', 
                                color: 'white', 
                                border: '1px solid #1a2235',
                                borderRadius: '25px',
                                padding: '10px 20px'
                            }}
                        />
                        <Button
                            variant="link"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            style={{ padding: 0, color: '#0dcaf0', fontSize: '1.2em' }}
                        >
                            😊
                        </Button>
                        <Form.Control
                            type="file"
                            onChange={handleFileChange}
                            style={{ 
                                width: 'auto', 
                                backgroundColor: '#101c36', 
                                color: 'white', 
                                border: '1px solid #1a2235',
                                borderRadius: '8px',
                                padding: '5px'
                            }}
                        />
                        <Button 
                            type="submit" 
                            style={{
                                backgroundColor: '#7747ff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ➤
                        </Button>
                    </div>
                </Form>
                {showEmojiPicker && (
                    <div style={{ position: 'absolute', zIndex: 1000, bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}>
                        <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                )}
                {reactionMessageId && (
                    <div style={{ position: 'absolute', zIndex: 1000, bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}>
                        <EmojiPicker onEmojiClick={(emojiObject) => handleAddReaction(reactionMessageId, emojiObject)} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ height: '100%' }}>
            <style>
                {`
                    .chat-container {
                        display: flex;
                        gap: 20px;
                        height: 650px;
                    }
                    .chat-sidebar {
                        width: 350px;
                        flex-shrink: 0;
                    }
                    .chat-main {
                        flex: 1;
                        min-width: 0;
                    }
                    @media (max-width: 768px) {
                        .chat-container {
                            flex-direction: column !important;
                            height: auto !important;
                            gap: 15px;
                        }
                        .chat-sidebar {
                            width: 1000px;
                            max-height: 300px !important;
                        }
                        .chat-main {
                            width: 1000px;
                            height: 300px !important;
                        }
                    }
                `}
            </style>
            
            {chatLoading && (
                <div className="text-center mb-3">
                    <Spinner animation="border" variant="light" />
                </div>
            )}
            
            {chatError && (
                <Alert variant="danger" className="mb-3">
                    {chatError}
                </Alert>
            )}
            
            <div className="chat-container">
                <div className="chat-sidebar">
                    {renderChatRooms()}
                </div>
                <div className="chat-main">
                    {renderMessages()}
                </div>
            </div>
        </div>
    );
};

export default CommunityChatInterface;


