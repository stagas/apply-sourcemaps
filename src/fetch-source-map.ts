import { Task } from 'event-toolkit'
import * as fs from 'fs/promises'
import { log } from './apply-sourcemaps'
import { getSourceMap } from './get-source-map'

import type { RawSourceMap } from 'source-map'

export const sourceMaps = new Map<string, Promise<Sources | undefined>>()

export interface Sources {
  source: string
  sourceMap: {
    sourcemap: RawSourceMap | undefined
  }
}

export const fetchSourceMap = async (url: string): Promise<Sources | undefined> => {
  if (sourceMaps.has(url)) return sourceMaps.get(url)

  const task = Task()

  sourceMaps.set(url, task.promise)

  try {
    log('fetching url', url)
    let source!: string
    for (const cand of [url, url + '.map']) {
      try {
        log('trying url', cand)
        if (cand[0] === '/') {
          source = await fs.readFile(cand, 'utf-8')
        } else if (cand.startsWith('http://') || cand.startsWith('https://')) {
          const result = await fetch(cand)
          source = await result.text()
        }
        if (source) break
      } catch {}
    }

    if (!source) throw new Error('No source')

    log('got source', source.length)

    const sourcemap = await getSourceMap(url, source)

    task.resolve({
      source,
      sourceMap: { sourcemap },
    })
  } catch (error) {
    task.resolve()
  }

  return task.promise
}
