import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, hrLogin as apiHRLogin } from '../lib/api';

interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role: 'admin' | 'qa_lead' | 'qa_engineer' | 'hr';
  avatar_url?: string;
}

interface AuthCtx {
  user: User | null;
  devName: string;
  setDevName: (n: string) => void;
  selectedQA: string;
  setSelectedQA: (qa: string) => void;
  login: (username: string, password: string) => Promise<void>;
  loginAsHR: (email: string, password: string) => Promise<void>;
  loginAsDeveloper: (name: string, qaName: string) => void;
  logout: () => void;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthCtx>(null!);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('qa_user') || 'null'); } catch { return null; }
  });
  const [devName, setDevName] = useState<string>(() => localStorage.getItem('qa_dev_name') || '');
  const [selectedQA, setSelectedQA] = useState<string>(() => localStorage.getItem('qa_selected_qa') || '');

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    localStorage.setItem('qa_token', data.token);
    localStorage.setItem('qa_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const loginAsHR = async (email: string, password: string) => {
    const data = await apiHRLogin(email, password);
    localStorage.setItem('qa_token', data.token);
    localStorage.setItem('qa_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const loginAsDeveloper = (name: string, qaName: string) => {
    localStorage.setItem('dev_session', JSON.stringify({ developerName: name, selectedQA: qaName, timestamp: Date.now() }));
    localStorage.setItem('qa_dev_name', name);
    localStorage.setItem('qa_selected_qa', qaName);
    setDevName(name);
    setSelectedQA(qaName);
  };

  const updateUser = (u: User) => {
    setUser(u);
    localStorage.setItem('qa_user', JSON.stringify(u));
  };

  const logout = () => {
    localStorage.removeItem('qa_token');
    localStorage.removeItem('qa_user');
    localStorage.removeItem('qa_role_choice');
    localStorage.removeItem('qa_dev_name');
    localStorage.removeItem('qa_selected_qa');
    localStorage.removeItem('dev_session');
    setUser(null);
    setDevName('');
    setSelectedQA('');
  };

  useEffect(() => {
    if (devName) localStorage.setItem('qa_dev_name', devName);
    else localStorage.removeItem('qa_dev_name');
  }, [devName]);

  useEffect(() => {
    if (selectedQA) localStorage.setItem('qa_selected_qa', selectedQA);
    else localStorage.removeItem('qa_selected_qa');
  }, [selectedQA]);

  return (
    <AuthContext.Provider value={{ user, devName, setDevName, selectedQA, setSelectedQA, login, loginAsHR, loginAsDeveloper, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
