/** Small, strict JSON validators for the local save boundary. No coercion. */
export type Check = (value: unknown, path: string) => void
export function invalid(path: string): never {
  throw new Error(`Invalid Classic save: ${path}`)
}
export function record(value: unknown, path: string): Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    invalid(path)
  return value as Record<string, unknown>
}
export const text: Check = (v, p) => {
  if (typeof v !== 'string' || v.length > 16_384) invalid(p)
}
export const id: Check = (v, p) => {
  text(v, p)
  if (!(v as string).length || (v as string).length > 512) invalid(p)
}
export const bool: Check = (v, p) => {
  if (typeof v !== 'boolean') invalid(p)
}
export const finite: Check = (v, p) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) invalid(p)
}
export const nonnegative: Check = (v, p) => {
  finite(v, p)
  if ((v as number) < 0) invalid(p)
}
export const count: Check = (v, p) => {
  nonnegative(v, p)
  if (!Number.isSafeInteger(v)) invalid(p)
}
export const integer: Check = (v, p) => {
  finite(v, p)
  if (!Number.isSafeInteger(v)) invalid(p)
}
export const positive: Check = (v, p) => {
  count(v, p)
  if ((v as number) < 1) invalid(p)
}
export const choice =
  (values: readonly unknown[]): Check =>
  (v, p) => {
    if (!values.includes(v)) invalid(p)
  }
export const optional =
  (check: Check): Check =>
  (v, p) => {
    if (v !== undefined) check(v, p)
  }
export const nullable =
  (check: Check): Check =>
  (v, p) => {
    if (v !== null) check(v, p)
  }
export const array =
  (check: Check, max = 20_000): Check =>
  (v, p) => {
    if (!Array.isArray(v) || v.length > max) invalid(p)
    for (let index = 0; index < v.length; index++)
      check(v[index], `${p}[${index}]`)
  }
export const tuple =
  (...checks: Check[]): Check =>
  (v, p) => {
    if (!Array.isArray(v) || v.length !== checks.length) invalid(p)
    checks.forEach((check, i) => check(v[i], `${p}[${i}]`))
  }
export const object =
  (fields: Record<string, Check>): Check =>
  (v, p) => {
    const data = record(v, p)
    if (
      Object.keys(data).some(
        (key) => !Object.prototype.hasOwnProperty.call(fields, key)
      )
    )
      invalid(p)
    for (const [key, check] of Object.entries(fields))
      check(data[key], `${p}.${key}`)
  }
/** Keep validators exhaustive when a serialized interface gains a field. */
export const schema = <T>(fields: { [K in keyof T]-?: Check }): Check =>
  object(fields)
export const uint32: Check = (v, p) => {
  count(v, p)
  if ((v as number) > 0xffffffff) invalid(p)
}
export const keyed =
  (check: Check, key: string): Check =>
  (v, p) => {
    array(check)(v, p)
    const values = (v as Record<string, unknown>[]).map((entry) => entry[key])
    if (new Set(values).size !== values.length) invalid(`${p}.${key}`)
  }
export const entries =
  (key: Check, value: Check): Check =>
  (v, p) => {
    array(tuple(key, value))(v, p)
    const keys = (v as [unknown, unknown][]).map((entry) => entry[0])
    if (new Set(keys).size !== keys.length) invalid(p)
  }
export const uniqueIds: Check = (v, p) => {
  array(id)(v, p)
  if (new Set(v as string[]).size !== (v as string[]).length) invalid(p)
}

/** Compare rule definitions independent of key order; presentation prose may change. */
export function ruleDefinition(
  value: unknown,
  canonical: unknown,
  path: string
): void {
  if (canonical === undefined) {
    if (value !== undefined) invalid(path)
    return
  }
  if (Array.isArray(canonical)) {
    if (!Array.isArray(value) || value.length !== canonical.length)
      invalid(path)
    canonical.forEach((entry, i) =>
      ruleDefinition(value[i], entry, `${path}[${i}]`)
    )
  } else if (canonical && typeof canonical === 'object') {
    const data = record(value, path)
    const expected = canonical as Record<string, unknown>
    if (
      Object.keys(data).some(
        (key) => !Object.prototype.hasOwnProperty.call(expected, key)
      )
    )
      invalid(path)
    for (const [key, entry] of Object.entries(expected)) {
      if (
        [
          'name',
          'description',
          'japaneseName',
          'mahjongTwist',
          'planetName',
        ].includes(key)
      )
        text(data[key], `${path}.${key}`)
      else ruleDefinition(data[key], entry, `${path}.${key}`)
    }
  } else if (value !== canonical) invalid(path)
}

export function catalog(
  candidates: readonly { id: string }[],
  runtime: Record<string, Check> = {}
): Check {
  return (v, p) => {
    const data = record(v, p)
    const definition = candidates.find((candidate) => candidate.id === data.id)
    if (!definition) invalid(`${p}.id`)
    const rules = { ...definition } as Record<string, unknown>
    const staticData = { ...data }
    for (const [key, check] of Object.entries(runtime)) {
      check(data[key], `${p}.${key}`)
      delete rules[key]
      delete staticData[key]
    }
    ruleDefinition(staticData, rules, p)
  }
}
