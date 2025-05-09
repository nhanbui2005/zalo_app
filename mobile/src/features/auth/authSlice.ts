// src/features/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loginGoogleResponse } from './authDto';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Bắt đầu quá trình đăng nhập
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null; 
    },
    // Đăng nhập thành công
    loginSuccess: (state, action: PayloadAction<loginGoogleResponse>) => {  
      state.accessToken = action.payload.accessToken; 
      state.refreshToken = action.payload.refreshToken;
      state.isLoading = false; 
    },
    // Đăng nhập thất bại
    loginFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    // Đăng xuất
    logout: (state) => {
      state.accessToken = null; 
      state.refreshToken = null; 
      state.error = null;
      state.isLoading = false;
    },
    setAuth: (
      state,
      action: PayloadAction<loginGoogleResponse>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },

  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setAuth } = authSlice.actions;
export const authReducer =  authSlice.reducer;
export const authSelector = (state: { auth: AuthState }) => state.auth;
