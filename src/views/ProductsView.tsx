import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatIDR, generateId } from '../utils';
import { Product } from '../types';
import { Plus, Edit2, Trash2, Search, PackageOpen, X, ImagePlus, ScanBarcode, Loader2 } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

export default function ProductsView() {
  const { products, setProducts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    image: '',
    barcode: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
        image: product.image || '',
        barcode: product.barcode || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', stock: '', category: '', image: '', barcode: '' });
    }
    setIsModalOpen(true);
  };

  const handleGlobalScan = (barcode: string) => {
    // If scanning while modal is open, just populate the form
    if (isModalOpen) {
       handleBarcodeScanned(barcode);
    } else {
       // Otherwise, try to find and edit the product, or open new product with that barcode
       const matched = products.find(p => p.barcode === barcode);
       if (matched) {
         setEditingProduct(matched);
         setFormData({
           name: matched.name,
           price: matched.price.toString(),
           stock: (matched.stock + 1).toString(), // Auto increment stock
           category: matched.category,
           image: matched.image || '',
           barcode: matched.barcode || ''
         });
         setIsModalOpen(true);
       } else {
         handleOpenModal();
         handleBarcodeScanned(barcode);
       }
    }
  };

  useBarcodeScanner({ onScan: handleGlobalScan, isActive: !isScanning });

  const handleBarcodeScanned = async (barcode: string) => {
    setIsScanning(false);

    // Cek apakah produk dengan barcode ini sudah ada
    const existingProduct = products.find(p => p.barcode === barcode);
    if (existingProduct) {
      // Jika ada, jadikan mode edit dan tambah stoknya di form
      setEditingProduct(existingProduct);
      setFormData({
        name: existingProduct.name,
        price: existingProduct.price.toString(),
        stock: (existingProduct.stock + 1).toString(),
        category: existingProduct.category,
        image: existingProduct.image || '',
        barcode: existingProduct.barcode || ''
      });
      return;
    }

    setFormData(prev => ({ ...prev, barcode }));
    setIsLoadingBarcode(true);

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      
      if (data.status === 1 && data.product) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || data.product.product_name || data.product.generic_name || prev.name,
          image: prev.image || data.product.image_url || prev.image,
          category: prev.category || (data.product.categories ? data.product.categories.split(',')[0] : prev.category)
        }));
      }
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
    } finally {
      setIsLoadingBarcode(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : generateId(),
      name: formData.name,
      price: Number(formData.price),
      stock: Number(formData.stock),
      category: formData.category || 'Lainnya',
      image: formData.image,
      barcode: formData.barcode
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? newProduct : p));
    } else {
      setProducts(prev => [...prev, newProduct]);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-6 gap-4 flex-1 lg:h-full lg:min-h-0">
      
      {/* Header Section */}
      <div className="lg:col-span-12 bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Produk</h1>
          <p className="text-slate-500 text-sm">Kelola daftar produk dan stok {products.length} item</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-colors flex items-center gap-2 whitespace-nowrap text-sm tracking-wider uppercase"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-12 lg:row-span-5 bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col min-h-[500px] lg:min-h-0 overflow-hidden">
        
        <div className="flex-1 overflow-auto pr-2">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <PackageOpen className="w-16 h-16 opacity-30 text-slate-300" />
              <p className="font-bold text-slate-500">Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-2">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-500 transition-colors flex flex-col group overflow-hidden relative h-full">
                  <div className="w-full h-32 bg-slate-50 relative overflow-hidden shrink-0 border-b-2 border-slate-100">
                    {product.image ? (
                      <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <PackageOpen className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-white/90 backdrop-blur-sm text-slate-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm">
                        {product.category}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button 
                        onClick={() => handleOpenModal(product)} 
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors bg-white shadow-sm border border-slate-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-white shadow-sm border border-slate-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-emerald-600 font-black text-lg mb-3">{formatIDR(product.price)}</p>
                    
                    <div className="mt-auto pt-3 border-t-2 border-dashed border-slate-100 flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium text-xs uppercase tracking-widest">Sisa Stok</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-xs ${product.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-700'}`}>
                        {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              <div className="flex flex-col items-center mb-6">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer overflow-hidden relative"
                 >
                    {formData.image ? (
                      <img src={formData.image} alt={formData.name} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Foto</span>
                      </>
                    )}
                 </div>
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   ref={fileInputRef}
                   onChange={handleImageChange}
                 />
                 <p className="text-[10px] text-slate-400 mt-2">Opsional: Upload ke Google Sheet</p>
              </div>

              {/* Barcode Section */}
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Barcode</label>
                  <button 
                    type="button" 
                    onClick={() => setIsScanning(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <ScanBarcode className="w-4 h-4" /> Scan
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium text-slate-800"
                    placeholder="Scan atau ketik barcode..."
                  />
                  {isLoadingBarcode && (
                    <Loader2 className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-800"
                  placeholder="Misal: Beras 5kg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Harga (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-800"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-800"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kategori</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-800"
                  placeholder="Sembako, Minuman..."
                />
              </div>

              <div className="pt-4 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all uppercase tracking-widest text-sm"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scanner Component */}
      {isScanning && (
        <BarcodeScanner 
          onResult={handleBarcodeScanned} 
          onClose={() => setIsScanning(false)} 
        />
      )}
    </div>
  );
}
