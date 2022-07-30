import { SourceMapConsumer } from 'source-map'
import { fetchSourceMap } from './fetch-source-map'

const consumers = new Map<string, SourceMapConsumer | undefined>()

export const getConsumer = async (url: string) => {
  if (consumers.has(url)) return consumers.get(url)

  const sources = await fetchSourceMap(url)

  let consumer: SourceMapConsumer | undefined

  if (sources?.sourceMap?.sourcemap) {
    consumer = await new SourceMapConsumer(sources.sourceMap.sourcemap)
  } else if (sources?.source) {
    consumer = {
      originalPositionFor(pos: { line: number; column: number }) {
        return {
          source: sources.source,
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

  consumers.set(url, consumer)

  return consumer
}
