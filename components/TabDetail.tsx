import React, { useState, useMemo } from 'react';
import { useBar } from '../context/BarContext';
import { Product, ProductCategory, TabStatus } from '../types';
import { ArrowLeft, Check, Plus, Minus, Search, Coffee, Beer, Utensils, IceCream, Receipt, X, Layers, List } from 'lucide-react';

interface TabDetailProps {
  tabId: string;
  onBack: () => void;
}

export const TabDetail: React.FC<TabDetailProps> = ({ tabId, onBack }) => {
  const { tabs, menu, addItemToTab, closeTab, payTab, reopenTab } = useBar();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGrouped, setIsGrouped] = useState(false);

  const tab = tabs.find(t => t.id === tabId);

  if (!tab) return <div>Comanda não encontrada</div>;

  const total = tab.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Group items for display
  const displayItems = useMemo(() => {
    if (isGrouped) {
      const grouped: Record<string, { id: string, name: string, quantity: number, price: number, total: number, timestamp?: number }> = {};
      tab.items.forEach(item => {
        if (!grouped[item.productId]) {
          grouped[item.productId] = {
            id: item.productId,
            name: item.productName,
            quantity: 0,
            price: item.price,
            total: 0
          };
        }
        grouped[item.productId].quantity += item.quantity;
        grouped[item.productId].total += (item.price * item.quantity);
      });
      return Object.values(grouped);
    } else {
      return tab.items.map(item => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        timestamp: item.timestamp
      }));
    }
  }, [tab.items, isGrouped]);

  const filteredMenu = menu.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'Tudo', icon: Search },
    { id: ProductCategory.COCKTAIL, label: 'Drinks', icon: Beer },
    { id: ProductCategory.FOOD, label: 'Comidas', icon: Utensils },
    { id: ProductCategory.DRINK, label: 'Bebidas', icon: Coffee },
    { id: ProductCategory.DESSERT, label: 'Doces', icon: IceCream },
  ];

  const handleCloseTab = () => {
    if (confirm('Deseja realmente fechar esta conta?')) {
      closeTab(tab.id);
      onBack();
    }
  };

  const isClosed = tab.status !== TabStatus.OPEN;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:flex-row gap-6">
      {/* Left Column: Order Summary (Cart) */}
      <div className="w-full lg:w-1/3 flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">Mesa {tab.tableNumber}</h2>
              {tab.customerName && <p className="text-slate-400">{tab.customerName}</p>}
            </div>
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
              tab.status === TabStatus.OPEN ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {tab.status}
            </span>
          </div>
        </div>

        {/* Grouping Toggle Toolbar */}
        <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-900/20 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {isGrouped ? 'Itens Agrupados' : 'Ordem de Pedido'}
            </span>
            <button
                onClick={() => setIsGrouped(!isGrouped)}
                className={`flex items-center text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
                    isGrouped 
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20' 
                    : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700 hover:text-white'
                }`}
            >
                {isGrouped ? (
                    <><List className="w-3.5 h-3.5 mr-1.5" /> Ver Detalhado</>
                ) : (
                    <><Layers className="w-3.5 h-3.5 mr-1.5" /> Agrupar Pedidos</>
                )}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
              <Receipt className="w-12 h-12 mb-2" />
              <p>Nenhum item adicionado</p>
            </div>
          ) : (
            displayItems.map((item, idx) => (
              <div key={item.id || idx} className="flex justify-between items-center bg-slate-700/30 p-3 rounded-lg border border-slate-700/50">
                <div>
                  <div className="flex items-center">
                    <span className="font-bold text-indigo-400 mr-2">{item.quantity}x</span>
                    <span className="text-slate-200">{item.name}</span>
                  </div>
                  <div className="flex items-center mt-1 gap-2">
                    <span className="text-xs text-slate-500">
                        Unit: R$ {item.price.toFixed(2)}
                    </span>
                    {!isGrouped && item.timestamp && (
                        <>
                            <span className="text-slate-600 text-[10px]">•</span>
                            <span className="text-xs text-slate-500">
                                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </>
                    )}
                  </div>
                </div>
                <div className="font-semibold text-white">
                  R$ {item.total.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-700">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400">Total</span>
            <span className="text-3xl font-bold text-white">R$ {total.toFixed(2)}</span>
          </div>
          
          {tab.status === TabStatus.OPEN ? (
            <button 
              onClick={handleCloseTab}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 transition-all flex items-center justify-center"
            >
              <Check className="w-5 h-5 mr-2" />
              Fechar Conta
            </button>
          ) : (
             <div className="flex gap-2">
                 {tab.status === TabStatus.CLOSED && (
                     <button
                         onClick={() => payTab(tab.id)}
                         className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
                     >
                         Marcar Pago
                     </button>
                 )}
                 <button
                     onClick={() => reopenTab(tab.id)}
                     className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all flex justify-center items-center"
                 >
                     <X className="w-4 h-4 mr-2" /> Reabrir
                 </button>
             </div>
          )}
        </div>
      </div>

      {/* Right Column: Menu Grid */}
      {tab.status === TabStatus.OPEN && (
        <div className="flex-1 flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-all border ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <cat.icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMenu.map(product => (
                <div 
                  key={product.id}
                  onClick={() => addItemToTab(tab.id, product.id, 1)}
                  className="bg-slate-700/30 hover:bg-slate-700 border border-slate-700/50 hover:border-indigo-500/50 p-4 rounded-xl cursor-pointer transition-all group flex flex-col h-full"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-semibold text-slate-500 uppercase">{product.category}</span>
                       <span className="text-emerald-400 font-bold">R$ {product.price.toFixed(2)}</span>
                    </div>
                    <h3 className="text-white font-medium leading-tight mb-1">{product.name}</h3>
                    {product.description && <p className="text-slate-400 text-xs line-clamp-2">{product.description}</p>}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-600/30 flex items-center justify-center text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium text-sm">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};