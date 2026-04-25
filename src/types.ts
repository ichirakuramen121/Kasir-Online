export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  barcode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'qris';

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  amountPaid: number;
  change: number;
  timestamp: number;
  paymentMethod: PaymentMethod;
}

export interface StoreSettings {
  storeName: string;
  qrisImage?: string;
}

