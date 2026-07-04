Tabel Database yang Diperlukan

## 1. Rooms

Mewakili ruang obrolan yang dapat dimasuki pengguna.

room_id (PK)

name — nama ruangan (contoh: "Music Chat", "Movies", dsb.)

description — deskripsi atau topik ruangan.

category_id — FK ke tabel Categories.

region_id — FK ke tabel Regions, jika lokasi-spesifik.

is_private — apakah ruangan privat/password-protected.

password_hash — jika ada kata sandi (opsional).

created_at, updated_at

## 2. Categories

Menampung kategori atau tema umum dari ruangan.
category_id (PK)
name — misalnya "Music", "Anime", "Fresh Rooms", dll.
description

## 3. Regions (Opsional)

Jika platform memungkinkan memilih ruangan berdasarkan lokasi seperti "USA Chat Room", "Indonesia Chat Room", dll.

region_id (PK)
name — nama lokal seperti negara atau zona.
parent_region_id — untuk hirarki (opsional).

## 4. Users (Anonymous or identified)

Menyimpan detail pengguna, walaupun penyimpanan bisa minimal karena anonim.

user_id (PK)
display_name — nama samaran yang pengguna pilih.
created_at

(Jika login memungkinkan: email, hashed password dsb.)

## 5. RoomMembers / UserRoomSessions

Menangani siapa ada di ruangan, termasuk detik masuk dan keluar.

session_id (PK)
room_id (FK)
user_id (FK)
joined_at
left_at
(Opsional: session token, status aktif, dsb.)

## 6. Messages

Untuk menyimpan pesan pengguna di ruang obrolan.

message_id (PK)
room_id (FK)
user_id (FK)
content — teks pesan.
timestamp
(Opsional: tipe pesan – teks/media.)

## 7. Media (Opsional)

Jika pengguna bisa berbagi gambar atau video.

media_id (PK)
message_id (FK)
url atau path.
media_type

## 8. Friends (Jika fitur teman ada)

Meskipun tidak langsung dari halaman Discover, MeetYou menjanjikan kemungkinan berteman.

friendship_id (PK)
user_id
friend_id
status (Pending, Accepted, dsb.)
requested_at, accepted_at

Bagaimana Relasi Antar Tabel:
Tabel Relasi ke
Rooms Categories, Regions
RoomMembers Rooms, Users
Messages Rooms, Users
Media Messages
Friends Users

## Completed Task

- users (OK)
- users profile (OK)
- auth (?)
- friend (OK)
- room (OK)(PERLU DI CEK LAGI)
- media (OK)
- message

## bedah dan next perbaruan

Mantap, kita bedah satu per satu ya biar clear:

1. Auth vs Users (redundansi credential)

👉 Best practice:

Auth → khusus untuk credential (email, password_hash, refresh_token, dll).

Users → khusus untuk profil (username, age, gender, dsb).

Alur registrasi & login:

User register → data masuk ke Auth (email, password_hash).

Setelah berhasil, buat entry di Users dengan user_id yang sama.

Hubungan: Auth.user_id → Users.user_id (1:1).

Login → cari user di Auth berdasarkan email.

Cocokkan password → password_hash di-verify.

Kalau valid → ambil detail user dari Users.

⚡ Jadi identifikasi user tetap via Auth.email, lalu dipetakan ke profil via user_id.
👉 Jadi tidak ada duplikasi password/email di Users → aman & clean.

2. Messages (sender_id, receiver_id, room_id)

Kamu punya 2 opsi:

Opsi A (paling simple, lebih clean) → ChatRoom tunggal

Semua percakapan (group/private) lewat Room.

Untuk private chat, buat Room dengan 2 member saja di RoomMembers.

Messages hanya butuh:

message_id
room_id
sender_id
content
type
status
created_at

👉 Tidak perlu receiver_id.

Kelebihan: Struktur simple, query konsisten (semua lewat room).
Kekurangan: Harus bikin room dulu walau untuk chat 1-1.

Opsi B (lebih eksplisit) → Pisahkan tabel

DirectMessages (sender_id, receiver_id, content, …).

RoomMessages (room_id, sender_id, content, …).

Kelebihan: lebih jelas.
Kekurangan: Query jadi bercabang (harus cek 2 tabel).

⚡ Saran: Pakai Opsi A (ChatRoom tunggal). Lebih maintainable, dipakai WhatsApp/Telegram juga modelnya begitu.

3. Presence (global vs per-room)

Kalau mau global presence (online/offline) cukup:

Tambah kolom di Users:

is_online boolean [default: false]
last_seen timestamp

Mekanisme:

User connect → is_online = true.

Disconnect → is_online = false, last_seen = now().

UI bisa menampilkan status global user tanpa perlu Presence table.

Kalau suatu hari butuh per-room presence (misal: “typing in Room A” tapi “offline in Room B”), baru aktifkan tabel Presence.

⚡ Saran: Mulai dari global dulu (simple) → cukup di Users.

4. Notification (tambahkan type & related_id)

Sekarang Notification hanya ada message text, user_id, created_at.
Lebih bagus ditambah:

Notification {
notification_id integer [pk]
user_id integer [fk -> Users.user_id] -- siapa yang menerima notif
type NotificationTypeEnum
related_id integer -- ID referensi (bisa message_id, friend_id, dll)
message text -- optional (bisa auto-generate)
is_read boolean [default: false]
created_at timestamp
}

Enum NotificationTypeEnum misalnya:

Enum NotificationTypeEnum {
new_message
friend_request
friend_accept
user_blocked
room_invite
}

⚡ Dengan desain ini:

Kalau ada pesan baru → type = new_message, related_id = message_id.

Kalau ada friend request → type = friend_request, related_id = friend_id.

UI tinggal query notifikasi berdasarkan type untuk tampilkan konten yang sesuai.

🔑 Kesimpulan

Auth khusus credential, Users khusus profil → hilangkan email/password di Users.

Messages lebih simple kalau semua lewat Room (Opsi A).

Presence global cukup di Users, Presence table opsional untuk per-room.

Notification perlu type & related_id biar fleksibel.
