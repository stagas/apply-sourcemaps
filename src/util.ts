import { KeyedCache } from 'utils'

const caches = new Set<any>()

export function clearAllCaches() {
  caches.forEach(x => {
    x.clear()
  })
}

export function createDeferredCache<T, U extends unknown[]>(fn: (id: string, ...rest: U) => Promise<T>) {
  const run = KeyedCache(fn)
  caches.add(run.cache)
  return run
}
