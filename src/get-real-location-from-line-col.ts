import { exists } from 'everyday-node'
import path from 'path'
import { log } from './apply-sourcemaps'
import { getConsumer } from './get-consumer'

export const getRealLocationFromUrlLineCol = async (
  { originalUrl, url, line, column }: {
    originalUrl: string
    url: string
    line: number | string
    column: number | string
  },
  { root, href }: { root: string; href: string },
) => {
  line = +line
  column = +column

  if (column > 500) return

  const consumer = await getConsumer(url)

  if (!consumer) {
    return {
      originalUrl,
      url: href ? path.relative(root, url.replace('@fs', '').replace(href, '')) : url,
      line,
      column,
    }
  }

  const cleanUrl = url.replace('@fs', '').replace(href, '')
  log('clean url', cleanUrl)

  const orig = consumer.originalPositionFor({ line, column: column + 1 })

  log('originalPositionFor', url, orig)
  const origTarget = path.resolve(path.dirname(cleanUrl), orig.source ?? '')
  log('origTarget', origTarget)

  if (await exists(origTarget)) {
    return {
      originalUrl,
      url: path.relative(root, origTarget),
      line: orig.line ?? 1,
      column: (orig.column ?? 0) + 1,
    }
  }

  return { originalUrl, url, line, column }
}
