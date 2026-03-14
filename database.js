// database.js
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database.json');

export const db = {
    _write(data) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    },

    read() {
        try {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        } catch (e) {
            return { pushedContacts: [], exportedContacts: [], history: { lastPushDate: "", todayCount: 0 } };
        }
    },

    // Fungsi pengecekan hari (Reset otomatis setiap ganti tanggal)
    _checkResetDay() {
        const data = this.read();
        const today = new Date().toISOString().split('T')[0];
        
        if (!data.history) data.history = { lastPushDate: today, todayCount: 0 };

        if (data.history.lastPushDate !== today) {
            data.history.lastPushDate = today;
            data.history.todayCount = 0;
            this._write(data);
        }
        return data;
    },

    // Fungsi untuk menambah hitungan limit (dipanggil saat push berhasil)
    incrementTodayCount() {
        const data = this._checkResetDay();
        data.history.todayCount += 1;
        this._write(data);
    },

    // Fungsi untuk mengambil angka limit (UNTUK MENU.JS)
    getTodayCount() {
        const data = this._checkResetDay();
        return data.history.todayCount || 0;
    },

    // Sisa fungsi lainnya (addContact, updateLidToNumber, dll) tetap ada di bawah...
    addContact(jid) {
        const data = this.read();
        if (!data.pushedContacts.includes(jid)) {
            data.pushedContacts.push(jid);
            this._write(data);
        }
    }
};