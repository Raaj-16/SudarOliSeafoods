'use client';

import { useSyncExternalStore } from 'react';

const FAVORITES_KEY = 'sudaroli-favourites';
const CHANGE_EVENT = 'sudaroli:favourites';
const EMPTY_FAVORITES = '[]';

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(FAVORITES_KEY) || EMPTY_FAVORITES;
}

function getServerSnapshot() {
  return EMPTY_FAVORITES;
}

function parseFavoriteIds(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function useFavoriteIds() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return parseFavoriteIds(snapshot);
}

export function writeFavoriteIds(ids: string[]) {
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
