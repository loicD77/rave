import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import serverReducer from './serverSlice';

// Configuration de persistance
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['server'], // Persister seulement le state du serveur
};

// Reducer persistant
const persistedServerReducer = persistReducer(persistConfig, serverReducer);

// Configuration du store
export const store = configureStore({
  reducer: {
    server: persistedServerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);