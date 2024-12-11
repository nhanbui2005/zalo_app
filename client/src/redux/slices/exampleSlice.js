import { createSlice } from '@reduxjs/toolkit';

const exampleSlice = createSlice({
  name: 'example',
  initialState: {
    counter: 0,
    message: '',
  },
  reducers: {
    increment: (state) => {
      state.counter += 1;
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
  },
});

export const { increment, setMessage } = exampleSlice.actions;

export default exampleSlice.reducer;
