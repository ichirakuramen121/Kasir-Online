import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatIDR, generateId } from '../utils';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, X, QrCode, Banknote, Printer, CheckCircle, ScanBarcode } from 'lucide-react';
import { Transaction, PaymentMethod } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { jsPDF } from "jspdf";

export default function POSView() {
  const { products, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, addTransaction, settings } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [amountPaidStr, setAmountPaidStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Print state
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const handleGlobalScan = (barcode: string) => {
    // Check if modal is open, if so don't interfere
    if (isCheckoutOpen || isSuccessModalOpen || isScanning) return;
    
    const matched = products.find(p => p.barcode === barcode);
    if (matched) {
      addToCart(matched);
      setSearchTerm('');
    } else {
      alert(`Produk dengan barcode ${barcode} tidak ditemukan.`);
    }
  };

  useBarcodeScanner({
    onScan: handleGlobalScan,
    isActive: true
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['Semua', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const amountPaid = paymentMethod === 'cash' ? parseInt(amountPaidStr.replace(/\D/g, '') || '0', 10) : cartTotal;
  const change = paymentMethod === 'cash' ? amountPaid - cartTotal : 0;
  const isPaymentValid = paymentMethod === 'cash' ? (amountPaid >= cartTotal && cart.length > 0) : cart.length > 0;

  const handleCheckout = () => {
    if (!isPaymentValid) return;

    const transaction: Transaction = {
      id: generateId(),
      items: [...cart],
      total: cartTotal,
      amountPaid,
      change,
      timestamp: Date.now(),
      paymentMethod,
    };

    addTransaction(transaction);
    setLastTransaction(transaction);
    clearCart();
    setIsCheckoutOpen(false);
    setAmountPaidStr('');
    setPaymentMethod('cash');

    // Show success modal instead of auto-printing
    setIsSuccessModalOpen(true);
  };

  const handlePrint = () => {
    if (!lastTransaction) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200] // Receipt printer size width 80mm
    });

    let yPos = 10;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.text(settings.storeName.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
    
    yPos += 5;
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text("Struk Pembelian", pageWidth / 2, yPos, { align: "center" });

    yPos += 5;
    doc.setFontSize(8);
    const dateStr = new Date(lastTransaction.timestamp).toLocaleString('id-ID');
    doc.text(dateStr, pageWidth / 2, yPos, { align: "center" });

    yPos += 4;
    doc.text(`ID: ${lastTransaction.id}`, pageWidth / 2, yPos, { align: "center" });

    yPos += 5;
    doc.text("------------------------------------------------", pageWidth / 2, yPos, { align: "center" });

    yPos += 5;
    lastTransaction.items.forEach(item => {
      // Product name
      doc.text(item.product.name, 5, yPos);
      yPos += 4;
      
      // qty x price    total
      const qtyPrice = `${item.quantity}x @ ${formatIDR(item.product.price)}`;
      const totalItem = formatIDR(item.quantity * item.product.price);
      doc.text(qtyPrice, 5, yPos);
      doc.text(totalItem, pageWidth - 5, yPos, { align: "right" });
      yPos += 5;
    });

    doc.text("------------------------------------------------", pageWidth / 2, yPos, { align: "center" });

    yPos += 5;
    doc.setFont("courier", "bold");
    doc.text("TOTAL", 5, yPos);
    doc.text(formatIDR(lastTransaction.total), pageWidth - 5, yPos, { align: "right" });
    
    yPos += 5;
    doc.setFont("courier", "normal");
    doc.text("Metode", 5, yPos);
    doc.text(lastTransaction.paymentMethod === 'cash' ? 'Tunai' : 'QRIS', pageWidth - 5, yPos, { align: "right" });

    if (lastTransaction.paymentMethod === 'cash') {
      yPos += 4;
      doc.text("Tunai", 5, yPos);
      doc.text(formatIDR(lastTransaction.amountPaid), pageWidth - 5, yPos, { align: "right" });
      
      yPos += 4;
      doc.text("Kembali", 5, yPos);
      doc.text(formatIDR(lastTransaction.change), pageWidth - 5, yPos, { align: "right" });
    }

    yPos += 5;
    doc.text("------------------------------------------------", pageWidth / 2, yPos, { align: "center" });

    yPos += 5;
    doc.text("Terima Kasih", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 4;
    doc.setFontSize(6);
    doc.text("Barang yang sudah dibeli tidak", pageWidth / 2, yPos, { align: "center" });
    yPos += 3;
    doc.text("dapat ditukar/dikembalikan", pageWidth / 2, yPos, { align: "center" });

    doc.save(`struk-${lastTransaction.id}.pdf`);
  };

  const handlePresetPay = (amount: number) => {
    setAmountPaidStr(amount.toString());
  };

  const today = currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <>
      {/* 
        ========================================================================
        PRINT RECEIPT SECTION (Hidden normally, visible only when printing)
        ========================================================================
      */}
      {lastTransaction && (
        <div className="hidden print:block font-mono text-sm leading-tight text-black w-[80mm] p-4 absolute top-0 left-0 bg-white z-[9999]">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase">{settings.storeName}</h1>
            <p className="text-xs">Struk Pembelian</p>
            <p className="text-xs">{new Date(lastTransaction.timestamp).toLocaleString('id-ID')}</p>
            <p className="text-xs">ID: {lastTransaction.id}</p>
          </div>
          
          <div className="border-t border-dashed border-black py-2 mb-2">
            <table className="w-full text-sm">
              <tbody>
                {lastTransaction.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-1">
                      <div>{item.product.name}</div>
                      <div className="text-xs">{item.quantity} x {formatIDR(item.product.price)}</div>
                    </td>
                    <td className="py-1 text-right align-bottom">
                      {formatIDR(item.quantity * item.product.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-dashed border-black pt-2 space-y-1">
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{formatIDR(lastTransaction.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Metode</span>
              <span className="uppercase">{lastTransaction.paymentMethod === 'cash' ? 'Tunai' : 'QRIS'}</span>
            </div>
            {lastTransaction.paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between">
                  <span>Tunai</span>
                  <span>{formatIDR(lastTransaction.amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembali</span>
                  <span>{formatIDR(lastTransaction.change)}</span>
                </div>
              </>
            )}
          </div>
          <div className="text-center mt-8 text-xs">
            <p>Terima Kasih</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MAIN POS UI (Hidden during print)
        ========================================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-6 gap-4 flex-1 lg:h-full lg:min-h-0 print:hidden">
        
        {/* Header Section */}
        <div className="lg:col-span-8 bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{settings.storeName}</h1>
            <p className="text-slate-500 text-sm">{today} • {timeStr}</p>
          </div>
          <div className="relative w-full md:w-80 flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Cari produk / barcode..." 
                className="w-full bg-slate-100 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const matched = products.find(p => p.barcode === searchTerm);
                    if (matched) {
                      addToCart(matched);
                      setSearchTerm('');
                    }
                  }
                }}
              />
              <svg className="absolute left-3 top-3 text-slate-400 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <button
               onClick={() => setIsScanning(true)}
               className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 rounded-xl flex items-center justify-center transition-colors"
               title="Scan Barcode"
            >
               <ScanBarcode className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cashier Info */}
        <div className="lg:col-span-4 bg-emerald-600 border-2 border-emerald-700 rounded-3xl p-6 text-white flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <p className="text-emerald-100 text-xs uppercase font-bold tracking-wider">Kasir Aktif</p>
            <p className="text-lg font-semibold">Admin Kasir</p>
          </div>
        </div>

        {/* POS Items Grid */}
        <div className="lg:col-span-8 lg:row-span-5 bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col min-h-[500px] lg:min-h-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="font-bold text-slate-700">Daftar Produk</h2>
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-hide pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="border-2 border-slate-100 rounded-2xl p-3 text-center hover:border-emerald-500 focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative flex flex-col h-40 overflow-hidden"
              >
                <div className="w-full h-16 bg-slate-50 rounded-xl mb-2 flex flex-col items-center justify-center text-slate-400 group-hover:bg-emerald-50 transition-colors relative overflow-hidden">
                   {product.image ? (
                     <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                   ) : (
                     <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-1.5 rounded uppercase">{product.category}</span>
                   )}
                </div>
                <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{product.name}</p>
                <div className="mt-auto">
                  <p className="text-emerald-600 font-bold">{formatIDR(product.price)}</p>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Stok: {product.stock}</div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                <p className="font-medium text-sm">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-4 lg:row-span-5 bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col min-h-[400px] lg:min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-700">Daftar Belanja</h2>
            {cart.length > 0 && (
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">
                {totalItems} item
              </span>
            )}
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-30 text-slate-300" />
                <p className="font-medium text-sm">Belum ada pesanan</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex justify-between items-start text-sm border-b border-slate-50 pb-3 last:border-0 group">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-slate-800">{item.product.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.quantity} x {formatIDR(item.product.price)}</p>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 text-emerald-600"><Plus className="w-3 h-3" /></button>
                      <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 rounded bg-red-50 flex items-center justify-center hover:bg-red-100 text-red-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <p className="font-bold text-slate-800">{formatIDR(item.product.price * item.quantity)}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t-2 border-dashed border-slate-100 pt-4 space-y-3 shrink-0">
            <div className="flex justify-between text-slate-500 text-sm">
               <span>Subtotal</span>
               <span>{formatIDR(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-slate-900 pt-2">
               <span>TOTAL</span>
               <span className="text-emerald-600">{formatIDR(cartTotal)}</span>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={clearCart}
                disabled={cart.length === 0}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl disabled:opacity-50 transition-colors uppercase tracking-widest text-xs"
              >
                Batal
              </button>
              <button 
                onClick={() => setIsCheckoutOpen(true)}
                disabled={cart.length === 0}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 uppercase tracking-widest text-xs disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                Bayar Sekarang
              </button>
            </div>
          </div>
        </div>

        {/* Checkout Modal */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-lg text-slate-800">Pembayaran</h3>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium mb-1 uppercase tracking-widest">Total Tagihan</p>
                  <p className="text-3xl font-black text-slate-800">{formatIDR(cartTotal)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-3 rounded-xl font-bold flex flex-col items-center gap-2 border-2 transition-all ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                     <Banknote className="w-6 h-6" />
                     <span>Tunai</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('qris')}
                    className={`py-3 rounded-xl font-bold flex flex-col items-center gap-2 border-2 transition-all ${paymentMethod === 'qris' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                     <QrCode className="w-6 h-6" />
                     <span>QRIS</span>
                  </button>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-slate-700">Uang Diterima</label>
                    <input
                      type="text"
                      value={amountPaidStr}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setAmountPaidStr(raw);
                      }}
                      className="w-full text-2xl px-4 py-3 border-2 border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-slate-900 transition-colors"
                      placeholder="0"
                      autoFocus
                    />
                    
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[cartTotal, 50000, 100000].map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePresetPay(preset)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors"
                        >
                          {idx === 0 ? 'Uang Pas' : formatIDR(preset)}
                        </button>
                      ))}
                    </div>

                    {amountPaid > 0 && (
                      <div className={`p-4 rounded-2xl border-2 ${change >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">
                          {change >= 0 ? 'Kembalian' : 'Kurang'}
                        </p>
                        <p className="text-2xl font-black">
                          {formatIDR(Math.abs(change))}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'qris' && (
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                    <div className="w-48 h-48 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 mb-4">
                      {/* Placeholder for real QR code */}
                      <QrCode className="w-full h-full text-slate-800" strokeWidth={1} />
                    </div>
                    <p className="text-center font-bold text-slate-700">Scan QR Code ini dengan GoPay, OVO, Dana, atau Mobile Banking.</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={!isPaymentValid}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 text-sm uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Selesaikan & Cetak Struk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {isSuccessModalOpen && lastTransaction && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden">
             <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 p-8 flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                 <CheckCircle className="w-10 h-10" />
               </div>
               
               <h3 className="text-2xl font-black text-slate-800 mb-2">Transaksi Sukses!</h3>
               <p className="text-slate-500 font-medium mb-6">Pembayaran telah berhasil dicatat.</p>

               <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-6">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Belanja</p>
                 <p className="text-3xl font-black text-emerald-600">{formatIDR(lastTransaction.total)}</p>
                 {lastTransaction.paymentMethod === 'cash' && lastTransaction.change > 0 && (
                   <p className="text-sm font-bold text-slate-600 mt-2">Kembalian: {formatIDR(lastTransaction.change)}</p>
                 )}
               </div>

               <div className="w-full space-y-3">
                 <button
                   onClick={handlePrint}
                   className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 text-sm uppercase tracking-widest hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                 >
                   <Printer className="w-5 h-5" />
                   Cetak / Download Struk
                 </button>
                 <button
                   onClick={() => setIsSuccessModalOpen(false)}
                   className="w-full py-4 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                 >
                   Pesanan Baru
                 </button>
               </div>
             </div>
           </div>
        )}

        {/* Scanner Modal */}
        {isScanning && (
          <BarcodeScanner 
            onResult={(text) => {
              setIsScanning(false);
              const matched = products.find(p => p.barcode === text);
              if (matched) {
                addToCart(matched);
              } else {
                alert(`Produk dengan barcode ${text} tidak ditemukan.`);
              }
            }} 
            onClose={() => setIsScanning(false)} 
          />
        )}
      </div>
    </>
  );
}
