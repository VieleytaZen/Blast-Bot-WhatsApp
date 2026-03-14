// plugins/jpm-id.js
import { db } from '../database.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
    command: ['.jpmid', '.pushid'], 
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;

        // --- 1. LOGIKA CEK OWNER (FIXED) ---
        const sender = msg.key.participant || msg.key.remoteJid || "";
        const isOwner = sender.includes(config.ownerNumber) || sender.includes(config.ownerLid);

        if (!isOwner) {
            return sock.sendMessage(from, { 
                text: `❌ Fitur ini hanya untuk Owner!\n\nID Kamu: ${sender}` 
            }, { quoted: msg });
        }

        // 2. Validasi Input
        if (!args.includes('|')) {
            return sock.sendMessage(from, { 
                text: `⚠️ *Format Salah!*\n\nGunakan:\n.jpmid ID_GRUP | PESAN` 
            }, { quoted: msg });
        }

        const [targetId, ...pesanArray] = args.split('|');
        const targetIdTrimmed = targetId.trim();
        const pesan = pesanArray.join('|').trim();

        if (!targetIdTrimmed || !pesan) {
            return sock.sendMessage(from, { text: "⚠️ ID Grup atau Pesan tidak boleh kosong!" });
        }

        try {
            // 3. Ambil Metadata Grup (Paksa Refresh)
            // Menggunakan fetch karena kadang metadata cache baileys suka 0
            const metadata = await sock.groupMetadata(targetIdTrimmed).catch(() => null);
            
            if (!metadata) {
                return sock.sendMessage(from, { text: "❌ Gagal mendapatkan data grup. Pastikan ID benar dan bot ada di sana." });
            }

            const participants = metadata.participants || [];

            await sock.sendMessage(from, { 
                text: `🚀 *Memulai Push Kontak*\n\nTarget: ${metadata.subject}\nTotal Anggota: ${participants.length}\n\n_Mengirim ke semua ID (termasuk LID)..._` 
            });

            let success = 0;

            for (let participant of participants) {
                let jid = participant.id;

                // 1. Filter: Bukan diri sendiri
                const isMe = jid.includes(sock.user.id.split(':')[0]);
                if (isMe) continue;

                // 2. Cek Database (Hanya kirim jika belum pernah dipush)
                if (!db.isPushed(jid)) {
                    try {
                        // Fitur Spintax sederhana {Halo|Hai}
                        const finalMsg = pesan.replace(/{([^{}]+)}/g, (m, o) => {
                            const choices = o.split('|');
                            return choices[Math.floor(Math.random() * choices.length)];
                        });

                        await sock.sendMessage(jid, { text: finalMsg });
                        
                        // Simpan ke database agar tidak spam
                        db.addContact(jid);
                        success++;

                        // --- WAJIB DELAY (Minimal 3 detik) ---
                        // Tanpa ini, WhatsApp akan mendeteksi aktivitas bot sebagai spam
                        await delay(3000); 

                    } catch (e) {
                        console.log(`❌ Gagal kirim ke ${jid}:`, e.message);
                    }
                }
            }

            await sock.sendMessage(from, { 
                text: `✅ *Push Selesai!*\n\nBerhasil kirim ke: ${success} nomor.\nGrup: ${metadata.subject}` 
            }, { quoted: msg });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(from, { 
                text: `❌ *Error Terjadi!*\nID Grup mungkin salah atau koneksi bermasalah.` 
            });
        }
    }
};