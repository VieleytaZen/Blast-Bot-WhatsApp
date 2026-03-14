import fs from 'fs';
import { db } from '../database.js';

export default {
    command: ['.export', '.getnew'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid || "";
        const isOwner = sender.includes(config.ownerNumber) || sender.includes(config.ownerLid);

        if (!isOwner) return;

        const data = db.read();
        // Fallback jika database belum ada isinya
        const pushedContacts = data.pushedContacts || [];
        const exportedList = data.exportedContacts || [];

        // Ambil nomor yang belum diekspor
        const newContacts = pushedContacts.filter(jid => !exportedList.includes(jid));

        if (newContacts.length === 0) {
            return sock.sendMessage(from, { text: "⚠️ Database kosong atau semua nomor sudah pernah diekspor sebelumnya." }, { quoted: msg });
        }

        // Paksa ke VCF untuk auto-save
        const fileName = `./Export_Kontak_${Date.now()}.vcf`;

        let vcardData = "";
        newContacts.forEach((jid, index) => {
            // Pembersihan ID agar murni angka
            const num = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            if (num.length > 5) { // Validasi nomor minimal
                vcardData += `BEGIN:VCARD\nVERSION:3.0\nFN:PushByVielx ${index + 1}\nTEL;type=CELL;waid=${num}:+${num}\nEND:VCARD\n`;
            }
        });

        // Pastikan vcardData tidak kosong
        if (!vcardData) {
            return sock.sendMessage(from, { text: "❌ Gagal membuat data kontak. Format ID di database mungkin tidak valid." });
        }

        fs.writeFileSync(fileName, vcardData);

        // KIRIM DENGAN MIME-TYPE CONTACT (BUKAN DOCUMENT BIASA)
        await sock.sendMessage(from, { 
            document: fs.readFileSync(fileName), 
            fileName: `Kontak_Baru_${newContacts.length}.vcf`,
            mimetype: 'text/vcard', // INI KUNCINYA AGAR TIDAK JADI PDF
            caption: `✅ *Berhasil Ekspor*\n\nTotal: ${newContacts.length} Nomor\n\n_Klik file di atas -> Buka dengan Kontak -> Simpan._`
        }, { quoted: msg });

        // Tandai sudah diekspor
        newContacts.forEach(jid => db.markAsExported(jid));
        
        // Hapus file setelah dikirim
        setTimeout(() => { if (fs.existsSync(fileName)) fs.unlinkSync(fileName) }, 2000);
    }
};