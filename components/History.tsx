import React from 'react';
import { useBar } from '../context/BarContext';
import { TabStatus } from '../types';
import { Archive } from 'lucide-react';

export const History = () => {
  const { tabs, deleteTab } = useBar();
  const historyTabs = tabs.filter(t => t.status !== TabStatus.OPEN).sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center">
        <Archive className="w-6 h-6 mr-3 text-indigo-400" />
        Histórico de Comandas
      </h2>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700">
                <th className="p-4 font-medium">Mesa</th>
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Data/Hora Fechamento</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {historyTabs.length === 0 ? (
                 <tr>
                     <td colSpan={6} className="p-8 text-center text-slate-500">Nenhum histórico disponível.</td>
                 </tr>
              ) : historyTabs.map(tab => {
                const total = tab.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                const date = tab.closedAt ? new Date(tab.closedAt).toLocaleString('pt-BR') : '-';
                
                return (
                  <tr key={tab.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 text-white font-medium">{tab.tableNumber}</td>
                    <td className="p-4 text-slate-300">{tab.customerName || '-'}</td>
                    <td className="p-4 text-slate-400 text-sm">{date}</td>
                    <td className="p-4 text-emerald-400 font-bold">R$ {total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        tab.status === TabStatus.PAID ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {tab.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                       <button 
                         onClick={() => deleteTab(tab.id)}
                         className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                       >
                         Excluir
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
