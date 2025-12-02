import React from 'react';
import { Beer, ClipboardList, LayoutDashboard, MessageSquareText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onChangeView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onChangeView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Mesas', icon: LayoutDashboard },
    { id: 'menu', label: 'Cardápio', icon: Beer },
    { id: 'history', label: 'Histórico', icon: ClipboardList },
    { id: 'assistant', label: 'Assistente AI', icon: MessageSquareText },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <Beer className="w-8 h-8 text-indigo-500" />
          <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            BarComanda
          </span>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2 lg:px-4">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'group-hover:text-indigo-400'}`} />
                <span className="hidden lg:block ml-3 font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-center lg:justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <span className="text-xs font-bold">ON</span>
            </div>
            <div className="hidden lg:block ml-3">
              <p className="text-sm font-medium text-white">Sistema Online</p>
              <p className="text-xs text-slate-500">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-10">
          <h1 className="text-xl font-semibold text-white capitalize">
            {navItems.find(n => n.id === activeView)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
             <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
               {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
             </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
