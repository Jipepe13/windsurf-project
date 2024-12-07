import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ChatLayout from './components/chat/ChatLayout';
import { Container } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Footer from './components/Footer/Footer';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="app">
      <Container maxWidth={false} disableGutters>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route
            path="/chat"
            element={<PrivateRoute element={<ChatLayout />} />}
          />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}

export default App;
