import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Home, Settings, RotateCcw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

export function Navigation() {
  const location = useLocation();
  const { taxRate, setTaxRate, resetData } = useData();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Signed in as: {user?.email}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
      <nav className="flex gap-2">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTaxRate(taxRate === 20 ? 30 : 20)}
        >
          <Settings className="h-4 w-4 mr-1" />
          Tax: {taxRate}%
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={resetData}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </nav>
    </div>
  );
}