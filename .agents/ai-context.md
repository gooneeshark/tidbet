# โครงสร้างและข้อมูล Widget สำหรับ AI (React Integration Context)

## คำแนะนำสำหรับ AI
ผู้ใช้ต้องการนำ **GooUnivers Smart Player (Music Widget)** ไปติดตั้งในโปรเจกต์ React อื่นๆ โปรดใช้ข้อมูลและโค้ดในไฟล์นี้เป็น Context บริบทในการสร้างคอมโพเนนต์หรือติดตั้ง Widget ให้กับผู้ใช้

---

## 🔗 ข้อมูล Deployment (CDN)
- **Primary URL (หลัก):** `https://goosing.netlify.app`
- **Fallback URL (สำรอง):** `https://goosing.vercel.app`
- **Icon Library:** Lucide (`https://unpkg.com/lucide@latest`)

ไฟล์ Asset ที่เกี่ยวข้อง:
- CSS: `[URL]/style.css`
- JS: `[URL]/script.js`

---

## 📦 โครงสร้าง HTML (DOM Structure)
นี่คือโครงสร้าง DOM ที่ Widget ต้องการให้โปรเจกต์ปลายทางเรนเดอร์:

```html
<div id="floating-player">
  <div id="fp-handle">
    <div id="fp-logo">
      <i data-lucide="music"></i>
    </div>
    <div id="fp-info">
      <span id="fp-status-text">พร้อมทำงาน</span>
      <span id="fp-current-title">รอเลือกเพลง...</span>
    </div>
    <button id="btn-clear-cache" title="ล้างแคชเพลงที่เคยฟัง" style="background:transparent; border:none; cursor:pointer; color:var(--fp-muted); padding:4px; display:flex;">
      <i data-lucide="hard-drive" size="16"></i>
    </button>
    <button id="btn-toggle">
      <i data-lucide="chevron-down"></i>
    </button>
  </div>

  <div id="fp-body">
    <div class="loader">กำลังโหลดเพลย์ลิสต์...</div>
  </div>

  <div id="fp-footer">
    <div class="progress-container" id="progress-bar">
      <div id="progress-fill"></div>
    </div>
    <div class="controls">
      <button class="ctrl-btn" id="btn-prev"><i data-lucide="skip-back"></i></button>
      <button class="ctrl-btn play-main" id="btn-play-pause"><i data-lucide="play"></i></button>
      <button class="ctrl-btn" id="btn-next"><i data-lucide="skip-forward"></i></button>
    </div>
  </div>
</div>
```

---

## 🛠️ แนวทางการเขียน React Component
เพื่อให้ AI นำไปเขียน Component ง่ายที่สุด นี่คือตัวอย่างการ Inject Script และ CSS โดยจำลองระบบ Fallback หาก Netlify ล่ม ให้ดึงจาก Vercel แทน

```jsx
import React, { useEffect, useRef, useState } from 'react';

// URL Configuration
const DOMAINS = {
  primary: 'https://goosing.netlify.app',
  fallback: 'https://goosing.vercel.app'
};

const SmartPlayerWidget = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // ฟังก์ชันสำหรับแทรก CSS/JS เข้าสู่ DOM
    const injectAssets = (domain) => {
      return new Promise((resolve, reject) => {
        // 1. Load Lucide Icons
        const lucideScript = document.createElement('script');
        lucideScript.src = "https://unpkg.com/lucide@latest";
        lucideScript.defer = true;
        document.body.appendChild(lucideScript);

        // 2. Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${domain}/style.css`;
        document.head.appendChild(link);

        // 3. Load Main script.js
        const script = document.createElement('script');
        script.src = `${domain}/script.js`;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load JS'));
        document.body.appendChild(script);
      });
    };

    // ระบบทดสอบการเชื่อมต่อและดึงไฟล์พร้อม Fallback
    const initWidget = async () => {
      try {
        // ทดสอบ Primary (Netlify)
        const res = await fetch(`${DOMAINS.primary}/style.css`, { method: 'HEAD' });
        if (res.ok) {
          await injectAssets(DOMAINS.primary);
        } else {
          throw new Error('Primary failed');
        }
      } catch (error) {
        console.warn('Primary domain failed, falling back to Vercel...');
        // ทดสอบ Fallback (Vercel)
        await injectAssets(DOMAINS.fallback);
      }
      setIsLoaded(true);
    };

    initWidget();

    // Cleanup assets (Optional: ป้องกันการโหลดซ้ำถ้า Component ถูก Unmount)
    return () => {
      // Logic for cleanup can be implemented here if the application uses react-router
    };
  }, []);

  return (
    <div ref={containerRef} id="music-widget-wrapper">
      <div id="floating-player" style={{ display: isLoaded ? 'flex' : 'none' }}>
        <div id="fp-handle">
          <div id="fp-logo">
            <i data-lucide="music"></i>
          </div>
          <div id="fp-info">
            <span id="fp-status-text">พร้อมทำงาน</span>
            <span id="fp-current-title">รอเลือกเพลง...</span>
          </div>
          <button id="btn-clear-cache" title="ล้างแคชเพลงที่เคยฟัง" style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--fp-muted)', padding:'4px', display:'flex' }}>
            <i data-lucide="hard-drive"></i>
          </button>
          <button id="btn-toggle">
            <i data-lucide="chevron-down"></i>
          </button>
        </div>

        <div id="fp-body">
          <div className="loader">กำลังโหลดเพลย์ลิสต์...</div>
        </div>

        <div id="fp-footer">
          <div className="progress-container" id="progress-bar">
            <div id="progress-fill"></div>
          </div>
          <div className="controls">
            <button className="ctrl-btn" id="btn-prev"><i data-lucide="skip-back"></i></button>
            <button className="ctrl-btn play-main" id="btn-play-pause"><i data-lucide="play"></i></button>
            <button className="ctrl-btn" id="btn-next"><i data-lucide="skip-forward"></i></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPlayerWidget;
```

---

## 🎯 กฎหมายและเงื่อนไขการวาง Widget
- ตัว Player ถูกออกแบบมาในรูปแบบ CSS `position: fixed` อยู่ที่มุมขวาบนของหน้าเว็บอัตโนมัติ ไม่จำเป็นต้องจัด Layout สไตล์เพิ่มเติม
- ตรวจสอบให้แน่ใจว่าได้ใช้ `className="..."` แทน `class="..."` ในไฟล์ JSX เมื่อ AI แปลงเป็น React
- CSS คลาสตัวอักษรบางตัวใน `style.css` มีการดึง Font `Inter` แนะนำให้ AI กำหนดให้โปรเจกต์ปลายทางทำการ Import Font Inter ผ่าน Google Fonts ด้วยเพื่อให้สวยงาม
