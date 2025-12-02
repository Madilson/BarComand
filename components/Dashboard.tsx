import React, { useState } from 'react';
import { useBar } from '../context/BarContext';
import { TabStatus, Tab, Product } from '../types';
import { Plus, Users, Receipt, ShoppingCart, ChevronRight, CheckCircle, Clock, Trash2, RotateCcw } from 'lucide-react';

interface DashboardProps {
  onSelectTab: (tabId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTab }) => {
  const { tabs, createTab, closeTab, deleteTab, reopenTab } = useBar();
  const [isCreating, setIsCreating] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newCustName, setNewCustName] = useState('');

  const activeTabs = tabs.filter(t => t.status === TabStatus.OPEN);
  const totalRevenue = activeTabs.reduce((acc, tab) => {
    return acc + tab.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTableNum) {
      createTab(newTableNum, newCustName);
      setNewTableNum('');
      setNewCustName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Mesas Abertas</p>
              <h3 className="text-3xl font-bold text-white mt-1">{activeTabs.length}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total em Aberto</p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-1">
                R$ {totalRevenue.toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-2xl border border-indigo-500 shadow-lg flex items-center justify-center cursor-pointer hover:shadow-indigo-500/25 transition-all"
             onClick={() => setIsCreating(true)}>
          <div className="flex flex-col items-center text-white">
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-bold text-lg">Nova Comanda</span>
          </div>
        </div>
      </div>

      {/* Active Tabs Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-indigo-400" />
          Em Andamento
        </h2>
        
        {activeTabs.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-800 border-dashed">
            <p className="text-slate-500">Nenhuma mesa aberta no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeTabs.map(tab => (
              <TabCard key={tab.id} tab={tab} onClick={() => onSelectTab(tab.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Modal for New Tab */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-6">Abrir Nova Comanda</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Número da Mesa *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTableNum}
                  onChange={e => setNewTableNum(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Ex: 12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Cliente (Opcional)</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Ex: João"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-900/50 transition-all"
                >
                  Abrir Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TabCard: React.FC<{ tab: Tab; onClick: () => void }> = ({ tab, onClick }) => {
  const total = tab.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = tab.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div 
      onClick={onClick}
      className="bg-slate-800 rounded-2xl border border-slate-700 p-5 cursor-pointer hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Receipt className="w-16 h-16 text-indigo-400" />
      </div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h4 className="text-2xl font-bold text-white">Mesa {tab.tableNumber}</h4>
          {tab.customerName && <p className="text-slate-400 text-sm truncate">{tab.customerName}</p>}
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
          Aberta
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 flex items-center">
            <ShoppingCart className="w-4 h-4 mr-2" /> Itens
          </span>
          <span className="text-slate-200 font-medium">{itemCount}</span>
        </div>
        <div className="h-px bg-slate-700/50" />
        <div className="flex justify-between items-end">
          <span className="text-slate-400 text-sm pb-1">Total</span>
          <span className="text-2xl font-bold text-white">R$ {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};