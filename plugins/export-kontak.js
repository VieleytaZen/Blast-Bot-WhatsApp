// plugins/export-kontak.js
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

        if (contacts.length === 0) return sock.sendMessage(from, { text: "⚠️ Database kosong!" });

        let vcfContent = "";
        
        contacts.forEach((jid, index) => {
            // Logika deteksi yang lebih ketat
            const isLid = jid.includes('@lid');
            const isRealNumber = jid.includes('@s.whatsapp.net');
            
            // Ambil ID murni (hanya angka)
            const idOnly = jid.split('@')[0].split(':')[0].replace(/\D/g, '');
            
            // Penamaan Kontak
            let contactName;
            if (isRealNumber) {
                contactName = `Push ${index + 1}`; // Nomor asli tanpa label [LID]
            } else {
                contactName = `Push ${index + 1} [LID]`;
            }
            
            vcfContent += `BEGIN:VCARD\n`;
            vcfContent += `VERSION:3.0\n`;
            vcfContent += `FN:${contactName}\n`;
            
            if (isLid && !isRealNumber) {
                // Jika MURNI LID (tidak mengandung @s.whatsapp.net)
                vcardContent += `TEL;TYPE=CELL;waid=${idOnly}:+${idOnly}\n`;
            } else {
                // Jika nomor asli ATAU LID yang sudah ter-update jadi nomor
                vcfContent += `TEL;TYPE=CELL;waid=${idOnly}:+${idOnly}\n`;
            }
            
            vcfContent += `END:VCARD\n`;
        });

        const fileName = './Hasil_Export.vcf';
        fs.writeFileSync(fileName, vcfContent);

        await sock.sendMessage(from, { 
            document: fs.readFileSync(fileName), 
            fileName: `Kontak_Vielx_${contacts.length}.vcf`,
            mimetype: 'text/vcard',
            caption: `✅ *Export Selesai*\n\nTotal: ${contacts.length} kontak.\n\n_Catatan: Jika nomor sudah asli, label [LID] akan hilang otomatis._`
        }, { quoted: msg });

        fs.unlinkSync(fileName);
    }
};