import Debug from 'debug'
import { getRealLocationFromUrlLineCol } from './get-real-location-from-line-col.ts'
import { parseUrls } from './parse-urls.ts'

export const log = Debug('apply-sourcemaps')

interface Result {
  originalUrl: string
  url: string
  line: number
  column: number
}

export const applySourceMaps = async (x: string, mapFn: (url: string) => string = x => x) => {
  log('searching in', x)

  const urls = parseUrls(x.toString()).filter(x => x.originalUrl.startsWith('http'))
  log('found urls', urls)

  const promises = urls.map(url => getRealLocationFromUrlLineCol(url))
  const results = await Promise.all(promises)

  for (const result of results.filter(Boolean) as Result[]) {
    log('result:', result)
    const { originalUrl, url, line, column } = result
    const dest = [mapFn(url), line, column].join(':')
    if (dest !== originalUrl) {
      x = x.replaceAll(originalUrl, dest)
    }
  }

  log('replaced', x)

  return x
}
