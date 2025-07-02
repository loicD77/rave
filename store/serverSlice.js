import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ip: '192.168.1.100', // IP par défaut - à modifier selon votre réseau
  port: '5000',        // Port par défaut Flask
  isConnected: false,
  lastConnection: null,
  connectionError: null,
  models: ['Jazz', 'Darbouka', 'Parole', 'Chats', 'Chiens'],
  selectedModel: '',
};

const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    setServerConfig: (state, action) => {
      const { ip, port } = action.payload;
      state.ip = ip;
      state.port = port;
      // Reset connection status when config changes
      state.isConnected = false;
      state.connectionError = null;
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.lastConnection = new Date().toISOString();
        state.connectionError = null;
      }
    },
    setConnectionError: (state, action) => {
      state.connectionError = action.payload;
      state.isConnected = false;
    },
    setAvailableModels: (state, action) => {
      state.models = action.payload;
    },
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload;
    },
    resetServerState: (state) => {
      return { ...initialState };
    },
  },
});

export const {
  setServerConfig,
  setConnectionStatus,
  setConnectionError,
  setAvailableModels,
  setSelectedModel,
  resetServerState,
} = serverSlice.actions;

// Selectors
export const selectServer = (state) => state.server;
export const selectIsConnected = (state) => state.server.isConnected;
export const selectServerConfig = (state) => ({
  ip: state.server.ip,
  port: state.server.port,
});
export const selectModels = (state) => state.server.models;
export const selectSelectedModel = (state) => state.server.selectedModel;

export default serverSlice.reducer;