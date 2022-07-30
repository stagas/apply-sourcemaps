import Debug from 'debug'
import { getRealLocationFromUrlLineCol } from './get-real-location-from-line-col'
import { parseUrls } from './parse-urls'

export const log = Debug('apply-sourcemaps')

interface Result {
  originalUrl: string
  url: string
  line: number
  column: number
}

export const applySourceMaps = async (x: string, root = process.cwd(), href: string) => {
  log('searching in', x)

  const urls = parseUrls(x.toString()).filter(x => x.originalUrl.startsWith('http'))
  log('found urls', urls)

  const promises = urls.map(url => getRealLocationFromUrlLineCol(url, { root, href }))
  const results = await Promise.all(promises)

  for (const result of results.filter(Boolean) as Result[]) {
    log('result:', result)
    const { originalUrl, url, line, column } = result
    const dest = [url, line, column].join(':')
    if (dest !== originalUrl) {
      x = x.replaceAll(originalUrl, dest)
    }
  }

  log('replaced', x)

  return x
}
