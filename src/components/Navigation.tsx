import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="flex gap-2 mb-6">
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
    </nav>
  );
}