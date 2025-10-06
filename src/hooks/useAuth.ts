import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/integrations/api/client';
import { AuthUser } from '@/integrations/api/types';

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    nom: string;
    telephone?: string;
    societe?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<AuthUser>) => Promise<void>;
  changePassword: (passwordData: { currentPassword: string; newPassword: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Vérifier l'authentification au chargement
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();

      if (!apiClient.isAuthenticated()) {
        setUser(null);
        return;
      }

      const response = await apiClient.verifyToken();
      
      if (response.success && response.data?.valid) {
        const profileResponse = await apiClient.getProfile();
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data);
        } else {
          // Token invalide, déconnecter
          await apiClient.logout();
          setUser(null);
        }
      } else {
        // Token invalide, déconnecter
        await apiClient.logout();
        setUser(null);
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'authentification:', err);
      // En cas d'erreur, déconnecter par sécurité
      await apiClient.logout();
      setUser(null);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connexion
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await apiClient.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Erreur de connexion');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inscription
  const register = useCallback(async (userData: {
    email: string;
    password: string;
    nom: string;
    telephone?: string;
    societe?: string;
  }) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await apiClient.register(userData);
      
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Déconnexion
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      
      await apiClient.logout();
      setUser(null);
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      // Même en cas d'erreur, on déconnecte localement
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mise à jour du profil
  const updateProfile = useCallback(async (profileData: Partial<AuthUser>) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await apiClient.updateProfile(profileData);
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors de la mise à jour du profil');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Changement de mot de passe
  const changePassword = useCallback(async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await apiClient.changePassword(passwordData);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Rafraîchir les données utilisateur
  const refreshUser = useCallback(async () => {
    try {
      clearError();

      if (!apiClient.isAuthenticated()) {
        setUser(null);
        return;
      }

      const response = await apiClient.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du rafraîchissement du profil');
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du profil:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du rafraîchissement du profil';
      setError(errorMessage);
    }
  }, []);

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    error,
  };
};
