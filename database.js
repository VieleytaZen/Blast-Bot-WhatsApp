// database.js
// Script ini di buat oleh Viel, jangan di hapus credit nya ya kak 🙏
// Untuk pertanyaan, saran, atau ingin request fitur bisa langsung DM ke Instagram saya: https://instagram.com/vieleyta_zen
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database.json');

// Fungsi inisialisasi struktur jika file hilang atau baru
const getInitialStructure = () => {
    const today = new Date().toISOString().split('T')[0];
    return { 
        pushedContacts: [], 
        exportedContacts: [], 
        history: { 
            lastPushDate: today, 
            todayCount: 0 
        } 
    };
};

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(getInitialStructure(), null, 2));
}

export const db = {
    _write(data) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    },

    read() {
        try {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        } catch (e) {
            return getInitialStructure();
        }
    },

    // Fungsi reset harian otomatis
    _checkResetDay() {
        const data = this.read();
        const today = new Date().toISOString().split('T')[0];
        
        if (!data.history) {
            data.history = { lastPushDate: today, todayCount: 0 };
        }

        if (data.history.lastPushDate !== today) {
            data.history.lastPushDate = today;
            data.history.todayCount = 0;
            this._write(data);
        }
        return data;
    },

    // --- INI FUNGSI YANG DICARI MENU.JS ---
    getTodayCount() {
        const data = this._checkResetDay();
        return data.history.todayCount || 0;
    },

    incrementTodayCount() {
        const data = this._checkResetDay();
        data.history.todayCount += 1;
        this._write(data);
    },

    // --- MANAJEMEN KONTAK ---
    addContact(jid) {
        if (!jid) return;
        const data = this.read();
        if (!data.pushedContacts.includes(jid)) {
            data.pushedContacts.push(jid);
            this._write(data);
        }
    },

    isPushed(jid) {
        return this.read().pushedContacts.includes(jid);
    },

    updateLidToNumber(lid, realJid) {
        const data = this.read();
        const index = data.pushedContacts.indexOf(lid);
        if (index !== -1 && lid !== realJid) {
            data.pushedContacts[index] = realJid;
            this._write(data);
            console.log(`\x1b[32m[DB UPDATE] LID ${lid} -> ${realJid}\x1b[0m`);
            return true;
        }
        return false;
    }
};