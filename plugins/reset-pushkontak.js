// plugins/reset.js
import { db } from '../database.js';

export default {
    command: ['.reset', '.cleardb'], // Perintah yang memicu plugin
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        
        // 1. Keamanan: Cek apakah pengirim adalah owner
        const isOwner = from.split('@')[0] === config.ownerNumber;
        if (!isOwner) return;

        // 2. Mengambil argumen (misal: export)
        const type = args.toLowerCase().trim();

        if (type === 'export') {
            // Memanggil fungsi yang kita letakkan di database.js tadi
            db.clearExport();
            
            await sock.sendMessage(from, { 
                text: "✅ *Riwayat Ekspor Berhasil Direset!*\n\nSekarang jika kamu mengetik `.export`, bot akan mengambil semua nomor dari database (bukan cuma yang baru)." 
            }, { quoted: msg });

        } else if (type === 'all') {
            // Opsi tambahan jika kamu ingin mengosongkan semuanya (opsional)
            // Kamu bisa buat fungsi db.clearAll() di database.js jika butuh ini
            await sock.sendMessage(from, { 
                text: "⚠️ Fitur reset total dinonaktifkan demi keamanan. Gunakan `.reset export` saja." 
            });

        } else {
            // Pesan bantuan jika user hanya mengetik .reset tanpa argumen
            const helpText = `❓ *Cara Menggunakan Reset*:\n\n` +
                             `Gunakan command: *.reset export*\n\n` +
                             `_Fungsi ini akan membuat semua nomor yang sudah pernah diekspor sebelumnya bisa diekspor kembali._`;
            
            await sock.sendMessage(from, { text: helpText }, { quoted: msg });
        }
    }
};