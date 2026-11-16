'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Users,
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  LogOut,
  Building,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // If on login, register, or public payment link page, don't show the dashboard navbar
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/pay/')) {
    return null;
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/reports', label: 'Reports', icon: FileSpreadsheet },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight">
                IF
              </div>
              <span className="font-semibold text-base text-slate-900 tracking-tight">
                InvoiceFlow
              </span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 text-slate-500" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User & Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-medium text-slate-900 leading-tight">
                    {user.name}
                  </span>
                  <div className="flex items-center justify-end text-xs text-slate-500 space-x-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{user.bank || 'Bank'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-slate-100 px-4 py-2 flex space-x-2 overflow-x-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 mr-1 text-slate-500" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
};

