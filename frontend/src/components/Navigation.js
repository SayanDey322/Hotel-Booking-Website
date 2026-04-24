import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, User, LogOut, Calendar, Shield } from 'lucide-react';           
import { Button } from '@/components/ui/button';                    
import {     
  DropdownMenu,     
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 glassmorphism border-b border-stone-100" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2" data-testid="logo-link">
            <h1 className="text-2xl font-serif font-bold text-primary">LuxeStay</h1>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/hotels" className="text-foreground hover:text-primary font-medium transition-colors" data-testid="hotels-nav-link">
              Hotels
            </Link>
            {user ? (
              <>
                <Link to="/my-bookings" className="text-foreground hover:text-primary font-medium transition-colors" data-testid="bookings-nav-link">
                  My Bookings
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-foreground hover:text-primary font-medium transition-colors" data-testid="admin-nav-link">
                    Admin
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2" data-testid="user-menu-trigger">
                      <User className="w-4 h-4" />
                      <span>{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={logout} data-testid="logout-button">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth" data-testid="login-button">
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-none px-8 py-6 font-serif tracking-wide">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="sm" data-testid="mobile-menu-button">
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
