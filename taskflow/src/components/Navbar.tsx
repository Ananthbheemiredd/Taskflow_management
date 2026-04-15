import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { LogOut, Plus } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/projects" className="text-xl font-bold text-blue-600">
              TaskFlow
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="hidden text-sm text-gray-700 sm:block">
                  {user.name}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/projects/new')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
                <Button variant="danger" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
