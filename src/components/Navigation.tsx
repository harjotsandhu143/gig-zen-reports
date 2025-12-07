import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Home, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

export function Navigation() {
  const location = useLocation();
  const { taxRate, setTaxRate } = useData();
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTaxRate(taxRate === 20 ? 30 : 20)}
        >
          <Settings className="h-4 w-4 mr-1" />
          Tax: {taxRate}%
        </Button>
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
