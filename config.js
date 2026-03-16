// config.js
// Script ini di buat oleh Viel, jangan di hapus credit nya ya kak 🙏
// Untuk pertanyaan, saran, atau ingin request fitur bisa langsung DM ke Instagram saya: https://instagram.com/vieleyta_zen
const config = {
    // 1. List semua ID (Nomor, LID Grup, LID Pribadi) untuk akses fitur
    owners: ["6282133692292", "83227876290608", "101352772509932"], 

    // 2. NOMOR HP ASLI (Hanya angka) untuk dikirim saat ketik .owner
    ownerNumber: "6282133692292", 
    
    ownerName: "Kii",
    botName: "Viel Bot",
    sessionName: "session_esm",     // Nama folder untuk menyimpan session login
    
    // --- PENGATURAN PUSH KONTAK ---
    delay: {
        min: 7000,                  // Jeda minimal (7 detik)
        max: 15000                  // Jeda maksimal (15 detik)
    },

    // --- SOSIAL MEDIA & TAMPILAN ---
    instagramUrl: "https://instagram.com/vieleyta_zen", // Ganti dengan link IG kamu
    thumbnailUrl: "https://telegra.ph/file/241f71128399589d13695.jpg", // Ganti dengan link foto/logo bot
    
    // --- KEAMANAN & LIMIT ---
    // Atur limit sesuai "umur" nomor kamu (Saran: 50 untuk nomor baru, 200 untuk nomor lama)
    maxPushDay: 200,                // Maksimal pesan push per hari
    
    // --- PESAN OTOMATIS ---
    msgWait: "🚀 *Proses Push dimulai...*\nMohon tunggu sebentar ya kak, bot sedang bekerja.",
    msgDone: "✅ *Alhamdulillah, proses push selesai!*",
    msgError: "❌ *Waduh!* Sepertinya ada masalah teknis saat mengirim pesan.",
    msgLimit: "⚠️ *Limit Harian Tercapai!*\nBot berhenti otomatis demi keamanan nomor agar tidak diblokir WhatsApp. Lanjutkan lagi besok ya!"
};

export default config;
