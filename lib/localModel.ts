/**
 * Optional on-device language model.
 *
 * The assistant already answers from lib/library/articles.ts with no download
 * and no network, on every device. This adds free-form phrasing on devices that
 * can run a model locally through WebGPU: Chrome and Edge on desktop, and newer
 * Android Chrome. iPhone Safari cannot, and gets the article answers.
 *
 * Rules that do not change when the model is on:
 *   - lib/safety.ts runs first, and crisis replies never reach the model
 *   - the model is given the matching library passages and told to answer only
 *     from them, so it cannot invent medical claims
 *   - the reminder that SikLo is not a healthcare professional is added by the
 *     screen, not by the model, so it cannot be left out
 *
 * The weights are fetched once and kept in the browser's cache, so later visits
 * work offline. Nothing about the person is ever uploaded: the model runs in
 * the page.
 */
import type { Article } from './library/articles';

/** Pinned so a new release cannot change behaviour without us choosing it. */
const WEBLLM_URL = 'https://esm.run/@mlc-ai/web-llm@0.2.79';

export type ModelStatus = 'unsupported' | 'not-loaded' | 'loading' | 'ready' | 'failed';

interface Engine {
  chat: { completions: { create(req: unknown): Promise<{ choices: { message: { content?: string } }[] }> } };
}
interface WebLLM {
  CreateMLCEngine(model: string, opts: { initProgressCallback?: (p: { progress: number; text: string }) => void }): Promise<Engine>;
  prebuiltAppConfig: { model_list: { model_id: string; vram_required_MB?: number }[] };
}

let engine: Engine | null = null;
let status: ModelStatus = 'not-loaded';
let modelName = '';

export const modelStatus = () => status;
export const loadedModelName = () => modelName;

/** WebGPU is what makes a local model possible in a browser. */
export function deviceCanRunModel(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

interface NetworkInfo { saveData?: boolean; effectiveType?: string; type?: string }

/**
 * Whether it is fair to start a several-hundred-megabyte download without
 * being asked. Mobile data is expensive, so this is deliberately cautious:
 * only when the browser says the connection is not metered and not slow, and
 * never when the person has asked their browser to save data.
 */
export function downloadWithoutAsking(info: NetworkInfo | undefined = (navigator as unknown as { connection?: NetworkInfo }).connection): boolean {
  if (!deviceCanRunModel()) return false;
  if (!info) return false;                       // nothing known: ask first
  if (info.saveData) return false;               // she asked not to use data
  if (info.type === 'cellular') return false;    // phone data
  return info.effectiveType === undefined || info.effectiveType === '4g';
}

/**
 * Smallest instruction-following model on offer, so the download stays as
 * short as possible. Chosen from the library's own list at run time rather
 * than hard-coded, so it keeps working when that list changes.
 */
export function chooseModel(list: { model_id: string; vram_required_MB?: number }[]): string | null {
  const usable = list
    .filter((m) => /instruct/i.test(m.model_id) && /q4f16|q4f32/i.test(m.model_id))
    .filter((m) => !/70b|13b|8b|7b/i.test(m.model_id))
    .sort((a, b) => (a.vram_required_MB ?? 1e9) - (b.vram_required_MB ?? 1e9));
  return usable[0]?.model_id ?? list[0]?.model_id ?? null;
}

/** Download and start the model. Reports progress from 0 to 1. */
export async function loadModel(onProgress?: (fraction: number, text: string) => void): Promise<boolean> {
  if (status === 'ready') return true;
  if (!deviceCanRunModel()) { status = 'unsupported'; return false; }
  status = 'loading';
  try {
    const webllm = (await import(/* @vite-ignore */ WEBLLM_URL)) as unknown as WebLLM;
    const model = chooseModel(webllm.prebuiltAppConfig.model_list);
    if (!model) throw new Error('no model available');
    engine = await webllm.CreateMLCEngine(model, {
      initProgressCallback: (p) => onProgress?.(p.progress, p.text),
    });
    modelName = model;
    status = 'ready';
    return true;
  } catch {
    status = 'failed';
    engine = null;
    return false;
  }
}

const SYSTEM = [
  'You are the assistant inside SikLo, a private menstrual cycle tracker used in the Philippines.',
  'Answer ONLY from the reference passages given to you. If they do not cover the question, say you are not sure and suggest seeing a healthcare professional.',
  'Never diagnose a condition, never name a medicine or a dose, and never say which days are safe from pregnancy.',
  'Be warm, plain and brief: at most three short sentences. Do not add a disclaimer; the app adds one.',
].join(' ');

/**
 * A free-form answer grounded in `passages`, or null if the model is not ready
 * or anything goes wrong, so the caller can fall back to the article answer.
 */
export async function generate(question: string, passages: readonly Article[], facts?: string): Promise<string | null> {
  if (status !== 'ready' || !engine) return null;
  const reference = passages.map((a) => `${a.title}: ${a.text}`).join('\n\n');
  const user = [
    facts ? `What this person has logged: ${facts}` : '',
    `Reference passages:\n${reference || '(none)'}`,
    `Question: ${question}`,
  ].filter(Boolean).join('\n\n');
  try {
    const out = await engine.chat.completions.create({
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
      temperature: 0.3,
      max_tokens: 220,
    });
    const text = out.choices[0]?.message?.content?.trim();
    return text && text.length > 10 ? text : null;
  } catch {
    return null;
  }
}
