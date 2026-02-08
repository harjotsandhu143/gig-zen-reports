import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, LogOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function Navigation() {
  const location = useLocation();
  const { resetData } = useData();
  const { signOut } = useAuth();

  return (
    <nav className="flex items-center gap-2 mb-10 flex-wrap">
      <div className="flex items-center bg-secondary rounded-full p-1">
        <Button
          variant="ghost"
          asChild
          size="sm"
          className={`rounded-full px-5 h-8 text-sm font-medium transition-all ${
            location.pathname === '/'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link to="/" className="flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </Button>
        <Button
          variant="ghost"
          asChild
          size="sm"
          className={`rounded-full px-5 h-8 text-sm font-medium transition-all ${
            location.pathname === '/table'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link to="/table" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Data
          </Link>
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 px-3 text-muted-foreground hover:text-foreground text-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              New Week
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Start a New Week?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive all your current income and expense records and reset your weekly progress. 
                Your historical data will be saved but won't appear in the dashboard or tables.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={resetData} className="rounded-full">
                Start Fresh
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="rounded-full h-8 px-3 text-muted-foreground hover:text-foreground text-sm"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
}
