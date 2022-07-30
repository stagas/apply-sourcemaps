const parseUrlsRegExp = /\(?(?<url>[^\s]+:\d+:\d+)/gm
const brokenHttp = /http:\/(?=[\d\w])/gm
const brokenHttps = /https:\/(?=[\d\w])/gm

export const parseUrls = (x: string) =>
  [...x.matchAll(parseUrlsRegExp)]
    .map(x => x.groups?.url)
    .filter(Boolean)
    .map(x => [x!, x!.split(':').slice(0, -2).join(':'), ...x!.split(':').slice(-2)])
    .map(([originalUrl, url, line, column]) => ({
      originalUrl,
      url: url.replace(brokenHttp, 'http://').replace(brokenHttps, 'https://'),
      line,
      column,
    }))
