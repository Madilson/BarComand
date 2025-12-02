export enum ProductCategory {
  DRINK = 'Bebidas',
  FOOD = 'Comidas',
  COCKTAIL = 'Drinks',
  DESSERT = 'Sobremesas'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  description?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  timestamp: number;
}

export enum TabStatus {
  OPEN = 'Aberta',
  CLOSED = 'Fechada',
  PAID = 'Paga'
}

export interface Tab {
  id: string;
  tableNumber: string | number;
  customerName?: string;
  status: TabStatus;
  items: OrderItem[];
  openedAt: number;
  closedAt?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
