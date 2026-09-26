// Modes register only after their code loads; update checks must not eagerly
// import the Table Loop engine or instantiate a new journal.
const guards = new Map<string, () => boolean | Promise<boolean>>()

export function registerReloadGuard(
  name: string,
  guard: () => boolean | Promise<boolean>
) {
  guards.set(name, guard)
  return () => {
    if (guards.get(name) === guard) guards.delete(name)
  }
}

export async function prepareForReload(): Promise<boolean> {
  try {
    for (const guard of guards.values()) if (!(await guard())) return false
    return true
  } catch {
    return false
  }
}
