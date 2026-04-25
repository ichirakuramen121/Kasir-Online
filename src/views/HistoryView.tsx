import React from 'react';
import { useAppContext } from '../context/AppContext';
import { formatIDR, formatDate } from '../utils';
import { Receipt, Calendar, ArrowRight, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function HistoryView() {
  const { transactions } = useAppContext();

  // Basic stats
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = transactions.length;
  
  // Get today's revenue
  const today = new Date().setHours(0, 0, 0, 0);
  const todayTransactions = transactions.filter(t => new Date(t.timestamp).setHours(0,0,0,0) === today);
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);

  const handleDownloadCSV = () => {
    const header = ['ID Transaksi', 'Tanggal', 'Metode Pembayaran', 'Total', 'Item'];
    const rows = transactions.map(t => [
      t.id,
      new Date(t.timestamp).toLocaleString('id-ID'),
      t.paymentMethod === 'qris' ? 'QRIS' : 'Tunai',
      t.total,
      t.items.map(i => `${i.quantity}x ${i.product.name}`).join('; ')
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [header.join(','), ...rows.map(e => e.map(String).map(s => `"${s.replace(/"/g, '""')}"`).join(','))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rekap-penjualan-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Generate chart data (last 7 days)
  const chartData = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0,0,0,0);
    
    const dayTransactions = transactions.filter(t => new Date(t.timestamp).setHours(0,0,0,0) === d.getTime());
    const dayTotal = dayTransactions.reduce((sum, t) => sum + t.total, 0);
    
    return {
      name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      total: dayTotal
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-6 gap-4 flex-1 lg:h-full lg:min-h-0">
      
      {/* Header Section */}
      <div className="lg:col-span-8 bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard & Laporan</h1>
          <p className="text-slate-500 text-sm mt-1">Laporan penjualan dan riwayat transaksi</p>
        </div>
        <button 
          onClick={handleDownloadCSV}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      {/* Quick Stats Top Right */}
      <div className="lg:col-span-4 bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-white">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Transaksi Hari Ini</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-slate-800">{todayTransactions.length}</p>
          <p className="text-sm font-medium text-slate-500">pesanan</p>
        </div>
      </div>

      {/* Main List Area */}
      <div className="lg:col-span-7 lg:row-span-5 bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col min-h-[500px] lg:min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-700">Daftar Transaksi</h2>
          {transactions.length > 0 && (
             <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg uppercase tracking-wider">
               Terbaru di atas
             </span>
          )}
        </div>
        
        <div className="flex-1 overflow-auto pr-2 space-y-3">
          {transactions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <svg className="w-12 h-12 opacity-30 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
              <p className="font-bold">Belum ada transaksi tercatat</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="bg-white border-2 border-slate-100 rounded-2xl p-4 hover:border-emerald-200 transition-all flex flex-col sm:flex-row gap-4 justify-between group"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-slate-50 text-slate-400 p-3 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors hidden sm:block shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="font-black text-slate-800 text-sm">#{transaction.id.toUpperCase()}</span>
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3" />
                        {formatDate(transaction.timestamp)}
                      </span>
                      {transaction.paymentMethod === 'qris' ? (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">QRIS</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Tunai</span>
                      )}
                    </div>
                    
                    <div className="mt-2 text-sm text-slate-600">
                      <div className="flex flex-wrap gap-2">
                        {transaction.items.map((item, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-xs">
                            <b className="text-slate-800">{item.quantity}x</b> {item.product.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-center border-t-2 border-dashed border-slate-100 sm:border-0 pt-3 sm:pt-0 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                    <p className="text-lg font-black text-emerald-600">{formatIDR(transaction.total)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-5 lg:row-span-5 flex flex-col gap-4">
        {/* Stats side panels */}
        <div className="bg-emerald-600 border-2 border-emerald-700 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-emerald-200/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-emerald-100 uppercase tracking-widest">Omzet Hari Ini</h3>
            <svg className="w-5 h-5 text-emerald-200" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div>
            <p className="text-3xl font-black">{formatIDR(todayRevenue)}</p>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col flex-1 min-h-[250px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Omzet 7 Hari Terakhir</h3>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tickFormatter={(val) => `Rp${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  formatter={(value: number) => [formatIDR(value), 'Omzet']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ringkasan Total</h3>
          
          <div className="space-y-4 flex-1">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Penjualan</p>
              <p className="text-lg font-black text-slate-800">{formatIDR(totalRevenue)}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Pesanan</p>
              <p className="text-lg font-black text-slate-800">{totalTransactions}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
