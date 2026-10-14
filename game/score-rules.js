const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normalizeAlias(value) {
  if (typeof value !== 'string') throw new Error('Escribe un alias de 3 a 20 caracteres.')
  const alias = value.normalize('NFKC').trim().replace(/ +/g, ' ')
  const length = [...alias].length
  if (length < 3 || length > 20 || !/^[\p{L}\p{N} _-]+$/u.test(alias)) {
    throw new Error('Usa de 3 a 20 letras, números, espacios, guiones o guiones bajos.')
  }
  return { alias, aliasKey: alias.toLowerCase() }
}

export function validateRunResult(input) {
  const { runId, score, coins, durationSeconds, mode } = input
  if (typeof runId !== 'string' || !uuid.test(runId)) throw new Error('La partida no tiene un identificador válido.')
  if (!Number.isSafeInteger(score) || score < 0 || score > 100_000_000) throw new Error('El puntaje no es válido.')
  if (!Number.isSafeInteger(coins) || coins < 0 || coins > 1_000_000) throw new Error('Las monedas no son válidas.')
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0 || durationSeconds > 86_400) throw new Error('La duración no es válida.')
  if (mode !== 'camera' && mode !== 'keyboard') throw new Error('El modo de juego no es válido.')
  // The game awards 10 points/second and 10/coin, doubled during protection.
  // Small tolerance covers flooring points and rounding active time for transport.
  const minimum = durationSeconds * 10 + coins * 10 - 2
  const maximum = durationSeconds * 20 + coins * 20 + 2
  if (score < minimum || score > maximum || coins > Math.ceil(durationSeconds * 25) + 5) {
    throw new Error('El resultado no coincide con la duración y las monedas de la partida.')
  }
  return { runId, score, coins, durationSeconds, mode }
}
