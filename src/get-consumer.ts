import { SourceMapConsumer } from 'source-map'
import { fetchSourceMap } from './fetch-source-map.ts'
import { createDeferredCache } from './util.ts'

export const getConsumer = createDeferredCache(async url => {
  const sources = await fetchSourceMap(url)
  let consumer: SourceMapConsumer | undefined

  // NOTE: this is confusing. the return types .source property is not the source contents
  //  but it's the source filename. this can be confused with other properties where .source
  //  is the source contents.
  if (sources?.sourceMap?.sourcemap) {
    consumer = await new SourceMapConsumer(sources.sourceMap.sourcemap)
  } else if (sources?.source) {
    consumer = {
      originalPositionFor(pos: { line: number; column: number }) {
        return {
          source: url,
          name: url,
          line: pos.line,
          column: pos.column - 2,
        }
      },
      sourceContentFor() {
        return sources.source
      },
    } as unknown as SourceMapConsumer
  }

  return consumer
})
