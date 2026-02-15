
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SLOT_SITES } from '../constants';
import { initTopBarManager } from '../utils/topBarManager';
import { THEMES, getRandomThemeId, getThemeById, type ThemeId } from '../utils/themes';

// ฟังก์ชันสำหรับดึง Favicon จาก Google
const getGoogleFavicon = (url: string) => {
  try {
    // ตรวจสอบว่าเป็น command พิเศษหรือไม่
    if (url.startsWith('command://')) return null;
    
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch (error) {
    return null;
  }
};

const BUNDLE_WIDGET_BASE = 'https://googem.netlify.app/';
const MINI_BROWSER_HOME = 'https://audio.com/goo-nee/collections/goonee';

interface Shortcut {
  id?: string;
  name: string;
  url: string;
  logo?: string;
  image?: string;
  tagline?: string;
  isUserAdded?: boolean;
  isFavorite?: boolean;
}

const GoostoryEmbed: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [externalSites, setExternalSites] = useState<Shortcut[]>([]);
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('goo_theme_id');
    return getThemeById(saved).id;
  });
  const [savedThemeId, setSavedThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('goo_theme_id');
    return getThemeById(saved).id;
  });
  const [userShortcuts, setUserShortcuts] = useState<Shortcut[]>(() => {
    const saved = localStorage.getItem('user_shortcuts');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('goo_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [customBg, setCustomBg] = useState<string | null>(() => {
    return localStorage.getItem('custom_bg');
  });
  const [isAudioSheetOpen, setIsAudioSheetOpen] = useState(false);
  const [showApiPreview, setShowApiPreview] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [miniBrowserUrl, setMiniBrowserUrl] = useState<string | null>(null);
  const [isMiniBrowserModal, setIsMiniBrowserModal] = useState(false);
  const [miniBrowserHistory, setMiniBrowserHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [urlInput, setUrlInput] = useState<string>('');
  const [miniBrowserKey, setMiniBrowserKey] = useState<number>(0);
  const [browserSize, setBrowserSize] = useState({ width: 600, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [newShortcut, setNewShortcut] = useState({ name: '', url: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useMemo(() => getThemeById(themeId), [themeId]);
  const [uiZoom, setUiZoom] = useState<number>(() => {
    const saved = localStorage.getItem('goo_ui_zoom');
    const parsed = saved ? Number(saved) : 0.5;
    return Number.isFinite(parsed) ? Math.min(1.5, Math.max(0.3, parsed)) : 0.5;
  });

  // Grid & Shortcut Customization
  const [gridCols, setGridCols] = useState<number>(() => {
    const saved = localStorage.getItem('goo_grid_cols');
    return saved ? Number(saved) : 6;
  });
  const [iconSize, setIconSize] = useState<number>(() => {
    const saved = localStorage.getItem('goo_icon_size');
    return saved ? Number(saved) : 112; // md:w-28 = 112px
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('goo_font_size');
    return saved ? Number(saved) : 16; // md:text-base = 16px
  });
  const [showGridSettings, setShowGridSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('goo_grid_cols', String(gridCols));
    localStorage.setItem('goo_icon_size', String(iconSize));
    localStorage.setItem('goo_font_size', String(fontSize));
  }, [gridCols, iconSize, fontSize]);

  // Stable zoom helpers: step 0.05, clamp between 0.3 and 1.5, avoid floating errors
  const ZOOM_MIN = 0.3;
  const ZOOM_MAX = 1.5;
  const ZOOM_STEP = 0.05;

  const clampZoom = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));
  const snapZoom = (v: number) => {
    const steps = Math.round(v / ZOOM_STEP);
    return parseFloat((steps * ZOOM_STEP).toFixed(2));
  };

  const setZoomValue = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    const snapped = snapZoom(raw);
    setUiZoom(clampZoom(snapped));
  };

  const increaseZoom = () => setUiZoom((prev) => {
    const next = snapZoom(prev + ZOOM_STEP);
    return clampZoom(next);
  });

  const decreaseZoom = () => setUiZoom((prev) => {
    const next = snapZoom(prev - ZOOM_STEP);
    return clampZoom(next);
  });

  useEffect(() => {
    localStorage.setItem('goo_ui_zoom', String(uiZoom));
  }, [uiZoom]);
  
  useEffect(() => {
    // Matrix background effect
    const canvas = document.getElementById("matrix") as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    const letters = "アイウエオカキクケコサシスセソタチツテトナニヌネโน101010";
    const fontSize = 16;
    let columns = canvas.width / fontSize;
    let drops: number[] = [];

    for (let x = 0; x < columns; x++) drops[x] = 1;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = customBg ? "rgba(0,0,0,0.3)" : theme.matrixFade;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = fontSize + "px monospace";
      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));

        const c = theme.matrixColors[Math.floor(Math.random() * theme.matrixColors.length)] || '#ffffff';
        ctx.fillStyle = c;
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 50);

    const handleResize = () => {
      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;
      columns = canvas.width / fontSize;
      drops = [];
      for (let x = 0; x < columns; x++) drops[x] = 1;
    };

    window.addEventListener('resize', handleResize);

    const existingScript = document.querySelector('script[data-top-bar-widget="1"]');
    const script = existingScript instanceof HTMLScriptElement ? existingScript : document.createElement('script');
    if (!existingScript) {
      script.setAttribute('data-top-bar-widget', '1');
      script.src = `${BUNDLE_WIDGET_BASE}/top-bar-widget.js`;
      script.async = true;
      document.body.appendChild(script);
    }

    const topBarManager = initTopBarManager();

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      topBarManager.cleanup();
      if (!existingScript && document.body.contains(script)) document.body.removeChild(script);
    };
  }, [customBg, theme]);

  const randomizeTheme = () => {
    setThemeId(getRandomThemeId(themeId));
  };

  const saveTheme = () => {
    localStorage.setItem('goo_theme_id', themeId);
    setSavedThemeId(themeId);
  };

  useEffect(() => {
    fetch(`${BUNDLE_WIDGET_BASE}/card.json`)
      .then(res => res.json())
      .then(data => {
        if (data && data.sites) {
          setExternalSites(data.sites);
        }
      })
      .catch(err => console.error("Failed to load external cards:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem('user_shortcuts', JSON.stringify(userShortcuts));
  }, [userShortcuts]);

  useEffect(() => {
    localStorage.setItem('goo_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const allSites = useMemo(() => {
    // 1. Start with base sites
    let merged: Shortcut[] = [...SLOT_SITES.map(s => ({ ...s, isUserAdded: false }))];

    // Special API Setup Shortcut - Keep at start or merge if exists
    const apiSite: Shortcut = {
      id: 'api-setup-special',
      name: 'ดูตัวอย่าง',
      url: 'command://open-api',
      image: '/api1.png',
      tagline: 'กดดูภาพตัวอย่าง',
      isUserAdded: false,
      isFavorite: true
    };
    
    // 2. Merge external sites from card.json
    externalSites.forEach(ext => {
      const idx = merged.findIndex(s => 
        (s.url && ext.url && s.url.toLowerCase() === ext.url.toLowerCase()) || 
        (s.name && ext.name && s.name.toLowerCase() === ext.name.toLowerCase())
      );
      if (idx !== -1) {
        // Update existing site with external data (external wins)
        merged[idx] = { ...merged[idx], ...ext };
      } else {
        merged.push({ ...ext, isUserAdded: false });
      }
    });

    // 3. Merge user-added shortcuts from localStorage
    // If a user shortcut has the same URL/Name as an existing one, update it but keep it "user added" status
    userShortcuts.forEach(us => {
      const idx = merged.findIndex(s => 
        (s.url && us.url && s.url.toLowerCase() === us.url.toLowerCase()) || 
        (s.name && us.name && s.name.toLowerCase() === us.name.toLowerCase())
      );
      if (idx !== -1) {
        // Prioritize image/logo from merged (external/base) if the user one is just a google favicon
        const current = merged[idx];
        const isUserJustGoogle = us.logo?.includes('google.com/s2/favicons');
        
        merged[idx] = { 
          ...current, 
          ...us, 
          // If the user version has a generic google logo, prefer the one from merged (external)
          logo: isUserJustGoogle ? (current.logo || us.logo) : (us.logo || current.logo),
          image: us.image || current.image,
          isUserAdded: true 
        };
      } else {
        merged.unshift({ ...us, isUserAdded: true });
      }
    });

    // 4. Ensure API site is at the front
    const apiIdx = merged.findIndex(s => s.id === 'api-setup-special');
    if (apiIdx !== -1) {
      const [item] = merged.splice(apiIdx, 1);
      merged.unshift(item);
    } else {
      merged.unshift(apiSite);
    }

    // Mark favorites
    merged.forEach(m => {
      m.isFavorite = favorites.includes(m.url);
    });

    return merged;
  }, [externalSites, userShortcuts, favorites]);

  const filteredSites = allSites.filter(site => 
    site.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShortcutClick = (site: Shortcut, e: React.MouseEvent) => {
    if (site.url === 'command://open-api') {
      e.preventDefault();
      e.stopPropagation();
      setShowApiPreview(true);
      return;
    }
    // Normal link behavior continues via <a> tag
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcut.name || !newShortcut.url) return;
    
    const formattedUrl = newShortcut.url.startsWith('http') ? newShortcut.url : `https://${newShortcut.url}`;
    const domain = new URL(formattedUrl).hostname;
    
    const shortcut: Shortcut = {
      id: Date.now().toString(),
      name: newShortcut.name,
      url: formattedUrl,
      logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      tagline: domain,
      isUserAdded: true
    };

    setUserShortcuts(prev => [shortcut, ...prev]);
    setNewShortcut({ name: '', url: '' });
    setShowAddModal(false);
  };

  const deleteShortcut = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUserShortcuts(prev => prev.filter(s => s.id !== id));
  };

  const normalizeUrl = (raw: string) => {
    try {
      if (!raw) return raw;
      if (/^https?:\/\//i.test(raw)) return raw;
      return `https://${raw}`;
    } catch {
      return raw;
    }
  };

  const navigateTo = (rawUrl: string, push = true) => {
    const url = normalizeUrl(rawUrl || MINI_BROWSER_HOME);
    if (!url) return;
    if (push) {
      const truncated = miniBrowserHistory.slice(0, historyIndex + 1);
      const next = [...truncated, url];
      setMiniBrowserHistory(next);
      setHistoryIndex(next.length - 1);
    }
    setMiniBrowserUrl(url);
    setUrlInput(url);
    // Only increment key if we want a fresh reload, or if no URL was set
    setMiniBrowserKey(k => k + 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const url = miniBrowserHistory[prevIndex];
      setMiniBrowserUrl(url);
      setUrlInput(url);
      setMiniBrowserKey(k => k + 1);
    }
  };

  const goHome = () => {
    navigateTo(MINI_BROWSER_HOME, true);
  };

  const refreshBrowser = () => {
    // bump key to force iframe reload
    setMiniBrowserKey(k => k + 1);
  };

  const toggleFavorite = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCustomBg(result);
        localStorage.setItem('custom_bg', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBg = () => {
    setCustomBg(null);
    localStorage.removeItem('custom_bg');
  };
  
  // Resize logic
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Only handle primary touch or left-click
    if ('button' in e && e.button !== 0) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const startX = clientX;
    const startY = clientY;
    const startWidth = browserSize.width;
    const startHeight = browserSize.height;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      setBrowserSize({
        width: Math.max(280, Math.min(window.innerWidth - 20, startWidth + deltaX * 2)),
        height: Math.max(150, Math.min(window.innerHeight * 0.9, startHeight - deltaY))
      });
    };

    const handleEnd = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  return (
    <div 
      className="fixed inset-0 z-0 overflow-y-auto bg-black bg-cover bg-center bg-no-repeat transition-all duration-700"
      style={{ ...(customBg ? { backgroundImage: `url(${customBg})` } : {}), paddingTop: 'calc(40px + var(--goo-topbar-safe-top, 0px))' }}
    >
      {/* Overlay for readability if custom background exists */}
      {customBg && <div className="fixed inset-0 bg-black/40 z-[-1]"></div>}

      <canvas id="matrix" className="fixed top-0 left-0 z-0 pointer-events-none opacity-40"></canvas>
      
      {/* Settings Menu */}
      <div
        className="fixed right-4 z-50 flex gap-2"
        style={{ top: 'calc(1rem + 40px + var(--goo-topbar-safe-top, 0px))' }}
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
          <select
            value={themeId}
            onChange={(e) => setThemeId(e.target.value as ThemeId)}
            className="bg-transparent text-white text-xs font-bold uppercase tracking-wider outline-none"
            title="เลือกธีม"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id} className="text-black">
                {t.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={randomizeTheme}
            className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all"
            title="สุ่มธีม"
          >
            สุ่ม
          </button>

          <button
            type="button"
            onClick={saveTheme}
            disabled={themeId === savedThemeId}
            className="px-2 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black transition-all"
            title="บันทึกธีมที่ชอบ"
          >
            บันทึก
          </button>
        </div>
        <button 
          onClick={() => setShowGridSettings(true)}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/10 group shadow-lg"
          title="ตั้งค่าการแสดงผล"
        >
          <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/10 group shadow-lg"
          title="เปลี่ยนพื้นหลัง"
        >
          <svg className="w-5 h-5 group-hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        {customBg && (
          <button 
            onClick={clearBg}
            className="p-3 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md rounded-full text-red-500 transition-all border border-red-500/20 shadow-lg"
            title="ล้างพื้นหลัง"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleBgChange} 
        className="hidden" 
        accept="image/*" 
      />

      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center min-h-screen">
        <div 
          className="flex flex-col items-center w-full transition-all duration-500 ease-in-out origin-top"
          style={{ 
            zoom: uiZoom,
            // Fallback for browsers that don't support zoom property
            transform: `scale(${uiZoom})`,
            transformOrigin: 'top center'
          }}
        >
          {/* Header/Logo Placeholder */}
          <div className="mb-10 text-center">
            <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-red-600 to-yellow-300 drop-shadow-[0_10px_35px_rgba(234,88,12,0.6)] tracking-tighter italic animate-pulse">
              GOO GEMNEE
            </h1>
            <p className="text-zinc-300 mt-6 text-xs md:text-sm uppercase tracking-[0.6em] font-black opacity-90 drop-shadow-md">The Ultimate Slot Companion</p>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-2xl mb-20 group">
            <div className="relative group/input">
              <input 
                type="text" 
                placeholder="ค้นหาเว็บไซต์ที่คุณอยากโดน..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 backdrop-blur-3xl border-2 border-zinc-700/50 focus:border-orange-500 rounded-full px-10 py-6 text-white text-2xl transition-all outline-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:border-zinc-500 placeholder:text-zinc-600 font-medium"
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-orange-500 transition-colors">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Shortcuts Grid */}
          <div 
            className="grid gap-10 w-full max-w-7xl pb-48"
            style={{ 
              gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(120, iconSize + 40)}px, 1fr))`,
              maxWidth: gridCols > 5 ? '100%' : `${gridCols * (iconSize + 100)}px`
            }}
          >
            
            {/* Add Shortcut Button */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="group flex flex-col items-center p-8 rounded-[3rem] bg-white/5 hover:bg-orange-600/20 backdrop-blur-2xl transition-all duration-700 border border-white/5 hover:border-orange-500/50 shadow-2xl hover:scale-105 active:scale-95"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 bg-zinc-900/90 rounded-[1.5rem] flex items-center justify-center mb-6 transition-all duration-700 group-hover:rotate-[360deg] shadow-inner group-hover:shadow-orange-500/20">
                <svg className="w-12 h-12 text-zinc-500 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-zinc-400 text-xs md:text-sm font-black group-hover:text-white uppercase tracking-widest">เพิ่มทางลัด</span>
            </button>

            {filteredSites.map((site, idx) => (
              <a 
                key={site.id || idx}
                href={site.url.startsWith('command://') ? '#' : site.url}
                onClick={(e) => handleShortcutClick(site, e)}
                target={site.url.startsWith('command://') ? '_self' : '_blank'}
                rel="noopener noreferrer"
                className="shortcut-link group relative flex flex-col items-center p-8 rounded-[3rem] bg-black/30 hover:bg-white/10 backdrop-blur-2xl transition-all duration-700 border border-transparent hover:border-white/20 hover:scale-110 active:scale-95 shadow-[0_25px_60px_rgba(0,0,0,0.4)]"
              >
                {/* Top Row Toolbar */}
                <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-[-15px] group-hover:translate-y-0">
                  <button 
                    onClick={(e) => toggleFavorite(site.url, e)}
                    className={`p-2 rounded-full transition-all hover:scale-125 ${site.isFavorite ? 'bg-red-500 text-white shadow-xl shadow-red-500/40' : 'bg-black/60 text-zinc-400 border border-white/10'}`}
                  >
                    <svg className={`w-5 h-5 ${site.isFavorite ? 'fill-current animate-pulse' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {site.isUserAdded && (
                    <button 
                      onClick={(e) => deleteShortcut(site.id!, e)}
                      className="p-2 bg-zinc-800 text-white rounded-full transition-all hover:bg-red-600 hover:scale-125 border border-white/10 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = site.url;
                        navigateTo(url, true);
                        setIsMiniBrowserModal(true);
                        setIsAudioSheetOpen(true);
                      }}
                    className="p-2 bg-black/60 text-zinc-300 rounded-full transition-all hover:bg-white/10 hover:scale-125 border border-white/5"
                    title="เปิดในมินิเบราเซอร์"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {site.isFavorite && (
                  <div className="absolute top-4 left-4 z-10 group-hover:opacity-0 transition-opacity">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                      <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                  </div>
                )}

                <div 
                  className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl overflow-hidden group-hover:shadow-orange-600/50 group-hover:ring-4 group-hover:ring-orange-500 transition-all duration-700 group-hover:rotate-3"
                  style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                >
                  <img src={site.image || site.logo || getGoogleFavicon(site.url) || `${BUNDLE_WIDGET_BASE}/public/logo/default.webp`} alt={site.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125 font-bold" onError={(e) => { const target = e.target as HTMLImageElement; const fallback = `${BUNDLE_WIDGET_BASE}/public/logo/default.webp`; if (target.src !== fallback) { target.src = fallback; } }} />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-center justify-center backdrop-blur-[4px]">
                    <span className="text-white text-xs font-black tracking-[0.3em] translate-y-3 group-hover:translate-y-0 transition-transform">LET'S GO</span>
                  </div>
                </div>
                <span className="text-white font-black truncate w-full text-center group-hover:text-orange-400 tracking-tight transition-colors" style={{ fontSize: `${fontSize}px` }}>
                  {site.name.toUpperCase()}
                </span>
                <span className="text-[11px] text-zinc-500 font-bold text-center opacity-60 group-hover:opacity-100 transition-all mt-3 line-clamp-1 max-w-[140px] uppercase tracking-tighter">
                  {site.tagline}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div
          className={`fixed transition-all duration-500 ease-in-out ${
            isMiniBrowserModal 
              ? 'inset-0 z-[9999] flex items-start justify-center p-4 bg-black/80 backdrop-blur-xl' 
              : 'left-1/2 -translate-x-1/2 z-[90]'
          }`}
          style={isMiniBrowserModal ? {
            paddingTop: 'calc(100px + var(--goo-topbar-safe-top, 0px))',
            paddingBottom: 'calc(40px + var(--goo-topbar-safe-bottom, 0px))'
          } : {
            bottom: 'calc(12px + var(--goo-topbar-safe-bottom, 0px) + env(safe-area-inset-bottom, 0px))'
          }}
        >
          {/* Main Toggle Button (only visible when NOT modal) */}
          {!isMiniBrowserModal && (
            <button
              type="button"
              onClick={() => setIsAudioSheetOpen((v) => {
                const next = !v;
                if (next && historyIndex === -1 && !miniBrowserUrl) {
                  navigateTo(MINI_BROWSER_HOME, true);
                }
                return next;
              })}
              className={`w-[min(92vw,540px)] px-4 py-3 rounded-2xl border ${theme.ui.panelBorder} ${theme.ui.panelBg} backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3`}
              aria-expanded={isAudioSheetOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-r ${theme.ui.accentFrom} ${theme.ui.accentTo} text-white font-black`}>🌐</span>
                <div className="min-w-0">
                  <div className="text-white font-black text-sm truncate">Mini Browser</div>
                  <div className="text-zinc-400 text-xs truncate">กดเพื่อ {isAudioSheetOpen ? 'ปิด' : 'เปิด'} มินิเบราเซอร์</div>
                </div>
              </div>
              <div className={`text-sm font-black transition-all text-transparent bg-clip-text bg-gradient-to-r ${theme.ui.accentFrom} ${theme.ui.accentTo}`}>
                {isAudioSheetOpen ? 'ย่อลง' : 'ขยายขึ้น'}
              </div>
            </button>
          )}

          <div
            className={`overflow-hidden transition-all ease-in-out ${
              isResizing ? '' : 'duration-500'
            } ${
              isMiniBrowserModal 
                ? 'w-full max-w-5xl h-[80vh] opacity-100 scale-100' 
                : (isAudioSheetOpen ? 'mt-3 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95 pointer-events-none')
            }`}
            style={!isMiniBrowserModal && isAudioSheetOpen ? { 
              width: `min(92vw, ${browserSize.width}px)`, 
              height: `${browserSize.height}px`,
              maxHeight: '90vh'
            } : {}}
          >
            <div className={`relative w-full h-full flex flex-col ${theme.ui.panelBg} backdrop-blur-xl border ${theme.ui.panelBorder} ${isMiniBrowserModal ? 'rounded-[2rem]' : 'rounded-3xl'} shadow-2xl overflow-hidden`}>
              
              {/* Resize Handles - Larger Hit Areas for Mobile */}
              {isAudioSheetOpen && !isMiniBrowserModal && (
                <>
                  {/* Left Corner */}
                  <div 
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    className="absolute top-0 left-0 w-12 h-12 cursor-nw-resize z-[100] group/resize flex items-start justify-start p-2"
                  >
                    <div className="w-6 h-6 border-t-4 border-l-4 border-white/20 group-hover/resize:border-orange-500 group-active/resize:border-orange-500 transition-colors rounded-tl-md"></div>
                  </div>
                  
                  {/* Right Corner */}
                  <div 
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    className="absolute top-0 right-0 w-12 h-12 cursor-ne-resize z-[100] group/resize flex items-start justify-end p-2"
                  >
                    <div className="w-6 h-6 border-t-4 border-r-4 border-white/20 group-hover/resize:border-orange-500 group-active/resize:border-orange-500 transition-colors rounded-tr-md"></div>
                  </div>
                  
                  {/* Top Edge Handle (Thicker for touch) */}
                  <div 
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    className="absolute top-0 left-12 right-12 h-6 cursor-n-resize z-[100] hover:bg-orange-500/10 active:bg-orange-500/20 transition-colors flex justify-center items-start pt-1"
                  >
                    <div className="w-12 h-1 bg-white/10 rounded-full group-hover/resize:bg-orange-500/50"></div>
                  </div>
                </>
              )}

              {/* Browser Header / Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-3">
                   <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-r ${theme.ui.accentFrom} ${theme.ui.accentTo} text-white text-[10px] font-black`}>🌐</span>
                   <div className="text-white font-black text-sm truncate">Mini Browser</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                        setBrowserSize({ width: 600, height: 500 }); // Reset size
                    }}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-zinc-400 hover:text-white transition-all mr-2"
                    title="ล้างขนาด"
                  >
                    Reset Size
                  </button>
                  {isMiniBrowserModal ? (
                    <button
                      type="button"
                      onClick={() => setIsMiniBrowserModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/40 text-orange-200 border border-orange-500/20 text-xs font-black transition-all"
                    >
                      ย่อ (Minimize)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsMiniBrowserModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-black transition-all"
                    >
                      ขยาย (Full)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAudioSheetOpen(false);
                      setIsMiniBrowserModal(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/20 text-xs font-black transition-all"
                  >
                    ปิด
                  </button>
                </div>
              </div>

              {/* Navigation Bar */}
              <div className="flex items-center gap-2 p-2 bg-zinc-900/50 border-b border-white/5">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); goBack(); }}
                  className={`px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 transition-all ${historyIndex <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title="กลับ"
                  disabled={historyIndex <= 0}
                >◀</button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); goHome(); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 transition-all"
                  title="หน้าแรก"
                >🏠</button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); refreshBrowser(); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 transition-all"
                  title="รีเฟรช"
                >⟳</button>

                <div className="flex-1">
                  <form onSubmit={(ev) => { ev.preventDefault(); navigateTo(urlInput, true); }}>
                    <input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full bg-black/40 text-sm text-white px-4 py-1.5 rounded-lg border border-white/5 focus:border-white/20 outline-none transition-all"
                      placeholder={MINI_BROWSER_HOME}
                    />
                  </form>
                </div>
              </div>

              {/* iFrame Content (Single Instance) */}
              <div className="flex-1 w-full bg-black/20 overflow-hidden relative">
                {/* Resize Overlay to prevent iframe from stealing mouse events */}
                {isResizing && <div className="absolute inset-0 z-50 bg-transparent"></div>}
                
                <iframe
                  key={miniBrowserKey}
                  src={miniBrowserUrl || MINI_BROWSER_HOME}
                  className="w-full h-full border-none"
                  title="Mini Browser"
                  sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showApiPreview && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in duration-300"
          onClick={() => setShowApiPreview(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-zinc-900/80 border border-zinc-700/50 rounded-[3rem] p-6 sm:p-10 shadow-[0_50px_120px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowApiPreview(false)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all"
              title="ปิด"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 tracking-tight">
              ภาพตัวอย่าง
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['/api1.png', '/api2.png', '/api3.png'].map((src) => (
                <div key={src} className="rounded-3xl overflow-hidden border border-white/10 bg-black/30">
                  <img src={src} alt={src} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid Settings Modal */}
      {showGridSettings && (
        <div 
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in duration-300"
          onClick={() => setShowGridSettings(false)}
        >
          <div 
            className="relative w-full max-w-md bg-zinc-900/90 border border-white/10 rounded-[3rem] p-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
               type="button"
               onClick={() => setShowGridSettings(false)}
               className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>

            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <span className="p-2 bg-orange-500 rounded-xl">🎨</span>
              ตั้งค่าการแสดงผล
            </h2>

            <div className="space-y-8">
              {/* UI Zoom */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 text-xs font-black uppercase tracking-widest">ซูมเนื้อหาหลัก (Global Zoom)</label>
                  <span className="text-orange-400 font-black">{Math.round(uiZoom * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.3" max="1.5" step="0.05"
                  value={uiZoom}
                  onChange={(e) => setUiZoom(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Icon Size */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 text-xs font-black uppercase tracking-widest">ขนาดไอคอน</label>
                  <span className="text-orange-400 font-black">{iconSize}px</span>
                </div>
                <input 
                  type="range" min="60" max="200" step="4"
                  value={iconSize}
                  onChange={(e) => setIconSize(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Font Size */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 text-xs font-black uppercase tracking-widest">ขนาดตัวอักษร</label>
                  <span className="text-orange-400 font-black">{fontSize}px</span>
                </div>
                <input 
                  type="range" min="10" max="32" step="1"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Max Columns (Approximate for large screens) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 text-xs font-black uppercase tracking-widest">จำนวนช่องสูงสุด (หน้าจอใหญ่)</label>
                  <span className="text-orange-400 font-black">{gridCols} ช่อง</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 4, 6, 8, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setGridCols(n)}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${
                        gridCols === n ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white/5 text-zinc-500 hover:bg-white/10'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setIconSize(112);
                  setFontSize(16);
                  setGridCols(6);
                }}
                className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-black tracking-widest uppercase transition-all mt-4"
              >
                รีเซ็ตค่าเริ่มต้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shortcut Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
          <div className="bg-zinc-900/80 border border-zinc-700/50 p-10 rounded-[4rem] w-full max-w-lg shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-10 duration-700">
            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
              <span className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-orange-900/40">+</span>
              เพิ่มปุ่มลัดใหม่
            </h2>
            <form onSubmit={handleAddShortcut} className="space-y-8">
              <div>
                <label className="block text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mb-3 px-2">ชื่อเว็บไซต์</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newShortcut.name}
                  onChange={(e) => setNewShortcut(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="เช่น Google, Facebook"
                  className="w-full bg-black/60 border-2 border-zinc-800 focus:border-orange-500 text-white rounded-[2rem] px-8 py-5 transition-all outline-none text-lg font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mb-3 px-2">ลิงก์ URL</label>
                <input 
                  type="text" 
                  value={newShortcut.url}
                  onChange={(e) => setNewShortcut(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="เช่น google.com"
                  className="w-full bg-black/60 border-2 border-zinc-800 focus:border-orange-500 text-white rounded-[2rem] px-8 py-5 transition-all outline-none text-lg font-medium"
                  required
                />
              </div>
              <div className="flex gap-6 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-6 bg-zinc-800/50 hover:bg-zinc-700 text-white font-black rounded-[2rem] transition-all text-lg uppercase tracking-widest border border-white/5"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black rounded-[2rem] transition-all text-lg uppercase tracking-widest shadow-xl shadow-orange-900/30"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoostoryEmbed;
