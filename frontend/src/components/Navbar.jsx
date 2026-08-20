'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '../lib/authStore';
import { chatService } from '../lib/api';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const isCook = user?.cookProfile?.isCook || user?.role === 'cook';
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    if (chatService.socket) chatService.socket.disconnect();
    router.push('/');
  };

  const linkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === path
        ? 'bg-primary-100 text-primary-600'
        : 'text-gray-600 hover:text-primary-500 hover:bg-gray-50'
    }`;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-[1000]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-gray-900">
              HomeCook <span className="text-primary-500">Connect</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-1">
            <Link href="/explore" className={linkClass('/explore')}>
              Explore
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/chat" className={linkClass('/chat')}>
                  Messages
                </Link>
                <Link href="/requests" className={linkClass('/requests')}>
                  Cravings
                </Link>
                <Link href="/orders" className={linkClass('/orders')}>
                  Orders
                </Link>
                {isCook && (
                  <Link href="/dashboard" className={linkClass('/dashboard')}>
                    Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className={linkClass('/admin')}>
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm text-gray-600 hover:text-primary-500 font-medium">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
