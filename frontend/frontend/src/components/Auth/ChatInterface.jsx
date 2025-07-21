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
// import { format } from 'date-fns'; // Add date-fns import

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

//         const wsUrl = `ws://localhost:8000/ws/${roomType}/${selectedRoom.id}/?token=${token}&room_type=${roomType}`;
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
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setFile({
//                     data: reader.result,
//                     name: selectedFile.name,
//                 });
//             };
//             reader.readAsDataURL(selectedFile);
//         }
//     };

//     const handleSendMessage = async (e) => {
//         e.preventDefault();
//         if (!messageInput.trim() && !file) {
//             toast.error('Please enter a message or attach a file.');
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
//             };
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
//                                             {msg.file_url.match(/\.(jpeg|jpg|png|gif)$/i) ? (
//                                                 <img
//                                                     src={msg.file_url}
//                                                     alt="attachment"
//                                                     style={{ maxWidth: '200px', borderRadius: '8px' }}
//                                                 />
//                                             ) : (
//                                                 <a href={msg.file_url} download style={{ color: '#0dcaf0' }}>
//                                                     Download File
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
import { Card, ListGroup, Form, Button, Spinner, Alert } from 'react-bootstrap';
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
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomType, setRoomType] = useState('chat');
    const [messageInput, setMessageInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [file, setFile] = useState(null);
    const [reactionMessageId, setReactionMessageId] = useState(null);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 3;

    const currentUser = currentMember || currentTrainer;
    const isMember = userType === 'member';

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

    const connectWebSocket = async () => {
        if (!selectedRoom || selectedRoom.isVirtual) return;

        const token = await getValidToken();
        if (!token) {
            toast.error("Please log in again to continue chatting.");
            return;
        }

        const wsUrl = `ws://localhost:8000/ws/${roomType}/${selectedRoom.id}/?token=${token}&room_type=${roomType}`;
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

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
            if (data.type === 'error') {
                toast.error(data.message);
                return;
            }
            if (data.type === 'chat_message') {
                dispatch(addMessage({
                    roomId: selectedRoom.id,
                    roomType,
                    message: {
                        id: data.message_id,
                        [roomType === 'chat' ? 'chat_room' : 'community_chat_room']: selectedRoom,
                        sender: data.sender,
                        content: data.message,
                        file_url: data.file_url,
                        file_type: data.file_type, // Added to store file type
                        timestamp: data.timestamp,
                        reactions: data.reactions || [],
                    },
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

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type to ensure it's an image
            const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validImageTypes.includes(selectedFile.type)) {
                toast.error('Please select a valid image file (JPEG, PNG, GIF).');
                return;
            }
            console.log('Selected file:', selectedFile.name, selectedFile.type, selectedFile.size);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFile({
                    data: reader.result,
                    name: selectedFile.name,
                    type: selectedFile.type, // Store file type
                });
                console.log('File read as base64:', reader.result.slice(0, 50) + '...');
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() && !file) {
            toast.error('Please enter a message or attach an image.');
            return;
        }

        if (selectedRoom?.isVirtual) {
            await handleVirtualRoomSelection(selectedRoom);
            return;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const messageData = {
                type: 'chat_message',
                message: messageInput,
                file: file?.data || null,
                file_name: file?.name || null,
                file_type: file?.type || null, // Include file type
            };
            console.log('Sending WebSocket message:', messageData);
            wsRef.current.send(JSON.stringify(messageData));
            setMessageInput('');
            setFile(null);
        } else {
            toast.error('Chat is disconnected. Trying to reconnect...');
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
                    <Card.Body>
                        <h5 className="text-white">Chat with Trainer</h5>
                        <p className="text-white">No trainer assigned.</p>
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
                            <h6 className="text-white-50 mb-2">
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
                                            padding: '15px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedRoom?.id !== room.id || roomType !== room.type) {
                                                e.target.style.backgroundColor = '#1a2a44';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedRoom?.id !== room.id || roomType !== room.type) {
                                                e.target.style.backgroundColor = '#101c36';
                                            }
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
                                                {room.type === 'chat'
                                                    ? (isMember ? room.trainer?.first_name?.charAt(0)?.toUpperCase() : room.member?.first_name?.charAt(0)?.toUpperCase())
                                                    : room.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', fontSize: '16px' }}>
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
                            <h6 className="text-white-50 mb-2">Group Chats</h6>
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
                                            padding: '15px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedRoom?.id !== room.id || roomType !== room.type) {
                                                e.target.style.backgroundColor = '#1a2a44';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedRoom?.id !== room.id || roomType !== room.type) {
                                                e.target.style.backgroundColor = '#101c36';
                                            }
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
                                                {room.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', fontSize: '16px' }}>
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
                        <p className="text-white">
                            {isMember ? 'No chats available.' : 'No assigned members.'}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    const renderMessages = () => {
        if (!selectedRoom) {
            return null;
        }

        if (selectedRoom.isVirtual) {
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
                        <div className="text-center text-white" style={{ paddingTop: '200px' }}>
                            {isCreatingRoom ? (
                                <div>
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p>Creating chat room...</p>
                                </div>
                            ) : (
                                <p>Click "Send" to start a conversation with {selectedRoom.member?.first_name}!</p>
                            )}
                        </div>
                    </div>
                    <Form onSubmit={handleSendMessage} className="mt-3">
                        <div className="d-flex gap-2 align-items-center">
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
                                    padding: '10px 20px'
                                }}
                            />
                            <Button
                                variant="link"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                disabled={isCreatingRoom}
                                style={{ padding: 0, color: '#0dcaf0', fontSize: '1.2em' }}
                            >
                                😊
                            </Button>
                            <Form.Control
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif" // Restrict to image types
                                onChange={handleFileChange}
                                disabled={isCreatingRoom}
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
                                disabled={isCreatingRoom}
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
                                {isCreatingRoom ? <Spinner animation="border" size="sm" /> : '➤'}
                            </Button>
                        </div>
                    </Form>
                    {showEmojiPicker && (
                        <div style={{ position: 'absolute', zIndex: 1000, bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}>
                            <EmojiPicker onEmojiClick={handleEmojiSelect} />
                        </div>
                    )}
                </div>
            );
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
                    {messages[`${roomType}-${selectedRoom.id}`]?.length === 0 ? (
                        <div className="text-center text-white" style={{ paddingTop: '200px' }}>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages[`${roomType}-${selectedRoom.id}`]?.map((msg) => (
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
                                            {msg.file_type && msg.file_type.startsWith('image/') ? (
                                                <img
                                                    src={msg.file_url}
                                                    alt="attachment"
                                                    style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }}
                                                    onClick={() => window.open(msg.file_url, '_blank')}
                                                />
                                            ) : (
                                                <a href={msg.file_url} download style={{ color: '#0dcaf0' }}>
                                                    Download File: {msg.file_name || 'File'}
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
                                        {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : 'Invalid time'}
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
                            accept="image/jpeg,image/jpg,image/png,image/gif" // Restrict to image types
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
                            width: 100%;
                            max-height: 300px !important;
                        }
                        .chat-main {
                            width: 100%;
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

export default ChatInterface;

