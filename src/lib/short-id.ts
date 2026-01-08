const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const SHORT_ID_LENGTH = 8

export function generateShortId(): string {
  let result = ''
  const randomValues = new Uint32Array(SHORT_ID_LENGTH)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < SHORT_ID_LENGTH; i++) {
    result += CHARS[randomValues[i] % CHARS.length]
  }
  return result
}
