// import { createSlice } from '@reduxjs/toolkit';
// import { getChatRooms, createChatRoom, getMessages, createCommunityChat } from './chatApi';

// const initialState = {
//   chatRooms: [],
//   communityChatRooms: [],
//   messages: {},
//   chatLoading: false,
//   chatError: null,
// };

// const chatSlice = createSlice({
//   name: 'chat',
//   initialState,
//   reducers: {
//     addMessage: (state, action) => {
//       const { roomId, roomType, message } = action.payload;
//       const key = `${roomType}-${roomId}`;
//       if (!state.messages[key]) {
//         state.messages[key] = [];
//       }
//       const existingMessageIndex = state.messages[key].findIndex(
//         (msg) => msg.id === message.id
//       );
//       if (existingMessageIndex !== -1) {
//         state.messages[key][existingMessageIndex] = {
//           ...state.messages[key][existingMessageIndex],
//           ...message,
//         };
//       } else {
//         state.messages[key].push(message);
//       }
//     },
//     clearChatError: (state) => {
//       state.chatError = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(getChatRooms.pending, (state) => {
//         state.chatLoading = true;
//       })
//       .addCase(getChatRooms.fulfilled, (state, action) => {
//         state.chatLoading = false;
//         state.chatRooms = action.payload.chat_rooms;
//         state.communityChatRooms = action.payload.community_chat_rooms;
//       })
//       .addCase(getChatRooms.rejected, (state, action) => {
//         state.chatLoading = false;
//         state.chatError = action.payload;
//       })
//       .addCase(createChatRoom.pending, (state) => {
//         state.chatLoading = true;
//       })
//       .addCase(createChatRoom.fulfilled, (state, action) => {
//         state.chatLoading = false;
//         state.chatRooms.push(action.payload);
//       })
//       .addCase(createChatRoom.rejected, (state, action) => {
//         state.chatLoading = false;
//         state.chatError = action.payload;
//       })
//       .addCase(getMessages.pending, (state) => {
//         state.chatLoading = true;
//       })
//       .addCase(getMessages.fulfilled, (state, action) => {
//         state.chatLoading = false;
//         const { roomId, roomType, messages } = action.payload;
//         state.messages[`${roomType}-${roomId}`] = messages;
//       })
//       .addCase(getMessages.rejected, (state, action) => {
//         state.chatLoading = true;
//         state.chatError = action.payload;
//       })
//       .addCase(createCommunityChat.pending, (state) => {
//         state.chatLoading = true;
//       })
//       .addCase(createCommunityChat.fulfilled, (state, action) => {
//         state.chatLoading = false;
//         state.communityChatRooms.push(action.payload);
//       })
//       .addCase(createCommunityChat.rejected, (state, action) => {
//         state.chatLoading = false;
//         state.chatError = action.payload;
//       });
//   },
// });

// export const { addMessage, clearChatError } = chatSlice.actions;
// export default chatSlice.reducer;



import { createSlice } from '@reduxjs/toolkit';
import { getChatRooms, createChatRoom, getMessages, createCommunityChat } from './chatApi';

const initialState = {
  chatRooms: [],
  communityChatRooms: [],
  messages: {},
  chatLoading: false,
  chatError: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const { roomId, roomType, message } = action.payload;
      const key = `${roomType}-${roomId}`;
      
      if (!state.messages[key]) {
        state.messages[key] = [];
      }
      
      const existingMessageIndex = state.messages[key].findIndex(
        (msg) => msg.id === message.id
      );
      
      if (existingMessageIndex !== -1) {
        // FIXED: Update existing message while preserving all fields including file data
        state.messages[key][existingMessageIndex] = {
          ...state.messages[key][existingMessageIndex],
          ...message,
          // Ensure file fields are properly updated
          file_url: message.file_url !== undefined ? message.file_url : state.messages[key][existingMessageIndex].file_url,
          file_type: message.file_type !== undefined ? message.file_type : state.messages[key][existingMessageIndex].file_type,
          file_name: message.file_name !== undefined ? message.file_name : state.messages[key][existingMessageIndex].file_name,
          file_size: message.file_size !== undefined ? message.file_size : state.messages[key][existingMessageIndex].file_size,
        };
      } else {
        // FIXED: Add new message with all fields properly preserved
        const newMessage = {
          id: message.id,
          sender: message.sender,
          content: message.content || '',
          file_url: message.file_url || null,
          file_type: message.file_type || null,
          file_name: message.file_name || null,
          file_size: message.file_size || null,
          timestamp: message.timestamp,
          reactions: message.reactions || [],
          // Keep room reference
          [roomType === 'chat' ? 'chat_room' : 'community_chat_room']: message[roomType === 'chat' ? 'chat_room' : 'community_chat_room'],
        };
        
        // Insert message in chronological order
        const insertIndex = state.messages[key].findIndex(
          (msg) => new Date(msg.timestamp) > new Date(newMessage.timestamp)
        );
        
        if (insertIndex === -1) {
          state.messages[key].push(newMessage);
        } else {
          state.messages[key].splice(insertIndex, 0, newMessage);
        }
      }
      
      console.log(`Message added/updated in state for ${key}:`, {
        messageId: message.id,
        hasFile: !!message.file_url,
        fileType: message.file_type,
        totalMessages: state.messages[key].length
      });
    },
    clearChatError: (state) => {
      state.chatError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getChatRooms.pending, (state) => {
        state.chatLoading = true;
      })
      .addCase(getChatRooms.fulfilled, (state, action) => {
        state.chatLoading = false;
        state.chatRooms = action.payload.chat_rooms;
        state.communityChatRooms = action.payload.community_chat_rooms;
      })
      .addCase(getChatRooms.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatError = action.payload;
      })
      .addCase(createChatRoom.pending, (state) => {
        state.chatLoading = true;
      })
      .addCase(createChatRoom.fulfilled, (state, action) => {
        state.chatLoading = false;
        state.chatRooms.push(action.payload);
      })
      .addCase(createChatRoom.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatError = action.payload;
      })
      .addCase(getMessages.pending, (state) => {
        state.chatLoading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.chatLoading = false;
        const { roomId, roomType, messages } = action.payload;
        // FIXED: Ensure messages with file data are properly stored
        state.messages[`${roomType}-${roomId}`] = messages.map(msg => ({
          ...msg,
          file_url: msg.file_url || null,
          file_type: msg.file_type || null,
          file_name: msg.file_name || null,
          file_size: msg.file_size || null,
        }));
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.chatLoading = false; // FIXED: was setting to true
        state.chatError = action.payload;
      })
      .addCase(createCommunityChat.pending, (state) => {
        state.chatLoading = true;
      })
      .addCase(createCommunityChat.fulfilled, (state, action) => {
        state.chatLoading = false;
        state.communityChatRooms.push(action.payload);
      })
      .addCase(createCommunityChat.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatError = action.payload;
      });
  },
});

export const { addMessage, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;
