import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShell } from '../components/app-shell';
import { Toaster } from '../components/ui/toaster';
import { LANGUAGES } from '../utils/languages';
import { getSpeechStatusForTests, initializeSpeech, speak } from '../utils/speech-service';

const ELEVENLABS_API_KEY_STORAGE_KEY = 'memo-bot-elevenlabs-api-key';
const mockSpeechSynthesisSpeak = vi.fn();
const mockSpeechSynthesisCancel = vi.fn();

type MockUtterance = {
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  pitch: number;
  rate: number;
  text: string;
};

class MockAudio {
  static instances: MockAudio[] = [];

  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  pause = vi.fn();
  play = vi.fn(async () => undefined);

  constructor(public src: string) {
    MockAudio.instances.push(this);
  }

  end() {
    this.onended?.();
  }
}

describe('speech service', () => {
  beforeEach(() => {
    MockAudio.instances = [];
    mockSpeechSynthesisSpeak.mockClear();
    mockSpeechSynthesisCancel.mockClear();
    vi.mocked(URL.createObjectURL).mockImplementation(
      () => `blob:audio-${MockAudio.instances.length}`,
    );

    global.Audio = MockAudio as unknown as typeof Audio;
    global.speechSynthesis = {
      speak: mockSpeechSynthesisSpeak,
      cancel: mockSpeechSynthesisCancel,
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => []),
    } as unknown as SpeechSynthesis;

    global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => {
      const utterance: MockUtterance = {
        text,
        lang: '',
        rate: 1,
        pitch: 1,
        onend: null,
        onerror: null,
      };
      return utterance;
    });

    window.history.pushState({}, '', '/');
  });

  it('reads a saved ElevenLabs key from local storage during initialization', () => {
    window.localStorage.setItem(ELEVENLABS_API_KEY_STORAGE_KEY, 'test-key');

    initializeSpeech();

    expect(getSpeechStatusForTests()).toEqual({
      hasElevenLabsApiKey: true,
      hasElevenLabsError: false,
      isElevenLabsActive: true,
    });
  });

  it('reuses cached ElevenLabs audio for the same locale and text', async () => {
    window.localStorage.setItem(ELEVENLABS_API_KEY_STORAGE_KEY, 'test-key');
    initializeSpeech();

    vi.mocked(fetch).mockResolvedValue(
      new Response(new Blob(['audio'], { type: 'audio/mpeg' }), { status: 200 }),
    );

    speak('kot', LANGUAGES[7]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(MockAudio.instances).toHaveLength(1);
    });

    MockAudio.instances[0].end();
    speak('kot', LANGUAGES[7]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(MockAudio.instances).toHaveLength(2);
    });
  });

  it('uses the mapped Polish voice and forces the Polish language code', async () => {
    window.localStorage.setItem(ELEVENLABS_API_KEY_STORAGE_KEY, 'test-key');
    initializeSpeech();

    vi.mocked(fetch).mockResolvedValue(
      new Response(new Blob(['audio'], { type: 'audio/mpeg' }), { status: 200 }),
    );

    speak('hamak', LANGUAGES[7]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const [requestUrl, requestInit] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toContain('/TX3LPaxmHKxFdv7VOQHJ');
    expect(requestInit.body).toContain('"language_code":"pl"');
    expect(requestInit.body).toContain('"model_id":"eleven_multilingual_v2"');
    expect(requestInit.body).toContain('"previous_text":"Następne słowo jest po polsku."');
    expect(requestInit.body).toContain('"next_text":"."');
    expect(requestInit.body).toContain('"voice_settings"');
    expect(requestInit.body).toContain('"speed":0.86');
  });

  it('uses the per-language mapped voice', async () => {
    window.localStorage.setItem(ELEVENLABS_API_KEY_STORAGE_KEY, 'test-key');
    initializeSpeech();

    vi.mocked(fetch).mockResolvedValue(
      new Response(new Blob(['audio'], { type: 'audio/mpeg' }), { status: 200 }),
    );

    speak('friend', LANGUAGES[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const [requestUrl] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toContain('/JBFqnCBsd6RMkjVDRZzb');
  });

  it('queues only the newest request while browser speech is in progress', async () => {
    speak('first', LANGUAGES[0]);
    speak('second', LANGUAGES[0]);
    speak('third', LANGUAGES[0]);

    expect(mockSpeechSynthesisSpeak).toHaveBeenCalledTimes(1);
    const firstUtterance = vi.mocked(SpeechSynthesisUtterance).mock.results[0]
      .value as MockUtterance;
    firstUtterance.onend?.();

    await waitFor(() => {
      expect(mockSpeechSynthesisSpeak).toHaveBeenCalledTimes(2);
    });

    const secondUtterance = vi.mocked(SpeechSynthesisUtterance).mock.results[1]
      .value as MockUtterance;
    expect(secondUtterance.text).toBe('third');
  });

  it('disables ElevenLabs after a hard failure and falls back to browser speech', async () => {
    window.localStorage.setItem(ELEVENLABS_API_KEY_STORAGE_KEY, 'test-key');
    initializeSpeech();

    vi.mocked(fetch).mockResolvedValue(new Response('Unauthorized', { status: 401 }));

    render(
      <>
        <AppShell>
          <div>child</div>
        </AppShell>
        <Toaster />
      </>,
    );

    speak('kot', LANGUAGES[7]);

    await waitFor(() => {
      expect(mockSpeechSynthesisSpeak).toHaveBeenCalledTimes(1);
    });

    expect(getSpeechStatusForTests()).toEqual({
      hasElevenLabsApiKey: true,
      hasElevenLabsError: true,
      isElevenLabsActive: false,
    });
    expect(screen.getByText('ElevenLabs TTS needs attention')).toBeInTheDocument();

    const firstUtterance = vi.mocked(SpeechSynthesisUtterance).mock.results[0]
      .value as MockUtterance;
    firstUtterance.onend?.();

    speak('pies', LANGUAGES[7]);

    await waitFor(() => {
      expect(mockSpeechSynthesisSpeak).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('saves and removes the ElevenLabs key from the TTS dialog without showing the current value', async () => {
    const user = userEvent.setup();

    render(
      <AppShell>
        <div>child</div>
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: /Open TTS settings/i }));
    expect(screen.getByText('No key configured')).toBeInTheDocument();

    const input = screen.getByLabelText(/New API key/i);
    await user.type(input, 'super-secret-key');
    await user.click(screen.getByRole('button', { name: /Save key/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem(ELEVENLABS_API_KEY_STORAGE_KEY)).toBe('super-secret-key');
    });

    await user.click(screen.getByRole('button', { name: /Open TTS settings/i }));
    expect(screen.getByText('Key configured on this device')).toBeInTheDocument();
    expect(screen.getByLabelText(/New API key/i)).toHaveValue('');

    await user.click(screen.getByRole('button', { name: /Remove key/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem(ELEVENLABS_API_KEY_STORAGE_KEY)).toBeNull();
    });
  });
});
