export const OPENING_QUESTION = `Welcome to Speaker OS.

Before we build your keynote, I want to understand you.

Imagine this is a podcast and nobody listening knows your story yet.

Who are you, and what have you been thinking about lately?`

export const BRAIN_DUMP_QUESTION = `Tell me every speech idea you’ve been thinking about recently.

Don’t organize them.
Don’t decide whether they’re good.

Give me unfinished ideas, old speeches, random thoughts, stories, arguments, phrases, lessons, questions—anything.`

export const DISCOVERY_QUESTIONS = [
  'What do you believe that most people in your industry disagree with?',
  'What lesson did you learn the hard way?',
  'What happened to you that changed how you see the world?',
  'What mistake do you see people repeatedly making?',
  'What do people constantly ask you for help with?',
  'What pisses you off?',
  'What could you talk about for three hours without preparing?',
  'What do you understand now that you wish you understood ten years ago?',
  'What story do your friends keep asking you to tell?',
  'What moment in your life divided things into before and after?',
  'What would you teach your younger self?',
  'What belief have you completely changed your mind about?',
  'What problem do you desperately want to solve?',
  'What do you want an audience to do differently after hearing you?',
]

export function nextFallbackQuestion({
  userTurnCount,
}: {
  userTurnCount: number
}) {
  if (userTurnCount <= 0) return OPENING_QUESTION
  if (userTurnCount === 1) return BRAIN_DUMP_QUESTION
  const index = (userTurnCount - 2) % DISCOVERY_QUESTIONS.length
  return DISCOVERY_QUESTIONS[index]
}
