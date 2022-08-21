import { context } from 'fetch-h2'
import * as fs from 'fs/promises'

import { log } from './apply-sourcemaps'
import { getSourceMap } from './get-source-map'
import { createDeferredCache } from './util'

import type { RawSourceMap } from 'source-map'

export interface Sources {
  source: string
  sourceMap: {
    sourcemap: RawSourceMap | undefined
  }
}

const { fetch } = context({
  session: { rejectUnauthorized: false },
})

export { fetch }

export const fetchSourceMap = createDeferredCache(async (url: string): Promise<Sources | undefined> => {
  try {
    log('fetching url', url)
    let source!: string
    for (const cand of [url, url + '.map']) {
      try {
        log('trying url', cand)
        if (cand[0] === '/') {
          source = await fs.readFile(cand, 'utf-8')
        } else if (cand.startsWith('http://') || cand.startsWith('https://')) {
          log('fetching', cand)
          const result = await fetch(cand)
          source = await result.text()
        }
        if (source) break
      } catch (error) {
        log('fetch sourcemap error', error)
      }
    }

    if (!source) throw new Error('No source')

    log('got source', url, source.length)

    const sourcemap = await getSourceMap(url, source)

    log('sourcemap for', url, sourcemap)

    return {
      source,
      sourceMap: { sourcemap },
    }
  } catch (error) {
    log('fetch sourcemap error', error)
    return void 0
  }
})
