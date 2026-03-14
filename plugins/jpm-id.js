// plugins/jpm-id.js
import { db } from '../database.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
    command: ['.jpmid', '.pushid'], 
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;

        // 1. Logika Cek Owner
        const sender = msg.key.participant || msg.key.remoteJid || "";
        const isOwner = sender.includes(config.ownerNumber) || sender.includes(config.ownerLid);

        if (!isOwner) {
            return sock.sendMessage(from, { 
                text: `❌ Fitur ini hanya untuk Owner!` 
            }, { quoted: msg });
        }

        // 2. Validasi Input
        if (!args.includes('|')) {
            return sock.sendMessage(from, { 
                text: `⚠️ *Format Salah!*\nGunakan: .jpmid ID_GRUP | PESAN` 
            }, { quoted: msg });
        }

        const [targetId, ...pesanArray] = args.split('|');
        const targetIdTrimmed = targetId.trim();
        const pesanRaw = pesanArray.join('|').trim();

        try {
            // 3. Ambil Metadata Grup
            const metadata = await sock.groupMetadata(targetIdTrimmed).catch(() => null);
            if (!metadata) return sock.sendMessage(from, { text: "❌ ID Grup tidak valid!" });

            const participants = metadata.participants || [];
            
            await sock.sendMessage(from, { 
                text: `🚀 *Memulai Push*\nTarget: ${metadata.subject}\nTotal: ${participants.length} anggota.` 
            });

            let success = 0;

            for (let participant of participants) {
                const jid = participant.id;

                // Filter: Bukan diri sendiri & Belum pernah di-push
                const isMe = jid.includes(sock.user.id.split(':')[0]);
                if (isMe || db.isPushed(jid)) continue; 

                try {
                    // Spintax Processing
                    const finalMsg = pesanRaw.replace(/{([^{}]+)}/g, (m, o) => {
                        const choices = o.split('|');
                        return choices[Math.floor(Math.random() * choices.length)];
                    });

                    await sock.sendMessage(jid, { text: finalMsg });
                    
                    // Simpan ke Database
                    db.addContact(jid); 

                    success++;
                    console.log(`✅ Push Berhasil: ${jid}`);

                    // Delay Random agar lebih aman (3-6 detik)
                    await delay(Math.floor(Math.random() * 3000) + 3000); 
                } catch (e) {
                    console.log(`❌ Gagal kirim ke: ${jid}`);
                }
            }

            await sock.sendMessage(from, { 
                text: `✅ *Push Selesai!*\nBerhasil kirim ke: ${success} nomor baru.\nGrup: ${metadata.subject}` 
            }, { quoted: msg });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(from, { text: `❌ Terjadi kesalahan sistem.` });
        }
    }
};