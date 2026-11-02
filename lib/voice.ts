/**
 * Speaking to SikLo and SikLo speaking back.
 *
 * Wake phrase: while listening is on, anything the microphone hears is checked
 * for "Hey SikLo". When it matches, whatever follows in the same breath is
 * treated as the question; if nothing follows, SikLo waits for the next phrase.
 *
 * Offline: speech synthesis (the reply) uses voices already on the device.
 * Speech recognition is on-device only where the browser offers it, which this
 * module requests when the option exists; elsewhere the browser may send audio
 * to its own service, so `recognitionIsLocal()` reports which applies and the
 * screen says so plainly rather than implying privacy it cannot guarantee.
 */
export type ListenState = 'off' | 'waiting' | 'question' | 'error';

/** "Hey SikLo", and the ways speech engines usually mishear it. */
const WAKE = [
  'hey siklo', 'hey sik lo', 'hey cycle', 'hey sicklo', 'hey ciclo', 'hey siclo', 'hey sikhlo',
  'hi siklo', 'hi sik lo', 'hey sik low', 'hey seek low', 'hey sicko', 'hey psyclo', 'hey cyclo',
  'okay siklo', 'ok siklo', 'hoy siklo',
];

const tidy = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Finds the wake phrase in what was heard.
 * Returns the question that followed it ('' when the phrase ended the sentence),
 * or null when the wake phrase was not said.
 */
export function matchWake(heard: string): string | null {
  const said = tidy(heard);
  for (const phrase of WAKE) {
    const at = said.indexOf(phrase);
    if (at === -1) continue;
    // Only count it at the start of a sentence, not buried mid-conversation
    if (at > 12) continue;
    return said.slice(at + phrase.length).replace(/^[\s,.]+/, '').trim();
  }
  return null;
}

type Ctor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  processLocally?: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

const recognitionCtor = (): Ctor | null => {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const canListen = () => recognitionCtor() !== null;
export const canSpeak = () => typeof speechSynthesis !== 'undefined';

/** True only when the browser confirmed it will keep the audio on the device. */
let localRecognition = false;
export const recognitionIsLocal = () => localRecognition;

export interface Listener {
  /** Wait for "Hey SikLo". */
  listenForWake(): void;
  /** Capture one question now, without the wake phrase. */
  listenForQuestion(): void;
  stop(): void;
  readonly state: ListenState;
}

export interface ListenerOptions {
  onQuestion(question: string): void;
  /** The wake phrase was heard; a question may follow. */
  onWake?(): void;
  /** Live text while someone is speaking. */
  onPartial?(text: string): void;
  onState?(state: ListenState, detail?: string): void;
}

/** Microphone control, or null when this browser cannot listen. */
export function createListener(opts: ListenerOptions): Listener | null {
  const available = recognitionCtor();
  if (!available) return null;
  const Recognition: Ctor = available; // hoisted helpers below need the non-null type

  let mode: 'wake' | 'question' | 'off' = 'off';
  let state: ListenState = 'off';
  let recognition: SpeechRecognitionLike | null = null;
  let quietTimer: ReturnType<typeof setTimeout> | undefined;

  const setState = (s: ListenState, detail?: string) => {
    state = s;
    opts.onState?.(s, detail);
  };

  function build(): SpeechRecognitionLike {
    const r = new Recognition();
    r.lang = 'en-PH';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    // Chrome can keep recognition on the device; ask for it where supported
    if ('processLocally' in r) {
      try { r.processLocally = true; localRecognition = true; } catch { localRecognition = false; }
    }
    r.onresult = (e) => {
      let finalText = '';
      let partial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const alt = e.results[i][0];
        if (e.results[i].isFinal) finalText += alt.transcript;
        else partial += alt.transcript;
      }
      const text = (finalText || partial).trim();
      if (!text) return;

      if (mode === 'wake') {
        const after = matchWake(text);
        if (after === null) { opts.onPartial?.(''); return; }
        if (after) { handleQuestion(after); return; }
        // Heard "Hey SikLo" on its own: listen for what comes next
        mode = 'question';
        opts.onWake?.();
        setState('question');
        opts.onPartial?.('');
        return;
      }
      opts.onPartial?.(text);
      if (finalText.trim()) handleQuestion(finalText.trim());
      else {
        // Someone paused mid-sentence; take what we have shortly
        clearTimeout(quietTimer);
        quietTimer = setTimeout(() => handleQuestion(text), 1400);
      }
    };
    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return; // ordinary, the restart handles it
      stop();
      setState('error', e.error === 'not-allowed' ? 'not-allowed' : e.error);
    };
    r.onend = () => {
      // Browsers stop listening on their own; start again while the user wants it on
      if (mode !== 'off') { try { r.start(); } catch { /* already starting */ } }
    };
    return r;
  }

  function handleQuestion(question: string): void {
    clearTimeout(quietTimer);
    opts.onPartial?.('');
    mode = 'wake';
    setState('waiting');
    opts.onQuestion(question);
  }

  function run(next: 'wake' | 'question'): void {
    mode = next;
    recognition ??= build();
    try { recognition.start(); } catch { /* already running */ }
    setState(next === 'wake' ? 'waiting' : 'question');
  }

  function stop(): void {
    clearTimeout(quietTimer);
    mode = 'off';
    recognition?.abort();
    recognition = null;
    setState('off');
  }

  return {
    listenForWake: () => run('wake'),
    listenForQuestion: () => run('question'),
    stop,
    get state() { return state; },
  };
}

/** Read a reply out loud, using a voice already on the device. */
export function speak(text: string): void {
  if (!canSpeak()) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\s+/g, ' ').trim());
    u.rate = 1;
    u.pitch = 1;
    const voice = speechSynthesis.getVoices().find((v) => v.lang === 'en-PH')
      ?? speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  } catch { /* speaking is a nicety; never let it break the answer */ }
}

export const stopSpeaking = () => { try { speechSynthesis?.cancel(); } catch { /* ignore */ } };
