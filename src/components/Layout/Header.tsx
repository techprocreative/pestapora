import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ShoppingCart, User, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { isAuthenticated, user, cart, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-black border-b-8 border-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="text-white font-black text-2xl tracking-tight hover:text-[#00FF00] transition-colors">
            PESTAPORA
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-0">
            <Link
              to="/events"
              className="bg-white text-black px-6 py-3 font-black text-sm border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-[#00FF00] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase"
            >
              EVENTS
            </Link>
            {user?.isOrganizer && (
              <Link
                to="/dashboard"
                className="bg-[#FF0080] text-white px-6 py-3 font-black text-sm border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-white hover:text-[#FF0080] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase"
              >
                DASHBOARD
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-0">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative bg-[#00FFFF] text-black px-4 py-3 border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-black hover:text-[#00FFFF] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FF0000] text-white text-xs font-black w-6 h-6 rounded-none border-2 border-black flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Actions */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-0">
                <Link
                  to="/profile"
                  className="bg-white text-black px-4 py-3 border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-[#00FF00] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-[#FF0000] text-white px-4 py-3 border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-white hover:text-[#FF0000] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-0">
                <Link
                  to="/login"
                  className="bg-white text-black px-6 py-3 font-black text-sm border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-[#00FF00] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase"
                >
                  LOGIN
                </Link>
                <Link
                  to="/register"
                  className="bg-[#00FF00] text-black px-6 py-3 font-black text-sm border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-white hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase"
                >
                  REGISTER
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-t-4 border-black">
        <div className="flex items-center justify-around py-2">
          <Link
            to="/events"
            className="text-black font-black text-xs uppercase px-4 py-2 hover:bg-[#00FF00] transition-colors"
          >
            EVENTS
          </Link>
          {user?.isOrganizer && (
            <Link
              to="/dashboard"
              className="text-black font-black text-xs uppercase px-4 py-2 hover:bg-[#FF0080] hover:text-white transition-colors"
            >
              DASHBOARD
            </Link>
          )}
          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className="text-black font-black text-xs uppercase px-4 py-2 hover:bg-[#00FFFF] transition-colors"
              >
                LOGIN
              </Link>
              <Link
                to="/register"
                className="text-black font-black text-xs uppercase px-4 py-2 hover:bg-[#00FF00] transition-colors"
              >
                REGISTER
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};