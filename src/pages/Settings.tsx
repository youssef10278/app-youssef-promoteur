import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import {
  ArrowLeft,
  Key,
  User,
  Shield,
  Bell,
  Palette,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // États pour les informations du profil
  const [profileData, setProfileData] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: user?.telephone || ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      // TODO: Implémenter l'endpoint de changement de mot de passe dans l'API backend
      // const response = await apiClient.changePassword({
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword
      // });

      // Pour l'instant, simuler une erreur pour indiquer que la fonctionnalité n'est pas encore disponible
      throw new Error('Fonctionnalité de changement de mot de passe en cours de développement');

      toast({
        title: "Succès",
        description: "Mot de passe modifié avec succès"
      });

      // Réinitialiser le formulaire
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Fonctionnalité non disponible",
        description: "Le changement de mot de passe sera bientôt disponible",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const response = await apiClient.updateProfile({
        nom: profileData.nom,
        telephone: profileData.telephone
      });

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour');
      }

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <AppLayout
      title="Paramètres"
      subtitle="Gérez vos préférences et votre compte"
    >
      <div className="space-y-8">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au Dashboard
            </Button>
          </Link>
        </div>

        {/* Informations du profil */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations du profil
            </CardTitle>
            <CardDescription>
              Gérez vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom complet</Label>
                  <Input
                    id="nom"
                    value={profileData.nom}
                    onChange={(e) => setProfileData(prev => ({ ...prev, nom: e.target.value }))}
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    L'email ne peut pas être modifié
                  </p>
                </div>
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={profileData.telephone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, telephone: e.target.value }))}
                    placeholder="Votre numéro de téléphone"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isUpdatingProfile}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdatingProfile ? 'Mise à jour...' : 'Sauvegarder'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Changement de mot de passe */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Sécurité du compte
            </CardTitle>
            <CardDescription>
              Modifiez votre mot de passe pour sécuriser votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Entrez votre mot de passe actuel"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Entrez votre nouveau mot de passe"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum 6 caractères
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirmez votre nouveau mot de passe"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isChangingPassword} variant="destructive">
                <Shield className="h-4 w-4 mr-2" />
                {isChangingPassword ? 'Modification...' : 'Changer le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informations de sécurité */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Informations de sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sessions actives</p>
                <p className="text-sm text-muted-foreground">Gérez vos sessions de connexion</p>
              </div>
              <Badge variant="secondary">1 session active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
