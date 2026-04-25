import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import POSView from './views/POSView';
import ProductsView from './views/ProductsView';
import HistoryView from './views/HistoryView';
import AuthView from './views/AuthView';
import { LayoutGrid, Package, Clock, Store, User, LogOut, Settings as SettingsIcon, X } from 'lucide-react';

type Tab = 'pos' | 'products' | 'history';

function MainLayout() {
  const { isLoggedIn, logout, settings, updateSettings } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [tempStoreName, setTempStoreName] = useState(settings.storeName);

  if (!isLoggedIn) {
    return <AuthView />;
  }

  const handleSaveSettings = () => {
    updateSettings({ ...settings, storeName: tempStoreName });
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row h-screen bg-slate-50 text-slate-900 font-sans lg:overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-full lg:w-20 h-16 lg:h-full bg-white border-t lg:border-t-0 lg:border-r border-slate-200 flex flex-row lg:flex-col items-center justify-between lg:justify-start px-6 lg:px-0 lg:py-8 lg:space-y-8 z-20 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:shadow-none">
        <div className="hidden lg:flex w-12 h-12 bg-emerald-600 rounded-xl items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm" title={settings.storeName}>
          <Store className="w-6 h-6" />
        </div>

        <div className="flex flex-row lg:flex-col gap-8 lg:gap-6 w-full lg:w-auto justify-center">
          <NavItem 
            icon={<LayoutGrid className="w-6 h-6" />} 
            isActive={activeTab === 'pos'} 
            onClick={() => setActiveTab('pos')} 
          />
          <NavItem 
            icon={<Package className="w-6 h-6" />} 
            isActive={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
          />
          <NavItem 
            icon={<Clock className="w-6 h-6" />} 
            isActive={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
        </div>
        
        <div className="hidden lg:flex mt-auto flex-col gap-4">
           <button 
             onClick={() => setShowSettings(true)}
             className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
           >
             <SettingsIcon className="w-5 h-5" />
           </button>
           <button 
             onClick={() => setShowLogoutConfirm(true)}
             className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center font-bold text-red-500 hover:bg-red-100 transition-colors"
           >
             <LogOut className="w-5 h-5 ml-1" />
           </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto lg:overflow-hidden p-4 lg:p-6 pb-20 lg:pb-6 relative flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm shrink-0">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <Store className="w-5 h-5" />
             </div>
             <h1 className="font-bold text-slate-800 tracking-tight">{settings.storeName}</h1>
           </div>
           <div className="flex gap-2">
             <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
               <SettingsIcon className="w-5 h-5" />
             </button>
             <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
               <LogOut className="w-5 h-5" />
             </button>
           </div>
        </div>

        {activeTab === 'pos' && <POSView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'history' && <HistoryView />}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Pengaturan Toko</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Toko</label>
                 <input 
                   type="text" 
                   value={tempStoreName}
                   onChange={(e) => setTempStoreName(e.target.value)}
                   className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
                 />
              </div>
              <button 
                onClick={handleSaveSettings}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-sm transition-colors mt-4"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <LogOut className="w-8 h-8 ml-1" />
            </div>
            <h3 className="font-black text-xl text-slate-800 mb-2">Keluar Kasir?</h3>
            <p className="text-slate-500 font-medium mb-6">Anda harus memasukkan PIN lagi untuk masuk ke sistem.</p>
            <div className="flex gap-3">
               <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-slate-200 transition-colors">Batal</button>
               <button onClick={logout} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-red-600 transition-colors shadow-md shadow-red-200">Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, isActive, onClick }: { icon: React.ReactNode, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-emerald-50 text-emerald-600' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon}
    </button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

