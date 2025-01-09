import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ACCESS_TOKEN } from '~/utils/Constants/authConstant';
import localStorage from '~/utils/localStorage';

const axiosInstance = axios.create({
  baseURL: 'http://192.168.1.22:7777/api/v1/', 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await localStorage.getItem(ACCESS_TOKEN); 
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.log('Request Error:', error);
    
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {    
    return response.data;
  },
  (error: AxiosError) => {
    console.error('Response Error:', error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
