// src/features/auth/authSlice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {UserEntity} from '../user/userEntity';

interface AppState {
  meData: UserEntity | null;
  networkState: boolean | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  meData: null,
  networkState: false,
  isLoading: false,
  error: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setMe: (state,action: PayloadAction<UserEntity>) => {      
      state.meData = action.payload      
    },
    setNetworkState: (state, action: PayloadAction<boolean | null>) => {
      state.networkState = action.payload
    }
  },
});

export const { setNetworkState, setLoading, setMe} = appSlice.actions;
export const appReducer = appSlice.reducer;
export const appSelector = (state: {app: AppState}) => state.app;
