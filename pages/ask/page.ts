// Ask SikLo: the on-device assistant. Answers from the health library and the
// person's own log, with an optional language model for free-form phrasing.
import { answerQuestion, MEDICAL_NOTE, retrieve, SUGGESTIONS, type Answer } from '@lib/assistant';
import { estimateUnsuitable } from '@lib/context';
import { buildCycleView, type CycleView } from '@lib/cycleView';
import { byId, esc, todayIso } from '@lib/dom';
import { deviceCanRunModel, downloadWithoutAsking, generate, loadModel, modelStatus } from '@lib/localModel';
import { buildMemory, memoryFacts, type Memory } from '@lib/memory';
import { load } from '@lib/store';
import { mountTabbar } from '@lib/tabbar';
import { toast } from '@lib/toast';
import { loadTracking } from '@lib/tracking';
import { canListen, canSpeak, createListener, matchWake, recognitionIsLocal, speak, stopSpeaking, type Listener } from '@lib/voice';

/**
 * The conversation is kept in memory only: it is gone when you leave this
 * screen, matching the backend's default chat retention of "off".
 */
export default function mount(signal: AbortSignal): void {
  mountTabbar(byId('tabbar'));

  const thread = byId('thread');
  const input = byId<HTMLTextAreaElement>('input');
  const sendBtn = byId<HTMLButtonElement>('sendBtn');
  const micBtn = byId<HTMLButtonElement>('micBtn');
  const heard = byId('heard');

  const saved = load();
  const today = todayIso();
  const tracking = loadTracking();
  const view: CycleView | null = saved
    ? buildCycleView(saved.periods, today, tracking.ovulation, { estimate: !estimateUnsuitable(saved.profile.life_stage) })
    : null;
  /** Recomputed from her whole history every time this screen opens. */
  const memory: Memory | null = saved
    ? buildMemory({ periods: saved.periods, entries: tracking.entries, intimacy: tracking.intimacy, view, today })
    : null;

  // ---------- Conversation ----------
  const scroll = () => { thread.scrollTop = thread.scrollHeight; };

  function addYou(text: string): void {
    const el = document.createElement('div');
    el.className = 'msg you';
    el.textContent = text;
    thread.append(el);
    scroll();
  }

  /** Everything that follows the answer itself: her own logs, sources, the note. */
  const extras = (answer: Answer) =>
    (answer.personal.length
      ? `<span class="mine"><b>From your own logs</b>${answer.personal.map((line) => `<em>${esc(line)}</em>`).join('')}</span>`
      : '')
    + (answer.sources.length ? `<span class="src">From the SikLo health library: ${esc(answer.sources.join(' · '))}</span>` : '')
    + (answer.showMedicalNote ? `<span class="note">${esc(MEDICAL_NOTE)}</span>` : '');

  const stillMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Set while an answer is being written out; shows the rest of it at once. */
  let skip: (() => void) | null = null;
  thread.addEventListener('click', () => skip?.(), { signal });

  function addSikLo(answer: Answer, written = true): HTMLElement {
    const el = document.createElement('div');
    el.className = `msg siklo${answer.crisis ? ' crisis' : ''}`;
    // Anything urgent appears at once; so does a reply for someone who asked
    // their device for less motion.
    if (!written || answer.crisis || stillMotion()) {
      el.innerHTML = esc(answer.text).replace(/\n/g, '<br>') + extras(answer);
      thread.append(el);
      scroll();
      return el;
    }
    // Otherwise it is written out, the way someone typing would.
    el.innerHTML = '<span class="said typing" aria-hidden="true"></span><span class="read"></span><span class="rest" hidden></span>';
    const said = el.querySelector<HTMLElement>('.said')!;
    const rest = el.querySelector<HTMLElement>('.rest')!;
    thread.append(el);
    scroll();
    type(said, answer.text, () => {
      said.classList.remove('typing');
      el.querySelector<HTMLElement>('.read')!.textContent = answer.text;  // for a screen reader, once
      rest.innerHTML = extras(answer);
      rest.hidden = false;
      scroll();
    });
    return el;
  }

  /**
   * Writes the answer out a word at a time, at a steady pace, with a breath at
   * the end of a sentence. Whole words rather than letters: nothing breaks
   * mid-word, so it can be read as it arrives instead of racing past.
   */
  function type(into: HTMLElement, text: string, done: () => void): void {
    const words = text.match(/\S+\s*/g) ?? [text];
    const each = words.length > 110 ? 34 : 48;       // a long answer moves a little quicker
    const atBottom = () => thread.scrollHeight - thread.scrollTop - thread.clientHeight < 60;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let i = 0;
    const finish = () => {
      clearTimeout(timer);
      skip = null;
      into.textContent = text;
      done();
      scroll();
    };
    skip = finish;                                   // a tap anywhere shows the rest at once
    const tick = () => {
      if (!into.isConnected) { skip = null; return; } // the screen was left, or the thread cleared
      const keep = atBottom();
      const word = words[i++];
      into.textContent += word;
      if (keep) scroll();
      if (i >= words.length) { skip = null; done(); return; }
      // Punctuation gets a pause, the way someone writing would stop for breath
      const wait = /[.!?][")]?\s*$/.test(word) ? each + 220 : /[,;:]\s*$/.test(word) ? each + 90 : each;
      timer = setTimeout(tick, wait);
    };
    timer = setTimeout(tick, each);
  }

  function addThinking(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'thinking';
    el.innerHTML = '<i></i><i></i><i></i>';
    el.setAttribute('aria-label', 'Thinking');
    thread.append(el);
    scroll();
    return el;
  }

  /** Her own numbers and learned patterns, for the model to work from. */
  const facts = () => (memory ? memoryFacts(memory, view) : undefined);

  /** The arrow flies off and the field settles, so sending a question is felt. */
  const askRow = document.querySelector<HTMLElement>('.ask')!;
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  function flash(): void {
    sendBtn.classList.remove('sent');
    askRow.classList.remove('sent');
    void sendBtn.offsetWidth;            // restart the animation on a second send
    sendBtn.classList.add('sent');
    askRow.classList.add('sent');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { sendBtn.classList.remove('sent'); askRow.classList.remove('sent'); }, 460);
  }

  let busy = false;
  async function ask(question: string, spoken = false): Promise<void> {
    const text = question.trim();
    if (!text || busy) return;
    busy = true;
    skip?.();                 // finish the answer before this one, rather than racing it
    stopSpeaking();
    suggestions.hidden = true;
    flash();
    addYou(text);
    input.value = '';
    resize();
    refreshSend();

    const base = answerQuestion(text, { view, memory, name: saved?.profile.name });
    const dots = addThinking();
    const started = Date.now();

    // The model only ever rephrases a library answer, and never touches safety replies
    let answer = base;
    if (!base.crisis && base.kind === 'library' && modelStatus() === 'ready') {
      const worded = await generate(text, retrieve(text, 3).map((s) => s.article), facts());
      if (worded) answer = { ...base, text: worded };
    }
    // A library answer is ready at once; a beat of thinking makes the exchange
    // readable rather than a flash. Anything urgent skips the wait.
    const beat = 1200 - (Date.now() - started);
    if (!base.crisis && beat > 0) await new Promise((r) => setTimeout(r, beat));
    dots.remove();
    addSikLo(answer);
    if (spoken && canSpeak()) speak(answer.text);
    busy = false;
  }

  // ---------- Typing ----------
  const resize = () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(120, input.scrollHeight)}px`;
  };
  const refreshSend = () => { sendBtn.disabled = !input.value.trim(); };
  input.addEventListener('input', () => { resize(); refreshSend(); });
  // The raised Ask button overlaps the field, so it steps aside while typing
  const typing = (on: boolean) => document.documentElement.classList.toggle('typing', on);
  input.addEventListener('focus', () => typing(true));
  input.addEventListener('blur', () => typing(false));
  signal.addEventListener('abort', () => typing(false));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void ask(input.value); }
  });
  sendBtn.addEventListener('click', () => void ask(input.value));

  // ---------- Opening message, suggestions and tools ----------
  const tools = document.createElement('div');
  tools.className = 'tools';
  const suggestions = document.createElement('div');
  suggestions.className = 'suggest';
  suggestions.innerHTML = SUGGESTIONS.map((s) => `<button type="button">${esc(s)}</button>`).join('');
  suggestions.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    if (b) void ask(b.textContent ?? '');
  });

  const greeting = saved?.profile.name ? `Hi ${saved.profile.name}. ` : '';
  const known = memory?.patterns.length
    ? ` I have learned ${memory.patterns.length} pattern${memory.patterns.length === 1 ? '' : 's'} from your logs so far, and I use them when they are relevant.`
    : '';
  addSikLo({
    kind: 'library',
    text: `${greeting}Ask me about cycles, symptoms, or anything you have logged. I work offline and nothing you type leaves this device.${known}`,
    sources: [], personal: [], crisis: false, showMedicalNote: true,
  }, false);   // the greeting is not a reply to anything, so it is simply there
  thread.append(suggestions, tools);

  // ---------- Voice ----------
  let listener: Listener | null = null;
  let wakeOn = false;

  const wakeBtn = document.createElement('button');
  wakeBtn.className = 'tool';
  wakeBtn.type = 'button';
  wakeBtn.setAttribute('aria-pressed', 'false');
  const micRing = () => document.getElementById('askPulse');

  function renderWake(state = 'off', detail = ''): void {
    const privacy = recognitionIsLocal()
      ? 'Speech stays on this device.'
      : 'This browser may send what it hears to its own speech service.';
    const body = !canListen()
      ? '<b>Voice is not available in this browser</b><small>Try Chrome or Edge. You can still type your question.</small>'
      : state === 'error'
        ? `<b>Microphone unavailable</b><small>${detail === 'not-allowed' ? 'Allow microphone access in your browser settings, then try again.' : 'Something interrupted listening. Tap to try again.'}</small>`
        : wakeOn
          ? `<b>Listening for “Hey SikLo”</b><small>${state === 'question' ? 'Go ahead, I am listening…' : 'Say it, then ask your question.'} ${privacy}</small>`
          : `<b>Say “Hey SikLo” to ask</b><small>Turns on the microphone while this screen is open. ${privacy}</small>`;
    wakeBtn.innerHTML = `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></span><span>${body}</span><span class="state">${wakeOn ? 'On' : 'Off'}</span>`;
    wakeBtn.setAttribute('aria-pressed', String(wakeOn));
    wakeBtn.disabled = !canListen();
    micBtn.classList.toggle('on', state === 'question');
    micRing()?.classList.toggle('listening', wakeOn);
  }

  function ensureListener(): Listener | null {
    listener ??= createListener({
      onQuestion: (q) => { heard.textContent = ''; void ask(q, true); },
      onWake: () => { heard.textContent = 'Listening…'; },
      onPartial: (t) => { heard.textContent = t; },
      onState: (s, detail) => renderWake(s, detail),
    });
    return listener;
  }

  wakeBtn.addEventListener('click', () => {
    const l = ensureListener();
    if (!l) return;
    wakeOn = !wakeOn;
    if (wakeOn) { l.listenForWake(); toast('Listening for “Hey SikLo”'); }
    else { l.stop(); heard.textContent = ''; }
    renderWake(wakeOn ? 'waiting' : 'off');
  });

  micBtn.addEventListener('click', () => {
    const l = ensureListener();
    if (!l) { toast('Voice is not available in this browser'); return; }
    if (l.state === 'question') { wakeOn ? l.listenForWake() : l.stop(); renderWake(wakeOn ? 'waiting' : 'off'); return; }
    l.listenForQuestion();
    renderWake('question');
  });

  // Leaving the screen always releases the microphone
  signal.addEventListener('abort', () => { listener?.stop(); stopSpeaking(); });

  // ---------- Optional model ----------
  const modelBtn = document.createElement('button');
  modelBtn.className = 'tool';
  modelBtn.type = 'button';

  function renderModel(fraction?: number, label?: string): void {
    const status = modelStatus();
    const supported = deviceCanRunModel();
    const body = !supported
      ? '<b>Full AI needs a newer browser</b><small>Answers still come from the SikLo health library, offline. Chrome or Edge on a computer or newer Android can run the full model.</small>'
      : status === 'ready'
        ? '<b>Full AI is on</b><small>Answers are worded by a model running on this device, using the SikLo library. Works offline.</small>'
        : status === 'loading'
          ? `<b>Downloading the full AI…</b><small>${esc(label ?? 'Starting')}</small><span class="bar"><i style="width:${Math.round((fraction ?? 0) * 100)}%"></i></span>`
          : status === 'failed'
            ? '<b>Download did not finish</b><small>Tap to try again. The library answers work in the meantime.</small>'
            : `<b>Turn on the full AI</b><small>A one-time download (several hundred MB) lets SikLo word answers freely, still entirely on this device. ${downloadWithoutAsking() ? 'Starting now.' : 'Not started automatically, because this looks like mobile data.'}</small>`;
    modelBtn.innerHTML = `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 11l4 4 4-4M5 21h14"/></svg></span><span>${body}</span>${status === 'ready' ? '<span class="state">On</span>' : ''}`;
    modelBtn.disabled = !supported || status === 'loading' || status === 'ready';
  }

  modelBtn.addEventListener('click', async () => {
    if (!deviceCanRunModel()) return;
    renderModel(0, 'Starting');
    const ok = await loadModel((f, text) => renderModel(f, text));
    renderModel();
    toast(ok ? 'Full AI ready, and it stays on this device' : 'Could not load the full AI');
  });

  tools.append(wakeBtn, modelBtn);
  renderWake();
  renderModel();

  // Not optional where the device can run it and the connection is not metered:
  // start it in the background, with the library answering until it is ready.
  if (modelStatus() === 'not-loaded' && downloadWithoutAsking()) {
    renderModel(0, 'Starting');
    void loadModel((f, text) => renderModel(f, text)).then((ok) => {
      renderModel();
      if (ok) toast('Full AI ready, and it stays on this device');
    });
  }

  // ---------- Clear ----------
  byId('clearBtn').addEventListener('click', () => {
    stopSpeaking();
    thread.querySelectorAll('.msg, .thinking').forEach((el, i) => { if (i > 0) el.remove(); });
    suggestions.hidden = false;
    heard.textContent = '';
    toast('Conversation cleared');
  });

  // Heard-but-not-matched text is useful while testing the wake phrase
  if (!canListen()) heard.textContent = '';
  void matchWake; // referenced for clarity that the wake rule lives in lib/voice.ts
}
