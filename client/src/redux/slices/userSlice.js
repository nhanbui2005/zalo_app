import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import userAPI from '../../service/userAPI';

const updateMe = createAsyncThunk(
  'users/updateMe',
  async (data, {rejectWithValue}) => {
    try {
      return await userAPI.updateMe(data)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const getMe = createAsyncThunk(
  'users/getMe',
  async (_,{rejectWithValue }) => {
    try {
      const response = await userAPI.getMe()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user:{},
    auth:{}
  },
  reducers: {
    // increment: (state) => {
    //   state.counter += 1;
    // },
    setAuth: (state, action) => {      
      console.log('data',action.payload);
      
      state.auth.accessToke = action.payload.accessToke
      state.auth.refreshToken = action.payload.refreshToken
      state.auth.expires = action.payload.expires
      state.user.id = action.payload.id
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateMe.fulfilled, (state, action) => {
      state.user = action.payload
    }),
    builder.addCase(getMe.fulfilled, (state, action) => {
      state.user = action.payload
    })
  }
});

export const { setAuth } = userSlice.actions;

export default userSlice.reducer;
