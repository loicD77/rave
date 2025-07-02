// 📁 redux/reducers.js
import { combineReducers } from 'redux';

const server = (state = {}, action) => {
  switch (action.type) {
    case 'SET_SERVER':
      return action.payload;
    default:
      return state;
  }
};

const recordings = (state = [], action) => {
  switch (action.type) {
    case 'ADD_RECORDING':
      return [...state, action.payload];
    case 'DELETE_RECORDING':
      return state.filter(r => r.uri !== action.payload);
    default:
      return state;
  }
};

export default combineReducers({ server, recordings });
