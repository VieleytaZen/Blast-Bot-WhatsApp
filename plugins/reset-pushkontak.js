// plugins/reset-db.js
// Script ini di buat oleh Viel, jangan di hapus credit nya ya kak 🙏
// Untuk pertanyaan, saran, atau ingin request fitur bisa langsung DM ke Instagram saya: https://instagram.com/vieleyta_zen
import { db } from '../database.js';

export default {
    command: ['.reset', '.cleardb'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;

        // --- 1. LOGIKA CEK OWNER (MULTI-ID SUPPORT) ---
        const isOwner = config.owners.some(id => sender.includes(id));

        if (!isOwner) {
            return sock.sendMessage(from, { 
                text: `❌ Fitur ini hanya untuk Owner!\n\nID Kamu: ${sender}` 
            }, { quoted: msg });
        }

        // --- 2. VALIDASI ARGUMEN ---
        const type = args.toLowerCase().trim();

        if (type === 'export') {
            // Hanya menghapus riwayat ekspor (agar bisa VCF ulang semua nomor)
            db.clearExport();
            await sock.sendMessage(from, { 
                text: "✅ *Riwayat Ekspor Direset!*\n\nSekarang perintah `.vcf` akan mengambil seluruh nomor yang ada di database dari awal (bukan hanya nomor baru)." 
            }, { quoted: msg });

        } else if (type === 'limit') {
            // Mereset hitungan limit harian secara manual
            const data = db.read();
            data.history.todayCount = 0;
            db._write(data);
            await sock.sendMessage(from, { 
                text: "✅ *Limit Harian Direset!*\n\nHitungan limit hari ini kembali ke 0. Kamu bisa melakukan push lagi sekarang." 
            }, { quoted: msg });

        } else if (type === 'all') {
            // Reset Total (Pushed Contacts + Export + History)
            // Menggunakan pengaman konfirmasi tambahan
            if (!args.includes('--fix')) {
                return sock.sendMessage(from, { 
                    text: "⚠️ *PERINGATAN RESET TOTAL!*\n\nIni akan menghapus seluruh daftar nomor yang pernah di-push dan statistik.\n\nKetik: *.reset all --fix*" 
                }, { quoted: msg });
            }

            db.resetPushed(); // Memanggil fungsi reset total dari database.js
            await sock.sendMessage(from, { 
                text: "✅ *DATABASE TOTAL DIRESET!*\n\nSeluruh data telah dikosongkan. Bot kembali seperti baru." 
            }, { quoted: msg });

        } else {
            // Pesan bantuan jika user salah ketik atau tanpa argumen
            let helpText = `🛠️ *MENU RESET DATABASE* 🛠️\n\n`;
            helpText += `◦ *.reset export*\n_(Hapus riwayat ekspor agar bisa download VCF semua nomor)_\n\n`;
            helpText += `◦ *.reset limit*\n_(Reset hitungan limit harian ke 0)_\n\n`;
            helpText += `◦ *.reset all --fix*\n_(Hapus SEMUA data kontak & statistik)_`;
            
            await sock.sendMessage(from, { text: helpText }, { quoted: msg });
        }
    }
};