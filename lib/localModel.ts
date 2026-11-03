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

/**
 * Turned off for now, while the model side is worked out. Everything below is
 * kept intact: the library answers every question on its own, which is what
 * ships today. Set this to true to offer the model again.
 */
export const FULL_AI = false;

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
  if (!FULL_AI) return false;
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

/** Parameter count in billions, read from the model's name ("1.5B", "360M"). */
export function sizeInB(id: string): number {
  const b = id.match(/(\d+(?:\.\d+)?)\s*b\b/i);
  if (b) return Number(b[1]);
  const m = id.match(/(\d+)\s*m\b/i);
  return m ? Number(m[1]) / 1000 : 0;
}

/**
 * The smallest model that can still follow an instruction, so the download
 * stays short without the answers suffering.
 *
 * Anything under a billion parameters is left out on purpose: those models
 * repeat the instruction back instead of doing it ("you are not sure and
 * suggest seeing a healthcare professional"), which is worse than no model at
 * all, since the library answers are already correct. If nothing suitable is
 * listed, this returns null and SikLo simply answers from the library.
 */
export function chooseModel(list: { model_id: string; vram_required_MB?: number }[]): string | null {
  const usable = list
    .filter((m) => /instruct|-it\b|chat/i.test(m.model_id) && /q4f16|q4f32/i.test(m.model_id))
    .filter((m) => sizeInB(m.model_id) >= 1 && sizeInB(m.model_id) <= 4)
    .sort((a, b) => (a.vram_required_MB ?? 1e9) - (b.vram_required_MB ?? 1e9));
  return usable[0]?.model_id ?? null;
}

/** Download and start the model. Reports progress from 0 to 1. */
export async function loadModel(onProgress?: (fraction: number, text: string) => void): Promise<boolean> {
  if (!FULL_AI) return false;
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
  'You rewrite health notes for SikLo, a private menstrual cycle tracker used in the Philippines.',
  'You are given a draft answer. Rewrite it so it speaks to the question asked, in warm, plain language.',
  'Keep every fact in the draft and add nothing that is not in it. Never diagnose a condition, never name a medicine or a dose, and never say which days are safe from pregnancy.',
  'Reply with the rewritten answer only: no preamble, no notes about these instructions, no disclaimer.',
].join(' ');

/** Phrases that mean the model talked about the task instead of doing it. */
const ECHOED = [
  /\b(the|this) (draft|passage|reference|instruction|question)\b/i,
  /\brewrit(e|ten|ing)\b/i,
  /\bas an ai\b/i,
  /\byou are (correct|right|asked)\b/i,
  /\bhere (is|'s) (the|your|a) (rewritten|revised|answer)/i,
  /\bi (cannot|can't) (help|assist)\b/i,
];

/** Rules the library itself is held to, applied again to anything a model writes. */
const BREAKS_THE_RULES = [
  /\b\d+\s?(mg|milligrams?|tablets?|capsules?)\b/i,
  /\byou (probably |likely )?have\b/i,
  /\bsafe days?\b/i,
  /\bcannot get pregnant\b/i,
];

/** Drops a half-finished last sentence, which is what running out of tokens looks like. */
export function wholeSentences(text: string | undefined): string | undefined {
  const out = text?.trim();
  if (!out || /[.!?]["')]?$/.test(out)) return out;
  const end = Math.max(out.lastIndexOf('.'), out.lastIndexOf('!'), out.lastIndexOf('?'));
  return end > 40 ? out.slice(0, end + 1) : undefined;
}

/**
 * Whether a rewrite can be shown. A small model that drifts off the task, or
 * writes something the library would never be allowed to say, is dropped and
 * the drafted answer is used instead.
 */
export function usableRewrite(text: string | undefined, draft: string): boolean {
  const out = text?.trim() ?? '';
  if (out.length < 60) return false;
  if (out.length > draft.length * 1.6 + 200) return false;   // it started inventing
  if (ECHOED.some((r) => r.test(out))) return false;
  if (BREAKS_THE_RULES.some((r) => r.test(out))) return false;
  return true;
}

/**
 * The drafted answer, reworded for the question asked, or null when the model
 * is not ready or its reply cannot be trusted, so the caller keeps the draft.
 *
 * The model never answers from scratch: it is handed the library's own answer
 * and asked to say the same thing better, which is a task a small model can do
 * and which leaves it no room to invent medical claims.
 */
export async function generate(question: string, draft: string, passages: readonly Article[], facts?: string): Promise<string | null> {
  if (!FULL_AI || status !== 'ready' || !engine || !draft) return null;
  const reference = passages.map((a) => `${a.title}: ${a.text}`).join('\n\n');
  const user = [
    `Question: ${question}`,
    facts ? `What this person has logged: ${facts}` : '',
    `Draft answer to rewrite:\n${draft}`,
    reference ? `Background it came from:\n${reference}` : '',
  ].filter(Boolean).join('\n\n');
  try {
    const out = await engine.chat.completions.create({
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 320,
    });
    const text = wholeSentences(out.choices[0]?.message?.content);
    return usableRewrite(text, draft) ? text! : null;
  } catch {
    return null;
  }
}
