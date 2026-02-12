// Configuration
const CONFIG = {
    iconSize: 80,
    maxShortcuts: 12,
    themes: {
        dark: {
            bgColor: '#1a1a1a',
            textColor: '#ffffff',
            cardBg: 'rgba(255, 255, 255, 0.1)',
            inputBg: 'rgba(0, 0, 0, 0.8)',
            inputBorder: 'rgba(255, 255, 255, 0.3)'
        },
        light: {
            bgColor: '#f5f5f5',
            textColor: '#333333',
            cardBg: 'rgba(0, 0, 0, 0.05)',
            inputBg: 'rgba(255, 255, 255, 0.9)',
            inputBorder: 'rgba(0, 0, 0, 0.2)'
        },
        blue: {
            bgColor: '#0a192f',
            textColor: '#e6f1ff',
            cardBg: 'rgba(100, 255, 255, 0.1)',
            inputBg: 'rgba(10, 25, 47, 0.8)',
            inputBorder: 'rgba(100, 255, 255, 0.5)'
        }
    },
    trashCan: {
        top: '20px',
        right: '20px',
        size: 60
    }
};

// State and DOM Elements
let addButton, themeSelect, shortcutForm, urlInput, nameInput, shortcutsContainer;
let trashCan;
let draggedEl = null;
let currentTheme = 'dark';
let jsonShortcutsCache = [];
const TOPBAR_PREF_KEY = 'topBarPosition'; // 'top' | 'bottom' | 'overlay'
let topBarChip = null;
let siteClicks = JSON.parse(localStorage.getItem('siteClicks') || '{}');
let currentQuery = '';
let deferredInstallPrompt = null;

// Simple debounce helper
function debounce(fn, wait) {
    let t;
    return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

// Initialize the shortcuts system
function initShortcuts() {
    createUI();
    loadTheme();
    // Load JSON shortcuts first, then user shortcuts to render combined
    loadJsonShortcuts().finally(() => {
        loadShortcuts();
    });
    setupEventListeners();
    initTopBarManager();
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js').catch(() => {});
        });
    }
}

// Create UI elements
function createUI() {
    // Create add button
    addButton = document.createElement('button');
    addButton.id = 'addShortcutBtn';
    addButton.className = 'btn-add';
    addButton.innerHTML = '+ เพิ่มปุ่มลัด';
    document.body.appendChild(addButton);

    // Create header and mobile toggle/panel
    const header = document.createElement('header');
    header.className = 'header-controls';
    const controlsToggle = document.createElement('button');
    controlsToggle.type = 'button';
    controlsToggle.className = 'controls-toggle';
    controlsToggle.setAttribute('aria-label', 'เมนู');
    controlsToggle.textContent = '☰';
    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'controls-panel';
    controlsPanel.id = 'controlsPanel';
    controlsToggle.setAttribute('aria-controls', 'controlsPanel');
    controlsToggle.setAttribute('aria-expanded', 'false');
    const closePanel = () => {
        if (controlsPanel.classList.contains('open')) {
            controlsPanel.classList.remove('open');
            controlsToggle.setAttribute('aria-expanded', 'false');
        }
    };
    const openPanel = () => {
        if (!controlsPanel.classList.contains('open')) {
            controlsPanel.classList.add('open');
            controlsToggle.setAttribute('aria-expanded', 'true');
        }
    };
    controlsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (controlsPanel.classList.contains('open')) {
            closePanel();
        } else {
            openPanel();
        }
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!controlsPanel.contains(e.target) && !controlsToggle.contains(e.target)) {
            closePanel();
        }
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePanel();
    });
    header.appendChild(controlsToggle);
    header.appendChild(controlsPanel);

    // Create theme selector
    
    themeSelect = document.createElement('select');
    themeSelect.id = 'themeSelect';
    Object.keys(CONFIG.themes).forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        themeSelect.appendChild(option);
    });
    
    controlsPanel.appendChild(themeSelect);
    // Close panel after theme change (mobile UX)
    themeSelect.addEventListener('change', () => closePanel());

    // Background upload control
    const bgBtn = document.createElement('button');
    bgBtn.type = 'button';
    bgBtn.textContent = 'พื้นหลัง';
    bgBtn.className = 'btn-chip';
    const bgInput = document.createElement('input');
    bgInput.type = 'file';
    bgInput.accept = 'image/*';
    bgInput.style.display = 'none';
    bgBtn.addEventListener('click', () => bgInput.click());
    bgInput.addEventListener('change', (e) => {
        const f = e.target && e.target.files ? e.target.files[0] : null;
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            try { localStorage.setItem('customBg', String(reader.result)); } catch {}
            applyCustomBackground();
        };
        reader.readAsDataURL(f);
    });
    controlsPanel.appendChild(bgBtn);
    controlsPanel.appendChild(bgInput);

    // Add to Home Screen button
    const a2hsBtn = document.createElement('button');
    a2hsBtn.type = 'button';
    a2hsBtn.textContent = 'เพิ่มเป็นแอป';
    a2hsBtn.className = 'btn-chip';
    a2hsBtn.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            try { await deferredInstallPrompt.userChoice; } catch {}
            deferredInstallPrompt = null;
        } else {
            alert('วิธีเพิ่มเป็นหน้าแรก:\n- Android: แตะเมนู ⋮ > Add to Home screen\n- iOS (Safari): แตะไอคอนแชร์ > Add to Home Screen');
        }
    });
    controlsPanel.appendChild(a2hsBtn);
    a2hsBtn.addEventListener('click', () => closePanel());

    // Matrix rain toggle button
    const applyMatrixEnabled = (enabled) => {
        const canvas = document.getElementById('matrix');
        if (canvas) {
            canvas.style.display = enabled ? 'block' : 'none';
        }
    };
    let matrixEnabled = (localStorage.getItem('matrixEnabled') ?? 'true') !== 'false';
    applyMatrixEnabled(matrixEnabled);
    const matrixBtn = document.createElement('button');
    matrixBtn.type = 'button';
    matrixBtn.className = 'btn-chip';
    const updateMatrixBtnText = () => {
        matrixBtn.textContent = matrixEnabled ? 'ปิดฝน Matrix' : 'เปิดฝน Matrix';
    };
    updateMatrixBtnText();
    matrixBtn.addEventListener('click', () => {
        matrixEnabled = !matrixEnabled;
        try { localStorage.setItem('matrixEnabled', String(matrixEnabled)); } catch {}
        applyMatrixEnabled(matrixEnabled);
        updateMatrixBtnText();
        closePanel();
    });
    controlsPanel.appendChild(matrixBtn);

    // Clear background button
    const clearBgBtn = document.createElement('button');
    clearBgBtn.type = 'button';
    clearBgBtn.textContent = 'ล้างพื้นหลัง';
    clearBgBtn.className = 'btn-chip';
    clearBgBtn.addEventListener('click', () => {
        try { localStorage.removeItem('customBg'); } catch {}
        applyCustomBackground();
    });
    controlsPanel.appendChild(clearBgBtn);
    clearBgBtn.addEventListener('click', () => closePanel());

    // Reset settings button
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'รีเซ็ต';
    resetBtn.className = 'btn-chip';
    resetBtn.addEventListener('click', () => {
        if (confirm('รีเซ็ตการตั้งค่าและปุ่มลัดทั้งหมด?')) {
            try {
                ['shortcuts','siteClicks','selectedTheme','customBg','topBarPosition'].forEach(k => localStorage.removeItem(k));
            } catch {}
            location.reload();
        }
    });
    controlsPanel.appendChild(resetBtn);
    resetBtn.addEventListener('click', () => closePanel());
    document.body.appendChild(header);

    // Create modal for adding shortcuts
    const modal = document.createElement('div');
    modal.id = 'shortcutModal';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    shortcutForm = document.createElement('form');
    shortcutForm.id = 'shortcutForm';
    
    const title = document.createElement('h3');
    title.textContent = 'เพิ่มปุ่มลัดใหม่';
    // title uses default styles
    
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'URL เว็บไซต์';
    // labels use default styles
    
    urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.placeholder = 'https://example.com';
    urlInput.required = true;
    // inputs styled via CSS
    
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'ชื่อปุ่มลัด (ไม่บังคับ)';
    // labels use default styles
    
    nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'ชื่อเว็บไซต์';
    // inputs styled via CSS
    
    const buttonContainer = document.createElement('div');
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'บันทึก';
    submitBtn.className = 'btn-submit';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'ยกเลิก';
    cancelBtn.className = 'btn-cancel';
    
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(submitBtn);
    
    shortcutForm.appendChild(title);
    shortcutForm.appendChild(urlLabel);
    shortcutForm.appendChild(urlInput);
    shortcutForm.appendChild(nameLabel);
    shortcutForm.appendChild(nameInput);
    shortcutForm.appendChild(buttonContainer);
    
    modalContent.appendChild(shortcutForm);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Create shortcuts container
    shortcutsContainer = document.createElement('div');
    shortcutsContainer.id = 'shortcutsContainer';
    shortcutsContainer.className = 'shortcuts-container';
    
    // Insert after the search input
    const searchInput = document.getElementById('searchInput');
    searchInput.insertAdjacentElement('afterend', shortcutsContainer);

    // Create trash can (hidden by default)
    trashCan = document.createElement('div');
    trashCan.id = 'trashCan';
    trashCan.textContent = '🗑️';
    document.body.appendChild(trashCan);
}

// ---------------- Top Bar Manager ----------------
let detectedTopBar = null; // HTMLElement | null
function initTopBarManager() {
    // Try initial detection after a small delay (external widget may load async)
    setTimeout(detectTopBar, 300);
    // Observe future mutations for late injection
    const mo = new MutationObserver(() => {
        if (!detectedTopBar) detectTopBar();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Create a small control near theme selector
    createTopBarControls();
    // Re-apply on resize
    window.addEventListener('resize', () => applyTopBarLayout());
    // Create a persistent quick toggle chip
    createTopBarChip();
}

function detectTopBar() {
    const candidates = Array.from(document.querySelectorAll('body *'))
        .filter(el => el instanceof HTMLElement)
        .map(el => el)
        .filter(el => {
            const cs = getComputedStyle(el);
            if (cs.position !== 'fixed') return false;
            if (el.id === 'addShortcutBtn' || el.id === 'trashCan' || el.id === 'shortcutModal') return false;
            if (el.closest('header')) return false; // skip our header
            const rect = el.getBoundingClientRect();
            const vw = window.innerWidth;
            const isFullWidth = rect.width >= vw * 0.8;
            const isBarHeight = rect.height > 24 && rect.height < 140;
            const nearTop = Math.abs(rect.top) < 10;
            const nearBottom = Math.abs(window.innerHeight - rect.bottom) < 10;
            return isFullWidth && isBarHeight && (nearTop || nearBottom);
        });

    if (candidates.length) {
        // Prefer the one with largest width
        candidates.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
        detectedTopBar = candidates[0];
        applyTopBarLayout();
    }
}

function createTopBarControls() {
    const header = document.querySelector('header');
    if (!header) return;
    const panel = header.querySelector('.controls-panel') || header;
    const wrapper = document.createElement('span');
    wrapper.style.marginLeft = '8px';
    const select = document.createElement('select');
    select.id = 'topBarPositionSelect';
    ;['top','bottom','overlay'].forEach(v => {
        const op = document.createElement('option');
        op.value = v; op.textContent = `TopBar: ${v}`;
        select.appendChild(op);
    });
    select.value = localStorage.getItem(TOPBAR_PREF_KEY) || 'top';
    select.addEventListener('change', () => {
        localStorage.setItem(TOPBAR_PREF_KEY, select.value);
        applyTopBarLayout();
    });
    wrapper.appendChild(select);
    panel.appendChild(wrapper);
}

function applyTopBarLayout() {
    const pref = localStorage.getItem(TOPBAR_PREF_KEY) || 'top';
    const header = document.querySelector('header');
    // Reset paddings
    document.body.style.paddingTop = '';
    document.body.style.paddingBottom = '';
    if (!detectedTopBar) return;

    const bar = detectedTopBar;
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.width = '100%';
    bar.style.zIndex = '1500';

    if (pref === 'top') {
        bar.style.top = '0';
        bar.style.bottom = '';
    } else if (pref === 'bottom') {
        bar.style.bottom = '0';
        bar.style.top = '';
    } else { // overlay
        // Keep current top/bottom, no padding
    }

    // Safe-area padding for mobile (avoid overlap)
    const rect = bar.getBoundingClientRect();
    const safe = Math.ceil(rect.height) + 8; // a bit extra spacing
    if (pref === 'top') {
        document.body.style.paddingTop = `calc(${safe}px + env(safe-area-inset-top, 0px))`;
        if (header) header.style.top = `${10 + safe}px`;
        // Place chip near bottom-left so it's away from the top bar
        placeTopBarChip({ position: 'bottom-left' });
    } else if (pref === 'bottom') {
        document.body.style.paddingBottom = `calc(${safe}px + env(safe-area-inset-bottom, 0px))`;
        if (header) header.style.top = '10px';
        // Place chip near top-left so it's away from the bottom bar
        placeTopBarChip({ position: 'top-left', offsetTop: safe + 12 });
    } else { // overlay
        if (header) header.style.top = '10px';
        // Place chip top-left with small offset so it's always tappable
        placeTopBarChip({ position: 'top-left', offsetTop: 12 });
    }
}

function createTopBarChip() {
    if (topBarChip) return;
    const chip = document.createElement('button');
    chip.id = 'topBarQuickToggle';
    chip.type = 'button';
    chip.textContent = 'TopBar';
    chip.title = 'Toggle top bar position';
    chip.style.cssText = `
        position: fixed;
        left: 12px;
        top: 12px;
        z-index: 5000;
        padding: 6px 10px;
        border: none;
        border-radius: 16px;
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        backdrop-filter: saturate(140%) blur(6px);
        cursor: pointer;
    `;
    chip.addEventListener('click', () => {
        const order = ['top','bottom','overlay'];
        const current = localStorage.getItem(TOPBAR_PREF_KEY) || 'top';
        const next = order[(order.indexOf(current) + 1) % order.length];
        localStorage.setItem(TOPBAR_PREF_KEY, next);
        applyTopBarLayout();
    });
    document.body.appendChild(chip);
    topBarChip = chip;
}

function placeTopBarChip({ position = 'top-left', offsetTop = 12, offsetBottom = 12 } = {}) {
    if (!topBarChip) return;
    // Reset
    topBarChip.style.top = '';
    topBarChip.style.bottom = '';
    topBarChip.style.left = '12px';
    topBarChip.style.right = '';
    if (position === 'top-left') {
        topBarChip.style.top = `${offsetTop}px`;
    } else if (position === 'bottom-left') {
        topBarChip.style.bottom = `${offsetBottom}px`;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Add button click
    addButton.addEventListener('click', () => {
        document.getElementById('shortcutModal').style.display = 'flex';
        urlInput.focus();
    });
    
    // Close modal when clicking outside
    document.getElementById('shortcutModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('shortcutModal')) {
            closeModal();
        }
    });
    
    // Close modal with cancel button
    document.querySelector('#shortcutForm button[type="button"]').addEventListener('click', closeModal);
    
    // Form submission
    shortcutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addShortcut(urlInput.value.trim(), nameInput.value.trim() || null);
        closeModal();
    });
    
    // Theme change
    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
        localStorage.setItem('selectedTheme', e.target.value);
    });

    // Search functionality
    const searchInputEl = document.getElementById('searchInput');
    if (searchInputEl) {
        const onSearch = debounce(() => {
            currentQuery = String(searchInputEl.value || '').toLowerCase().trim();
            renderShortcuts(getShortcuts());
        }, 180);
        searchInputEl.addEventListener('input', onSearch);
    }

    // Capture A2HS event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
    });

    // Container drag events (for reordering)
    shortcutsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(shortcutsContainer, e.clientX, e.clientY);
        if (!draggedEl) return;
        if (afterElement == null) {
            shortcutsContainer.appendChild(draggedEl);
        } else {
            shortcutsContainer.insertBefore(draggedEl, afterElement);
        }
    });

    shortcutsContainer.addEventListener('drop', () => {
        hideTrash();
        saveShortcutsOrder();
    });

    // Trash can drag events
    trashCan.addEventListener('dragover', (e) => {
        e.preventDefault();
        trashCan.style.transform = 'scale(1)';
        trashCan.style.background = 'rgba(255, 0, 0, 0.95)';
    });
    trashCan.addEventListener('dragleave', () => {
        trashCan.style.transform = 'scale(0.95)';
        trashCan.style.background = 'rgba(255, 0, 0, 0.75)';
    });
    trashCan.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedEl && draggedEl.dataset.id) {
            const id = draggedEl.dataset.id;
            deleteShortcut(id, { confirmDialog: false });
            hideTrash();
        }
    });
}

// Apply custom background image if saved
function applyCustomBackground() {
    try {
        const dataUrl = localStorage.getItem('customBg');
        if (dataUrl) {
            document.body.style.backgroundImage = `url(${dataUrl})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
        } else {
            document.body.style.backgroundImage = '';
        }
    } catch {
        document.body.style.backgroundImage = '';
    }
}

// Close modal and reset form
function closeModal() {
    document.getElementById('shortcutModal').style.display = 'none';
    shortcutForm.reset();
}

function resolveFavicon(input, fallbackUrl) {
    try {
        if (typeof input !== 'string' || !input.trim()) return fallbackUrl;
        const s = input.trim();
        if (/^https?:\/\//i.test(s)) return s;
        if (/^data:/i.test(s)) return s;
        if (/^\/\//.test(s)) return s;
        const host = new URL(s.startsWith('http') ? s : `https://${s}`).hostname;
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
    } catch {
        return fallbackUrl;
    }
}

// Add a new shortcut
async function addShortcut(url, name = null) {
    try {
        // Get website name from URL if not provided
        if (!name) {
            const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
            name = domain.split('.')[0];
        }
        
        // Create favicon URL
        const faviconUrl = resolveFavicon(url, `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=128`);
        
        // Create shortcut object
        const shortcut = {
            id: Date.now().toString(),
            url: url.startsWith('http') ? url : `https://${url}`,
            name: name,
            icon: faviconUrl,
            timestamp: Date.now()
        };
        
        // Save to localStorage
        const shortcuts = getShortcuts();
        shortcuts.unshift(shortcut);
        
        // Limit the number of shortcuts
        if (shortcuts.length > CONFIG.maxShortcuts) {
            shortcuts.pop();
        }
        
        localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
        
        // Update UI
        renderShortcuts(shortcuts);
        
    } catch (error) {
        console.error('Error adding shortcut:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่มปุ่มลัด');
    }
}

// Get all shortcuts from localStorage
function getShortcuts() {
    return JSON.parse(localStorage.getItem('shortcuts') || '[]');
}

// Render shortcuts to the DOM
function renderShortcuts(shortcuts) {
    shortcutsContainer.innerHTML = '';

    // Normalize query
    const q = currentQuery;

    // 1) Render user-created shortcuts first (draggable)
    const userList = q
        ? shortcuts.filter(s => (s.name || '').toLowerCase().includes(q))
        : shortcuts;
    userList.forEach(shortcut => {
        const el = createShortcutElement(shortcut, { draggable: true, deletable: true });
        shortcutsContainer.appendChild(el);
    });

    // 2) Then render JSON-loaded shortcuts (not draggable, not deletable)
    if (jsonShortcutsCache && jsonShortcutsCache.length) {
        // Filter by query
        let jsonList = q
            ? jsonShortcutsCache.filter(site => (site.name || '').toLowerCase().includes(q))
            : jsonShortcutsCache.slice();
        // Sort by last clicked (most recent first)
        jsonList.sort((a, b) => (siteClicks[b.url] || 0) - (siteClicks[a.url] || 0));
        jsonList.forEach(site => {
            const jsonEl = createShortcutElement({
                id: `json-${site.name}`,
                url: site.url,
                name: site.name,
                icon: resolveFavicon(site.logo || site.url, site.logo || '')
            }, { draggable: false, deletable: false });
            shortcutsContainer.appendChild(jsonEl);
        });
    }
}

// Create a shortcut element
function createShortcutElement(shortcut, options = { draggable: false, deletable: false }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'shortcut';
    wrapper.dataset.id = shortcut.id;

    const iconBox = document.createElement('div');
    iconBox.className = 'shortcut-icon';

    const img = document.createElement('img');
    img.src = shortcut.icon;
    img.alt = shortcut.name;

    const name = document.createElement('span');
    name.className = 'shortcut-name';
    name.textContent = shortcut.name;

    // Delete button for user shortcuts
    if (options.deletable) {
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-shortcut';
        delBtn.textContent = '×';
        wrapper.appendChild(delBtn);
        wrapper.addEventListener('mouseenter', () => { delBtn.style.opacity = '1'; });
        wrapper.addEventListener('mouseleave', () => { delBtn.style.opacity = '0'; });
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteShortcut(shortcut.id);
        });
    }

    iconBox.appendChild(img);
    wrapper.appendChild(iconBox);
    wrapper.appendChild(name);

    // Helper to open shortcut and record click
    let suppressNextClick = false;
    const openShortcut = () => {
        try {
            if (shortcut && shortcut.url) {
                siteClicks[shortcut.url] = Date.now();
                localStorage.setItem('siteClicks', JSON.stringify(siteClicks));
            }
        } catch {}
        window.open(shortcut.url, '_blank');
    };
    // Open URL on click (skip if we already opened from touchend)
    wrapper.addEventListener('click', (e) => {
        if (suppressNextClick) { suppressNextClick = false; return; }
        openShortcut();
    });

    // Drag and drop for user shortcuts
    if (options.draggable) {
        wrapper.draggable = true;
        wrapper.addEventListener('dragstart', (e) => {
            draggedEl = wrapper;
            e.dataTransfer.effectAllowed = 'move';
            showTrash();
            setTimeout(() => wrapper.style.opacity = '0.5', 0);
        });
        wrapper.addEventListener('dragend', () => {
            wrapper.style.opacity = '1';
            draggedEl = null;
            hideTrash();
        });

        // Touch drag support with following finger
        let touchActive = false;
        let dragging = false;
        let placeholder = null;
        let offset = { x: 0, y: 0 };
        let lastTouch = { x: 0, y: 0 };
        let startPos = { x: 0, y: 0 };
        const dragThreshold = 8; // px
        const beginDrag = (t, rect) => {
            draggedEl = wrapper;
            showTrash();
            // Create placeholder to keep layout
            placeholder = document.createElement('div');
            placeholder.style.width = rect.width + 'px';
            placeholder.style.height = rect.height + 'px';
            placeholder.className = 'shortcut placeholder';
            shortcutsContainer.insertBefore(placeholder, wrapper);
            // Move dragged element to body as overlay
            document.body.appendChild(wrapper);
            wrapper.style.position = 'fixed';
            wrapper.style.left = rect.left + 'px';
            wrapper.style.top = rect.top + 'px';
            wrapper.style.width = rect.width + 'px';
            wrapper.style.zIndex = '3500';
            wrapper.style.opacity = '0.9';
            wrapper.style.pointerEvents = 'none';
            offset = { x: t.clientX - rect.left, y: t.clientY - rect.top };
            dragging = true;
        };
        const startTouchDrag = (ev) => {
            if (ev.touches.length !== 1) return;
            const t = ev.touches[0];
            touchActive = true;
            lastTouch = { x: t.clientX, y: t.clientY };
            startPos = { x: t.clientX, y: t.clientY };
            // Do not preventDefault yet; allow tap to generate click
        };
        const moveTouchDrag = (ev) => {
            if (!touchActive) return;
            const t = ev.touches[0];
            lastTouch = { x: t.clientX, y: t.clientY };
            if (!dragging) {
                const dx = lastTouch.x - startPos.x;
                const dy = lastTouch.y - startPos.y;
                if (Math.hypot(dx, dy) > dragThreshold) {
                    const rect = wrapper.getBoundingClientRect();
                    beginDrag(t, rect);
                } else {
                    return; // still waiting for threshold, don't block scroll
                }
            }
            const x = lastTouch.x - offset.x;
            const y = lastTouch.y - offset.y;
            wrapper.style.left = x + 'px';
            wrapper.style.top = y + 'px';
            // Find insertion point relative to container
            const after = getDragAfterElement(shortcutsContainer, lastTouch.x, lastTouch.y);
            if (after == null) {
                shortcutsContainer.appendChild(placeholder);
            } else if (after !== placeholder) {
                shortcutsContainer.insertBefore(placeholder, after);
            }
            // Trash hover feedback
            if (isPointOverTrash(lastTouch.x, lastTouch.y)) {
                trashCan.style.transform = 'scale(1.05)';
                trashCan.style.background = 'rgba(255, 0, 0, 0.95)';
            } else {
                trashCan.style.transform = 'scale(0.95)';
                trashCan.style.background = 'rgba(255, 0, 0, 0.75)';
            }
            ev.preventDefault();
        };
        const endTouchDrag = () => {
            if (!touchActive) return;
            touchActive = false;
            if (!dragging) {
                // Treat as a tap: open the shortcut
                suppressNextClick = true;
                openShortcut();
                return;
            }
            // If dropped over trash, delete and cleanup
            if (isPointOverTrash(lastTouch.x, lastTouch.y)) {
                const id = wrapper && wrapper.dataset ? wrapper.dataset.id : null;
                if (id) {
                    if (placeholder) placeholder.remove();
                    hideTrash();
                    deleteShortcut(id, { confirmDialog: false });
                    dragging = false;
                    return;
                }
            }
            // Insert wrapper at placeholder position
            if (placeholder && placeholder.parentNode) {
                shortcutsContainer.insertBefore(wrapper, placeholder);
                placeholder.remove();
            }
            // Reset styles
            wrapper.style.position = '';
            wrapper.style.left = '';
            wrapper.style.top = '';
            wrapper.style.width = '';
            wrapper.style.zIndex = '';
            wrapper.style.opacity = '';
            wrapper.style.pointerEvents = '';
            draggedEl = null;
            hideTrash();
            saveShortcutsOrder();
            dragging = false;
        };
        wrapper.addEventListener('touchstart', startTouchDrag, { passive: false });
        wrapper.addEventListener('touchmove', moveTouchDrag, { passive: false });
        wrapper.addEventListener('touchend', endTouchDrag);
    }

    return wrapper;
}

// Helpers for drag position
function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.shortcut[draggable="true"]:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = Math.hypot(y - (box.top + box.height / 2), x - (box.left + box.width / 2));
        if (offset < closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.POSITIVE_INFINITY, element: null }).element;
}

function saveShortcutsOrder() {
    const current = getShortcuts();
    const idsInDom = Array.from(shortcutsContainer.children)
        .map(el => el.getAttribute('data-id'))
        .filter(id => id && !id.startsWith('json-'));
    const newOrder = idsInDom.map(id => current.find(s => s.id === id)).filter(Boolean);
    localStorage.setItem('shortcuts', JSON.stringify(newOrder));
}

function showTrash() {
    trashCan.style.opacity = '1';
    trashCan.style.transform = 'scale(1)';
    trashCan.style.pointerEvents = 'auto';
}
function hideTrash() {
    trashCan.style.opacity = '0';
    trashCan.style.transform = 'scale(0.85)';
    trashCan.style.pointerEvents = 'none';
    trashCan.style.background = 'rgba(255, 0, 0, 0.75)';
}

function isPointOverTrash(x, y) {
    if (!trashCan) return false;
    const r = trashCan.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

// Delete a shortcut
function deleteShortcut(id, options = { confirmDialog: true }) {
    if (!options.confirmDialog || confirm('คุณแน่ใจหรือไม่ที่ต้องการลบปุ่มลัดนี้?')) {
        const shortcuts = getShortcuts().filter(s => s.id !== id);
        localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
        renderShortcuts(shortcuts);
    }
}

// Load saved shortcuts
function loadShortcuts() {
    const shortcuts = getShortcuts();
    renderShortcuts(shortcuts);
}

// Load JSON shortcuts and cache
async function loadJsonShortcuts() {
    try {
        const res = await fetch('https://raw.githubusercontent.com/P200p/bundle_widget/main/card.json');
        const data = await res.json();
        jsonShortcutsCache = Array.isArray(data?.sites) ? data.sites : [];
    } catch (e) {
        console.error('โหลด JSON ไอคอนไม่สำเร็จ', e);
        jsonShortcutsCache = [];
    }
}

// Load saved theme or apply default
function loadTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
    applyCustomBackground();
}

// Apply theme
function applyTheme(themeName) {
    currentTheme = themeName;
    const theme = CONFIG.themes[themeName] || CONFIG.themes.dark;
    
    // Update root variables
    document.documentElement.style.setProperty('--bg-color', theme.bgColor);
    document.documentElement.style.setProperty('--text-color', theme.textColor);
    document.documentElement.style.setProperty('--card-bg', theme.cardBg);
    document.documentElement.style.setProperty('--input-bg', theme.inputBg);
    document.documentElement.style.setProperty('--input-border', theme.inputBorder);
    
    // Update existing elements
    document.body.style.backgroundColor = theme.bgColor;
    document.body.style.color = theme.textColor;
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.style.backgroundColor = theme.inputBg;
        searchInput.style.color = theme.textColor;
        searchInput.style.borderColor = theme.inputBorder;
    }
    
    // Update shortcuts
    const shortcuts = document.querySelectorAll('.shortcut');
    shortcuts.forEach(shortcut => {
        const nameElement = shortcut.querySelector('.shortcut-name');
        if (nameElement) nameElement.style.color = theme.textColor;
        const iconElement = shortcut.querySelector('.shortcut-icon');
        if (iconElement) iconElement.style.background = theme.cardBg;
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShortcuts);
} else {
    initShortcuts();
}

// Export for testing/global access if needed
window.ShortcutsManager = {
    addShortcut: addShortcut,
    deleteShortcut: deleteShortcut,
    getShortcuts: getShortcuts,
    applyTheme: applyTheme
};
