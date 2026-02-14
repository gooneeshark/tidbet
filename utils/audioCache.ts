// Audio Cache Manager for caching elfsightcdn.com audio files
import { useState, useEffect } from 'react';

interface CachedAudioInfo {
  url: string;
  timestamp: number;
  size: number;
  title?: string;
}

class AudioCacheManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private cacheKey = 'goo_gemnee_audio_cache_info';
  
  constructor() {
    this.init();
  }
  
  private async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Audio Cache Service Worker registered');
      } catch (error) {
        console.error('Audio Cache Service Worker registration failed:', error);
      }
    }
  }
  
  // Cache an audio file
  async cacheAudio(url: string, title?: string): Promise<boolean> {
    if (!this.swRegistration) return false;
    
    try {
      // Create message channel for response
      const messageChannel = new MessageChannel();
      
      const promise = new Promise<boolean>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            // Save cache info
            this.saveCacheInfo({
              url,
              timestamp: Date.now(),
              size: 0, // We'll get this from response headers if needed
              title
            });
            resolve(true);
          } else {
            resolve(false);
          }
        };
      });
      
      // Send message to service worker
      this.swRegistration.active?.postMessage(
        { type: 'CACHE_AUDIO', url },
        [messageChannel.port2]
      );
      
      return await promise;
    } catch (error) {
      console.error('Failed to cache audio:', error);
      return false;
    }
  }
  
  // Get cached audio blob
  async getCachedAudio(url: string): Promise<Blob | null> {
    if (!this.swRegistration) return null;
    
    try {
      const messageChannel = new MessageChannel();
      
      const promise = new Promise<Blob | null>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success && event.data.data) {
            const blob = new Blob([event.data.data], { type: 'audio/mpeg' });
            resolve(blob);
          } else {
            resolve(null);
          }
        };
      });
      
      this.swRegistration.active?.postMessage(
        { type: 'GET_CACHED_AUDIO', url },
        [messageChannel.port2]
      );
      
      return await promise;
    } catch (error) {
      console.error('Failed to get cached audio:', error);
      return null;
    }
  }
  
  // Get list of cached audio info
  getCachedAudioList(): CachedAudioInfo[] {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Failed to get cached audio list:', error);
      return [];
    }
  }
  
  // Save cache info
  private saveCacheInfo(info: CachedAudioInfo) {
    try {
      const cached = this.getCachedAudioList();
      const existingIndex = cached.findIndex(item => item.url === info.url);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = info;
      } else {
        cached.push(info);
      }
      
      localStorage.setItem(this.cacheKey, JSON.stringify(cached));
    } catch (error) {
      console.error('Failed to save cache info:', error);
    }
  }
  
  // Clear all cached audio
  async clearCache(): Promise<boolean> {
    if (!this.swRegistration) return false;
    
    try {
      const messageChannel = new MessageChannel();
      
      const promise = new Promise<boolean>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            localStorage.removeItem(this.cacheKey);
            resolve(true);
          } else {
            resolve(false);
          }
        };
      });
      
      this.swRegistration.active?.postMessage(
        { type: 'CLEAR_AUDIO_CACHE' },
        [messageChannel.port2]
      );
      
      return await promise;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }
  
  // Get cache size estimate
  getCacheSize(): string {
    const cached = this.getCachedAudioList();
    const totalSize = cached.reduce((sum, item) => sum + item.size, 0);
    
    if (totalSize < 1024 * 1024) {
      return `${Math.round(totalSize / 1024)} KB`;
    } else {
      return `${Math.round(totalSize / (1024 * 1024))} MB`;
    }
  }
  
  // Check if audio is cached
  isAudioCached(url: string): boolean {
    const cached = this.getCachedAudioList();
    return cached.some(item => item.url === url);
  }
}

// Create singleton instance
export const audioCache = new AudioCacheManager();

// Hook for React components
export const useAudioCache = () => {
  const [cachedList, setCachedList] = useState<CachedAudioInfo[]>([]);
  
  useEffect(() => {
    setCachedList(audioCache.getCachedAudioList());
    
    // Listen for storage changes
    const handleStorageChange = () => {
      setCachedList(audioCache.getCachedAudioList());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return {
    cachedList,
    cacheAudio: audioCache.cacheAudio.bind(audioCache),
    getCachedAudio: audioCache.getCachedAudio.bind(audioCache),
    clearCache: audioCache.clearCache.bind(audioCache),
    getCacheSize: audioCache.getCacheSize.bind(audioCache),
    isAudioCached: audioCache.isAudioCached.bind(audioCache)
  };
};
