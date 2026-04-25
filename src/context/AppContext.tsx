import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Transaction, StoreSettings } from '../types';
import { syncTransactionToSheet, syncProductsToSheet } from '../services/GoogleSheetService';

interface AppContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  isLoggedIn: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  settings: StoreSettings;
  updateSettings: (newSettings: StoreSettings) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Kopi Susu Gula Aren', price: 15000, stock: 50, category: 'Minuman' },
  { id: '2', name: 'Nasi Goreng Spesial', price: 25000, stock: 20, category: 'Makanan' },
  { id: '3', name: 'Es Teh Manis', price: 5000, stock: 100, category: 'Minuman' },
  { id: '4', name: 'Kerupuk Udang', price: 2000, stock: 100, category: 'Snack' },
  { id: '5', name: 'Ayam Geprek', price: 20000, stock: 15, category: 'Makanan' },
  { id: '6', name: 'Air Mineral', price: 4000, stock: 50, category: 'Minuman' },
];

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Toko UMKM Kita',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('umkm_logged_in') === 'true';
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('umkm_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('umkm_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('umkm_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('umkm_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('umkm_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('umkm_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('umkm_products', JSON.stringify(products));
    syncProductsToSheet(products); // Auto sync on change
  }, [products]);

  useEffect(() => {
    localStorage.setItem('umkm_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('umkm_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const login = (pin: string) => {
    if (pin === '123456') { // Simple hardcoded PIN for demo
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
    
    // Sync to sheet
    syncTransactionToSheet(transaction);

    // Deduct stock
    setProducts((prev) => 
      prev.map((p) => {
        const cartItem = transaction.items.find(item => item.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        products,
        setProducts,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        transactions,
        addTransaction,
        isLoggedIn,
        login,
        logout,
        settings,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

