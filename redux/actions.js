// 📁 redux/actions.js
export const setServerInfo = (server) => ({ type: 'SET_SERVER', payload: server });
export const addRecording = (recording) => ({ type: 'ADD_RECORDING', payload: recording });
export const deleteRecording = (uri) => ({ type: 'DELETE_RECORDING', payload: uri });
