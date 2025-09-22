// import React, { useState, useEffect, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useLocation } from 'react-router-dom';
// import { Card, ListGroup, Form, Button, Spinner, Alert } from 'react-bootstrap';
// import { getChatRooms, getMessages, createChatRoom } from '../../features/chat/chatApi';
// import { addMessage } from '../../features/chat/chatSlice';
// import { refreshAccessToken, getAssignedMembers } from '../../features/auth/authApi';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { jwtDecode } from 'jwt-decode';
// import EmojiPicker from 'emoji-picker-react';
// import { format } from 'date-fns';

// const ChatInterface = ({ userType = 'member' }) => {
//     const dispatch = useDispatch();
//     const location = useLocation();
//     const { currentMember, currentTrainer, accessToken, refresh, assignedMembers } = useSelector((state) => state.auth);
//     const { chatRooms, communityChatRooms, messages, chatLoading, chatError } = useSelector((state) => state.chat);
//     const [selectedRoom, setSelectedRoom] = useState(null);
//     const [roomType, setRoomType] = useState('chat');
//     const [messageInput, setMessageInput] = useState('');
//     const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//     const [file, setFile] = useState(null);
//     const [reactionMessageId, setReactionMessageId] = useState(null);
//     const [isCreatingRoom, setIsCreatingRoom] = useState(false);
//     const wsRef = useRef(null);
//     const messagesEndRef = useRef(null);
//     const reconnectAttempts = useRef(0);
//     const maxReconnectAttempts = 3;

//     const currentUser = currentMember || currentTrainer;
//     const isMember = userType === 'member';

//     useEffect(() => {
//         const params = new URLSearchParams(location.search);
//         const roomId = params.get('roomId');
//         const urlRoomType = params.get('roomType');

//         if (roomId && urlRoomType) {
//             const roomList = urlRoomType === 'chat' ? chatRooms : communityChatRooms;
//             const room = roomList.find(r => r.id === parseInt(roomId));
//             if (room) {
//                 setSelectedRoom(room);
//                 setRoomType(urlRoomType);
//             }
//         }
//     }, [location.search, chatRooms, communityChatRooms]);

//     useEffect(() => {
//         if (currentUser) {
//             dispatch(getChatRooms());
//             if (!isMember && currentTrainer) {
//                 dispatch(getAssignedMembers());
//             }
//         }
//     }, [dispatch, currentUser, isMember, currentTrainer]);

//     const isTokenExpired = (token) => {
//         if (!token) return true;
//         try {
//             const decoded = jwtDecode(token);
//             const now = Math.floor(Date.now() / 1000);
//             return decoded.exp < now;
//         } catch (error) {
//             console.error("Error decoding token:", error);
//             return true;
//         }
//     };

//     const getValidToken = async () => {
//         let token = accessToken || localStorage.getItem('accessToken');
//         const refreshTok = refresh || localStorage.getItem('refreshToken');

//         if (isTokenExpired(token) && refreshTok) {
//             console.log("Access token expired, refreshing...");
//             try {
//                 const response = await dispatch(refreshAccessToken({ refresh: refreshTok })).unwrap();
//                 token = response;
//                 localStorage.setItem('accessToken', token);
//             } catch (error) {
//                 console.error("Failed to refresh token:", error);
//                 toast.error("Session expired. Please log in again.");
//                 return null;
//             }
//         }
//         return token;
//     };

//     const handleVirtualRoomSelection = async (room) => {
//         if (!room.isVirtual) {
//             setSelectedRoom(room);
//             setRoomType(room.type);
//             return;
//         }

//         setIsCreatingRoom(true);
//         try {
//             let newRoom;
//             if (isMember) {
//                 newRoom = await dispatch(createChatRoom(room.trainer.id)).unwrap();
//             } else {
//                 newRoom = await dispatch(createChatRoom(room.member.id)).unwrap();
//             }
//             setSelectedRoom(newRoom);
//             setRoomType('chat');
//             dispatch(getChatRooms());
//             toast.success(`Chat started with ${isMember ? room.trainer.first_name : room.member.first_name}!`);
//         } catch (error) {
//             console.error('Failed to create chat room:', error);
//             toast.error(error || 'Failed to start chat');
//         } finally {
//             setIsCreatingRoom(false);
//         }
//     };

//     const connectWebSocket = async () => {
//         if (!selectedRoom || selectedRoom.isVirtual) return;

//         const token = await getValidToken();
//         if (!token) {
//             toast.error("Please log in again to continue chatting.");
//             return;
//         }

//         const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/${roomType}/${selectedRoom.id}/?token=${token}&room_type=${roomType}`;
//         wsRef.current = new WebSocket(wsUrl);

//         wsRef.current.onopen = () => {
//             console.log(`WebSocket connected for ${roomType} room:`, selectedRoom.id);
//             reconnectAttempts.current = 0;
//             toast.success('Chat connected!');
//             dispatch(getMessages({ roomId: selectedRoom.id, roomType }))
//                 .unwrap()
//                 .catch((error) => {
//                     toast.error(error || 'Failed to load messages');
//                 });
//         };

//         wsRef.current.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             console.log('Received WebSocket message:', data);
//             if (data.type === 'error') {
//                 toast.error(data.message);
//                 return;
//             }
//             if (data.type === 'chat_message') {
//                 dispatch(addMessage({
//                     roomId: selectedRoom.id,
//                     roomType,
//                     message: {
//                         id: data.message_id,
//                         [roomType === 'chat' ? 'chat_room' : 'community_chat_room']: selectedRoom,
//                         sender: data.sender,
//                         content: data.message,
//                         file_url: data.file_url,
//                         file_type: data.file_type, // Added to store file type
//                         timestamp: data.timestamp,
//                         reactions: data.reactions || [],
//                     },
//                 }));
//             } else if (data.type === 'reaction_update') {
//                 dispatch(addMessage({
//                     roomId: selectedRoom.id,
//                     roomType,
//                     message: {
//                         id: data.message_id,
//                         reactions: data.reactions,
//                     },
//                 }));
//             }
//         };

//         wsRef.current.onclose = (event) => {
//             console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
//             if (reconnectAttempts.current < maxReconnectAttempts) {
//                 reconnectAttempts.current += 1;
//                 console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
//                 setTimeout(connectWebSocket, 3000);
//             } else {
//                 toast.error('Unable to connect to chat server after multiple attempts.');
//             }
//         };

//         wsRef.current.onerror = (error) => {
//             console.error('WebSocket error:', error);
//             toast.error('Failed to connect to chat server');
//         };
//     };

//     useEffect(() => {
//         if (selectedRoom && !selectedRoom.isVirtual) {
//             dispatch(getMessages({ roomId: selectedRoom.id, roomType }))
//                 .unwrap()
//                 .catch((error) => {
//                     toast.error(error || 'Failed to load messages');
//                 });
//             connectWebSocket();
//         }
//         return () => {
//             if (wsRef.current) {
//                 wsRef.current.close(1000, 'Component unmounting');
//             }
//         };
//     }, [dispatch, selectedRoom, roomType]);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [messages]);

//     const handleFileChange = (e) => {
//         const selectedFile = e.target.files[0];
//         if (selectedFile) {
//             // Validate file type to ensure it's an image
//             const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
//             if (!validImageTypes.includes(selectedFile.type)) {
//                 toast.error('Please select a valid image file (JPEG, PNG, GIF).');
//                 return;
//             }
//             console.log('Selected file:', selectedFile.name, selectedFile.type, selectedFile.size);
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setFile({
//                     data: reader.result,
//                     name: selectedFile.name,
//                     type: selectedFile.type, // Store file type
//                 });
//                 console.log('File read as base64:', reader.result.slice(0, 50) + '...');
//             };
//             reader.readAsDataURL(selectedFile);
//         }
//     };

//     const handleSendMessage = async (e) => {
//         e.preventDefault();
//         if (!messageInput.trim() && !file) {
//             toast.error('Please enter a message or attach an image.');
//             return;
//         }

//         if (selectedRoom?.isVirtual) {
//             await handleVirtualRoomSelection(selectedRoom);
//             return;
//         }

//         if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//             const messageData = {
//                 type: 'chat_message',
//                 message: messageInput,
//                 file: file?.data || null,
//                 file_name: file?.name || null,
//                 file_type: file?.type || null, // Include file type
//             };
//             console.log('Sending WebSocket message:', messageData);
//             wsRef.current.send(JSON.stringify(messageData));
//             setMessageInput('');
//             setFile(null);
//         } else {
//             toast.error('Chat is disconnected. Trying to reconnect...');
//         }
//     };

//     const handleEmojiSelect = (emojiObject) => {
//         setMessageInput(messageInput + emojiObject.emoji);
//         setShowEmojiPicker(false);
//     };

//     const handleAddReaction = (messageId, emojiObject) => {
//         if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//             wsRef.current.send(
//                 JSON.stringify({
//                     type: 'reaction',
//                     message_id: messageId,
//                     reaction: emojiObject.emoji,
//                 })
//             );
//             setReactionMessageId(null);
//         } else {
//             toast.error('Chat is disconnected. Cannot add reaction.');
//         }
//     };

//     const renderChatRooms = () => {
//         const allRooms = [
//             ...chatRooms.map(room => ({ ...room, type: 'chat' })),
//             ...communityChatRooms.map(room => ({ ...room, type: 'community' }))
//         ];

//         let oneToOneChats = [];
//         if (isMember && currentMember?.assigned_trainer) {
//             const existingRoom = chatRooms.find(room => room.trainer?.id === currentMember.assigned_trainer.id);
//             if (existingRoom) {
//                 oneToOneChats = [{ ...existingRoom, type: 'chat' }];
//             } else {
//                 oneToOneChats = [{
//                     id: `virtual-trainer-${currentMember.assigned_trainer.id}`,
//                     type: 'chat',
//                     trainer: currentMember.assigned_trainer,
//                     member: currentMember,
//                     isVirtual: true
//                 }];
//             }
//         } else if (!isMember && assignedMembers && assignedMembers.length > 0) {
//             oneToOneChats = assignedMembers.map(member => {
//                 const existingRoom = chatRooms.find(room => room.member && room.member.id === member.id);
//                 if (existingRoom) {
//                     return { ...existingRoom, type: 'chat' };
//                 } else {
//                     return {
//                         id: `virtual-${member.id}`,
//                         type: 'chat',
//                         member: member,
//                         trainer: currentTrainer,
//                         isVirtual: true
//                     };
//                 }
//             });
//         }

//         const groupChats = allRooms.filter(room => room.type === 'community');

//         if (isMember && !currentMember?.assigned_trainer) {
//             return (
//                 <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px', height: '100%' }}>
//                     <Card.Body>
//                         <h5 className="text-white">Chat with Trainer</h5>
//                         <p className="text-white">No trainer assigned.</p>
//                     </Card.Body>
//                 </Card>
//             );
//         }

//         return (
//             <div style={{ height: '100%' }}>
//                 <h5 className="text-white mb-3">Chats</h5>
//                 <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
//                     {oneToOneChats.length > 0 && (
//                         <>
//                             <h6 className="text-white-50 mb-2">
//                                 {isMember ? 'Chat with Trainer' : 'Assigned Members'}
//                             </h6>
//                             <ListGroup className="mb-3">
//                                 {oneToOneChats.map((room) => (
//                                     <ListGroup.Item
//                                         key={`${room.type}-${room.id}`}
//                                         action
//                                         onClick={() => handleVirtualRoomSelection(room)}
//                                         style={{
//                                             backgroundColor: selectedRoom?.id === room.id && roomType === room.type ? '#1a2a44' : '#101c36',
//                                             color: 'white',
//                                             border: '1px solid #1a2235',
//                                             borderRadius: '8px',
//                                             marginBottom: '8px',
//                                             padding: '15px',
//                                             cursor: 'pointer',
//                                             transition: 'all 0.2s ease'
//                                         }}
//                                         onMouseEnter={(e) => {
//                                             if (selectedRoom?.id !== room.id || roomType !== room.type) {
//                                                 e.target.style.backgroundColor = '#1a2a44';
//                                             }
//                                         }}
//                                         onMouseLeave={(e) => {
//                                             if (selectedRoom?.id !== room.id || roomType !== room.type) {
//                                                 e.target.style.backgroundColor = '#101c36';
//                                             }
//                                         }}
//                                     >
//                                         <div className="d-flex align-items-center">
//                                             <div
//                                                 style={{
//                                                     width: '40px',
//                                                     height: '40px',
//                                                     borderRadius: '50%',
//                                                     backgroundColor: '#7747ff',
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     justifyContent: 'center',
//                                                     marginRight: '12px',
//                                                     fontSize: '16px',
//                                                     fontWeight: 'bold'
//                                                 }}
//                                             >
//                                                 {room.type === 'chat'
//                                                     ? (isMember ? room.trainer?.first_name?.charAt(0)?.toUpperCase() : room.member?.first_name?.charAt(0)?.toUpperCase())
//                                                     : room.name?.charAt(0)?.toUpperCase()}
//                                             </div>
//                                             <div>
//                                                 <div style={{ fontWeight: '500', fontSize: '16px' }}>
//                                                     {room.type === 'chat'
//                                                         ? (isMember
//                                                             ? `${room.trainer?.first_name} ${room.trainer?.last_name}`
//                                                             : `${room.member?.first_name} ${room.member?.last_name}`)
//                                                         : room.name}
//                                                 </div>
//                                                 <div style={{ fontSize: '12px', opacity: '0.7' }}>
//                                                     {room.type === 'chat'
//                                                         ? (isMember ? 'Trainer' : 'Member')
//                                                         : 'Community Chat'}
//                                                     {room.isVirtual && ' (Start Chat)'}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </ListGroup.Item>
//                                 ))}
//                             </ListGroup>
//                         </>
//                     )}
//                     {groupChats.length > 0 && (
//                         <>
//                             <h6 className="text-white-50 mb-2">Group Chats</h6>
//                             <ListGroup>
//                                 {groupChats.map((room) => (
//                                     <ListGroup.Item
//                                         key={`${room.type}-${room.id}`}
//                                         action
//                                         onClick={() => handleVirtualRoomSelection(room)}
//                                         style={{
//                                             backgroundColor: selectedRoom?.id === room.id && roomType === room.type ? '#1a2a44' : '#101c36',
//                                             color: 'white',
//                                             border: '1px solid #1a2235',
//                                             borderRadius: '8px',
//                                             marginBottom: '8px',
//                                             padding: '15px',
//                                             cursor: 'pointer',
//                                             transition: 'all 0.2s ease'
//                                         }}
//                                         onMouseEnter={(e) => {
//                                             if (selectedRoom?.id !== room.id || roomType !== room.type) {
//                                                 e.target.style.backgroundColor = '#1a2a44';
//                                             }
//                                         }}
//                                         onMouseLeave={(e) => {
//                                             if (selectedRoom?.id !== room.id || roomType !== room.type) {
//                                                 e.target.style.backgroundColor = '#101c36';
//                                             }
//                                         }}
//                                     >
//                                         <div className="d-flex align-items-center">
//                                             <div
//                                                 style={{
//                                                     width: '40px',
//                                                     height: '40px',
//                                                     borderRadius: '50%',
//                                                     backgroundColor: '#7747ff',
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     justifyContent: 'center',
//                                                     marginRight: '12px',
//                                                     fontSize: '16px',
//                                                     fontWeight: 'bold'
//                                                 }}
//                                             >
//                                                 {room.name.charAt(0).toUpperCase()}
//                                             </div>
//                                             <div>
//                                                 <div style={{ fontWeight: '500', fontSize: '16px' }}>
//                                                     {room.name}
//                                                 </div>
//                                                 <div style={{ fontSize: '12px', opacity: '0.7' }}>
//                                                     Community Chat
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </ListGroup.Item>
//                                 ))}
//                             </ListGroup>
//                         </>
//                     )}
//                     {oneToOneChats.length === 0 && groupChats.length === 0 && (
//                         <p className="text-white">
//                             {isMember ? 'No chats available.' : 'No assigned members.'}
//                         </p>
//                     )}
//                 </div>
//             </div>
//         );
//     };

//     const renderMessages = () => {
//         if (!selectedRoom) {
//             return null;
//         }

//         if (selectedRoom.isVirtual) {
//             return (
//                 <div>
//                     <div style={{
//                         height: '500px',
//                         width: '800px',
//                         overflowY: 'auto',
//                         backgroundColor: '#1a2a44',
//                         padding: '15px',
//                         borderRadius: '10px',
//                         border: '1px solid #2a3b6a'
//                     }}>
//                         <div className="text-center text-white" style={{ paddingTop: '200px' }}>
//                             {isCreatingRoom ? (
//                                 <div>
//                                     <Spinner animation="border" variant="light" className="mb-3" />
//                                     <p>Creating chat room...</p>
//                                 </div>
//                             ) : (
//                                 <p>Click "Send" to start a conversation with {selectedRoom.member?.first_name}!</p>
//                             )}
//                         </div>
//                     </div>
//                     <Form onSubmit={handleSendMessage} className="mt-3">
//                         <div className="d-flex gap-2 align-items-center">
//                             <Form.Control
//                                 type="text"
//                                 value={messageInput}
//                                 onChange={(e) => setMessageInput(e.target.value)}
//                                 placeholder="Type your message..."
//                                 disabled={isCreatingRoom}
//                                 style={{
//                                     backgroundColor: '#101c36',
//                                     color: 'white',
//                                     border: '1px solid #1a2235',
//                                     borderRadius: '25px',
//                                     padding: '10px 20px'
//                                 }}
//                             />
//                             <Button
//                                 variant="link"
//                                 onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//                                 disabled={isCreatingRoom}
//                                 style={{ padding: 0, color: '#0dcaf0', fontSize: '1.2em' }}
//                             >
//                                 😊
//                             </Button>
//                             <Form.Control
//                                 type="file"
//                                 accept="image/jpeg,image/jpg,image/png,image/gif" // Restrict to image types
//                                 onChange={handleFileChange}
//                                 disabled={isCreatingRoom}
//                                 style={{
//                                     width: 'auto',
//                                     backgroundColor: '#101c36',
//                                     color: 'white',
//                                     border: '1px solid #1a2235',
//                                     borderRadius: '8px',
//                                     padding: '5px'
//                                 }}
//                             />
//                             <Button
//                                 type="submit"
//                                 disabled={isCreatingRoom}
//                                 style={{
//                                     backgroundColor: '#7747ff',
//                                     border: 'none',
//                                     borderRadius: '50%',
//                                     width: '45px',
//                                     height: '45px',
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     justifyContent: 'center'
//                                 }}
//                             >
//                                 {isCreatingRoom ? <Spinner animation="border" size="sm" /> : '➤'}
//                             </Button>
//                         </div>
//                     </Form>
//                     {showEmojiPicker && (
//                         <div style={{ position: 'absolute', zIndex: 1000, bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}>
//                             <EmojiPicker onEmojiClick={handleEmojiSelect} />
//                         </div>
//                     )}
//                 </div>
//             );
//         }

//         return (
//             <div>
//                 <div style={{
//                     height: '500px',
//                     width: '800px',
//                     overflowY: 'auto',
//                     backgroundColor: '#1a2a44',
//                     padding: '15px',
//                     borderRadius: '10px',
//                     border: '1px solid #2a3b6a'
//                 }}>
//                     {messages[`${roomType}-${selectedRoom.id}`]?.length === 0 ? (
//                         <div className="text-center text-white" style={{ paddingTop: '200px' }}>
//                             <p>No messages yet. Start the conversation!</p>
//                         </div>
//                     ) : (
//                         messages[`${roomType}-${selectedRoom.id}`]?.map((msg) => (
//                             <div
//                                 key={msg.id}
//                                 style={{
//                                     textAlign: msg.sender.id === currentUser.id ? 'right' : 'left',
//                                     marginBottom: '15px',
//                                 }}
//                             >
//                                 <div
//                                     style={{
//                                         display: 'inline-block',
//                                         backgroundColor: msg.sender.id === currentUser.id ? '#007bff' : '#343a40',
//                                         color: 'white',
//                                         padding: '12px 16px',
//                                         borderRadius: '18px',
//                                         maxWidth: '70%',
//                                         wordWrap: 'break-word',
//                                         boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//                                     }}
//                                 >
//                                     <div style={{ fontWeight: '500', marginBottom: '4px' }}>
//                                         {msg.sender.first_name}
//                                     </div>
//                                     <div>{msg.content}</div>
//                                     {msg.file_url && (
//                                         <div style={{ marginTop: '8px' }}>
//                                             {msg.file_type && msg.file_type.startsWith('image/') ? (
//                                                 <img
//                                                     src={msg.file_url}
//                                                     alt="attachment"
//                                                     style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }}
//                                                     onClick={() => window.open(msg.file_url, '_blank')}
//                                                 />
//                                             ) : (
//                                                 <a href={msg.file_url} download style={{ color: '#0dcaf0' }}>
//                                                     Download File: {msg.file_name || 'File'}
//                                                 </a>
//                                             )}
//                                         </div>
//                                     )}
//                                     <div style={{
//                                         fontSize: '0.75em',
//                                         opacity: '0.7',
//                                         marginTop: '4px',
//                                         textAlign: msg.sender.id === currentUser.id ? 'right' : 'left'
//                                     }}>
//                                         {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : 'Invalid time'}
//                                     </div>
//                                     <div style={{ marginTop: '8px' }}>
//                                         <Button
//                                             variant="link"
//                                             onClick={() => setReactionMessageId(reactionMessageId === msg.id ? null : msg.id)}
//                                             style={{ padding: 0, color: '#0dcaf0', fontSize: '1em' }}
//                                         >
//                                             😊
//                                         </Button>
//                                     </div>
//                                     {msg.reactions?.length > 0 && (
//                                         <div style={{ marginTop: '4px', fontSize: '0.9em', opacity: '0.8' }}>
//                                             {msg.reactions.map((reaction, index) => (
//                                                 <span key={index} style={{ marginRight: '8px' }}>
//                                                     {reaction.reaction} ({reaction.user.first_name})
//                                                 </span>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                     <div ref={messagesEndRef} />
//                 </div>
//                 <Form onSubmit={handleSendMessage} className="mt-3">
//                     <div className="d-flex gap-2 align-items-center">
//                         <Form.Control
//                             type="text"
//                             value={messageInput}
//                             onChange={(e) => setMessageInput(e.target.value)}
//                             placeholder="Type your message..."
//                             style={{
//                                 backgroundColor: '#101c36',
//                                 color: 'white',
//                                 border: '1px solid #1a2235',
//                                 borderRadius: '25px',
//                                 padding: '10px 20px'
//                             }}
//                         />
//                         <Button
//                             variant="link"
//                             onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//                             style={{ padding: 0, color: '#0dcaf0', fontSize: '1.2em' }}
//                         >
//                             😊
//                         </Button>
//                         <Form.Control
//                             type="file"
//                             accept="image/jpeg,image/jpg,image/png,image/gif" // Restrict to image types
//                             onChange={handleFileChange}
//                             style={{
//                                 width: 'auto',
//                                 backgroundColor: '#101c36',
//                                 color: 'white',
//                                 border: '1px solid #1a2235',
//                                 borderRadius: '8px',
//                                 padding: '5px'
//                             }}
//                         />
//                         <Button
//                             type="submit"
//                             style={{
//                                 backgroundColor: '#7747ff',
//                                 border: 'none',
//                                 borderRadius: '50%',
//                                 width: '45px',
//                                 height: '45px',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'center'
//                             }}
//                         >
//                             ➤
//                         </Button>
//                     </div>
//                 </Form>
//                 {showEmojiPicker && (
//                     <div style={{ position: 'absolute', zIndex: 1000, bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}>
//                         <EmojiPicker onEmojiClick={handleEmojiSelect} />
//                     </div>
//                 )}
//                 {reactionMessageId && (
//                     <div style={{ position: 'absolute', zIndex: 1000, bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}>
//                         <EmojiPicker onEmojiClick={(emojiObject) => handleAddReaction(reactionMessageId, emojiObject)} />
//                     </div>
//                 )}
//             </div>
//         );
//     };

//     return (
//         <div style={{ height: '100%' }}>
//             <style>
//                 {`
//                     .chat-container {
//                         display: flex;
//                         gap: 20px;
//                         height: 650px;
//                     }
//                     .chat-sidebar {
//                         width: 350px;
//                         flex-shrink: 0;
//                     }
//                     .chat-main {
//                         flex: 1;
//                         min-width: 0;
//                     }
//                     @media (max-width: 768px) {
//                         .chat-container {
//                             flex-direction: column !important;
//                             height: auto !important;
//                             gap: 15px;
//                         }
//                         .chat-sidebar {
//                             width: 100%;
//                             max-height: 300px !important;
//                         }
//                         .chat-main {
//                             width: 100%;
//                             height: 300px !important;
//                         }
//                     }
//                 `}
//             </style>

//             {chatLoading && (
//                 <div className="text-center mb-3">
//                     <Spinner animation="border" variant="light" />
//                 </div>
//             )}

//             {chatError && (
//                 <Alert variant="danger" className="mb-3">
//                     {chatError}
//                 </Alert>
//             )}

//             <div className="chat-container">
//                 <div className="chat-sidebar">
//                     {renderChatRooms()}
//                 </div>
//                 <div className="chat-main">
//                     {renderMessages()}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ChatInterface;



import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Card, ListGroup, Form, Button, Spinner, Alert, Modal, ProgressBar, Badge } from 'react-bootstrap';
import { getChatRooms, getMessages, createChatRoom } from '../../features/chat/chatApi';
import { addMessage } from '../../features/chat/chatSlice';
import { refreshAccessToken, getAssignedMembers } from '../../features/auth/authApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';

const ChatInterface = ({ userType = 'member' }) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { currentMember, currentTrainer, accessToken, refresh, assignedMembers } = useSelector((state) => state.auth);
    const { chatRooms, communityChatRooms, messages, chatLoading, chatError } = useSelector((state) => state.chat);
    
    // Chat state
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomType, setRoomType] = useState('chat');
    const [messageInput, setMessageInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [reactionMessageId, setReactionMessageId] = useState(null);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    
    // File upload state
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    
    // File preview modal state
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [selectedFileForPreview, setSelectedFileForPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    
    // Refs
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 3;

    const currentUser = currentMember || currentTrainer;
    const isMember = userType === 'member';

    // File configuration
    const FILE_SIZE_LIMITS = {
        image: 10,      // 10MB for images
        video: 100,     // 100MB for videos
        audio: 50,      // 50MB for audio
        document: 50,   // 50MB for documents
        archive: 25,    // 25MB for archives
        other: 25       // 25MB for other files
    };

    const SUPPORTED_FILE_TYPES = {
        // Images
        'image/jpeg': 'image', 'image/jpg': 'image', 'image/png': 'image', 
        'image/gif': 'image', 'image/webp': 'image', 'image/bmp': 'image',
        'image/tiff': 'image', 'image/svg+xml': 'image', 'image/ico': 'image',
        
        // Documents
        'application/pdf': 'document', 'application/msword': 'document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
        'application/vnd.ms-excel': 'document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
        'application/vnd.ms-powerpoint': 'document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
        'text/plain': 'document', 'text/csv': 'document', 'text/rtf': 'document',
        
        // Archives
        'application/zip': 'archive', 'application/x-zip-compressed': 'archive',
        'application/x-rar-compressed': 'archive', 'application/x-7z-compressed': 'archive',
        'application/gzip': 'archive', 'application/x-tar': 'archive',
        
        // Audio
        'audio/mpeg': 'audio', 'audio/wav': 'audio', 'audio/ogg': 'audio',
        'audio/mp4': 'audio', 'audio/aac': 'audio', 'audio/flac': 'audio',
        'audio/x-ms-wma': 'audio',
        
        // Video
        'video/mp4': 'video', 'video/mpeg': 'video', 'video/quicktime': 'video',
        'video/x-msvideo': 'video', 'video/webm': 'video', 'video/x-flv': 'video',
        'video/x-ms-wmv': 'video',
        
        // Other
        'application/json': 'other', 'application/xml': 'other', 'text/xml': 'other',
        'text/html': 'other', 'application/javascript': 'other', 'text/css': 'other'
    };

    // Utility functions
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType) => {
        if (!fileType) return '📄';
        
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.startsWith('video/')) return '🎥';
        if (fileType.startsWith('audio/')) return '🎵';
        if (fileType === 'application/pdf') return '📕';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📋';
        if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️';
        if (fileType === 'text/plain') return '📄';
        if (fileType === 'text/csv') return '📈';
        if (fileType === 'application/json') return '📄';
        if (fileType === 'text/html') return '🌐';
        
        return '📎';
    };

    const getFileCategory = (fileType) => {
        return SUPPORTED_FILE_TYPES[fileType] || 'other';
    };

    // Cloudinary upload function
    const uploadToCloudinary = async (file, fileCategory) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', fileCategory);

    try {
        const token = await getValidToken();
        
        if (!token) {
            throw new Error('Authentication failed. Please log in again.');
        }

        console.log('Uploading file to backend:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            category: fileCategory
        });

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/upload-file/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const responseText = await response.text();
        console.log('Upload response status:', response.status);
        console.log('Upload response:', responseText);

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} - ${responseText}`);
        }

        const result = JSON.parse(responseText);
        console.log('File uploaded successfully:', result);
        
        return {
            url: result.url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes
        };
        
    } catch (error) {
        console.error('File upload error:', error);
        throw error;
    }
};

    // File validation and processing
    const validateFile = (selectedFile) => {
        const fileCategory = SUPPORTED_FILE_TYPES[selectedFile.type];
        
        if (!fileCategory) {
            throw new Error(`File type "${selectedFile.type}" is not supported. Please upload images, documents, videos, audio files, or archives.`);
        }

        const maxSizeBytes = FILE_SIZE_LIMITS[fileCategory] * 1024 * 1024;
        if (selectedFile.size > maxSizeBytes) {
            throw new Error(`File size exceeds the ${FILE_SIZE_LIMITS[fileCategory]}MB limit for ${fileCategory} files.`);
        }

        return fileCategory;
    };

    const createFilePreview = async (selectedFile, fileCategory) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onloadstart = () => setUploadProgress(0);
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 50); // Reserve 50% for upload
                    setUploadProgress(progress);
                }
            };
            
            reader.onloadend = () => {
                setUploadProgress(50);
                const preview = {
                    file: selectedFile,
                    name: selectedFile.name,
                    type: selectedFile.type,
                    size: selectedFile.size,
                    category: fileCategory
                };

                if (fileCategory === 'image') {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        const maxSize = 150;
                        let { width, height } = img;
                        
                        if (width > height) {
                            if (width > maxSize) {
                                height = (height * maxSize) / width;
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width = (width * maxSize) / height;
                                height = maxSize;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        preview.thumbnail = canvas.toDataURL();
                        resolve(preview);
                    };
                    img.onerror = () => resolve(preview);
                    img.src = reader.result;
                } else {
                    resolve(preview);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(selectedFile);
        });
    };

    // Token management
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
                localStorage.setItem('accessToken', token);
            } catch (error) {
                console.error("Failed to refresh token:", error);
                toast.error("Session expired. Please log in again.");
                return null;
            }
        }
        return token;
    };

    // File handling
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const fileCategory = validateFile(selectedFile);
            const preview = await createFilePreview(selectedFile, fileCategory);
            
            setFile(preview);
            setFilePreview(preview);
            
            console.log('File selected:', selectedFile.name, selectedFile.type, formatFileSize(selectedFile.size));
            toast.success(`File "${selectedFile.name}" ready to send`);
            
        } catch (error) {
            console.error('File validation error:', error);
            toast.error(error.message);
            e.target.value = '';
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const removeFile = () => {
        setFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openFilePreview = async (fileUrl, fileName, fileType) => {
        setPreviewLoading(true);
        setSelectedFileForPreview({ url: fileUrl, name: fileName, type: fileType });
        setShowFilePreview(true);
        setPreviewLoading(false);
    };

    // Room management
    const handleVirtualRoomSelection = async (room) => {
        if (!room.isVirtual) {
            setSelectedRoom(room);
            setRoomType(room.type);
            return;
        }

        setIsCreatingRoom(true);
        try {
            let newRoom;
            if (isMember) {
                newRoom = await dispatch(createChatRoom(room.trainer.id)).unwrap();
            } else {
                newRoom = await dispatch(createChatRoom(room.member.id)).unwrap();
            }
            setSelectedRoom(newRoom);
            setRoomType('chat');
            dispatch(getChatRooms());
            toast.success(`Chat started with ${isMember ? room.trainer.first_name : room.member.first_name}!`);
        } catch (error) {
            console.error('Failed to create chat room:', error);
            toast.error(error || 'Failed to start chat');
        } finally {
            setIsCreatingRoom(false);
        }
    };

    // WebSocket management
    const connectWebSocket = async () => {
        if (!selectedRoom || selectedRoom.isVirtual) return;

        const token = await getValidToken();
        if (!token) {
            toast.error("Please log in again to continue chatting.");
            return;
        }

        const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/chat/${selectedRoom.id}/?token=${token}&room_type=${roomType}`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log(`WebSocket connected for ${roomType} room:`, selectedRoom.id);
            reconnectAttempts.current = 0;
            toast.success('Chat connected!');
            dispatch(getMessages({ roomId: selectedRoom.id, roomType }))
                .unwrap()
                .catch((error) => {
                    toast.error(error || 'Failed to load messages');
                });
        };

        // In the connectWebSocket function, fix the onmessage handler:
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
            
            if (data.type === 'error') {
                toast.error(data.message);
                return;
            }
            
            if (data.type === 'chat_message') {
                // CRITICAL FIX: Ensure all file fields are properly preserved
                const message = {
                    id: data.message_id,
                    [roomType === 'chat' ? 'chat_room' : 'community_chat_room']: selectedRoom,
                    sender: data.sender,
                    content: data.message || '',
                    // IMPORTANT: Explicitly preserve all file-related fields
                    file_url: data.file_url || null,
                    file_type: data.file_type || null,
                    file_name: data.file_name || null,
                    file_size: data.file_size || null,
                    timestamp: data.timestamp,
                    reactions: data.reactions || [],
                };
                
                // Debug logging
                if (message.file_url) {
                    console.log('✅ WebSocket message with file received:', {
                        messageId: message.id,
                        fileName: message.file_name,
                        fileType: message.file_type,
                        fileUrl: message.file_url
                    });
                }
                
                dispatch(addMessage({
                    roomId: selectedRoom.id,
                    roomType,
                    message: message,
                }));
            } else if (data.type === 'reaction_update') {
                dispatch(addMessage({
                    roomId: selectedRoom.id,
                    roomType,
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

    // Message handling
    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!messageInput.trim() && !file) {
            toast.error('Please enter a message or attach a file.');
            return;
        }

        if (selectedRoom?.isVirtual) {
            await handleVirtualRoomSelection(selectedRoom);
            return;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            let fileData = null;
            
            // Upload file to Cloudinary if present
            if (file && file.file) {
                try {
                    setIsUploading(true);
                    setUploadProgress(50); // File read progress was 50%
                    
                    const uploadResult = await uploadToCloudinary(file.file, file.category);
                    
                    setUploadProgress(100);
                    
                    fileData = {
                        url: uploadResult.url,
                        publicId: uploadResult.publicId,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        category: file.category
                    };
                    
                    console.log('File uploaded to Cloudinary:', uploadResult);
                } catch (error) {
                    console.error('File upload failed:', error);
                    toast.error('Failed to upload file. Please try again.');
                    setIsUploading(false);
                    setUploadProgress(0);
                    return;
                }
            }
            
            const messageData = {
                type: 'chat_message',
                message: messageInput,
                file_data: fileData,
            };
            
            console.log('Sending WebSocket message:', messageData.type, fileData ? `with file: ${fileData.name}` : 'text only');
            wsRef.current.send(JSON.stringify(messageData));
            
            setMessageInput('');
            removeFile();
            setIsUploading(false);
            setUploadProgress(0);
            
        } else {
            toast.error('Chat is disconnected. Trying to reconnect...');
            connectWebSocket();
        }
    };

    const handleEmojiSelect = (emojiObject) => {
        setMessageInput(messageInput + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleAddReaction = (messageId, emojiObject) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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

    // Effects
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const roomId = params.get('roomId');
        const urlRoomType = params.get('roomType');

        if (roomId && urlRoomType) {
            const roomList = urlRoomType === 'chat' ? chatRooms : communityChatRooms;
            const room = roomList.find(r => r.id === parseInt(roomId));
            if (room) {
                setSelectedRoom(room);
                setRoomType(urlRoomType);
            }
        }
    }, [location.search, chatRooms, communityChatRooms]);

    useEffect(() => {
        if (currentUser) {
            dispatch(getChatRooms());
            if (!isMember && currentTrainer) {
                dispatch(getAssignedMembers());
            }
        }
    }, [dispatch, currentUser, isMember, currentTrainer]);

    useEffect(() => {
        if (selectedRoom && !selectedRoom.isVirtual) {
            dispatch(getMessages({ roomId: selectedRoom.id, roomType }))
                .unwrap()
                .catch((error) => {
                    toast.error(error || 'Failed to load messages');
                });
            connectWebSocket();
        }
        return () => {
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting');
            }
        };
    }, [dispatch, selectedRoom, roomType]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Render functions
    const renderFilePreview = () => {
        if (!filePreview) return null;

        return (
            <div style={{
                border: '2px solid #7747ff',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
                backgroundColor: '#1a2a44'
            }}>
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        {filePreview.category === 'image' && filePreview.thumbnail ? (
                            <img 
                                src={filePreview.thumbnail} 
                                alt="Preview" 
                                style={{ width: '50px', height: '50px', borderRadius: '6px', marginRight: '12px', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: '#7747ff',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                fontSize: '24px'
                            }}>
                                {getFileIcon(filePreview.type)}
                            </div>
                        )}
                        <div>
                            <div className="text-white" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
                                {filePreview.name}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <Badge bg="secondary" style={{ fontSize: '10px' }}>
                                    {filePreview.category.toUpperCase()}
                                </Badge>
                                <span className="text-white-50" style={{ fontSize: '12px' }}>
                                    {formatFileSize(filePreview.size)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={removeFile}
                        style={{ minWidth: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        ✕
                    </Button>
                </div>
                {(isUploading || uploadProgress > 0) && (
                    <ProgressBar 
                        now={uploadProgress} 
                        style={{ marginTop: '8px', height: '4px' }}
                        variant="info"
                    />
                )}
            </div>
        );
    };

    // FIXED: Enhanced renderFileMessage function to properly handle file display
const renderFileMessage = (msg) => {
    // CRITICAL: Check for file_url existence first
    if (!msg.file_url) {
        console.log(`Message ${msg.id}: No file URL found`);
        return null;
    }

    console.log(`Rendering file for message ${msg.id}:`, {
        file_url: msg.file_url,
        file_type: msg.file_type,
        file_name: msg.file_name,
        file_size: msg.file_size
    });

    const isImage = msg.file_type && msg.file_type.startsWith('image/');
    const isVideo = msg.file_type && msg.file_type.startsWith('video/');
    const isAudio = msg.file_type && msg.file_type.startsWith('audio/');

    return (
        <div style={{ marginTop: '10px' }}>
            {isImage ? (
                <div>
                    <img
                        src={msg.file_url}
                        alt={msg.file_name || "Image"}
                        style={{ 
                            maxWidth: '250px', 
                            maxHeight: '200px',
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            objectFit: 'cover',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'block'
                        }}
                        onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
                        onLoad={(e) => {
                            console.log(`✅ Image loaded successfully: ${msg.file_name}`);
                        }}
                        onError={(e) => {
                            console.error(`❌ Image failed to load: ${msg.file_url}`);
                            console.error('Error details:', e.target.src);
                            // Show fallback file icon instead of hiding completely
                            e.target.style.display = 'none';
                            const fallbackDiv = e.target.nextElementSibling;
                            if (fallbackDiv) {
                                fallbackDiv.style.display = 'block';
                            }
                        }}
                    />
                    {/* Fallback for failed image loads */}
                    <div 
                        style={{ 
                            display: 'none',
                            padding: '12px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            maxWidth: '250px'
                        }}
                        onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
                    >
                        <div className="d-flex align-items-center">
                            <span style={{ fontSize: '24px', marginRight: '12px' }}>🖼️</span>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '500', color: '#ff6b6b' }}>
                                    {msg.file_name || 'Image'} (Failed to load)
                                </div>
                                <div style={{ fontSize: '11px', opacity: '0.7' }}>
                                    Click to view original
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : isVideo ? (
                <div
                    style={{
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        maxWidth: '250px',
                    }}
                    onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
                >
                    <div className="d-flex align-items-center">
                        <span style={{ fontSize: '24px', marginRight: '12px' }}>🎥</span>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>
                                {msg.file_name || 'Video'}
                            </div>
                            <div style={{ fontSize: '11px', opacity: '0.7' }}>
                                {msg.file_size ? formatFileSize(msg.file_size) : 'Click to play'}
                            </div>
                        </div>
                    </div>
                </div>
            ) : isAudio ? (
                <div
                    style={{
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        maxWidth: '250px',
                    }}
                    onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
                >
                    <div className="d-flex align-items-center">
                        <span style={{ fontSize: '24px', marginRight: '12px' }}>🎵</span>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>
                                {msg.file_name || 'Audio'}
                            </div>
                            <div style={{ fontSize: '11px', opacity: '0.7' }}>
                                {msg.file_size ? formatFileSize(msg.file_size) : 'Click to play'}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Generic file display for documents and other file types
                <div
                    style={{
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        maxWidth: '250px',
                        transition: 'background-color 0.2s'
                    }}
                    onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                >
                    <div className="d-flex align-items-center">
                        <span style={{ fontSize: '24px', marginRight: '12px' }}>
                            {getFileIcon(msg.file_type)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                                fontSize: '13px', 
                                fontWeight: '500',
                                marginBottom: '2px',
                                wordBreak: 'break-all'
                            }}>
                                {msg.file_name || 'File'}
                            </div>
                            <div style={{ fontSize: '11px', opacity: '0.7' }}>
                                {msg.file_size ? formatFileSize(msg.file_size) : 'Click to view'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

    // const renderFileMessage = (msg) => {
    //     if (!msg.file_url) return null;

    //     const isImage = msg.file_type && msg.file_type.startsWith('image/');
    //     const isVideo = msg.file_type && msg.file_type.startsWith('video/');
    //     const isAudio = msg.file_type && msg.file_type.startsWith('audio/');

    //     return (
    //         <div style={{ marginTop: '10px' }}>
    //             {isImage ? (
    //                 <div>
    //                     <img
    //                         src={msg.file_url}
    //                         alt={msg.file_name || "Image"}
    //                         style={{ 
    //                             maxWidth: '250px', 
    //                             maxHeight: '200px',
    //                             borderRadius: '8px', 
    //                             cursor: 'pointer',
    //                             objectFit: 'cover',
    //                             border: '1px solid rgba(255,255,255,0.1)',
    //                             display: 'block'
    //                         }}
    //                         onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
    //                         onError={(e) => {
    //                             console.error('Image failed to load:', msg.file_url);
    //                             e.target.style.display = 'none';
    //                             e.target.nextElementSibling.style.display = 'block';
    //                         }}
    //                     />
    //                     <div 
    //                         style={{ 
    //                             display: 'none',
    //                             padding: '12px',
    //                             backgroundColor: 'rgba(255,255,255,0.1)',
    //                             borderRadius: '8px',
    //                             cursor: 'pointer',
    //                             maxWidth: '250px'
    //                         }}
    //                         onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
    //                     >
    //                         <div className="d-flex align-items-center">
    //                             <span style={{ fontSize: '24px', marginRight: '12px' }}>🖼️</span>
    //                             <div>
    //                                 <div style={{ fontSize: '13px', fontWeight: '500' }}>
    //                                     {msg.file_name || 'Image'}
    //                                 </div>
    //                                 <div style={{ fontSize: '11px', opacity: '0.7' }}>
    //                                     Click to view
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             ) : isVideo ? (
    //                 <div
    //                     style={{
    //                         border: '1px solid rgba(255,255,255,0.2)',
    //                         borderRadius: '8px',
    //                         padding: '12px',
    //                         backgroundColor: 'rgba(255,255,255,0.1)',
    //                         cursor: 'pointer',
    //                         maxWidth: '250px',
    //                     }}
    //                     onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
    //                 >
    //                     <div className="d-flex align-items-center">
    //                         <span style={{ fontSize: '24px', marginRight: '12px' }}>🎥</span>
    //                         <div>
    //                             <div style={{ fontSize: '13px', fontWeight: '500' }}>
    //                                 {msg.file_name || 'Video'}
    //                             </div>
    //                             <div style={{ fontSize: '11px', opacity: '0.7' }}>
    //                                 Click to play
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             ) : isAudio ? (
    //                 <div
    //                     style={{
    //                         border: '1px solid rgba(255,255,255,0.2)',
    //                         borderRadius: '8px',
    //                         padding: '12px',
    //                         backgroundColor: 'rgba(255,255,255,0.1)',
    //                         cursor: 'pointer',
    //                         maxWidth: '250px',
    //                     }}
    //                     onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
    //                 >
    //                     <div className="d-flex align-items-center">
    //                         <span style={{ fontSize: '24px', marginRight: '12px' }}>🎵</span>
    //                         <div>
    //                             <div style={{ fontSize: '13px', fontWeight: '500' }}>
    //                                 {msg.file_name || 'Audio'}
    //                             </div>
    //                             <div style={{ fontSize: '11px', opacity: '0.7' }}>
    //                                 Click to play
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             ) : (
    //                 <div
    //                     style={{
    //                         border: '1px solid rgba(255,255,255,0.2)',
    //                         borderRadius: '8px',
    //                         padding: '12px',
    //                         backgroundColor: 'rgba(255,255,255,0.1)',
    //                         cursor: 'pointer',
    //                         maxWidth: '250px',
    //                         transition: 'background-color 0.2s'
    //                     }}
    //                     onClick={() => openFilePreview(msg.file_url, msg.file_name, msg.file_type)}
    //                     onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
    //                     onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
    //                 >
    //                     <div className="d-flex align-items-center">
    //                         <span style={{ fontSize: '24px', marginRight: '12px' }}>
    //                             {getFileIcon(msg.file_type)}
    //                         </span>
    //                         <div style={{ flex: 1, minWidth: 0 }}>
    //                             <div style={{ 
    //                                 fontSize: '13px', 
    //                                 fontWeight: '500',
    //                                 marginBottom: '2px',
    //                                 wordBreak: 'break-all'
    //                             }}>
    //                                 {msg.file_name || 'File'}
    //                             </div>
    //                             <div style={{ fontSize: '11px', opacity: '0.7' }}>
    //                                 {msg.file_size ? formatFileSize(msg.file_size) : 'Click to view'}
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             )}
    //         </div>
    //     );
    // };

    const renderChatRooms = () => {
        const allRooms = [
            ...chatRooms.map(room => ({ ...room, type: 'chat' })),
            ...communityChatRooms.map(room => ({ ...room, type: 'community' }))
        ];

        let oneToOneChats = [];
        if (isMember && currentMember?.assigned_trainer) {
            const existingRoom = chatRooms.find(room => room.trainer?.id === currentMember.assigned_trainer.id);
            if (existingRoom) {
                oneToOneChats = [{ ...existingRoom, type: 'chat' }];
            } else {
                oneToOneChats = [{
                    id: `virtual-trainer-${currentMember.assigned_trainer.id}`,
                    type: 'chat',
                    trainer: currentMember.assigned_trainer,
                    member: currentMember,
                    isVirtual: true
                }];
            }
        } else if (!isMember && assignedMembers && assignedMembers.length > 0) {
            oneToOneChats = assignedMembers.map(member => {
                const existingRoom = chatRooms.find(room => room.member && room.member.id === member.id);
                if (existingRoom) {
                    return { ...existingRoom, type: 'chat' };
                } else {
                    return {
                        id: `virtual-${member.id}`,
                        type: 'chat',
                        member: member,
                        trainer: currentTrainer,
                        isVirtual: true
                    };
                }
            });
        }

        const groupChats = allRooms.filter(room => room.type === 'community');

        if (isMember && !currentMember?.assigned_trainer) {
            return (
                <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px', height: '100%' }}>
                    <Card.Body className="d-flex align-items-center justify-content-center">
                        <div className="text-center">
                            <h5 className="text-white mb-2">Chat with Trainer</h5>
                            <p className="text-white-50">No trainer assigned yet.</p>
                        </div>
                    </Card.Body>
                </Card>
            );
        }

        return (
            <div style={{ height: '100%' }}>
                <h5 className="text-white mb-3">Chats</h5>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {oneToOneChats.length > 0 && (
                        <>
                            <h6 className="text-white-50 mb-2" style={{ fontSize: '14px', fontWeight: '500' }}>
                                {isMember ? 'Chat with Trainer' : 'Assigned Members'}
                            </h6>
                            <ListGroup className="mb-3">
                                {oneToOneChats.map((room) => (
                                    <ListGroup.Item
                                        key={`${room.type}-${room.id}`}
                                        action
                                        onClick={() => handleVirtualRoomSelection(room)}
                                        style={{
                                            backgroundColor: selectedRoom?.id === room.id && roomType === room.type ? '#1a2a44' : '#101c36',
                                            color: 'white',
                                            border: '1px solid #1a2235',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            padding: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
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
                                                    fontWeight: 'bold',
                                                    color: 'white'
                                                }}
                                            >
                                                {room.type === 'chat'
                                                    ? (isMember ? room.trainer?.first_name?.charAt(0)?.toUpperCase() : room.member?.first_name?.charAt(0)?.toUpperCase())
                                                    : room.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '500', fontSize: '15px', marginBottom: '2px' }}>
                                                    {room.type === 'chat'
                                                        ? (isMember
                                                            ? `${room.trainer?.first_name} ${room.trainer?.last_name}`
                                                            : `${room.member?.first_name} ${room.member?.last_name}`)
                                                        : room.name}
                                                </div>
                                                <div style={{ fontSize: '12px', opacity: '0.7' }}>
                                                    {room.type === 'chat'
                                                        ? (isMember ? 'Trainer' : 'Member')
                                                        : 'Community Chat'}
                                                    {room.isVirtual && ' (Start Chat)'}
                                                </div>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>
                    )}
                    
                    {groupChats.length > 0 && (
                        <>
                            <h6 className="text-white-50 mb-2" style={{ fontSize: '14px', fontWeight: '500' }}>
                                Group Chats
                            </h6>
                            <ListGroup>
                                {groupChats.map((room) => (
                                    <ListGroup.Item
                                        key={`${room.type}-${room.id}`}
                                        action
                                        onClick={() => handleVirtualRoomSelection(room)}
                                        style={{
                                            backgroundColor: selectedRoom?.id === room.id && roomType === room.type ? '#1a2a44' : '#101c36',
                                            color: 'white',
                                            border: '1px solid #1a2235',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            padding: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div className="d-flex align-items-center">
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#28a745',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    color: 'white'
                                                }}
                                            >
                                                {room.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '500', fontSize: '15px', marginBottom: '2px' }}>
                                                    {room.name}
                                                </div>
                                                <div style={{ fontSize: '12px', opacity: '0.7' }}>
                                                    Community Chat
                                                </div>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>
                    )}
                    
                    {oneToOneChats.length === 0 && groupChats.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-white-50">
                                {isMember ? 'No chats available.' : 'No assigned members.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // const renderMessages = () => {
    //     if (!selectedRoom) {
    //         return (
    //             <div style={{
    //                 height: '500px',
    //                 width: '100%',
    //                 display: 'flex',
    //                 alignItems: 'center',
    //                 justifyContent: 'center',
    //                 backgroundColor: '#1a2a44',
    //                 borderRadius: '10px',
    //                 border: '1px solid #2a3b6a'
    //             }}>
    //                 <div className="text-center text-white-50">
    //                     <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
    //                     <p>Select a chat to start messaging</p>
    //                 </div>
    //             </div>
    //         );
    //     }

    //     if (selectedRoom.isVirtual) {
    //         return (
    //             <div>
    //                 <div style={{
    //                     height: '500px',
    //                     width: '100%',
    //                     overflowY: 'auto',
    //                     backgroundColor: '#1a2a44',
    //                     padding: '20px',
    //                     borderRadius: '10px',
    //                     border: '1px solid #2a3b6a',
    //                     display: 'flex',
    //                     alignItems: 'center',
    //                     justifyContent: 'center'
    //                 }}>
    //                     <div className="text-center text-white">
    //                         {isCreatingRoom ? (
    //                             <div>
    //                                 <Spinner animation="border" variant="light" className="mb-3" />
    //                                 <p>Creating chat room...</p>
    //                             </div>
    //                         ) : (
    //                             <div>
    //                                 <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
    //                                 <p>Send a message to start your conversation!</p>
    //                             </div>
    //                         )}
    //                     </div>
    //                 </div>
    //                 {renderFilePreview()}
    const renderMessages = () => {
    if (!selectedRoom) {
        return (
            <div style={{
                height: '500px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a2a44',
                borderRadius: '10px',
                border: '1px solid #2a3b6a'
            }}>
                <div className="text-center text-white-50">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                    <p>Select a chat to start messaging</p>
                </div>
            </div>
        );
    }

    if (selectedRoom.isVirtual) {
        // Virtual room rendering (unchanged)
        return (
            <div>
                <div style={{
                    height: '500px',
                    width: '100%',
                    overflowY: 'auto',
                    backgroundColor: '#1a2a44',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #2a3b6a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="text-center text-white">
                        {isCreatingRoom ? (
                            <div>
                                <Spinner animation="border" variant="light" className="mb-3" />
                                <p>Creating chat room...</p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
                                <p>Send a message to start your conversation!</p>
                            </div>
                        )}
                    </div>
                </div>
                {renderFilePreview()}
                    <Form onSubmit={handleSendMessage} className="mt-3">
                        <div className="d-flex gap-2 align-items-end">
                            <div style={{ flex: 1 }}>
                                <Form.Control
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type your message..."
                                    disabled={isCreatingRoom}
                                    style={{
                                        backgroundColor: '#101c36',
                                        color: 'white',
                                        border: '1px solid #1a2235',
                                        borderRadius: '25px',
                                        padding: '12px 20px',
                                        resize: 'none'
                                    }}
                                />
                            </div>
                            <Button
                                variant="link"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                disabled={isCreatingRoom}
                                style={{ 
                                    padding: '8px', 
                                    color: '#0dcaf0', 
                                    fontSize: '20px',
                                    minWidth: '40px',
                                    height: '40px'
                                }}
                                title="Add emoji"
                            >
                                😊
                            </Button>
                            <Button
                                variant="link"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isCreatingRoom || isUploading}
                                style={{ 
                                    padding: '8px', 
                                    color: '#28a745', 
                                    fontSize: '18px',
                                    minWidth: '40px',
                                    height: '40px'
                                }}
                                title="Attach file"
                            >
                                📎
                            </Button>
                            <Form.Control
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                disabled={isCreatingRoom || isUploading}
                                style={{ display: 'none' }}
                                title="Upload any file type (images, documents, videos, audio, etc.)"
                            />
                            <Button
                                type="submit"
                                disabled={isCreatingRoom || isUploading}
                                style={{
                                    backgroundColor: '#7747ff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '45px',
                                    height: '45px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px'
                                }}
                                title="Send message"
                            >
                                {isCreatingRoom ? <Spinner animation="border" size="sm" /> : '➤'}
                            </Button>
                        </div>
                    </Form>
                    {showEmojiPicker && (
                        <div style={{ 
                            position: 'absolute', 
                            zIndex: 1000, 
                            bottom: '70px', 
                            left: '50%', 
                            transform: 'translateX(-50%)' 
                        }}>
                            <EmojiPicker onEmojiClick={handleEmojiSelect} />
                        </div>
                    )}
                </div>
            );
        }

        const roomMessages = messages[`${roomType}-${selectedRoom.id}`] || [];

    return (
        <div>
            <div style={{
                height: '500px',
                width: '100%',
                overflowY: 'auto',
                backgroundColor: '#1a2a44',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #2a3b6a'
            }}>
                {roomMessages.length === 0 ? (
                    <div className="text-center text-white-50" style={{ paddingTop: '200px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    roomMessages.map((msg) => {
                        // CRITICAL: Log each message to debug file display issues
                        if (msg.file_url) {
                            console.log(`Rendering message ${msg.id} with file:`, {
                                file_url: msg.file_url,
                                file_name: msg.file_name,
                                file_type: msg.file_type,
                                file_size: msg.file_size
                            });
                        }
                        
                        return (
                            <div
                                key={msg.id}
                                style={{
                                    textAlign: msg.sender.id === currentUser.id ? 'right' : 'left',
                                    marginBottom: '16px',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'inline-block',
                                        backgroundColor: msg.sender.id === currentUser.id ? '#007bff' : '#343a40',
                                        color: 'white',
                                        padding: '12px 16px',
                                        borderRadius: '18px',
                                        maxWidth: '75%',
                                        wordWrap: 'break-word',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ 
                                        fontWeight: '600', 
                                        marginBottom: '6px',
                                        fontSize: '13px',
                                        opacity: '0.9'
                                    }}>
                                        {msg.sender.first_name}
                                    </div>
                                    
                                    {msg.content && (
                                        <div style={{ marginBottom: msg.file_url ? '8px' : '0' }}>
                                            {msg.content}
                                        </div>
                                    )}
                                    
                                    {/* CRITICAL: Use the fixed renderFileMessage function */}
                                    {renderFileMessage(msg)}
                                    
                                    <div style={{
                                        fontSize: '11px',
                                        opacity: '0.7',
                                        marginTop: '6px',
                                        textAlign: msg.sender.id === currentUser.id ? 'right' : 'left'
                                    }}>
                                        {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}
                                    </div>
                                    
                                    <div style={{ marginTop: '6px' }}>
                                        <Button
                                            variant="link"
                                            onClick={() => setReactionMessageId(reactionMessageId === msg.id ? null : msg.id)}
                                            style={{ 
                                                padding: '2px 6px', 
                                                color: '#0dcaf0', 
                                                fontSize: '14px',
                                                minHeight: 'auto',
                                                lineHeight: '1'
                                            }}
                                            title="Add reaction"
                                        >
                                            😊
                                        </Button>
                                    </div>
                                    
                                    {msg.reactions?.length > 0 && (
                                        <div style={{ 
                                            marginTop: '6px', 
                                            fontSize: '12px', 
                                            opacity: '0.9',
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '4px'
                                        }}>
                                            {msg.reactions.map((reaction, index) => (
                                                <span 
                                                    key={index} 
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                                        padding: '2px 6px',
                                                        borderRadius: '12px',
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    {reaction.reaction} {reaction.user.first_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {renderFilePreview()}
                
                <Form onSubmit={handleSendMessage} className="mt-3">
                    <div className="d-flex gap-2 align-items-end">
                        <div style={{ flex: 1 }}>
                            <Form.Control
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type your message..."
                                disabled={isUploading}
                                style={{
                                    backgroundColor: '#101c36',
                                    color: 'white',
                                    border: '1px solid #1a2235',
                                    borderRadius: '25px',
                                    padding: '12px 20px'
                                }}
                            />
                        </div>
                        <Button
                            variant="link"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            disabled={isUploading}
                            style={{ 
                                padding: '8px', 
                                color: '#0dcaf0', 
                                fontSize: '20px',
                                minWidth: '40px',
                                height: '40px'
                            }}
                            title="Add emoji"
                        >
                            😊
                        </Button>
                        <Button
                            variant="link"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            style={{ 
                                padding: '8px', 
                                color: '#28a745', 
                                fontSize: '18px',
                                minWidth: '40px',
                                height: '40px'
                            }}
                            title="Attach file"
                        >
                            📎
                        </Button>
                        <Form.Control
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            style={{ display: 'none' }}
                        />
                        <Button
                            type="submit"
                            disabled={isUploading}
                            style={{
                                backgroundColor: '#7747ff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px'
                            }}
                            title="Send message"
                        >
                            {isUploading ? <Spinner animation="border" size="sm" /> : '➤'}
                        </Button>
                    </div>
                </Form>
                
                {showEmojiPicker && (
                    <div style={{ 
                        position: 'absolute', 
                        zIndex: 1000, 
                        bottom: '70px', 
                        left: '50%', 
                        transform: 'translateX(-50%)' 
                    }}>
                        <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                )}
                
                {reactionMessageId && (
                    <div style={{ 
                        position: 'absolute', 
                        zIndex: 1000, 
                        bottom: '70px', 
                        left: '50%', 
                        transform: 'translateX(-50%)' 
                    }}>
                        <EmojiPicker onEmojiClick={(emojiObject) => handleAddReaction(reactionMessageId, emojiObject)} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ height: '100%', position: 'relative' }}>
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
                            width: 100%;
                            max-height: 300px !important;
                        }
                        .chat-main {
                            width: 100%;
                            height: 400px !important;
                        }
                    }
                `}
            </style>

            {chatLoading && (
                <div className="text-center mb-3">
                    <Spinner animation="border" variant="light" />
                    <p className="text-white-50 mt-2">Loading chats...</p>
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

            {/* Enhanced File Preview Modal */}
            <Modal
                show={showFilePreview}
                onHide={() => setShowFilePreview(false)}
                size="xl"
                centered
                backdrop="static"
            >
                <Modal.Header 
                    closeButton 
                    style={{ 
                        backgroundColor: '#101c36', 
                        color: 'white', 
                        border: 'none',
                        borderBottom: '1px solid #2a3b6a'
                    }}
                >
                    <Modal.Title style={{ fontSize: '18px' }}>
                        {selectedFileForPreview?.name || 'File Preview'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body 
                    style={{ 
                        backgroundColor: '#101c36', 
                        color: 'white', 
                        textAlign: 'center',
                        padding: '20px',
                        minHeight: '400px'
                    }}
                >
                    {previewLoading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                            <Spinner animation="border" variant="light" />
                        </div>
                    ) : selectedFileForPreview && (
                        <div>
                            {selectedFileForPreview.type?.startsWith('image/') ? (
                                <img
                                    src={selectedFileForPreview.url}
                                    alt={selectedFileForPreview.name}
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '70vh', 
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'block';
                                    }}
                                />
                            ) : selectedFileForPreview.type?.startsWith('video/') ? (
                                <video
                                    controls
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '70vh', 
                                        borderRadius: '8px'
                                    }}
                                    preload="metadata"
                                >
                                    <source src={selectedFileForPreview.url} type={selectedFileForPreview.type} />
                                    Your browser does not support the video tag.
                                </video>
                            ) : selectedFileForPreview.type?.startsWith('audio/') ? (
                                <div style={{ padding: '40px 20px' }}>
                                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎵</div>
                                    <h5 style={{ marginBottom: '20px', wordBreak: 'break-all' }}>
                                        {selectedFileForPreview.name}
                                    </h5>
                                    <audio 
                                        controls 
                                        style={{ width: '100%', maxWidth: '400px' }}
                                        preload="metadata"
                                    >
                                        <source src={selectedFileForPreview.url} type={selectedFileForPreview.type} />
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            ) : selectedFileForPreview.type === 'application/pdf' ? (
                                <div style={{ width: '100%', height: '70vh' }}>
                                    <iframe
                                        src={`${selectedFileForPreview.url}#toolbar=1&navpanes=1&scrollbar=1`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none',
                                            borderRadius: '8px'
                                        }}
                                        title={selectedFileForPreview.name}
                                    />
                                </div>
                            ) : selectedFileForPreview.type === 'text/plain' ? (
                                <div style={{ padding: '20px', textAlign: 'left' }}>
                                    <iframe
                                        src={selectedFileForPreview.url}
                                        style={{
                                            width: '100%',
                                            height: '60vh',
                                            border: '1px solid #2a3b6a',
                                            borderRadius: '8px',
                                            backgroundColor: 'white',
                                            color: 'black'
                                        }}
                                        title={selectedFileForPreview.name}
                                    />
                                </div>
                            ) : (
                                <div style={{ padding: '40px 20px' }}>
                                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                                        {getFileIcon(selectedFileForPreview.type)}
                                    </div>
                                    <h5 style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                                        {selectedFileForPreview.name}
                                    </h5>
                                    <p className="text-white-50 mb-3">
                                        This file type cannot be previewed directly.
                                    </p>
                                    <Button
                                        variant="primary"
                                        onClick={() => window.open(selectedFileForPreview.url, '_blank')}
                                        style={{ backgroundColor: '#7747ff', border: 'none' }}
                                    >
                                        Open in New Tab
                                    </Button>
                                </div>
                            )}
                            <div 
                                style={{ 
                                    display: 'none',
                                    padding: '40px 20px'
                                }}
                            >
                                <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
                                <h5 style={{ marginBottom: '10px' }}>Failed to load file</h5>
                                <p className="text-white-50 mb-3">
                                    The file could not be displayed. You can try downloading it instead.
                                </p>
                                <Button
                                    variant="primary"
                                    onClick={() => window.open(selectedFileForPreview.url, '_blank')}
                                    style={{ backgroundColor: '#7747ff', border: 'none' }}
                                >
                                    Download File
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer 
                    style={{ 
                        backgroundColor: '#101c36', 
                        border: 'none',
                        borderTop: '1px solid #2a3b6a'
                    }}
                >
                    <Button
                        variant="outline-light"
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedFileForPreview?.url;
                            link.download = selectedFileForPreview?.name || 'file';
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        Download
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setShowFilePreview(false)}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ChatInterface;