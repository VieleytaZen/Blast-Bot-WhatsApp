Fitur sek tak buat;
Arsitektur Plugin (Modular): Fitur dipisah per file. Jika satu fitur rusak, fitur lain tetap berjalan. Menambah fitur baru sangat mudah tanpa mengganggu kode utama.

Sistem Anti-Double Spam: Menggunakan database.json untuk mencatat nomor yang sudah dichat. Bot tidak akan mengirim pesan dua kali ke nomor yang sama, meskipun perintah dijalankan berulang kali.

Fitur Humanize (Random Delay): Jeda waktu pengiriman diacak (7-15 detik), meniru perilaku manusia agar tidak terdeteksi sebagai mesin oleh sistem keamanan WhatsApp.

Fitur Spintax: Mendukung pengacakan kata otomatis (contoh: {Halo|Hai|P}). Setiap penerima akan mendapatkan pesan dengan variasi teks yang berbeda.

Smart Export (VCF/TXT): Kamu bisa mendownload hasil kontak dalam format file kontak HP (VCF) yang siap impor. Dilengkapi sistem "Hanya Ekspor Nomor Baru" agar file tidak menumpuk dengan nomor lama.

Stealth JPM (Private Cmd): Bisa melakukan Push Kontak ke anggota grup hanya melalui chat pribadi bot dengan menggunakan ID Grup. Bot tidak perlu "berisik" di dalam grup.


Perintah,Fungsi,Contoh Penggunaan
.push <pesan>,Push kontak ke semua anggota grup yang diikuti bot.,`.push Halo
.jpmid <id>|<msg>,Push ke grup tertentu lewat chat pribadi.,.jpmid idgrup@g.us | Halo!
.listid,Melihat daftar nama grup dan ID-nya.,.listid
.stats,Melihat statistik total nomor yang sudah di-push.,.stats
.export <txt/vcf>,Download nomor baru yang belum pernah diekspor.,.export vcf
.reset export,Mengulang daftar ekspor agar nomor lama bisa diekspor lagi.,.reset export
.owner,Mengirim kartu kontak owner (VCard).,.owner