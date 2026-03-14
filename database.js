// database.js
import fs from 'fs';

const DB_PATH = './database.json';

// Inisialisasi file
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ 
        pushedContacts: [], 
        exportedContacts: [] 
    }, null, 2));
}

export const db = {
    // 1. buat baca data dari file JSON
    read() {
        return JSON.parse(fs.readFileSync(DB_PATH));
    },
    
    // 2. buat fungsi untuk menambahkan nomor yang sudah di-push ke dalam database
    addContact(jid) {
        const data = this.read();
        if (!data.pushedContacts.includes(jid)) {
            data.pushedContacts.push(jid);
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        }
    },

    // 3. buat tanda biar ga ke ekspor nomornya, biar ga ke double export
    markAsExported(jid) {
        const data = this.read();
        if (!data.exportedContacts.includes(jid)) {
            data.exportedContacts.push(jid);
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        }
    },

    // 4. Fungsi Cek Status
    isPushed(jid) {
        return this.read().pushedContacts.includes(jid);
    },

    isExported(jid) {
        return this.read().exportedContacts.includes(jid);
    },

    // 5. LETAKKAN KODE BARU DI SINI (clearExport)
    clearExport() {
        const data = this.read();
        data.exportedContacts = []; // Mengosongkan daftar ekspor
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    }
};