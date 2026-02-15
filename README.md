# 🌐 goo-nee - The Ultimate Slot Companion

โปรเจกต์เว็บแอปพลิเคชันสำหรับรวมทางลัด (Shortcuts) และเครื่องมือช่วยเหลือสายปั่นสล็อต โดยเน้นดีไซน์ที่พรีเมียม ปรับแต่งได้สูง และฟีเจอร์ Mini Browser ในตัว

## 🚀 Deployment Links

- **Main Site (Production):** [https://goo-nee.netlify.app/](https://goo-nee.netlify.app/)
- **Core Strategy:** โปรเจกต์นี้ทำงานร่วมกับทรัพยากรภายนอก (External Resources) จากโปรเจกต์ GooGem

---

## 🏗️ Project Architecture & External Dependencies

โปรเจกต์นี้ไม่ได้ทำงานโดดเดี่ยว แต่มีการเรียกใช้ทรัพยากรจาก **Static Assets Server** ของโปรเจกต์อื่น:

1. **GooGem Resources (Static/CDN):** [https://googem.netlify.app/](https://googem.netlify.app/)
    - **Source Code:** [github.com/gooneeshark/googem](https://github.com/gooneeshark/googem)
    - **External Content:** เรียกใช้ `card.json` เพื่อดึงข้อมูลทางลัดล่าสุดจาก GooGem
    - **Shared Widgets:** โหลด `top-bar-widget.js` มาแสดงผลแถบด้านบนแบบ Dynamic
    - **Assets:** โหลดรูปภาพโลโก้เริ่มต้นจากโฟลเดอร์ `/public/logo/` ของ GooGem

2. **goo-nee (Main Logic):** ฟอร์คและพัฒนาต่อยอดมาเพื่อจัดการหน้าเว็บหลัก (Landing Page)
    - **Main Component:** `components/GoostoryEmbed.tsx` (หัวใจหลักของระบบ)
    - **Storage:** ใช้ `localStorage` ในการจดจำ Theme, ทางลัดที่ผู้ใช้เพิ่มเอง และการตั้งค่าหน้าจอ

---

## 🛠️ Key Features (Technical Overview)

### 1. Mini Browser (Persistent iFrame)

* **Persistent Logic:** ออกแบบให้ใช้ `iframe` ตัวเดียวในการทำงานตลอด Session
- **No Reset:** เมื่อกด "ย่อ (Minimize)" หรือ "ล้างขนาด (Reset Size)" หน้าเว็บใน iFrame จะไม่ถูกรีโหลดใหม่ แต่จะใช้การควบคุมผ่าน CSS Transition
- **Resizable:** รองรับการลากปรับขนาด (Mouse & Touch) บริเวณมุมและขอบด้านบน พร้อม Overlay ป้องกัน iFrame แย่งเหตุการณ์เมาส์

### 2. Display & Scaling System

* **Decoupled Zoom:** ระบบซูมถูกแยกออกจาก UI หลัก (ปุ่มตั้งค่าและ Modal จะไม่จิ๋วตามเนื้อหา)
- **Customization:** ผู้ใช้สามารถปรับขนาดไอคอน, ขนาดตัวอักษร และ Global Zoom ของเนื้อหาหลักได้อิสระผ่านเมนู "ตั้งค่าการแสดงผล"
- **Responsiveness:** ออกแบบมาให้รองรับ Mobile Touch โดยเฉพาะ (เพิ่ม Hit Area สำหรับปุ่มปรับขนาด)

### 3. Smart Merging System

* **Deduplication:** ระบบจะรวมผลลัพธ์ระหว่างทางลัดพื้นฐาน, ทางลัดจาก `card.json` (GooGem), และทางลัดที่ผู้ใช้เพิ่มเอง โดยเช็คจาก URL/Name
- **Image Fallback:** ลำดับการแสดงรูป: `image` (จาก json) -> `logo` -> `google favicon` -> `default logo`

---

## 🤖 Note for AI Agents

If you are modifying this codebase, please keep these rules in mind:

- **Main Component:** Always check `components/GoostoryEmbed.tsx` first.
- **Persistent iFrame:** DO NOT split the mini-browser into multiple iframes. It must remain a single instance to prevent session loss.
- **Styling:** We use **Vanilla CSS** + **Tailwind Classes**. Be careful with the Zoom container in `GoostoryEmbed.tsx`.
- **External Repo:** If you need to update hardcoded site lists, they are in `constants.ts`, but prioritize data from `googem.netlify.app/card.json`.

---

Developed with ❤️ by **Gooneeshark**
