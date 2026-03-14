// plugins/database-stats.js
import { db } from '../database.js';

export default {
    command: ['.stats', '.status', '.cekdb'], 
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        
        // Proteksi Owner
        const sender = msg.key.participant || msg.key.remoteJid || "";
        const isOwner = sender.includes(config.ownerNumber) || sender.includes(config.ownerLid);
        if (!isOwner) return;

        // Membaca data terbaru dari database
        const data = db.read();
        const pushed = data.pushedContacts || [];
        const totalPushed = pushed.length;

        // Hitung rincian nomor (Nomor HP vs LID)
        const lidCount = pushed.filter(jid => jid.includes('@lid')).length;
        const phoneCount = pushed.filter(jid => jid.includes('@s.whatsapp.net')).length;
        const phonePercent = totalPushed > 0 ? ((phoneCount / totalPushed) * 100).toFixed(1) : 0;

        // Menyusun laporan yang digabung
        let laporan = `📊 *STATISTIK BOT PUSH*\n\n`;
        laporan += `┌  ─── [ *INFO BOT* ]\n`;
        laporan += `│ 👤 *Owner:* ${config.ownerName}\n`;
        laporan += `│ 🤖 *Bot Name:* ${config.botName}\n`;
        laporan += `│ ⏳ *Delay:* ${config.delay.min / 1000}s - ${config.delay.max / 1000}s\n`;
        laporan += `└  ───\n\n`;

        laporan += `┌  ─── [ *DATA DATABASE* ]\n`;
        laporan += `│ 📈 *Total Push:* ${totalPushed} nomor\n`;
        laporan += `│ ✅ *Nomor Asli:* ${phoneCount} (${phonePercent}%)\n`;
        laporan += `│ 🆔 *ID LID:* ${lidCount}\n`;
        laporan += `└  ───\n\n`;

        if (lidCount > 0) {
            laporan += `_Catatan: ${lidCount} ID LID akan otomatis berubah menjadi nomor asli saat mereka membalas chat bot._`;
        } else {
            laporan += `_Semua nomor tersimpan aman di database untuk menghindari duplikasi._`;
        }

        // Mengirim pesan dengan quoted
        await sock.sendMessage(from, { text: laporan }, { quoted: msg });
    }
};