import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, MonitorStop, HardDrive, Music, Maximize2, Music2 } from 'lucide-react';

// URL Configuration
const DOMAINS = {
  primary: 'https://goosing.netlify.app',
  fallback: 'https://goosing.vercel.app'
};

const M3U_URL = `${DOMAINS.primary}/music/mp3tag.m3u`;
const FALLBACK_M3U_URL = `${DOMAINS.fallback}/music/mp3tag.m3u`;
const AUDIO_CACHE_NAME = 'music-audio-cache-v1-react';

interface Track {
  title: string;
  url: string;
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

  useEffect(() => {
    // 1. Load CSS from external domain
    const loadStyles = async () => {
       if (!document.getElementById('smart-player-styles')) {
          const link = document.createElement('link');
          link.id = 'smart-player-styles';
          link.rel = 'stylesheet';
          link.href = `${DOMAINS.primary}/style.css`;
          document.head.appendChild(link);
       }
    };
    
    // 2. Fetch M3U and parse
    const fetchM3U = async () => {
        try {
            let response = await fetch(M3U_URL).catch(() => fetch(FALLBACK_M3U_URL));
            if (!response.ok) throw new Error("Failed to load M3U");
            const text = await response.text();
            
            const lines = text.split('\n');
            const items: Track[] = [];
            let currentItem: Track | null = null;

            lines.forEach(line => {
                line = line.trim();
                if (line.startsWith('#EXTINF:')) {
                    const info = line.substring(line.indexOf(',') + 1);
                    currentItem = { title: info, url: '' };
                } else if (line && !line.startsWith('#')) {
                    if (currentItem) {
                        currentItem.url = line;
                        items.push(currentItem);
                        currentItem = null;
                    } else {
                        items.push({ title: line.split('/').pop() || 'Unknown', url: line });
                    }
                }
            });

            setPlaylist(items);
            setStatusText('พร้อมทำงาน');
            setIsLoaded(true);
        } catch (err) {
            console.error('Failed to load playlist:', err);
            setStatusText('โหลดไม่สำเร็จ');
        }
    };

    // Init audio element
    if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = 'none';

        audioRef.current.onended = () => {
            handleNext();
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

    loadStyles();
    fetchM3U();
    
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

    return () => {
        cancelAnimationFrame(animationFrameId);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
    };
  }, []);

  const playTrack = async (index: number) => {
    if (index < 0 || index >= playlist.length || !audioRef.current) return;
    
    setCurrentIndex(index);
    const track = playlist[index];
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
    } catch(e) {
        audioRef.current.src = track.url;
    }

    // Play with error handling for AbortError
    let playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
         if (error.name !== 'AbortError') {
             console.error("Playback failed:", error);
         }
      });
    }
  };

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (currentIndex === -1 && playlist.length > 0) {
        playTrack(0);
        return;
    }
    
    if (audioRef.current.paused) {
        audioRef.current.play().catch(e => console.error(e));
    } else {
         audioRef.current.pause();
    }
  }, [currentIndex, playlist]);

  const handleNext = useCallback(() => {
    let next = currentIndex + 1;
    if (next >= playlist.length) next = 0;
    playTrack(next);
  }, [currentIndex, playlist]);

  const handlePrev = useCallback(() => {
    let prev = currentIndex - 1;
    if (prev < 0) prev = playlist.length - 1;
    playTrack(prev);
  }, [currentIndex, playlist]);

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
      if ((e.target as Element).closest('#btn-toggle') || (e.target as Element).closest('#btn-clear-cache')) return;
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
          const newLeft = clamp(initPos.current.x + dx, 10, window.innerWidth - floatingPlayerRef.current.offsetWidth - 10);
          const newTop = clamp(initPos.current.y + dy, 10, window.innerHeight - floatingPlayerRef.current.offsetHeight - 10);
          
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
        style={{ right: 20, top: 20, left: 'auto', transition: 'width 0.5s var(--transition), height 0.5s var(--transition), border-radius 0.5s var(--transition)' }}
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
          <button id="btn-clear-cache" onClick={handleClearCache} title="ล้างแคชเพลงที่เคยฟัง" style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--fp-muted)', padding:'4px', display:'flex' }}>
            <HardDrive size={16} />
          </button>
          <button id="btn-toggle" onClick={togglePlayer} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--fp-muted)', padding:'4px', display:'flex' }}>
            {isCollapsed ? <Maximize2 size={16}/> : <ChevronDown size={16} />}
          </button>
        </div>

        <div id="fp-body">
            {playlist.length === 0 ? (
                 <div className="loader">ไม่มีรายการเพลง</div>
            ) : (
                playlist.map((track, idx) => (
                    <div 
                        key={idx} 
                        className={`track-item ${idx === currentIndex ? 'active' : ''}`}
                        onClick={() => playTrack(idx)}
                    >
                        <div className="track-icon"><Music2 size={18} /></div>
                        <div className="track-detail">
                            <span className="track-name">{track.title}</span>
                            <span className="track-meta">MP3 Audio</span>
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
                {isPlaying ? <Pause size={20} color="#000" /> : <Play size={20} color="#000" style={{marginLeft: '2px'}}/>}
            </button>
            <button className="ctrl-btn" onClick={handleNext}><SkipForward size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPlayerWidget;
