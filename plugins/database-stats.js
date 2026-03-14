import { db } from '../database.js';

export default {
    command: ['.stats', '.status', '.cekdb'], // ubah command di sini 
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        
        // Membaca data terbaru dari database
        const data = db.read();
        const totalPushed = data.pushedContacts.length;

        // pesan laporan biar gampang dibaca
        let laporan = `📊 *STATISTIK BOT PUSH*\n\n`;
        laporan += `┌  ───\n`;
        laporan += `│ 👤 *Owner:* ${config.ownerName}\n`;
        laporan += `│ 🤖 *Bot Name:* ${config.botName}\n`;
        laporan += `│ 📈 *Total Push:* ${totalPushed} nomor\n`;
        laporan += `│ ⏳ *Delay:* ${config.delay.min / 1000}s - ${config.delay.max / 1000}s\n`;
        laporan += `└  ───\n\n`;
        laporan += `Semua nomor di atas telah tersimpan di database agar tidak terjadi duplikasi kirim.`;

        // Mengirim pesan dengan quoted (me-reply pesan user)
        await sock.sendMessage(from, { text: laporan }, { quoted: msg });
    }
};