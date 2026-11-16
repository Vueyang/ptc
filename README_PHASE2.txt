=== ເຟດ 2: ວິທີຕິດຕັ້ງ ແລະ ນຳໃຊ້ ===

[1] ອັບເດດໄຟລ໌ (ສຳຄັນ)
  - ແຕກ zip ແລ້ວ copy ທັບໂຟລເດີ C:\xampp\htdocs\ptc\
  - ຢ່າທັບ api\config.php ຂອງທ່ານ (zip ນີ້ບໍ່ມີໄຟລ໌ນັ້ນ ຈຶ່ງບໍ່ຖືກທັບ)

[2] ເພີ່ມຕາຕະລາງ audit log (ເຮັດ 1 ຄັ້ງ)
  - phpMyAdmin > ກົດຖານຂໍ້ມູນຂອງທ່ານ (ເຊັ່ນ database) > ແຖບ SQL
  - ເປີດໄຟລ໌ database_phase2.sql ດ້ວຍ Notepad > ກ໊ອບທັງໝົດ > ວາງ > ກົດ Go

[3] ເຂົ້າລະບົບໃໝ່ (Ctrl+F5 ເພື່ອລ້າງ cache)
  - admin ຈະເຫັນເມນູເພີ່ມ: ຜູ້ໃຊ້ລະບົບ, ປະຫວັດການແກ້ໄຂ, ສຳຮອງຂໍ້ມູນ
  - ທຸກຄົນເຫັນ: ກວດນັບອຸປະກອນ, ປຸ່ມ "ປ່ຽນລະຫັດຜ່ານ" ຢູ່ແຖບຊ້າຍລຸ່ມ

[4] ການໃຊ້ງານ
  - ຜູ້ໃຊ້: admin ເພີ່ມ/ແກ້ໄຂ/ລຶບ ແລະ ຕັ້ງລະຫັດໃໝ່ໃຫ້ຜູ້ອື່ນໄດ້. staff ລຶບຂໍ້ມູນບໍ່ໄດ້
  - ໃບມອບ-ຮັບ: ເມນູ "ມອບ / ໂອນ / ສ້ອມ" > ກົດ "ພິມໃບ" ທ້າຍແຖວ
  - ລາຍງານ: ເມນູ "ອຸປະກອນ" > ກັ່ນຕອງ > "ລາຍງານ / PDF"
  - ໃນໜ້າຕ່າງພິມ ເລືອກ Destination = "Save as PDF" ຖ້າຕ້ອງການໄຟລ໌ PDF
  - ປ້າຍບາໂຄດ: ເມນູ "ອຸປະກອນ" > ກັ່ນຕອງ > "ພິມປ້າຍບາໂຄດ" (ພິມໃສ່ສະຕິກເກີ A4 ໄດ້)
  - ກວດນັບ: ເມນູ "ກວດນັບອຸປະກອນ" > ເລືອກກົມ > ສະແກນ ຫຼື ພິມລະຫັດ + Enter
  - ລະຫັດອຸປະກອນຕ້ອງໃຊ້ສະເພາະ A-Z, 0-9, ຂີດ (-), ຈຸດ (.), ຍະຫວ່າງ ເພື່ອພິມບາໂຄດໄດ້

[5] ສຳຮອງຂໍ້ມູນ
  ກ) ອັດຕະໂນມັດ: ເມື່ອ admin ເຂົ້າລະບົບເທື່ອທຳອິດຂອງມື້ ລະບົບສຳຮອງໃຫ້ເອງ (ເກັບສູງສຸດ 30 ໄຟລ໌)
  ຂ) ທຸກຄືນ 02:00 ໂດຍບໍ່ຕ້ອງເຂົ້າລະບົບ: ຄລິກຂວາ schedule_backup.bat > Run as administrator
     ທົດສອບ: schtasks /run /tn "PTC Backup"
  ຄ) ໄຟລ໌ຢູ່ໂຟລເດີ ptc\backups\ (ເປີດຜ່ານເວັບບໍ່ໄດ້). ຄວນ copy ໄປ USB/ເຄື່ອງອື່ນເປັນປະຈຳ
  ງ) ກູ້ຄືນ: phpMyAdmin > ເລືອກຖານຂໍ້ມູນ > Import > ເລືອກໄຟລ໌ .sql

[6] ເປີດ HTTPS ໃນ XAMPP (ເມື່ອໃຊ້ຜ່ານເຄືອຂ່າຍ/ອິນເຕີເນັດ ແລະ ໃຫ້ກ້ອງໂທລະສັບສະແກນໄດ້)
  1. ກວດ C:\xampp\apache\conf\httpd.conf ວ່າບັນທັດ "Include conf/extra/httpd-ssl.conf"
     ບໍ່ມີ # ນຳໜ້າ (ປົກກະຕິເປີດຢູ່ແລ້ວ)
  2. ສ້າງ certificate ສຳລັບ IP/ຊື່ເຄື່ອງເຊີບເວີ (ປ່ຽນ 192.168.1.10 ເປັນ IP ຂອງທ່ານ)
     ເປີດ Command Prompt ແບບ Administrator:
       cd C:\xampp\apache\bin
       set OPENSSL_CONF=C:\xampp\apache\conf\openssl.cnf
       openssl req -x509 -nodes -days 825 -newkey rsa:2048 -keyout ..\conf\ssl.key\server.key -out ..\conf\ssl.crt\server.crt -subj "/CN=192.168.1.10" -addext "subjectAltName=IP:192.168.1.10"
     (ສຳຮອງ server.crt / server.key ເດີມໄວ້ກ່ອນ)
  3. Restart Apache ແລ້ວເປີດ https://192.168.1.10/ptc/
     ບຣາວເຊີຈະເຕືອນ "ບໍ່ປອດໄພ" ເພາະເປັນ certificate ທີ່ເຮົາສ້າງເອງ. ເພື່ອໃຫ້ຫາຍເຕືອນ ໃຫ້ນຳ
     server.crt ໄປຕິດຕັ້ງເປັນ Trusted Root ໃນແຕ່ລະເຄື່ອງ (Windows: ດັບເບິນຄລິກ > Install > Local Machine
     > Trusted Root Certification Authorities). ໂທລະສັບກໍຕ້ອງຕິດຕັ້ງ certificate ນຳ
  4. ເປີດພອດ 443 ໃນ Windows Firewall ຂອງເຊີບເວີ
  5. ເມື່ອ HTTPS ໃຊ້ໄດ້ແລ້ວ: ເປີດ .htaccess ເອົາ # ອອກ 3 ບັນທັດ RewriteEngine/RewriteCond/RewriteRule
     ເພື່ອບັງຄັບໃຫ້ http ຖືກປ່ຽນເປັນ https ອັດຕະໂນມັດ
  6. cookie ຂອງລະບົບຈະຕັ້ງ Secure ອັດຕະໂນມັດເມື່ອໃຊ້ HTTPS (ຢູ່ api/lib.php)

[7] ຖ້າຈະເປີດຜ່ານອິນເຕີເນັດສາທາລະນະ ຕ້ອງເຮັດເພີ່ມ
  - ຕັ້ງລະຫັດ root ຂອງ MySQL, ຢ່າເປີດພອດ 3306, ຈຳກັດ/ປິດ phpMyAdmin ຈາກພາຍນອກ
  - ໃຊ້ໂດເມນ + certificate ຈິງ (ເຊັ່ນ Let's Encrypt) ແທນ certificate ທີ່ສ້າງເອງ
  - ປ່ຽນລະຫັດ admin ຈາກຄ່າເລີ່ມຕົ້ນ ແລະ ຕິດຕາມ "ປະຫວັດການແກ້ໄຂ" ເປັນປະຈຳ
