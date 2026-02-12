import { useState, useCallback } from 'react';

type CachedAudio = {
  url: string;
  title?: string;
  size: number;
  timestamp: number;
};

const STORAGE_KEY = 'goo_audio_cache_v1';

function readStore(): CachedAudio[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStore(list: CachedAudio[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function useAudioCache() {
  const [cachedList, setCachedList] = useState<CachedAudio[]>(() => readStore());

  const sync = useCallback(() => {
    const list = readStore();
    setCachedList(list);
  }, []);

  const cacheAudio = useCallback(async (url: string, title?: string) => {
    try {
      // Minimal approach: store metadata only, do not fetch binary
      const list = readStore();
      if (list.find(l => l.url === url)) return;
      const entry: CachedAudio = {
        url,
        title,
        size: 0,
        timestamp: Date.now()
      };
      list.push(entry);
      writeStore(list);
      setCachedList(list);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const getCachedAudio = useCallback((url: string) => {
    const list = readStore();
    return list.find(l => l.url === url) || null;
  }, []);

  const clearCache = useCallback(async () => {
    writeStore([]);
    setCachedList([]);
  }, []);

  const getCacheSize = useCallback(() => {
    const list = readStore();
    return list.reduce((acc, cur) => acc + (cur.size || 0), 0);
  }, []);

  const isAudioCached = useCallback((url: string) => {
    const list = readStore();
    return !!list.find(l => l.url === url);
  }, []);

  return {
    cachedList,
    cacheAudio,
    getCachedAudio,
    clearCache,
    getCacheSize,
    isAudioCached,
    sync
  };
}
