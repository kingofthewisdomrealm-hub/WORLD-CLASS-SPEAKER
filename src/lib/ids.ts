export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID()
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

export function formatIdeaNumber(number: number) {
  return `#${String(number).padStart(3, '0')}`
}

export function nowIso() {
  return new Date().toISOString()
}
