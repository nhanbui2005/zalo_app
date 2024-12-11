import React, { useState } from 'react';
import { Assets } from '../assets'
import AxiosInstant from '../config/axiosInstant';

const ImageUploadPreview = ({
  url, setUrl, setPid
}) => {
  const handleImageChange = async (e) => {
    const file = e.target.files[0]; // Lấy file từ input
    if (file) {
      const formData = new FormData(); // Khai báo formData
      formData.append('file', file); // Thêm file vào formData
  
      try {
        const response = await AxiosInstant.post('/uploads/upload', formData);
        console.log(response);
        if (response && response.url) {
          setUrl(response.url)
          setPid(response.public_id)
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleImageClick = () => {
    document.getElementById('hiddenFileInput').click(); // Kích hoạt input file
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Hiển thị ảnh đã chọn */}
        <img
          src={url ? url : Assets.images.avatarDefault}
          alt="Selected"
          className="w-36 h-36 rounded-full border border-sky-600 p-2"
          onClick={handleImageClick}
        />

       {/* Input file ẩn */}
       <input
        id="hiddenFileInput"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }} // Ẩn input
      />
    </div>
  );
};

export default ImageUploadPreview;
