import { generate, generateJSON, extractText } from '../api'

export const DEPTH_LABELS = [
  'question one', 'question two', 'question three', 'question four', 'question five',
  'going deeper', 'further in', 'deeper still', 'the edge of the forest',
  'the very end',
]

export function getDepthLabel(qi) {
  return DEPTH_LABELS[Math.min(qi, DEPTH_LABELS.length - 1)]
}

function pathSummary(answers) {
  return answers
    .map((a, i) => `Q${i + 1}: "${a.q}" → "${a.c}"${a.leaf ? ' (chosen from a leaf)' : ''}`)
    .join('\n')
}

const JSON_SUFFIX = '\n\nJSON only: {"q":"...","l":"first option (12 words max)","r":"second option (12 words max)"}'

export async function generateQuestion(theme, answers, qi) {
  const summary = pathSummary(answers)
  let prompt

  if (qi <= 6) {
    // Q6–7: early AI — penetrating, path-specific
    prompt = `You are writing questions for a philosophical icebreaker app. Theme: ${theme}.

The user's path so far:
${summary}

Write ONE penetrating question that could only come from reading this specific path. It should feel like it sees something true about what they've said. Then two short answer options — not comfortable opposites, but two honest ways to respond.${JSON_SUFFIX}`

  } else if (qi <= 8) {
    // Q8–9: find the contradiction
    prompt = `You are writing questions for a philosophical icebreaker. Theme: ${theme}.

The user's path so far:
${summary}

You are at question ${qi + 1} of 10. Read the full path carefully. Find the contradiction — what the answers keep circling without landing on. What is the person approaching but not quite saying?
Write ONE question that names what's underneath, not what's on the surface. It should feel slightly uncomfortable to read — not cruel, but precise.${JSON_SUFFIX}`

  } else {
    // Q10: the final, inevitable question
    prompt = `You are writing questions for a philosophical icebreaker. Theme: ${theme}.

The user's full path:
${summary}

This is question 10 of 10. The last question before the path ends.
Read everything. The full arc. What has this person been moving toward without knowing it?
Write ONE question — the most essential question this specific path makes possible. Not a summary. A question that, answered honestly, would change something. It should feel inevitable. Like the forest knew it was coming.${JSON_SUFFIX}`
  }

  return generateJSON([{ role: 'user', content: prompt }])
}

export async function generateConvergenceQuestion(theme, answers) {
  const summary = answers.map((a, i) => `${i + 1}. ${a.q} → ${a.c}`).join('\n')
  const prompt = `You are ending a profound philosophical journey on the theme of ${theme}. The full path — ${answers.length} questions:

${summary}

This person went further than most. Write ONE final question that could only exist given everything you now know about them. It should be both inevitable — given this specific path — and slightly unresolvable. Something beautiful that will stay with them. No explanation, no comment. Only the question.`

  const data = await generate([{ role: 'user', content: prompt }])
  return extractText(data).replace(/^[""\u201c]|[""\u201d]$/g, '').trim()
}

export async function generateShareMessage(theme, answers, sharedQuestion, senderName) {
  const summary = pathSummary(answers)
  const nameNote = senderName
    ? `The sender's name is ${senderName}. Sign the message naturally at the end.`
    : 'Do not sign with a name.'

  const prompt = `You are writing a short WhatsApp message. The sender used Deep Dive, a philosophical icebreaker, on the theme of ${theme}.

Their path:
${summary}

The question they are sharing: "${sharedQuestion}"

Write 2–3 sentences that:
- Name the theme and what this specific path revealed (concrete, not generic)
- Make clear this question emerged from their particular journey
- Tell the recipient what they're being asked to do

Rules: no pronouns "they/them/it" about the sender — write about the path itself. Warm, direct, plain text, max 60 words.
${nameNote}`

  const data = await generate([{ role: 'user', content: prompt }], 400)
  const context = extractText(data)

  return [
    context,
    '',
    `"${sharedQuestion}"`,
    '',
    "This question came from a specific path through the forest. Where would yours lead?",
    '',
    '→ deepdive.app',
  ].join('\n')
}
