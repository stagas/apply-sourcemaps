/** @env node */
import * as path from 'path'
import { puppito } from 'puppito'
import { applySourceMaps, clearAllCaches } from '../src/index.ts'

const homedir = path.resolve(__dirname, '..')

const getContext = (inlineSourceMaps: boolean) => {
  const ctx: any = {
    logs: [],
  }

  beforeAll(async () => {
    const p = ctx.p = await puppito({
      homedir,
      file: path.join(__dirname, 'fixtures', 'a', 'index.ts'),
      quiet: true,
      silent: true,
      inlineSourceMaps,
      transformArgs: async (args, originUrl) => {
        ctx.logs.push([originUrl, args])
        return args
      },
      failedRequestFilter: x => {
        return !x.includes('/onreload') && !x.includes('.css')
      },
    })
    await p.page.goto(ctx.p.server.url)
  })

  afterAll(async () => {
    await ctx.p.close()
    clearAllCaches()
  })

  afterEach(() => {
    ctx.logs = []
  })

  ctx.run = async () => {
    await ctx.p.flush()

    const urls: string[] = []

    const out = await Promise.all(ctx.logs.map(
      async ([, args]: any) => {
        for (const [i, x] of args.entries()) {
          if (typeof x !== 'string') continue
          args[i] = await applySourceMaps(args[i], url => {
            urls.push(url)
            return url
          })
        }
        return args
      }
    ))

    return { urls, out }
  }
  return ctx
}

describe('applySourceMaps', () => {
  describe('http', () => {
    describe('external', () => {
      const ctx = getContext(false)

      it('should work', async () => {
        const { out, urls } = await ctx.run()
        expect(out).toMatchSnapshot()
        expect(urls).toMatchSnapshot()
      })
    })

    describe('inline', () => {
      const ctx = getContext(true)

      it('should work', async () => {
        const { out, urls } = await ctx.run()
        expect(out).toMatchSnapshot()
        expect(urls).toMatchSnapshot()
      })
    })
  })
})
