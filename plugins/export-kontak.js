// plugins/export-kontak.js
import fs from 'fs';
import { db } from '../database.js';

export default {
    command: ['.export', '.getnew'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
     
  // --- 1. LOGIKA CEK OWNER (SUPPORT LID & PHONE) ---
const sender = msg.key.participant || msg.key.remoteJid || "";
const isOwner = sender.includes(config.ownerNumber) || sender.includes(config.ownerLid);

if (!isOwner) {
    return sock.sendMessage(from, { 
        text: `❌ Fitur ini hanya untuk Owner!\n\nID Kamu: ${sender}` 
    }, { quoted: msg });
}
    if (!isOwner) {
        return sock.sendMessage(from, { text: "❌ Fitur ini hanya untuk Owner!" }, { quoted: msg });
    }
        // 2. Ambil data dari database
        const data = db.read();
        
        // FILTER: Ambil nomor yang sudah di-push tapi BELUM pernah di-ekspor
        // Pastikan exportedContacts sudah diinisialisasi di database.json (seperti instruksi sebelumnya)
        const exportedList = data.exportedContacts || [];
        const newContacts = data.pushedContacts.filter(jid => !exportedList.includes(jid));

        if (newContacts.length === 0) {
            return sock.sendMessage(from, { text: "⚠️ Tidak ada nomor baru untuk diekspor." }, { quoted: msg });
        }

        // 3. Tentukan tipe file (Default TXT jika tidak diisi)
        const type = args.toLowerCase() === 'vcf' ? 'vcf' : 'txt';
        const fileName = `./new_contacts_${Date.now()}.${type}`;

        // 4. Proses pembuatan file
        if (type === 'vcf') {
            let vcardData = "";
            newContacts.forEach((jid, index) => {
                const num = jid.split('@')[0];
                vcardData += `BEGIN:VCARD\nVERSION:3.0\nFN:NewPush ${index + 1}\nTEL;type=CELL;waid=${num}:+${num}\nEND:VCARD\n`;
            });
            fs.writeFileSync(fileName, vcardData);
        } else {
            const txtData = newContacts.map(jid => jid.split('@')[0]).join('\n');
            fs.writeFileSync(fileName, txtData);
        }

        // 5. Kirim File ke user
        await sock.sendMessage(from, { 
            document: fs.readFileSync(fileName), 
            fileName: `Data_Baru_${newContacts.length}.${type}`,
            caption: `✅ Berhasil ekspor ${newContacts.length} nomor baru.\n\nNomor ini otomatis ditandai dan tidak akan muncul lagi di ekspor berikutnya.`
        }, { quoted: msg });

        // 6. TANDAI: Masukkan nomor-nomor tadi ke daftar exportedContacts di database
        newContacts.forEach(jid => db.markAsExported(jid));

        // 7. Hapus file sampah di server
        fs.unlinkSync(fileName);
    }
};