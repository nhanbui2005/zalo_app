import axios from "axios";
import { AppConstant } from "../constants/appConstant";

const AxiosInstant = axios.create({
  baseURL: 'http://localhost:7777/api/v1',
  headers: {
    'Content-Type': 'application/json', // Mặc định là JSON, có thể thay đổi khi gửi dữ liệu form
  },
});

// Add a request interceptor
AxiosInstant.interceptors.request.use(function (config) {
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  const token = localStorage.getItem(AppConstant.LOCAL_STORAGE_TOKEN_KEY);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, function (error) {
  // Do something with request error
  return Promise.reject(error);
});

// Add a response interceptor
AxiosInstant.interceptors.response.use(function (response) {
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  return response.data;
}, function (error) {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  return Promise.reject(error);
});

export default AxiosInstant