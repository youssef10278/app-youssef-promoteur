import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-foreground"></div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, rediriger vers le dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de login
  return <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
