import React, { useState, useRef, useEffect } from 'react';
import type { Theme } from '../utils/themes';
import { getThemeById } from '../utils/themes';

interface Song {
  id: string;
  title: string;
  filename: string;
  duration?: number;
}

interface CustomMusicPlayerProps {
  theme?: Theme;
}

const CustomMusicPlayer: React.FC<CustomMusicPlayerProps> = ({ theme }) => {
  const t = theme ?? getThemeById(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState('');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const getSongUrl = (index: number): string => {
    const s = songs[index];
    return s ? `/mp3/${s.filename}` : '';
  };

  const ensureSrcAndPlay = async (index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextSrc = getSongUrl(index);
    if (!nextSrc) return;

    if (audioSrc !== nextSrc) {
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
      setAudioSrc(nextSrc);

      // Wait a microtask for React to commit the new src into the DOM
      await Promise.resolve();
      audio.load();
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      // Ignore autoplay/user-gesture errors; play will work on next user gesture.
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  // Load songs from local mp3 folder
  useEffect(() => {
    const loadSongs = async () => {
      try {
        // Since we can't directly read the directory, we'll use the known file list
        const songFiles = [
          "Goonee (1).mp3", "Goonee'(Hiphop).mp3", "Goonee'(Hippo).mp3", "Goonee.mp3",
          "กูนี่ (Mashup).mp3", "กูนี่ (🚺slow).mp3", "กูนี่ No.1 x กูนี่ ผิดตั้งแต่เกิด (Mashup).mp3",
          "กูนี่ No.1.mp3", "กูนี่ Women Cheerful.mp3", "กูนี่ Women 🚺 (1).mp3",
          "กูนี่ Women 🚺 (2).mp3", "กูนี่ Women 🚺 (3).mp3", "กูนี่ Women 🚺 (4).mp3",
          "กูนี่ Women 🚺 (5).mp3", "กูนี่ Women 🚺.mp3", "กูนี่ Women.mp3",
          "กูนี่ กูนี้ กู้หนี้ กูหนี (1).mp3", "กูนี่ กูนี้ กู้หนี้ กูหนี (2).mp3",
          "กูนี่ กูนี้ กู้หนี้ กูหนี (3).mp3", "กูนี่ กูนี้ กู้หนี้ กูหนี (4).mp3",
          "กูนี่ กูนี้ กู้หนี้ กูหนี (5).mp3", "กูนี่ กูนี้ กู้หนี้ กูหนี (6).mp3",
          "กูนี่ กูนี้ กู้หนี้ กูหนี (7).mp3", "กูนี่ กูนี้ กู้หนี้ กูหนี (8).mp3",
          "กูนี่ กูนี้ กู้หนี้ กูหนี.mp3", "กูนี่ กูหนิ กูนี้ (1).mp3",
          "กูนี่ กูหนิ กูนี้.mp3", "กูนี่ บัคฮันเตอร์ (1).mp3",
          "กูนี่ บัคฮันเตอร์(Man).mp3", "กูนี่ บัคฮันเตอร์(Rock).mp3", "กูนี่ บัคฮันเตอร์.mp3",
          "กูนี่ ผิดตั้งแต่เกิด (1).mp3", "กูนี่ ผิดตั้งแต่เกิด (2).mp3",
          "กูนี่ ผิดตั้งแต่เกิด (3).mp3", "กูนี่ ผิดตั้งแต่เกิด (4).mp3",
          "กูนี่ ผิดตั้งแต่เกิด.mp3", "กูนี่ ผิดตั้งแต่เกิดmr.mp3", "กูนี่ ว๊ากfm.mp3",
          "กูนี่ แฟละ.mp3", "กูนี่.mp3", "กูนี่fmhc.mp3", "กูนี่ของจริง (1).mp3",
          "กูนี่ของจริง.mp3", "กูนี่มันรักมึงว่ะ (1).mp3", "กูนี่มันรักมึงว่ะ.mp3",
          "กูนี่มันรักมึงว่ะslowM.mp3", "กูนี่รักของมึง (1).mp3", "กูนี่รักของมึง.mp3",
          "กูนี่รักมึงจริง (1).mp3", "กูนี่รักมึงจริง.mp3", "กูนี่รักมึงจริงslow.mp3",
          "กูนี่เพื่อนที่รักมึง.mp3", "กูนี่แหละตัวจริง (1).mp3", "กูนี่แหละตัวจริง.mp3",
          "กูนี่แหละที่รักมึง (1).mp3", "กูนี่แหละที่รักมึง.mp3",
          "กูนี่แหละที่รักมึงสุดใจ.mp3", "กูนี่แหละรักมึง (1).mp3",
          "กูนี่แหละรักมึง (2).mp3", "กูนี่แหละรักมึง (3).mp3",
          "กูนี่แหละรักมึง (4).mp3", "กูนี่แหละรักมึง (5).mp3",
          "กูนี่แหละรักมึง (6).mp3", "กูนี่แหละรักมึง.mp3", "กูนี่แหละรักมึงจริง.mp3",
          "กูนี่ไงที่มึงไม่ลืม (1).mp3", "กูนี่ไงที่มึงไม่ลืม.mp3",
          "กูนี่ไม่เท่าเขาเท่าใคร.mp3", "กูแซมบ้า.mp3", "คนที่มึงเรียกว่าGoo.mp3",
          "ตามหาหัวใจที่เคยมี.mp3", "ทั้งโลกใบเดียว.mp3", "ทุกครั้งที่เราทะเลาะกัน.mp3",
          "บัคที่โลกยังไม่ได้แพท.mp3", "ลืมตามาในเช้าที่โลกหมุนเร็วไป (1).mp3",
          "ลืมตามาในเช้าที่โลกหมุนเร็วไป (2).mp3", "ลืมตามาในเช้าที่โลกหมุนเร็วไป.mp3",
          "สลับ สลับ สลับ (1).mp3", "สลับ สลับ สลับ (2).mp3", "สลับ สลับ สลับ (3).mp3",
          "สลับ สลับ สลับ (4).mp3", "สลับ สลับ สลับ (5).mp3", "สลับ สลับ สลับ.mp3",
          "เข้าใจกูยัง.mp3"
        ];

        const songList: Song[] = songFiles.map((filename, index) => ({
          id: `song-${index}`,
          title: filename.replace('.mp3', '').replace(/\(\d+\)/g, '').trim(),
          filename
        }));

        setSongs(songList);
      } catch (error) {
        console.error('Failed to load songs:', error);
      }
    };

    loadSongs();
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleEnded = () => {
      playNext();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentSongIndex]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    if (!audioRef.current || songs.length === 0) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void ensureSrcAndPlay(currentSongIndex);
    }
  };

  const playNext = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    setCurrentSongIndex(nextIndex);
    void ensureSrcAndPlay(nextIndex);
  };

  const playPrevious = () => {
    if (songs.length === 0) return;
    const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    setCurrentSongIndex(prevIndex);
    void ensureSrcAndPlay(prevIndex);
  };

  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    void ensureSrcAndPlay(index);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentSong = songs[currentSongIndex];

  if (!isPlayerVisible) {
    return (
      <button
        onClick={() => setIsPlayerVisible(true)}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-gradient-to-r ${t.ui.accentFrom} ${t.ui.accentTo} text-white px-6 py-3 rounded-full shadow-lg transition-all hover:scale-110 flex items-center gap-2`}
        title="เปิดเพลเยอร์เพลง"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <span className="font-bold">🎵 เพลงกูเจมนี่ ({songs.length})</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-[50] ${t.ui.panelBg} backdrop-blur-xl border-t ${t.ui.panelBorder} rounded-t-3xl shadow-2xl`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="none"
      />

      {/* Main Player */}
      <div className="p-4">
        {/* Current Song Info */}
        <div className="text-center mb-4">
          <h3 className="text-white font-bold text-lg truncate">
            {currentSong?.title || 'เลือกเพลง'}
          </h3>
          <p className="text-zinc-400 text-sm">
            {currentSongIndex + 1} / {songs.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="relative h-2 bg-zinc-700 rounded-full cursor-pointer overflow-hidden"
          >
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={playPrevious}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          <button
            onClick={togglePlayPause}
            disabled={!currentSong || isLoading}
            className={`p-3 bg-gradient-to-r ${t.ui.accentFrom} ${t.ui.accentTo} text-white rounded-full transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <button
            onClick={playNext}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-zinc-400 text-xs w-8">{Math.round(volume * 100)}%</span>
        </div>

        {/* Playlist Toggle */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsPlayerVisible(false)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            ซ่อนเพลเยอร์
          </button>
          <button
            onClick={() => document.getElementById('playlist')?.scrollIntoView({ behavior: 'smooth' })}
            className={`text-sm font-black transition-all text-transparent bg-clip-text bg-gradient-to-r ${t.ui.accentFrom} ${t.ui.accentTo} hover:opacity-90`}
          >
            เปิดเพลย์ลิสต์ ↓
          </button>
        </div>
      </div>

      {/* Playlist */}
      <div id="playlist" className={`max-h-60 overflow-y-auto border-t ${t.ui.panelBorder}`}>
        <div className="p-4 space-y-2">
          {songs.map((song, index) => (
            <div
              key={song.id}
              onClick={() => handleSongSelect(index)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                index === currentSongIndex
                  ? `bg-gradient-to-r ${t.ui.accentFrom}/20 ${t.ui.accentTo}/20 border border-white/20`
                  : 'bg-zinc-800/50 hover:bg-zinc-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    index === currentSongIndex
                      ? `bg-gradient-to-r ${t.ui.accentFrom} ${t.ui.accentTo} text-white`
                      : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {index === currentSongIndex && isPlaying ? (
                      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div>
                    <div className={`text-sm font-black ${
                      index === currentSongIndex
                        ? `text-transparent bg-clip-text bg-gradient-to-r ${t.ui.accentFrom} ${t.ui.accentTo}`
                        : 'text-white'
                    }`}>
                      {song.title}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomMusicPlayer;
