import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Building2,
  LayoutDashboard,
  FolderOpen,
  Plus,
  Receipt,
  TrendingUp,
  CheckSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Projets',
    href: '/projects',
    icon: FolderOpen,
    badge: null,
  },
  {
    name: 'Nouveau Projet',
    href: '/create-project',
    icon: Plus,
    badge: 'Nouveau',
  },
  {
    name: 'Dépenses',
    href: '/expenses',
    icon: Receipt,
    badge: null,
  },
  {
    name: 'Ventes',
    href: '/sales',
    icon: TrendingUp,
    badge: null,
  },
  {
    name: 'Chèques',
    href: '/checks',
    icon: CheckSquare,
    badge: null,
  },
  {
    name: 'Paramètres',
    href: '/settings',
    icon: Settings,
    badge: null,
  },
];

const AppSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, rediriger vers la page de connexion
      navigate('/auth', { replace: true });
    }
  };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-50 h-full bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95',
        'border-r border-sidebar-border backdrop-blur-xl',
        'transition-all duration-300 ease-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border/50">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-sidebar-foreground">
                RealtySimplify
              </h1>
              <p className="text-xs text-sidebar-foreground/60">Hub Pro</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium',
                  'transition-all duration-200 ease-out',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    collapsed ? 'mx-auto' : 'mr-3'
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 px-2 text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>


      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 p-4">
        {!collapsed && user && (
          <div className="mb-3 p-3 rounded-lg bg-sidebar-accent/50">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.nom?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.nom || 'Utilisateur'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  Promoteur
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              'w-full justify-start text-sidebar-foreground/80',
              'hover:bg-destructive/10 hover:text-destructive',
              collapsed && 'px-2'
            )}
          >
            <LogOut className={cn('h-4 w-4', !collapsed && 'mr-2')} />
            {!collapsed && 'Déconnexion'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
