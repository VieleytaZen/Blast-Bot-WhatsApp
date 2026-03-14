// database.js
import fs from 'fs';
import path from 'path';

// Menggunakan path absolute agar tidak error saat di-import dari folder plugins
const DB_PATH = path.join(process.cwd(), 'database.json');

// Inisialisasi file jika belum ada
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ 
        pushedContacts: [], 
        exportedContacts: [] 
    }, null, 2));
}

export const db = {
    // Fungsi internal untuk menulis data
    _write(data) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    },

    read() {
        try {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        } catch (e) {
            return { pushedContacts: [], exportedContacts: [] };
        }
    },
    
    addContact(jid) {
        const data = this.read();
        if (!data.pushedContacts.includes(jid)) {
            data.pushedContacts.push(jid);
            this._write(data);
        }
    },

    markAsExported(jid) {
        const data = this.read();
        if (!data.exportedContacts.includes(jid)) {
            data.exportedContacts.push(jid);
            this._write(data);
        }
    },

    isPushed(jid) {
        return this.read().pushedContacts.includes(jid);
    },

    clearExport() {
        const data = this.read();
        data.exportedContacts = [];
        this._write(data);
        return true;
    },

    // Tambahan: Untuk mengosongkan semua daftar push
    resetPushed() {
        const data = this.read();
        data.pushedContacts = [];
        this._write(data);
        return true;
    }
};