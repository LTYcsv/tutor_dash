import { createContext, useContext, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [tutor, setTutor] = useState(() => {
    try {
      const t = localStorage.getItem('tutor');
      return t ? JSON.parse(t) : null;
    } catch {
      return null;
    }
  });

  async function login(email, password) {
    const { data } = await client.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('tutor', JSON.stringify(data.tutor));
    setTutor(data.tutor);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tutor');
    setTutor(null);
  }

  return (
    <AuthContext.Provider value={{ tutor, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
