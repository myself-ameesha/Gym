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
        state.messages[key][existingMessageIndex] = {
          ...state.messages[key][existingMessageIndex],
          ...message,
        };
      } else {
        state.messages[key].push(message);
      }
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
        state.messages[`${roomType}-${roomId}`] = messages;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.chatLoading = true;
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

