import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { authReducer } from '~/features/auth/authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer, 
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAuthDispatch = () => useDispatch<AppDispatch>();
export const useAuthSelector: TypedUseSelectorHook<RootState> = useSelector;


export default store;
