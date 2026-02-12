import React, { useState, useEffect } from 'react';
import { useAudioCache } from '../utils/audioCache';

const AudioCacheManager: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { cachedList, cacheAudio, getCachedAudio, clearCache, getCacheSize, isAudioCached } = useAudioCache();
  const [isCaching, setIsCaching] = useState(false);

  // Monitor for audio elements and cache their sources
  useEffect(() => {
    const monitorAudioElements = () => {
      const audioElements = document.querySelectorAll('audio');
      const sourceElements = document.querySelectorAll('source');
      
      audioElements.forEach((audio) => {
        const src = audio.getAttribute('src');
        if (src && src.includes('elfsightcdn.com') && !isAudioCached(src)) {
          cacheAudioIfNeeded(src);
        }
      });
      
      sourceElements.forEach((source) => {
        const src = source.getAttribute('src');
        if (src && src.includes('elfsightcdn.com') && !isAudioCached(src)) {
          cacheAudioIfNeeded(src);
        }
      });
    };

    const interval = setInterval(monitorAudioElements, 2000);
    monitorAudioElements(); // Initial check

    return () => clearInterval(interval);
  }, [isAudioCached]);

  const cacheAudioIfNeeded = async (url: string) => {
    if (isCaching) return;
    
    setIsCaching(true);
    try {
      await cacheAudio(url, extractTitleFromUrl(url));
    } catch (error) {
      console.error('Failed to cache audio:', error);
    } finally {
      setIsCaching(false);
    }
  };

  const extractTitleFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'Unknown';
      return filename.replace(/\.[^/.]+$/, ""); // Remove file extension
    } catch {
      return 'Unknown Track';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearCache = async () => {
    if (confirm('คุณต้องการล้างแคชเพลงทั้งหมดใช่ไหม?')) {
      await clearCache();
    }
  };

  // Toggle visibility with Ctrl+Shift+A
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-[60] bg-orange-600 hover:bg-orange-500 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        title="แคชเพลง (Ctrl+Shift+A)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        {cachedList.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {cachedList.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            แคชเพลง
          </h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-zinc-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-orange-500">{cachedList.length}</div>
              <div className="text-xs text-zinc-400">เพลงที่แคชไว้</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-500">{getCacheSize()}</div>
              <div className="text-xs text-zinc-400">ขนาดแคช</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-500">
                {isCaching ? '...' : 'พร้อม'}
              </div>
              <div className="text-xs text-zinc-400">สถานะ</div>
            </div>
          </div>
        </div>

        {/* Cache List */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[400px]">
          {cachedList.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <p className="text-zinc-400">ยังไม่มีเพลงที่แคชไว้</p>
              <p className="text-zinc-500 text-sm mt-2">เพลงจะถูกแคชอัตโนมัติเมื่อเล่น</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cachedList.map((audio, index) => (
                <div key={audio.url} className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between group hover:bg-zinc-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium">{audio.title || `Track ${index + 1}`}</div>
                      <div className="text-zinc-400 text-sm">{formatDate(audio.timestamp)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">{formatFileSize(audio.size)}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-zinc-800 flex gap-4">
          <button
            onClick={handleClearCache}
            disabled={cachedList.length === 0}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-colors"
          >
            ล้างแคชทั้งหมด
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioCacheManager;
