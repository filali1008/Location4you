import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Car, FileText, Wallet, Receipt, BarChart3,
  Calendar, Shield, FolderOpen, Settings, Menu, X, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de Bord' },
  { to: '/flotte', icon: Car, label: 'Flotte' },
  { to: '/locations', icon: FileText, label: 'Contrats' },
  { to: '/charges', icon: Wallet, label: 'Charges' },
  { to: '/factures', icon: Receipt, label: 'Factures' },
  { to: '/rapports-financiers', icon: BarChart3, label: 'Rapports' },
  { to: '/planning', icon: Calendar, label: 'Planning' },
  { to: '/sinistres', icon: Shield, label: 'Sinistres' },
  { to: '/documents-drive', icon: FolderOpen, label: 'Documents' },
];

const BOTTOM_TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/flotte', icon: Car, label: 'Flotte' },
  { to: '/locations', icon: FileText, label: 'Contrats' },
  { to: '/factures', icon: Receipt, label: 'Factures' },
  { to: '/parametres', icon: Settings, label: 'Paramètres' },
];

function NavItem({ to, icon: Icon, label, mobile = false, onClick }: any) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
          mobile ? 'flex-col gap-0.5 px-2 py-1 text-xs' : '',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )
      }
    >
      <Icon className={mobile ? 'w-5 h-5' : 'w-4 h-4'} />
      <span className={mobile ? 'text-[10px] leading-tight' : ''}>{label}</span>
    </NavLink>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-card border-r border-border z-30">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Location4You</h1>
            <p className="text-xs text-muted-foreground">ERP Location</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-0.5">
          <NavItem to="/journal-audit" icon={FileText} label="Journal d'Audit" />
          <NavItem to="/parametres" icon={Settings} label="Paramètres" />
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 flex flex-col lg:hidden transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-sm">Location4You</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-0.5">
          <NavItem to="/journal-audit" icon={FileText} label="Journal d'Audit" onClick={() => setSidebarOpen(false)} />
          <NavItem to="/parametres" icon={Settings} label="Paramètres" onClick={() => setSidebarOpen(false)} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <Car className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Location4You</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom tabs */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-20 flex items-center justify-around px-2 py-1 safe-area-inset-bottom">
          {BOTTOM_TABS.map((item) => (
            <NavItem key={item.to} {...item} mobile={true} />
          ))}
        </nav>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}
