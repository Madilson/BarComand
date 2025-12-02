import { Product, ProductCategory } from './types';

export const INITIAL_MENU: Product[] = [
  { id: '1', name: 'Caipirinha Clássica', price: 25.00, category: ProductCategory.COCKTAIL, description: 'Cachaça, limão e açúcar' },
  { id: '2', name: 'Gin Tônica', price: 32.00, category: ProductCategory.COCKTAIL, description: 'Gin importado, tônica e especiarias' },
  { id: '3', name: 'Cerveja Artesanal IPA', price: 18.00, category: ProductCategory.DRINK, description: '500ml' },
  { id: '4', name: 'Água sem Gás', price: 6.00, category: ProductCategory.DRINK, description: '350ml' },
  { id: '5', name: 'Batata Frita Rústica', price: 28.00, category: ProductCategory.FOOD, description: 'Com alecrim e alho' },
  { id: '6', name: 'Hambúrguer da Casa', price: 35.00, category: ProductCategory.FOOD, description: 'Blend 180g, queijo cheddar, bacon' },
  { id: '7', name: 'Dadinho de Tapioca', price: 24.00, category: ProductCategory.FOOD, description: 'Acompanha geleia de pimenta' },
  { id: '8', name: 'Petit Gâteau', price: 22.00, category: ProductCategory.DESSERT, description: 'Com sorvete de creme' },
  { id: '9', name: 'Moscow Mule', price: 30.00, category: ProductCategory.COCKTAIL, description: 'Vodka, espuma de gengibre e limão' },
  { id: '10', name: 'Refrigerante Lata', price: 7.00, category: ProductCategory.DRINK, description: 'Coca-cola, Guaraná' },
];
