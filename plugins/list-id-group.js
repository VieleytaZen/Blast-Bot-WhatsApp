
export default {
    command: ['.listid', '.cekgc'],
    run: async (sock, msg, args, config) => {
        const groups = await sock.groupFetchAllParticipating();
        let teks = "*DAFTAR GRUP BOT*\n\n";
        for (let res of Object.values(groups)) {
            teks += `👥 *${res.subject}*\n🆔 \`${res.id}\`\n\n`;
        }
        await sock.sendMessage(msg.key.remoteJid, { text: teks });
    }
};