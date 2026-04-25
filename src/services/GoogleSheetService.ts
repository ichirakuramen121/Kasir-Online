import { Transaction, Product } from '../types';

/**
 * PANDUAN INTEGRASI PADA GOOGLE SPREADSHEET (MENGGUNAKAN APPS SCRIPT)
 * 1. Buka Google Sheet baru
 * 2. Klik Ekstensi > Apps Script
 * 3. Paste kode berikut:
 * 
 * function doPost(e) {
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *   var action = e.parameter.action;
 *   var data = JSON.parse(e.postData.contents);
 *   if(action == 'addTransaction') {
 *     sheet.appendRow([data.id, data.timestamp, data.total, data.paymentMethod, JSON.stringify(data.items)]);
 *   } else if (action == 'syncProducts') {
 *     // Clear and replace products
 *   }
 *   return ContentService.createTextOutput(JSON.stringify({"success": true})).setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * 4. Klik Terapkan (Deploy) > Deployment Baru -> Pilih "Aplikasi Web", Opsi akses: "Siapa saja"
 * 5. Copy URL Deployment dan paste di file .env (VITE_SHEETS_ENDPOINT) atau gunakan API key.
 */

const ENDPOINT = (import.meta as any).env?.VITE_SHEETS_ENDPOINT;

export const syncTransactionToSheet = async (transaction: Transaction) => {
  if (!ENDPOINT) {
    console.warn("Google Sheet Sync: VITE_SHEETS_ENDPOINT belum diatur. Simulasi sukses.");
    return true; // Mock success
  }

  try {
    const response = await fetch(`${ENDPOINT}?action=addTransaction`, {
      method: "POST",
      body: JSON.stringify(transaction),
      headers: { "Content-Type": "application/json" }
    });
    return response.ok;
  } catch (error) {
    console.error("Gagal sinkronisasi ke Google Sheet", error);
    return false;
  }
};

export const syncProductsToSheet = async (products: Product[]) => {
  if (!ENDPOINT) {
    console.warn("Google Sheet Sync: VITE_SHEETS_ENDPOINT belum diatur. Simulasi sukses.");
    return true;
  }
  
  try {
    const response = await fetch(`${ENDPOINT}?action=syncProducts`, {
      method: "POST",
      body: JSON.stringify(products),
      headers: { "Content-Type": "application/json" }
    });
    return response.ok;
  } catch (error) {
    console.error("Gagal sinkronisasi produk", error);
    return false;
  }
};
