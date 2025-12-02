import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Tab, TabStatus, OrderItem } from '../types';
import { INITIAL_MENU } from '../constants';

interface BarContextType {
  menu: Product[];
  tabs: Tab[];
  addProduct: (product: Product) => void;
  createTab: (tableNumber: string, customerName?: string) => void;
  addItemToTab: (tabId: string, productId: string, quantity: number) => void;
  closeTab: (tabId: string) => void;
  reopenTab: (tabId: string) => void;
  payTab: (tabId: string) => void;
  deleteTab: (tabId: string) => void;
}

const BarContext = createContext<BarContextType | undefined>(undefined);

export const BarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from constants
  const [menu, setMenu] = useState<Product[]>(INITIAL_MENU);
  
  // Initialize tabs from local storage or empty
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('bar_tabs');
    return saved ? JSON.parse(saved) : [];
  });

  // Save tabs to local storage on change
  useEffect(() => {
    localStorage.setItem('bar_tabs', JSON.stringify(tabs));
  }, [tabs]);

  const addProduct = (product: Product) => {
    setMenu(prev => [...prev, product]);
  };

  const createTab = (tableNumber: string, customerName?: string) => {
    const newTab: Tab = {
      id: Date.now().toString(),
      tableNumber,
      customerName,
      status: TabStatus.OPEN,
      items: [],
      openedAt: Date.now()
    };
    setTabs(prev => [...prev, newTab]);
  };

  const addItemToTab = (tabId: string, productId: string, quantity: number) => {
    const product = menu.find(p => p.id === productId);
    if (!product) return;

    setTabs(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;

      const newItem: OrderItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
        timestamp: Date.now()
      };

      return { ...tab, items: [...tab.items, newItem] };
    }));
  };

  const closeTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, status: TabStatus.CLOSED, closedAt: Date.now() } : tab
    ));
  };

  const reopenTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, status: TabStatus.OPEN, closedAt: undefined } : tab
    ));
  };

  const payTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, status: TabStatus.PAID } : tab
    ));
  };

  const deleteTab = (tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
  };

  return (
    <BarContext.Provider value={{ 
      menu, tabs, addProduct, createTab, addItemToTab, closeTab, reopenTab, payTab, deleteTab 
    }}>
      {children}
    </BarContext.Provider>
  );
};

export const useBar = () => {
  const context = useContext(BarContext);
  if (!context) throw new Error('useBar must be used within a BarProvider');
  return context;
};