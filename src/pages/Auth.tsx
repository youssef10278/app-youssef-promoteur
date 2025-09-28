import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Lock, Shield, TrendingUp, Users } from 'lucide-react';

const Auth = () => {
  const { user, signIn, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-foreground"></div>
    </div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await signIn(formData.get('email') as string, formData.get('password') as string);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center min-h-screen lg:min-h-0 lg:h-screen">
          {/* Section gauche - Informations */}
          <div className="text-primary-foreground space-y-4 sm:space-y-6 lg:space-y-8 order-2 lg:order-1 py-4 lg:py-0">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center justify-center p-2 sm:p-3 lg:p-4 bg-primary-foreground/10 rounded-full w-fit mx-auto lg:mx-0">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 lg:mb-4 leading-tight">
                  Gestion Immobilière
                  <span className="block text-secondary">Professionnelle</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-primary-foreground/80 mb-4 sm:mb-6 lg:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Votre plateforme personnelle de gestion immobilière
                </p>
              </div>
            </div>

            {/* Fonctionnalités */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6 hidden md:block">
              <div className="flex items-start space-x-3 lg:space-x-4">
                <div className="p-2 bg-primary-foreground/10 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-secondary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base lg:text-lg">Suivi Financier Complet</h3>
                  <p className="text-sm lg:text-base text-primary-foreground/70 leading-relaxed">Gestion des montants principal et autres montants selon la réglementation marocaine</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 lg:space-x-4">
                <div className="p-2 bg-primary-foreground/10 rounded-lg flex-shrink-0">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6 text-secondary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base lg:text-lg">Gestion Multi-Projets</h3>
                  <p className="text-sm lg:text-base text-primary-foreground/70 leading-relaxed">Organisez vos projets, dépenses, ventes et chèques efficacement</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 lg:space-x-4">
                <div className="p-2 bg-primary-foreground/10 rounded-lg flex-shrink-0">
                  <Shield className="h-5 w-5 lg:h-6 lg:w-6 text-secondary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base lg:text-lg">Sécurisé & Privé</h3>
                  <p className="text-sm lg:text-base text-primary-foreground/70 leading-relaxed">Vos données restent privées et sécurisées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section droite - Formulaire de connexion */}
          <div className="flex items-center justify-center order-1 lg:order-2">
            <Card className="w-full max-w-md mx-auto card-premium shadow-2xl">
              <CardHeader className="text-center pb-4 lg:pb-6">
                <div className="mx-auto mb-3 lg:mb-4 p-2 lg:p-3 bg-primary/10 rounded-full w-fit">
                  <Building2 className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                </div>
                <CardTitle className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  Connexion
                </CardTitle>
                <CardDescription className="text-sm lg:text-base text-gray-600 dark:text-gray-300">
                  Accédez à votre espace de gestion immobilière
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleSignIn} className="space-y-5 lg:space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="votre@email.com"
                          className="pl-10 h-11 lg:h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 lg:h-12 text-base"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full btn-hero h-11 lg:h-12 text-base font-medium" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Connexion...</span>
                      </div>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;