export function hasAiKey() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN
  )
}
