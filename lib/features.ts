/**
 * Parts of SikLo that can be turned off without removing them.
 *
 * ASSISTANT covers the whole Ask SikLo screen: the tab that opens it, the link
 * to it from Insights, and the screen itself, which sends anyone who reaches it
 * from an old history entry back to Today. Set it to true to bring all of that
 * back; nothing about it has been deleted.
 *
 * (lib/localModel.ts has its own switch, FULL_AI, for the on-device model that
 * rewords library answers. The assistant works without it.)
 */
export const ASSISTANT = false;
