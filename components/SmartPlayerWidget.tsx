import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, HardDrive, Music, Maximize2, Music2, Shuffle } from 'lucide-react';

// RSS Feed URL (via CORS proxy since audio.com blocks cross-origin requests)
const RSS_FEED_URL = 'https://audio.com/rss/collection/1856762119672147';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const AUDIO_CACHE_NAME = 'music-audio-cache-v2-rss';

// External style domain
const STYLE_DOMAIN = 'https://goosing.netlify.app';

interface Track {
  title: string;
  url: string;
  image?: string;
}

/** Fisher-Yates shuffle */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SmartPlayerWidget = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Player state
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('กำลังโหลด...');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // High-frequency DOM Refs (to bypass React renders)
  const floatingPlayerRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  // Dragging state references
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initPos = useRef({ x: 0, y: 0 });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<Track[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const autoplayPending = useRef<boolean>(true);

  // Keep refs in sync with state
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  useEffect(() => {
    // 1. Load CSS from external domain
    if (!document.getElementById('smart-player-styles')) {
      const link = document.createElement('link');
      link.id = 'smart-player-styles';
      link.rel = 'stylesheet';
      link.href = `${STYLE_DOMAIN}/style.css`;
      document.head.appendChild(link);
    }

    // 2. Fetch RSS and parse
    const fetchRSS = async () => {
      try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(RSS_FEED_URL));
        if (!response.ok) throw new Error('Failed to load RSS feed');
        const text = await response.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');
        const items = xml.querySelectorAll('item');
        const tracks: Track[] = [];

        items.forEach(item => {
          const title = item.querySelector('title')?.textContent || 'Unknown';
          const enclosure = item.querySelector('enclosure');
          const url = enclosure?.getAttribute('url') || '';
          // itunes:image — namespace query
          const itunesImage = item.getElementsByTagName('itunes:image')[0];
          const image = itunesImage?.getAttribute('href') || '';

          if (url) {
            // Decode XML entities in URL (RSS uses &amp; etc.)
            const decoded = url.replace(/&amp;/g, '&');
            tracks.push({ title, url: decoded, image });
          }
        });

        // Set playlist in original order
        setPlaylist(tracks);
        playlistRef.current = tracks;
        setStatusText('พร้อมทำงาน');
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load RSS playlist:', err);
        setStatusText('โหลดไม่สำเร็จ');
      }
    };

    // Init audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'none';

      audioRef.current.onended = () => {
        // Auto-play next track
        const pl = playlistRef.current;
        const ci = currentIndexRef.current;
        let next = ci + 1;
        if (next >= pl.length) next = 0; // Loop back to start
        playTrackDirect(next);
      };

      audioRef.current.onplay = () => {
        setIsPlaying(true);
        setStatusText('กำลังเล่น');
      };

      audioRef.current.onpause = () => {
        setIsPlaying(false);
        setStatusText('หยุดเพลง');
      };
    }

    // Lazy load the RSS feed to prevent blocking main thread during initial page load
    const rssTimeout = setTimeout(fetchRSS, 3000);

    // Progress update loop
    let animationFrameId: number;
    const updateProgress = () => {
      if (audioRef.current && progressFillRef.current) {
        const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        if (!isNaN(percent)) {
          progressFillRef.current.style.width = `${percent}%`;
        }
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };
    animationFrameId = requestAnimationFrame(updateProgress);

    // Auto-play on first user interaction
    const tryAutoplay = () => {
      if (autoplayPending.current && playlistRef.current.length > 0) {
        autoplayPending.current = false;
        playTrackDirect(0);
      }
      document.removeEventListener('click', tryAutoplay);
      document.removeEventListener('touchstart', tryAutoplay);
      document.removeEventListener('keydown', tryAutoplay);
    };
    document.addEventListener('click', tryAutoplay, { once: true });
    document.addEventListener('touchstart', tryAutoplay, { once: true });
    document.addEventListener('keydown', tryAutoplay, { once: true });

    return () => {
      clearTimeout(rssTimeout);
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('click', tryAutoplay);
      document.removeEventListener('touchstart', tryAutoplay);
      document.removeEventListener('keydown', tryAutoplay);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  /** Play a track by index — uses refs to avoid stale closure */
  const playTrackDirect = async (index: number) => {
    const pl = playlistRef.current;
    if (index < 0 || index >= pl.length || !audioRef.current) return;

    currentIndexRef.current = index;
    setCurrentIndex(index);
    const track = pl[index];
    setStatusText('กำลังโหลด...');

    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const match = await cache.match(track.url);
      if (match) {
        const blob = await match.blob();
        audioRef.current.src = URL.createObjectURL(blob);
      } else {
        audioRef.current.src = track.url;
        fetch(track.url).then(res => {
          if (res.ok) cache.put(track.url, res).catch(console.error);
        }).catch(e => console.log('Cache failed', e));
      }
    } catch (e) {
      audioRef.current.src = track.url;
    }

    let playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Playback failed:', error);
        }
      });
    }
  };

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (currentIndexRef.current === -1 && playlistRef.current.length > 0) {
      playTrackDirect(0);
      return;
    }

    if (audioRef.current.paused) {
      audioRef.current.play().catch(e => console.error(e));
    } else {
      audioRef.current.pause();
    }
  }, []);

  const handleNext = useCallback(() => {
    const pl = playlistRef.current;
    const ci = currentIndexRef.current;
    let next = ci + 1;
    if (next >= pl.length) next = 0;
    playTrackDirect(next);
  }, []);

  const handlePrev = useCallback(() => {
    const pl = playlistRef.current;
    const ci = currentIndexRef.current;
    let prev = ci - 1;
    if (prev < 0) prev = pl.length - 1;
    playTrackDirect(prev);
  }, []);

  const handleShuffle = useCallback(() => {
    const reshuffled = shuffleArray(playlistRef.current);
    playlistRef.current = reshuffled;
    setPlaylist(reshuffled);
    setStatusText('สุ่มเพลงใหม่แล้ว');
    playTrackDirect(0);
  }, []);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = clickPos * audioRef.current.duration;
  };

  const handleClearCache = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await caches.delete(AUDIO_CACHE_NAME);
      setStatusText('ล้างแคชเรียบร้อย');
      setTimeout(() => {
        setStatusText(isPlaying ? 'กำลังเล่น' : 'หยุดเพลง');
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Dragging logic
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('#btn-toggle') || (e.target as Element).closest('#btn-clear-cache') || (e.target as Element).closest('#btn-shuffle')) return;
    isDragging.current = true;

    dragStart.current = { x: e.clientX, y: e.clientY };
    if (floatingPlayerRef.current) {
      floatingPlayerRef.current.style.transition = 'none';
      const rect = floatingPlayerRef.current.getBoundingClientRect();
      initPos.current = { x: rect.left, y: rect.top };
    }
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    if (floatingPlayerRef.current) {
      const safeTopStr = getComputedStyle(document.documentElement).getPropertyValue('--goo-topbar-safe-top');
      const safeTop = parseInt(safeTopStr) || 80;

      const newLeft = clamp(initPos.current.x + dx, 10, window.innerWidth - floatingPlayerRef.current.offsetWidth - 10);
      const newTop = clamp(initPos.current.y + dy, safeTop + 10, window.innerHeight - floatingPlayerRef.current.offsetHeight - 10);

      requestAnimationFrame(() => {
        if (floatingPlayerRef.current) {
          floatingPlayerRef.current.style.left = `${newLeft}px`;
          floatingPlayerRef.current.style.top = `${newTop}px`;
          floatingPlayerRef.current.style.right = 'auto';
        }
      });
    }
  };

  const onPointerUp = () => {
    isDragging.current = false;
    if (floatingPlayerRef.current) {
      floatingPlayerRef.current.style.transition = 'width 0.5s var(--transition), height 0.5s var(--transition), border-radius 0.5s var(--transition), left 0.3s ease, top 0.3s ease';
    }
  };

  const togglePlayer = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const currentTrackTitle = currentIndex !== -1 ? playlist[currentIndex]?.title : 'รอเลือกเพลง...';

  if (!isLoaded) return null;

  return (
    <div ref={containerRef} id="music-widget-wrapper">
      <div
        ref={floatingPlayerRef}
        id="floating-player"
        className={isCollapsed ? 'collapsed' : ''}
        style={{ right: 20, top: 'calc(20px + var(--goo-topbar-safe-top, 60px))', left: 'auto', transition: 'width 0.5s var(--transition), height 0.5s var(--transition), border-radius 0.5s var(--transition)' }}
        onClick={(e) => { if (isCollapsed && !isDragging.current) togglePlayer(e); }}
      >
        <div
          id="fp-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div id="fp-logo">
            <Music size={20} color="#000" />
          </div>
          <div id="fp-info">
            <span id="fp-status-text">{statusText}</span>
            <span id="fp-current-title">{currentTrackTitle}</span>
          </div>
          <button id="btn-shuffle" onClick={(e) => { e.stopPropagation(); handleShuffle(); }} title="สุ่มเพลงใหม่" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fp-muted)', padding: '4px', display: 'flex' }}>
            <Shuffle size={16} />
          </button>
          <button id="btn-clear-cache" onClick={handleClearCache} title="ล้างแคชเพลงที่เคยฟัง" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fp-muted)', padding: '4px', display: 'flex' }}>
            <HardDrive size={16} />
          </button>
          <button id="btn-toggle" onClick={togglePlayer} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fp-muted)', padding: '4px', display: 'flex' }}>
            {isCollapsed ? <Maximize2 size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div id="fp-body" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {playlist.length === 0 ? (
            <div className="loader">ไม่มีรายการเพลง</div>
          ) : (
            playlist.map((track, idx) => (
              <div
                key={idx}
                className={`track-item ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => playTrackDirect(idx)}
              >
                <div className="track-icon"><Music2 size={18} /></div>
                <div className="track-detail">
                  <span className="track-name">{track.title}</span>
                  <span className="track-meta">RSS Audio</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div id="fp-footer">
          <div className="progress-container" id="progress-bar" onClick={handleProgressBarClick}>
            <div ref={progressFillRef} id="progress-fill" style={{ width: `0%` }}></div>
          </div>
          <div className="controls">
            <button className="ctrl-btn" onClick={handlePrev}><SkipBack size={20} /></button>
            <button className="ctrl-btn play-main" onClick={handlePlayPause}>
              {isPlaying ? <Pause size={20} color="#000" /> : <Play size={20} color="#000" style={{ marginLeft: '2px' }} />}
            </button>
            <button className="ctrl-btn" onClick={handleNext}><SkipForward size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPlayerWidget;
