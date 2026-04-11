import { useSyncExternalStore } from 'react';

import type { Language } from './languages';

const ELEVENLABS_API_KEY_PARAM = 'elevenlabs-api-key';
const ELEVENLABS_VOICE_ID_PARAM = 'elevenlabs-voice-id';
const ELEVENLABS_MODEL_ID = 'eleven_multilingual_v2';
const ELEVENLABS_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_ELEVENLABS_VOICE_ID = 'TX3LPaxmHKxFdv7VOQHJ';
const ELEVENLABS_VOICE_IDS_BY_LANGUAGE: Record<string, string> = {
  'de-DE': 'TX3LPaxmHKxFdv7VOQHJ',
  'en-GB': 'JBFqnCBsd6RMkjVDRZzb',
  'en-US': 'TX3LPaxmHKxFdv7VOQHJ',
  'es-ES': 'JBFqnCBsd6RMkjVDRZzb',
  'fr-FR': 'JBFqnCBsd6RMkjVDRZzb',
  'it-IT': 'SAz9YHcvj6GT2YYXdXww',
  'pl-PL': 'TX3LPaxmHKxFdv7VOQHJ',
  'pt-PT': 'SAz9YHcvj6GT2YYXdXww',
};
const ELEVENLABS_CONTEXT_BY_LANGUAGE: Record<string, { previousText: string; nextText: string }> = {
  'de-DE': {
    previousText: 'Das nächste Wort ist auf Deutsch.',
    nextText: '.',
  },
  'en-GB': {
    previousText: 'The next word is in British English.',
    nextText: '.',
  },
  'en-US': {
    previousText: 'The next word is in American English.',
    nextText: '.',
  },
  'es-ES': {
    previousText: 'La siguiente palabra está en español.',
    nextText: '.',
  },
  'fr-FR': {
    previousText: 'Le mot suivant est en français.',
    nextText: '.',
  },
  'it-IT': {
    previousText: 'La prossima parola è in italiano.',
    nextText: '.',
  },
  'pl-PL': {
    previousText: 'Następne słowo jest po polsku.',
    nextText: '.',
  },
  'pt-PT': {
    previousText: 'A próxima palavra está em português.',
    nextText: '.',
  },
};

type SpeechRequest = {
  language: Language;
  text: string;
};

type SpeechStatus = {
  isElevenLabsActive: boolean;
};

type SpeechCacheEntry = {
  objectUrl: string;
};

const listeners = new Set<() => void>();
const speechCache = new Map<string, SpeechCacheEntry>();

let hasInitialized = false;
let elevenLabsApiKey: string | null = null;
let configuredVoiceId: string | null = null;
let isElevenLabsDisabled = false;
let currentPlaybackToken: number | null = null;
let currentAudio: HTMLAudioElement | null = null;
let queuedRequest: SpeechRequest | null = null;
let nextPlaybackToken = 0;
let speechStatus: SpeechStatus = {
  isElevenLabsActive: false,
};

function emitStatusChange() {
  speechStatus = {
    isElevenLabsActive: elevenLabsApiKey != null && !isElevenLabsDisabled,
  };
  listeners.forEach((listener) => listener());
}

function getSpeechStatus(): SpeechStatus {
  return speechStatus;
}

function subscribeToSpeechStatus(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getCacheKey({ language, text }: SpeechRequest) {
  return `${language.code}::${text}`;
}

function getUrlWithoutHiddenParams(url: URL) {
  const nextSearch = url.searchParams.toString();
  return `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
}

function canRequestElevenLabs() {
  return elevenLabsApiKey != null && !isElevenLabsDisabled;
}

function finishPlayback(playbackToken: number) {
  if (currentPlaybackToken !== playbackToken) {
    return;
  }

  currentPlaybackToken = null;
  currentAudio = null;

  if (queuedRequest == null) {
    return;
  }

  const nextRequest = queuedRequest;
  queuedRequest = null;
  void playSpeechRequest(nextRequest);
}

function playObjectUrl(objectUrl: string, playbackToken: number) {
  const audio = new Audio(objectUrl);
  currentAudio = audio;
  audio.onended = () => {
    finishPlayback(playbackToken);
  };
  audio.onerror = () => {
    finishPlayback(playbackToken);
  };

  const playResult = audio.play();
  if (playResult != null && typeof playResult.catch === 'function') {
    void playResult.catch(() => {
      finishPlayback(playbackToken);
    });
  }
}

function playWithBrowserSpeech({ language, text }: SpeechRequest, playbackToken: number) {
  if (
    typeof window === 'undefined' ||
    typeof window.speechSynthesis === 'undefined' ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    finishPlayback(playbackToken);
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language.code;
    utterance.rate = 0.6;
    utterance.pitch = 1;
    utterance.onend = () => {
      finishPlayback(playbackToken);
    };
    utterance.onerror = () => {
      finishPlayback(playbackToken);
    };
    window.speechSynthesis.speak(utterance);
  } catch {
    finishPlayback(playbackToken);
  }
}

function disableElevenLabs() {
  if (isElevenLabsDisabled) {
    return;
  }

  isElevenLabsDisabled = true;
  emitStatusChange();
}

async function readErrorText(response: Response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

async function shouldDisableElevenLabs(response: Response) {
  if (response.status === 401 || response.status === 403) {
    return true;
  }

  const errorText = await readErrorText(response);
  return /\b(quota|credit|credits|billing|payment required|insufficient)\b/i.test(errorText);
}

function getElevenLabsLanguageCode(language: Language) {
  return language.code.split('-')[0].toLowerCase();
}

function getElevenLabsVoiceId(language: Language) {
  return (
    configuredVoiceId ??
    ELEVENLABS_VOICE_IDS_BY_LANGUAGE[language.code] ??
    DEFAULT_ELEVENLABS_VOICE_ID
  );
}

function getElevenLabsContext(language: Language) {
  return (
    ELEVENLABS_CONTEXT_BY_LANGUAGE[language.code] ?? {
      previousText: '',
      nextText: '.',
    }
  );
}

async function synthesizeWithElevenLabs(request: SpeechRequest) {
  const cachedAudio = speechCache.get(getCacheKey(request));
  if (cachedAudio != null) {
    return cachedAudio.objectUrl;
  }

  if (!canRequestElevenLabs()) {
    return null;
  }

  const voiceId = getElevenLabsVoiceId(request.language);
  const context = getElevenLabsContext(request.language);
  if (voiceId == null) {
    return null;
  }

  try {
    const response = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'xi-api-key': elevenLabsApiKey!,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: ELEVENLABS_MODEL_ID,
        language_code: getElevenLabsLanguageCode(request.language),
        previous_text: context.previousText,
        next_text: context.nextText,
      }),
    });

    if (!response.ok) {
      if (await shouldDisableElevenLabs(response)) {
        disableElevenLabs();
      }
      return null;
    }

    const audioBlob = await response.blob();
    const objectUrl = URL.createObjectURL(audioBlob);
    speechCache.set(getCacheKey(request), { objectUrl });
    return objectUrl;
  } catch {
    return null;
  }
}

async function playSpeechRequest(request: SpeechRequest) {
  const playbackToken = ++nextPlaybackToken;
  currentPlaybackToken = playbackToken;

  const cachedAudio = speechCache.get(getCacheKey(request));
  if (cachedAudio != null) {
    playObjectUrl(cachedAudio.objectUrl, playbackToken);
    return;
  }

  if (!canRequestElevenLabs()) {
    playWithBrowserSpeech(request, playbackToken);
    return;
  }

  const elevenLabsAudio = await synthesizeWithElevenLabs(request);
  if (currentPlaybackToken !== playbackToken) {
    return;
  }

  if (elevenLabsAudio != null) {
    playObjectUrl(elevenLabsAudio, playbackToken);
    return;
  }

  playWithBrowserSpeech(request, playbackToken);
}

export function initializeSpeech() {
  if (hasInitialized || typeof window === 'undefined') {
    return;
  }

  hasInitialized = true;

  const url = new URL(window.location.href);
  const apiKey = url.searchParams.get(ELEVENLABS_API_KEY_PARAM)?.trim();
  const voiceId = url.searchParams.get(ELEVENLABS_VOICE_ID_PARAM)?.trim();
  const removedApiKey = url.searchParams.has(ELEVENLABS_API_KEY_PARAM);
  const removedVoiceId = url.searchParams.has(ELEVENLABS_VOICE_ID_PARAM);
  url.searchParams.delete(ELEVENLABS_API_KEY_PARAM);
  url.searchParams.delete(ELEVENLABS_VOICE_ID_PARAM);
  const hadHiddenParam = removedApiKey || removedVoiceId;

  elevenLabsApiKey = apiKey || null;
  configuredVoiceId = voiceId || null;
  isElevenLabsDisabled = false;
  speechStatus = {
    isElevenLabsActive: false,
  };

  if (hadHiddenParam) {
    window.history.replaceState(window.history.state, '', getUrlWithoutHiddenParams(url));
  }

  emitStatusChange();
}

export function speak(text: string, language: Language) {
  if (!text.trim()) {
    return;
  }

  const nextRequest = { language, text };

  if (currentPlaybackToken != null) {
    queuedRequest = nextRequest;
    return;
  }

  void playSpeechRequest(nextRequest);
}

export function useSpeechStatus() {
  return useSyncExternalStore(subscribeToSpeechStatus, getSpeechStatus, getSpeechStatus);
}

export function resetSpeechServiceForTests() {
  currentAudio?.pause?.();
  currentAudio = null;
  currentPlaybackToken = null;
  queuedRequest = null;
  nextPlaybackToken = 0;
  hasInitialized = false;
  elevenLabsApiKey = null;
  configuredVoiceId = null;
  isElevenLabsDisabled = false;
  speechStatus = {
    isElevenLabsActive: false,
  };

  for (const entry of speechCache.values()) {
    URL.revokeObjectURL?.(entry.objectUrl);
  }

  speechCache.clear();
  window.speechSynthesis?.cancel?.();
  emitStatusChange();
}

export function getSpeechStatusForTests() {
  return getSpeechStatus();
}
