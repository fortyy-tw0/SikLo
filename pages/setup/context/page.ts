// Setup step 4: optional context (all answers optional)
import {
  CONTRACEPTION_OPTIONS, contraceptionHelper, estimateUnsuitable, isContraception, isLifeStage,
  LIFE_STAGE_OPTIONS, MAX_CONTEXT_NOTE, WRITE_IN, type ContraceptionContext, type LifeStageContext,
} from '@lib/context';
import { byId, esc } from '@lib/dom';
import { goTo } from '@lib/nav';
import { draft, update } from '@lib/store';
import type { DiagnosisAnswer } from '@lib/types';

/** One "+ Add ... context" button with its choices, an own-words box for "Other", and a helper line. */
function contextSection<T extends string>(
  key: string,
  options: readonly { value: T; label: string }[],
  initial: { value: T | null; note: string },
  helper: (value: T | null) => string | null,
  onChange: () => void,
) {
  const button = byId<HTMLButtonElement>(key);
  const label = button.querySelector<HTMLElement>('.lbl')!;
  const panel = byId(`${key}Panel`);
  const opts = byId(`${key}Opts`);
  const noteWrap = byId(`${key}NoteWrap`);
  const note = byId<HTMLTextAreaElement>(`${key}Note`);
  const help = byId(`${key}Help`);
  let value: T | null = initial.value;
  note.value = initial.note;
  note.maxLength = MAX_CONTEXT_NOTE;

  opts.innerHTML = options.map((o) => `
    <button class="copt" type="button" role="radio" aria-checked="false" data-v="${o.value}">
      <span class="radio"></span>${esc(o.label)}
    </button>`).join('');

  const render = () => {
    opts.querySelectorAll<HTMLElement>('.copt').forEach((o) => o.setAttribute('aria-checked', String(o.dataset.v === value)));
    noteWrap.hidden = !(value && WRITE_IN.includes(value));
    const h = helper(value);
    help.hidden = !h;
    help.textContent = h ?? '';
  };
  const setOpen = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('open', open);
    panel.toggleAttribute('inert', !open);
    label.textContent = (open ? label.dataset.open : label.dataset.add) ?? '';
  };

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    if (!open) {
      // Closing removes this context
      value = null;
      note.value = '';
    }
    setOpen(open);
    render();
    onChange();
    if (open) opts.querySelector<HTMLElement>('.copt')?.focus({ preventScroll: true });
  });
  opts.addEventListener('click', (e) => {
    const o = (e.target as Element).closest<HTMLElement>('.copt');
    if (!o) return;
    value = value === o.dataset.v ? null : (o.dataset.v as T); // tap again to clear
    render();
    onChange();
    if (value && WRITE_IN.includes(value)) setTimeout(() => note.focus({ preventScroll: true }), 150);
  });

  setOpen(initial.value !== null);
  render();
  return {
    get value() { return value; },
    get note() { return value && WRITE_IN.includes(value) ? note.value.trim() : ''; },
  };
}

/** Called by the router each time this screen is shown. */
export default function mount(_signal: AbortSignal): void {
  const MAX_NOTE = 500;
  const d = draft();

  // Diagnosed condition (single choice, tap again to clear)
  let diagnosed: DiagnosisAnswer | null = null;
  const dx = byId('dx');
  dx.addEventListener('click', (e) => {
    const o = (e.target as Element).closest<HTMLElement>('.opt');
    if (!o) return;
    const already = o.getAttribute('aria-checked') === 'true';
    dx.querySelectorAll('.opt').forEach((x) => x.setAttribute('aria-checked', 'false'));
    if (!already) o.setAttribute('aria-checked', 'true');
    diagnosed = already ? null : (o.dataset.v as DiagnosisAnswer);
  });
  if (d.diagnosed) {
    const o = dx.querySelector(`[data-v="${d.diagnosed}"]`);
    if (o) { o.setAttribute('aria-checked', 'true'); diagnosed = d.diagnosed; }
  }

  // Concern note
  const ta = byId<HTMLTextAreaElement>('concern');
  const count = byId('count');
  const showCount = () => { count.textContent = `${ta.value.length}/${MAX_NOTE}`; };
  ta.value = d.concern_note;
  showCount();
  ta.addEventListener('input', showCount);

  // Contraception and life stage
  const estimateOff = byId('estimateOff');
  const showEstimateNote = () => {
    const why = estimateUnsuitable(life.value);
    estimateOff.hidden = !why;
    byId('estimateOffText').textContent = why ?? '';
  };
  const contra = contextSection<ContraceptionContext>('contra', CONTRACEPTION_OPTIONS,
    { value: isContraception(d.contraception) ? d.contraception : null, note: d.contraception_note ?? '' },
    contraceptionHelper, () => {});
  const life = contextSection<LifeStageContext>('life', LIFE_STAGE_OPTIONS,
    { value: isLifeStage(d.life_stage) ? d.life_stage : null, note: d.life_stage_note ?? '' },
    () => null, () => showEstimateNote());
  showEstimateNote();

  const keep = () =>
    update({
      diagnosed,
      concern_note: ta.value.trim(),
      contraception: contra.value,
      contraception_note: contra.note,
      life_stage: life.value,
      life_stage_note: life.note,
    });

  byId('backBtn').addEventListener('click', () => { keep(); goTo('cycle', 'back'); });
  byId('next').addEventListener('click', () => { keep(); goTo('dates', 'forward'); });
  // Skip = share none of this optional context
  byId('skipBtn').addEventListener('click', () => {
    update({ diagnosed: null, concern_note: '', contraception: null, contraception_note: '', life_stage: null, life_stage_note: '' });
    goTo('dates', 'forward');
  });
}
