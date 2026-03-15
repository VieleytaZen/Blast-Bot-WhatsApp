// plugins/exec.js
import { exec } from 'child_process';

export default {
    command: ['$', '.shell', '.exec'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;
        const isOwner = config.owners.some(id => sender.includes(id));

        if (!isOwner) return;
        if (!args) return sock.sendMessage(from, { text: "Contoh: $ ls" });

        exec(args, (error, stdout, stderr) => {
            if (error) return sock.sendMessage(from, { text: `❌ *ERROR*\n\`\`\`${error.message}\`\`\`` });
            const output = stdout || stderr;
            sock.sendMessage(from, { text: `💻 *TERMINAL*\n\n\`\`\`${output}\`\`\`` }, { quoted: msg });
        });
    }
};