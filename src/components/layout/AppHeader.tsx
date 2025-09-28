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
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Section - Title */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {title && (
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-foreground-secondary truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>



        {/* Right Section - Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Custom Actions */}
          {actions && (
            <>
              <div className="hidden sm:block">
                {actions}
              </div>
              <div className="sm:hidden">
                {/* Version mobile simplifiée des actions */}
                {actions}
              </div>
              <div className="h-6 w-px bg-border mx-1 sm:mx-2 hidden sm:block" />
            </>
          )}



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


        </div>
      </div>
    </header>
  );
};

export default AppHeader;
