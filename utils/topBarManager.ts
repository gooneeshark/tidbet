export type TopBarPosition = 'top' | 'bottom' | 'overlay';

type InitResult = {
  cleanup: () => void;
};

const TOPBAR_PREF_KEY = 'topBarPosition';

let detectedTopBar: HTMLElement | null = null;
let topBarChip: HTMLButtonElement | null = null;

function detectTopBar() {
  const candidates = Array.from(document.querySelectorAll('body *'))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
    .filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed') return false;
      if (el.id === 'addShortcutBtn' || el.id === 'trashCan' || el.id === 'shortcutModal') return false;
      if (el.closest('header')) return false;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const isFullWidth = rect.width >= vw * 0.8;
      const isBarHeight = rect.height > 24 && rect.height < 140;
      const nearTop = Math.abs(rect.top) < 10;
      const nearBottom = Math.abs(window.innerHeight - rect.bottom) < 10;
      return isFullWidth && isBarHeight && (nearTop || nearBottom);
    });

  if (candidates.length) {
    candidates.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
    detectedTopBar = candidates[0];
    applyTopBarLayout();
  }
}

function getPref(): TopBarPosition {
  const v = (localStorage.getItem(TOPBAR_PREF_KEY) || 'top') as TopBarPosition;
  if (v === 'top' || v === 'bottom' || v === 'overlay') return v;
  return 'top';
}

function applyTopBarLayout() {
  const pref = getPref();
  const header = document.querySelector('header') as HTMLElement | null;

  document.body.style.paddingTop = '';
  document.body.style.paddingBottom = '';
  document.documentElement.style.setProperty('--goo-topbar-safe-top', '0px');
  document.documentElement.style.setProperty('--goo-topbar-safe-bottom', '0px');
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
  }

  const rect = bar.getBoundingClientRect();
  const safe = Math.ceil(rect.height) + 8;
  if (pref === 'top') {
    document.body.style.paddingTop = `calc(${safe}px + env(safe-area-inset-top, 0px))`;
    document.documentElement.style.setProperty('--goo-topbar-safe-top', `${safe}px`);
    if (header) header.style.top = `${10 + safe}px`;
    placeTopBarChip({ position: 'bottom-left' });
  } else if (pref === 'bottom') {
    document.body.style.paddingBottom = `calc(${safe}px + env(safe-area-inset-bottom, 0px))`;
    document.documentElement.style.setProperty('--goo-topbar-safe-bottom', `${safe}px`);
    if (header) header.style.top = '10px';
    placeTopBarChip({ position: 'top-left', offsetTop: safe + 12 });
  } else {
    if (header) header.style.top = '10px';
    placeTopBarChip({ position: 'top-left', offsetTop: 12 });
  }
}

function createTopBarControls() {
  const header = document.querySelector('header');
  if (!header) return;
  const panel = (header.querySelector('.controls-panel') as HTMLElement | null) || (header as HTMLElement);

  if (panel.querySelector('#topBarPositionSelect')) return;

  const wrapper = document.createElement('span');
  wrapper.style.marginLeft = '8px';
  const select = document.createElement('select');
  select.id = 'topBarPositionSelect';

  (['top', 'bottom', 'overlay'] as TopBarPosition[]).forEach((v) => {
    const op = document.createElement('option');
    op.value = v;
    op.textContent = `TopBar: ${v}`;
    select.appendChild(op);
  });

  select.value = getPref();
  select.addEventListener('change', () => {
    localStorage.setItem(TOPBAR_PREF_KEY, select.value);
    applyTopBarLayout();
  });

  wrapper.appendChild(select);
  panel.appendChild(wrapper);
}

function createTopBarChip() {
  if (topBarChip) return;

  const chip = document.createElement('button');
  chip.id = 'topBarQuickToggle';
  chip.type = 'button';
  chip.textContent = 'TopBar';
  chip.title = 'Toggle top bar position';
  chip.style.cssText = [
    'position: fixed',
    'left: 12px',
    'top: 12px',
    'z-index: 5000',
    'padding: 6px 10px',
    'border: none',
    'border-radius: 16px',
    'background: rgba(0,0,0,0.6)',
    'color: #fff',
    'font-size: 12px',
    'box-shadow: 0 2px 8px rgba(0,0,0,0.25)',
    'backdrop-filter: saturate(140%) blur(6px)',
    'cursor: pointer'
  ].join(';');

  chip.addEventListener('click', () => {
    const order: TopBarPosition[] = ['top', 'bottom', 'overlay'];
    const current = getPref();
    const next = order[(order.indexOf(current) + 1) % order.length];
    localStorage.setItem(TOPBAR_PREF_KEY, next);
    applyTopBarLayout();
  });

  document.body.appendChild(chip);
  topBarChip = chip;
}

function placeTopBarChip(params?: { position?: 'top-left' | 'bottom-left'; offsetTop?: number; offsetBottom?: number }) {
  if (!topBarChip) return;
  const { position = 'top-left', offsetTop = 12, offsetBottom = 12 } = params || {};

  topBarChip.style.top = '';
  topBarChip.style.bottom = '';
  topBarChip.style.left = '12px';
  topBarChip.style.right = '';

  if (position === 'top-left') {
    topBarChip.style.top = `${offsetTop}px`;
  } else {
    topBarChip.style.bottom = `${offsetBottom}px`;
  }
}

export function initTopBarManager(): InitResult {
  let disposed = false;

  const resizeHandler = () => applyTopBarLayout();
  const mo = new MutationObserver(() => {
    if (!detectedTopBar) detectTopBar();
  });

  setTimeout(() => {
    if (disposed) return;
    detectTopBar();
  }, 300);

  mo.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', resizeHandler);

  createTopBarControls();
  createTopBarChip();

  return {
    cleanup: () => {
      disposed = true;
      mo.disconnect();
      window.removeEventListener('resize', resizeHandler);
    }
  };
}
