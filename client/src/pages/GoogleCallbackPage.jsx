import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuth } from '../redux/slices/userSlice';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch()

  useEffect(() => {
    // Lấy token từ URL
    const queryParams = new URLSearchParams(window.location.search);
    console.log(queryParams);
    
    const accessToken = queryParams.get('access_token');
    const refreshToken = queryParams.get('refresh_token');
    const id = queryParams.get('id');
    const expires = queryParams.get('expires');

    console.log("accessToken",accessToken);
    console.log("refreshToken",refreshToken);
    console.log("id",id);
    console.log("expires",expires);
    

    if (accessToken && refreshToken && id && expires) {
      dispatch(setAuth({
        accessToken,
        refreshToken,
        id,
        expires
      }))

      // Điều hướng đến trang chính
      navigate('/init');
    }
  }, [navigate]);

  return <p>Đang xử lý đăng nhập...</p>;
};

export default GoogleCallbackPage;
