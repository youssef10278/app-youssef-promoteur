import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Search,
  Sun,
  Moon,
  User,
  Settings,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  sidebarCollapsed: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  actions,
  sidebarCollapsed,
}) => {
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section - Title */}
        <div className="flex items-center space-x-4">
          {title && (
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-foreground-secondary">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              className={cn(
                'w-full rounded-lg border border-input bg-background/50 pl-10 pr-4 py-2',
                'text-sm placeholder:text-muted-foreground',
                'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Custom Actions */}
          {actions && (
            <>
              {actions}
              <div className="h-6 w-px bg-border mx-2" />
            </>
          )}

          {/* Quick Actions */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-accent"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0 hover:bg-accent"
              >
                <Bell className="h-4 w-4" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Badge variant="secondary" className="ml-2">
                  3 nouvelles
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem className="flex items-start space-x-3 p-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nouveau projet créé</p>
                    <p className="text-xs text-muted-foreground">
                      Le projet "Villa Moderne" a été ajouté avec succès
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Il y a 2 minutes
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-start space-x-3 p-3">
                  <div className="h-2 w-2 rounded-full bg-warning mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Chèque en attente</p>
                    <p className="text-xs text-muted-foreground">
                      Un chèque de 50,000 DH nécessite votre attention
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Il y a 1 heure
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-start space-x-3 p-3">
                  <div className="h-2 w-2 rounded-full bg-success mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Vente confirmée</p>
                    <p className="text-xs text-muted-foreground">
                      Appartement A-101 vendu pour 1,200,000 DH
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Il y a 3 heures
                    </p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 p-0 hover:bg-accent"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0 hover:bg-accent"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {profile?.nom?.charAt(0) || 'U'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.nom || 'Utilisateur'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Promoteur Immobilier
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Zap className="mr-2 h-4 w-4" />
                <span>Mise à niveau</span>
                <Badge variant="secondary" className="ml-auto">
                  Pro
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Aide</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
