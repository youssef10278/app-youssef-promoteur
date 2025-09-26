import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Users, TrendingUp, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-primary-foreground/10 rounded-full mb-6">
              <Building2 className="h-16 w-16" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-scale">
              Gestion Immobilière
              <span className="block text-secondary">Professionnelle</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 mb-8 animate-slide-up">
              La plateforme complète pour promoteurs immobiliers au Maroc
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 hover-lift">
              <Users className="h-12 w-12 mx-auto mb-4 text-secondary" />
              <h3 className="text-xl font-semibold mb-2">Gestion Complète</h3>
              <p className="text-primary-foreground/70">Projets, dépenses, ventes et chèques en un seul endroit</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 hover-lift">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-secondary" />
              <h3 className="text-xl font-semibold mb-2">Suivi Financier</h3>
              <p className="text-primary-foreground/70">Montants déclarés et non déclarés selon la loi marocaine</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 hover-lift">
              <Shield className="h-12 w-12 mx-auto mb-4 text-secondary" />
              <h3 className="text-xl font-semibold mb-2">Sécurisé & Conforme</h3>
              <p className="text-primary-foreground/70">Respecte la réglementation immobilière marocaine</p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link to="/auth">
              <Button size="lg" className="btn-secondary-gradient text-lg px-8 py-3">
                Commencer Maintenant
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-3">
                Déjà inscrit ? Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
