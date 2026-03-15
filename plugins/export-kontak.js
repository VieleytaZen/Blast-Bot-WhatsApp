// plugins/export-kontak.js
// Script ini di buat oleh Viel, jangan di hapus credit nya ya kak 🙏
// Untuk pertanyaan, saran, atau ingin request fitur bisa langsung DM ke Instagram saya: https://instagram.com/vieleyta_zen
import { db } from '../database.js';
import fs from 'fs';

export default {
    command: ['.vcf', '.exportvcf'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        
        // 1. KEAMANAN OWNER
        const sender = msg.key.participant || from;
        const isOwner = config.owners.some(id => sender.includes(id));
        if (!isOwner) return;

        const data = db.read();
        const contacts = data.pushedContacts || [];

        // 2. FILTER: Hanya ambil yang mengandung '@s.whatsapp.net' (Nomor Asli)
        const realNumbers = contacts.filter(jid => jid.includes('@s.whatsapp.net'));

        if (realNumbers.length === 0) {
            return sock.sendMessage(from, { 
                text: "⚠️ *Gagal Export*\n\nBelum ada nomor asli di database. Saat ini semua masih berupa ID LID. Tunggu sampai mereka membalas chat bot agar ID-nya berubah menjadi nomor asli." 
            }, { quoted: msg });
        }

        let vcfContent = "";
        
        realNumbers.forEach((jid, index) => {
            // Ambil nomor murni (angka saja)
            const phoneNumber = jid.split('@')[0].split(':')[0].replace(/\D/g, '');
            
            vcfContent += `BEGIN:VCARD\n`;
            vcfContent += `VERSION:3.0\n`;
            vcfContent += `FN:Push ${index + 1}\n`; // Nama bersih tanpa label [LID]
            vcfContent += `TEL;TYPE=CELL;waid=${phoneNumber}:+${phoneNumber}\n`;
            vcfContent += `END:VCARD\n`;
        });

        const fileName = `./Kontak_Real_${realNumbers.length}.vcf`;
        fs.writeFileSync(fileName, vcfContent);

        try {
            await sock.sendMessage(from, { 
                document: fs.readFileSync(fileName), 
                fileName: `Kontak_Vielx_Real_${realNumbers.length}.vcf`,
                mimetype: 'text/vcard',
                caption: `✅ *Export Selesai*\n\nTotal: ${realNumbers.length} nomor asli.\n_(ID LID diabaikan agar kontak HP bersih)_`
            }, { quoted: msg });
        } catch (e) {
            console.error("Gagal kirim VCF:", e);
        }

        if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    }
};