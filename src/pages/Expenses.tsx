import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, Plus, ArrowLeft, Building2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CheckForm from '@/components/expense/CheckForm';
import CashForm from '@/components/expense/CashForm';
import { ExpenseAnalyticsComponent } from '@/components/expenses/ExpenseAnalytics';
import { ExpenseFilters as ExpenseFiltersComponent, ExpenseFiltersState } from '@/components/expenses/ExpenseFilters';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ModifyExpenseModal } from '@/components/expenses/ModifyExpenseModal';
import { ExpenseDetailsModal } from '@/components/expenses/ExpenseDetailsModal';
import CreateSimpleExpenseModal from '@/components/expenses/CreateSimpleExpenseModal';
import ExpenseDetailsModalNew from '@/components/expenses/ExpenseDetailsModalNew';

import { useExpensesNew } from '@/hooks/useExpensesNew';
import { ProjectSelector } from '@/components/common/ProjectSelector';
import { Project, Expense, ExpenseWithPayments, ExpenseFormData, CheckData, PAYMENT_MODES, ExpenseFilters } from '@/types/expense';
import { eventBus, EVENTS } from '@/utils/eventBus';

const Expenses = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedExpenseForPayments, setSelectedExpenseForPayments] = useState<ExpenseWithPayments | null>(null);
  const { toast } = useToast();

  // Utiliser le nouveau hook pour la gestion des dépenses
  const {
    expenses,
    isLoading: isLoadingExpenses,
    createSimpleExpense,
    refreshExpenses,
    loadExpenses,
    getExpenseWithPayments
  } = useExpensesNew(selectedProject !== 'all' ? selectedProject : undefined);

  // États pour les filtres
  const [filters, setFilters] = useState<ExpenseFiltersState>({
    searchTerm: '',
    mode_paiement: '',
    date_debut: null,
    date_fin: null,
    montant_min: null,
    montant_max: null,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Filtrer les dépenses localement
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Recharger les dépenses quand les filtres ou le projet sélectionné changent
  useEffect(() => {
    if (user && selectedProject) {
      // Convertir les filtres au format attendu par le service
      const expenseFilters: ExpenseFilters = {
        searchTerm: filters.searchTerm || undefined,
        mode_paiement: filters.mode_paiement || undefined,
        date_debut: filters.date_debut?.toISOString() || undefined,
        date_fin: filters.date_fin?.toISOString() || undefined,
        montant_min: filters.montant_min || undefined,
        montant_max: filters.montant_max || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      loadExpenses(selectedProject !== 'all' ? selectedProject : undefined, expenseFilters);
    }
  }, [user, selectedProject, filters, loadExpenses]);

  // Mettre à jour les dépenses filtrées quand les dépenses changent
  useEffect(() => {
    setFilteredExpenses(expenses);
  }, [expenses]);

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/projects');
      const projects = response.data || [];

      // Mapper les données pour correspondre au format attendu
      const mappedProjects = projects.map((project: any) => ({
        id: project.id,
        nom: project.nom
      }));

      setProjects(mappedProjects);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Erreur lors du chargement des projets:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Handler pour les changements de filtres
  const handleFiltersChange = (newFilters: ExpenseFiltersState) => {
    setFilters(newFilters);
  };

  // Handlers pour le nouveau système de dépenses
  const handleCreateExpenseSuccess = () => {
    setIsCreateModalOpen(false);
    refreshExpenses();
  };





  // Handlers pour la modification des dépenses
  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModifyModalOpen(true);
  };

  const handleModifySuccess = () => {
    refreshExpenses();
    setIsModifyModalOpen(false);
    setSelectedExpense(null);
  };

  const handleModifyClose = () => {
    setIsModifyModalOpen(false);
    setSelectedExpense(null);
  };

  // Handlers pour les paiements de dépenses
  const handleViewPayments = async (expense: Expense) => {
    try {
      // Charger les détails complets de la dépense avec ses paiements
      const expenseWithPayments = await getExpenseWithPayments(expense.id);
      setSelectedExpenseForPayments(expenseWithPayments);
      setIsPaymentModalOpen(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la dépense",
        variant: "destructive",
      });
    }
  };

  const handlePaymentModalClose = () => {
    setIsPaymentModalOpen(false);
    setSelectedExpenseForPayments(null);
  };

  const handlePaymentSuccess = () => {
    refreshExpenses(); // Recharger les dépenses pour mettre à jour les statuts de paiement
  };



  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Gestion des Dépenses</h1>
                <p className="text-sm sm:text-base text-primary-foreground/80">
                  Suivez vos dépenses principales et autres montants
                </p>
              </div>
            </div>
            <Button
              className="btn-secondary-gradient w-full sm:w-auto"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Dépense
            </Button>

          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <ProjectSelector
            projects={projects}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
            placeholder="Filtrer par projet"
            showAllOption={true}
            allOptionLabel="Tous les projets"
            className="w-full sm:w-[300px]"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-8">
          {/* Section Analytics */}
          <ExpenseAnalyticsComponent
            projectId={selectedProject !== 'all' ? selectedProject : undefined}
            projectName={selectedProject !== 'all' ? projects.find(p => p.id === selectedProject)?.nom : undefined}
            showAllProjects={selectedProject === 'all'}
          />

          {/* Section Dépenses */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center">
                  <Receipt className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  Dépenses du Projet
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Liste des dépenses et suivi des montants
                </p>
              </div>
            </div>

            {/* Composant de filtres et recherche */}
            <ExpenseFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              totalResults={filteredExpenses.length}
              isLoading={isLoadingExpenses}
            />

            <ExpenseList
              expenses={filteredExpenses}
              isLoading={isLoadingExpenses}
              onViewPayments={handleViewPayments}
              onEdit={handleEditExpense}
            />
          </div>
        </div>
      </main>

      {/* Modal de modification des dépenses */}
      {selectedExpense && (
        <ModifyExpenseModal
          expense={selectedExpense}
          projects={projects}
          isOpen={isModifyModalOpen}
          onClose={handleModifyClose}
          onSuccess={handleModifySuccess}
        />
      )}

      {/* Modal de création simple */}
      <CreateSimpleExpenseModal
        projects={projects}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateExpenseSuccess}
      />

      {/* Modal de gestion des paiements */}
      {selectedExpenseForPayments && (
        <ExpenseDetailsModalNew
          expense={selectedExpenseForPayments}
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentModalClose}
          onRefresh={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Expenses;