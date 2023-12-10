import { codeFrameColumns } from '@babel/code-frame'
import { getConsumer } from './get-consumer.ts'

export const getCodeFrame = async (
  message: string,
  { url, line, column }: { originalUrl: string; url: string; line: number | string; column: number | string },
) => {
  line = +line
  column = +column
  if (column > 500) return

  const consumer = await getConsumer(url)
  if (!consumer) return

  const orig = consumer.originalPositionFor({ line, column: column + 1 })

  const input = consumer.sourceContentFor(orig.source!)!

  const result = codeFrameColumns(input, {
    start: {
      line: orig.line ?? 1,
      column: (orig.column ?? 0) + 1,
    },
  }, {
    message,
    forceColor: true,
    highlightCode: true,
  })

  return result.toString()
}
