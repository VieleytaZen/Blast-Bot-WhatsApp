// plugins/menu.js
// Script ini di buat oleh Viel, jangan di hapus credit nya ya kak 🙏
// Untuk pertanyaan, saran, atau ingin request fitur bisa langsung DM ke Instagram saya: https://instagram.com/vieleyta_zen
import fs from 'fs';
import path from 'path';
import { db } from '../database.js'; // Pastikan database di-import untuk ambil angka limit

export default {
    command: ['.help'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;

        // Ambil data limit hari ini
        const todayCount = db.getTodayCount() || 0;
        const maxLimit = config.maxPushDay || 0;

        // Salam berdasarkan waktu
        const hour = new Date().getHours();
        let salam = "Selamat Malam";
        if (hour >= 5 && hour < 11) salam = "Selamat Pagi";
        else if (hour >= 11 && hour < 15) salam = "Selamat Siang";
        else if (hour >= 15 && hour < 18) salam = "Selamat Sore";

        // Baca folder plugins secara otomatis
        const pluginFolder = path.join(process.cwd(), 'plugins');
        const pluginFiles = fs.readdirSync(pluginFolder).filter(file => file.endsWith('.js'));

        let menuList = [];
        for (const file of pluginFiles) {
            try {
                const module = await import(`file://${path.join(pluginFolder, file)}?update=${Date.now()}`);
                const plugin = module.default || module;
                if (plugin && plugin.command) {
                    const cmdName = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command;
                    menuList.push(`│ ◦ ${cmdName}`);
                }
            } catch (e) {}
        }

        let teks = `👋 *Hi ${config.ownerName}, ${salam}!*\n`;
        teks += `🤖 Saya adalah *${config.botName}*\n\n`;
        
        teks += `┌  ─── [ *LIST COMMAND* ]\n`;
        teks += menuList.join('\n');
        teks += `\n└  ───\n\n`;

        teks += `┌  ─── [ *INFO SYSTEM* ]\n`;
        teks += `│ ⏳ *Delay:* ${config.delay.min/1000}-${config.delay.max/1000}s\n`;
        teks += `│ 🛡️ *Limit:* ${todayCount} / ${maxLimit} hari\n`; // Sudah diperbaiki
        teks += `└  ───\n\n`;

        teks += `_Klik gambar di atas untuk mengunjungi Instagram Owner._`;

        await sock.sendMessage(from, { 
            text: teks,
            contextInfo: {
                externalAdReply: {
                    title: `Official ${config.botName}`,
                    body: `Automated Marketing System`,
                    thumbnailUrl: config.thumbnailUrl, // Mengambil dari config
                    sourceUrl: config.instagramUrl,   // Mengambil dari config (Link IG)
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: msg });
    }
};