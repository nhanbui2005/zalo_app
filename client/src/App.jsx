import { Navigate, Route, Routes } from 'react-router-dom'
import HomeLayout from './layouts/homeLayout'
import ChatPage from './pages/chatPage'
import LoginPage from './pages/LoginPage'
import GoogleCallbackPage from './pages/GoogleCallbackPage'
import SetupInitAccount from './pages/SetupInfoInitAccount'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  
  const isAuthenticated = () => {
    return localStorage.getItem('authToken'); // Lưu token khi đăng nhập
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage/>}/>

      {/* Các trang yêu cầu đăng nhập */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <HomeLayout>
              <ChatPage></ChatPage>
            </HomeLayout>
          </PrivateRoute>
        }
      />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage/>}/>
      <Route path="/init" element={<SetupInitAccount/>}/>

      {/* Route 404 */}
      <Route path="*" element={<NotFoundPage/>}/>
    </Routes>
  )
}
