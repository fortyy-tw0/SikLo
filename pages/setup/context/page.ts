// Step 3: optional context (all answers optional)
import { byId } from '@lib/dom';
import { goTo } from '@lib/nav';
import { draft, update } from '@lib/store';
import type { DiagnosisAnswer } from '@lib/types';

/** Called by the router each time this screen is shown. */
export default function mount(_signal: AbortSignal): void {
  const MAX_NOTE = 500;

  const answers: { diagnosed: DiagnosisAnswer | null; concern: string; contraception: boolean; lifeStage: boolean } = {
    diagnosed: null,
    concern: '',
    contraception: false,
    lifeStage: false,
  };

  const dx = byId('dx');
  const ta = byId<HTMLTextAreaElement>('concern');
  const count = byId('count');
  const contra = byId('contra');
  const life = byId('life');

  dx.addEventListener('click', (e) => {
    const o = (e.target as Element).closest<HTMLElement>('.opt');
    if (!o) return;
    const already = o.getAttribute('aria-checked') === 'true';
    dx.querySelectorAll('.opt').forEach((x) => x.setAttribute('aria-checked', 'false'));
    if (!already) o.setAttribute('aria-checked', 'true'); // tap again to clear
    answers.diagnosed = already ? null : (o.dataset.v as DiagnosisAnswer);
  });

  const showCount = () => { count.textContent = `${ta.value.length}/${MAX_NOTE}`; };
  ta.addEventListener('input', () => { showCount(); answers.concern = ta.value; });

  function toggle(button: HTMLElement, key: 'contraception' | 'lifeStage'): void {
    button.addEventListener('click', () => {
      const on = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(on));
      answers[key] = on;
    });
  }
  toggle(contra, 'contraception');
  toggle(life, 'lifeStage');

  // Restore earlier answers
  const d = draft();
  if (d.diagnosed) {
    const o = dx.querySelector(`[data-v="${d.diagnosed}"]`);
    if (o) { o.setAttribute('aria-checked', 'true'); answers.diagnosed = d.diagnosed; }
  }
  if (d.concern_note) { ta.value = d.concern_note; showCount(); answers.concern = ta.value; }
  if (d.contraception_context) { contra.setAttribute('aria-pressed', 'true'); answers.contraception = true; }
  if (d.life_stage_context) { life.setAttribute('aria-pressed', 'true'); answers.lifeStage = true; }

  const keep = () =>
    update({
      diagnosed: answers.diagnosed,
      concern_note: answers.concern.trim(),
      contraception_context: answers.contraception,
      life_stage_context: answers.lifeStage,
    });

  byId('backBtn').addEventListener('click', () => { keep(); goTo('cycle', 'back'); });
  byId('next').addEventListener('click', () => { keep(); goTo('dates', 'forward'); });
  // Skip = share none of this optional context
  byId('skipBtn').addEventListener('click', () => {
    update({ diagnosed: null, concern_note: '', contraception_context: false, life_stage_context: false });
    goTo('dates', 'forward');
  });
}
