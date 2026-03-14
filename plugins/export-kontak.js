//buat export kontak yang sudah di push tapi belum pernah di ekspor, dengan format .export [vcf/txt]
import fs from 'fs';
import { db } from '../database.js';

export default {
    command: ['.export', '.getnew'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        const isOwner = from.split('@')[0] === config.ownerNumber;

        if (!isOwner) return;

        const data = db.read();
        
        // FILTER: Ambil nomor yang sudah di-push tapi BELUM pernah di-ekspor
        const newContacts = data.pushedContacts.filter(jid => !data.exportedContacts.includes(jid));

        if (newContacts.length === 0) {
            return sock.sendMessage(from, { text: "⚠️ Tidak ada nomor baru untuk diekspor." });
        }

        const type = args.toLowerCase() === 'vcf' ? 'vcf' : 'txt';
        const fileName = `./new_contacts_${Date.now()}.${type}`;

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

        // Kirim File
        await sock.sendMessage(from, { 
            document: fs.readFileSync(fileName), 
            fileName: `Data_Baru_${newContacts.length}.${type}`,
            caption: `✅ Berhasil ekspor ${newContacts.length} nomor baru.\nNomor ini tidak akan muncul lagi di ekspor berikutnya.`
        }, { quoted: msg });

        // TANDAI: Masukkan nomor-nomor tadi ke daftar exportedContacts
        newContacts.forEach(jid => db.markAsExported(jid));

        fs.unlinkSync(fileName);
    }
};