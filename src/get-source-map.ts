import type { RawSourceMap } from 'source-map'
import { log } from './apply-sourcemaps'
import { fetch } from './fetch-source-map'

const INLINE_SOURCEMAP_REGEX = /^data:application\/json[^,]+base64,/
const SOURCEMAP_REGEX =
  /(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^*]+?)[ \t]*(?:\*\/)[ \t]*$)/

export const getSourceMap = async (url: string, content: string) => {
  const lines = content.split('\n')

  let sourceMapUrl: string | undefined

  for (let i = lines.length - 1; i >= 0 && !sourceMapUrl; i--) {
    const result = lines[i].match(SOURCEMAP_REGEX)
    if (result) {
      sourceMapUrl = result[1]
    }
  }

  if (!sourceMapUrl) {
    return
  }

  if (!INLINE_SOURCEMAP_REGEX.test(sourceMapUrl) && !sourceMapUrl.startsWith('/')) {
    // Resolve path if it's a relative access
    const parsedURL = url.split('/')
    parsedURL[parsedURL.length - 1] = sourceMapUrl
    sourceMapUrl = parsedURL.join('/')
  }

  log('decoding sourcemap for', url)

  let rawSourceMap: RawSourceMap

  // TODO: real fetch would handle data: urls but we use our own impl. here until that's ready
  if (sourceMapUrl.startsWith('data:')) {
    const destUrl = new URL(sourceMapUrl)
    rawSourceMap = sourceMapFromDataUrl(destUrl.pathname)
  } else {
    const destUrl = new URL(sourceMapUrl, url)
    const res = await fetch(destUrl.href)
    rawSourceMap = await res.json()
  }

  return rawSourceMap
}

// ripped from: https://github.com/bcoe/c8/blob/d77f5edae952d600d4f784379256cf4983f1e861/lib/source-map-from-file.js#L81
function sourceMapFromDataUrl(url: string) {
  const { 0: format, 1: data } = url.split(',')
  const splitFormat = format.split(';')
  const contentType = splitFormat[0]
  const base64 = splitFormat[splitFormat.length - 1] === 'base64'
  if (contentType === 'application/json') {
    const decodedData = base64 ? Buffer.from(data, 'base64').toString('utf8') : data
    try {
      return JSON.parse(decodedData)
    } catch (err) {
      log(err)
      return null
    }
  } else {
    log(`unexpected content-type ${contentType}`)
    return null
  }
}
