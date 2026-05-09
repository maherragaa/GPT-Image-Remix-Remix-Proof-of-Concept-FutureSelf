import React, { createContext, useContext } from 'react';
import localforage from 'localforage';

export interface LocalUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  photoURL?: string;
  displayName?: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isGuest: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  isGuest: false,
  authError: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<LocalUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [authError, setAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Generate or load local user
    localforage.getItem('localUser').then((savedUser: any) => {
      if (savedUser) {
        setUser(savedUser);
      } else {
        const newUser: LocalUser = {
          uid: 'local_user_' + Date.now(),
          email: 'local@user.com',
          isAnonymous: false,
          displayName: 'Local User'
        };
        localforage.setItem('localUser', newUser);
        localStorage.setItem('localUser_sync', JSON.stringify(newUser));
        setUser(newUser);
      }
      setLoading(false);
    });
  }, []);

  const loginWithGoogle = async () => {};
  const logout = async () => {};

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithGoogle,
      logout,
      isGuest: false, // Local user is trusted enough to save locally
      authError
    }}>
      {children}
    </AuthContext.Provider>
  );
}
