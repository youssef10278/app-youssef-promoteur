import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-foreground"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de login
  // en sauvegardant la page qu'il essayait d'atteindre
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est connecté, afficher le contenu protégé
  return <>{children}</>;
};

export default RequireAuth;
