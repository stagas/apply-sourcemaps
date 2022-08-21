import { getConsumer } from './get-consumer'
import { createDeferredCache } from './util'

export interface RealLocation {
  originalUrl: string
  url: string
  line: number | string
  column: number | string
}

const hashLocation = (r: RealLocation) => `${r.originalUrl}${r.url}${r.line}${r.column}`

export const getIt = createDeferredCache(
  async (
    _: string,
    { originalUrl, url, line, column }: RealLocation,
  ): Promise<RealLocation | void> => {
    line = +line
    column = +column

    const consumer = await getConsumer(url)

    if (!consumer) return

    const orig = consumer.originalPositionFor({ line, column: column + 1 })

    return {
      originalUrl,
      url: orig.source || url,
      line: orig.line ?? 1,
      column: (orig.column ?? 0) + 1,
    }
  }
)

export const getRealLocationFromUrlLineCol = async (
  real: RealLocation,
) => {
  if (+real.column > 500) return

  const hash = hashLocation(real)

  return getIt(hash, real)
}

getRealLocationFromUrlLineCol.clear = () => getIt.cache.clear()
