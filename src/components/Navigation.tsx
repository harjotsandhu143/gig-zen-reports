import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Home, LogOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
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
    <div className="flex flex-col gap-4 mb-6">
      <nav className="flex gap-2 flex-wrap">
        <Button
          variant={location.pathname === '/' ? 'default' : 'outline'}
          asChild
          size="sm"
        >
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button
          variant={location.pathname === '/table' ? 'default' : 'outline'}
          asChild
          size="sm"
        >
          <Link to="/table" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Data Table
          </Link>
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-warning/50 text-warning hover:bg-warning hover:text-warning-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              New Week
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start a New Week?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive all your current income and expense records and reset your weekly progress. 
                Your historical data will be saved but won't appear in the dashboard or tables.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={resetData}>
                Start Fresh
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </nav>
    </div>
  );
}
