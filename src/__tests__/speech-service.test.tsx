import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShell } from '../components/app-shell';
import { LANGUAGES } from '../utils/languages';
import { getSpeechStatusForTests, initializeSpeech, speak } from '../utils/speech-service';

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

  it('reads the hidden ElevenLabs params once and removes them from the URL', () => {
    window.history.pushState({}, '', '/?elevenlabs-api-key=test-key&elevenlabs-voice-id=voice-123');

    initializeSpeech();

    expect(window.location.search).toBe('');
    expect(getSpeechStatusForTests().isElevenLabsActive).toBe(true);
  });

  it('reuses cached ElevenLabs audio for the same locale and text', async () => {
    window.history.pushState({}, '', '/?elevenlabs-api-key=test-key&elevenlabs-voice-id=voice-123');
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
    window.history.pushState({}, '', '/?elevenlabs-api-key=test-key');
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
    expect(requestInit.body).not.toContain('"next_text"');
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
    window.history.pushState({}, '', '/?elevenlabs-api-key=test-key&elevenlabs-voice-id=voice-123');
    initializeSpeech();

    vi.mocked(fetch).mockResolvedValue(new Response('Unauthorized', { status: 401 }));

    speak('kot', LANGUAGES[7]);

    await waitFor(() => {
      expect(mockSpeechSynthesisSpeak).toHaveBeenCalledTimes(1);
    });

    expect(getSpeechStatusForTests().isElevenLabsActive).toBe(false);

    const firstUtterance = vi.mocked(SpeechSynthesisUtterance).mock.results[0]
      .value as MockUtterance;
    firstUtterance.onend?.();

    speak('pies', LANGUAGES[7]);

    await waitFor(() => {
      expect(mockSpeechSynthesisSpeak).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the active badge only when ElevenLabs is enabled for new requests', () => {
    window.history.pushState({}, '', '/?elevenlabs-api-key=test-key');
    initializeSpeech();

    render(
      <AppShell>
        <div>child</div>
      </AppShell>,
    );

    expect(screen.getByText('ElevenLabs TTS')).toBeInTheDocument();
  });
});
