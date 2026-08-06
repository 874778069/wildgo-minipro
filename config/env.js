const ENV = 'development'

const environments = {
  development: {
    baseUrl: 'https://api.fdzhuang.site',
    imageBaseUrl: 'https://www.fdzhuang.site'
  },
  production: {
    baseUrl: 'https://www.fdzhuang.site',
    imageBaseUrl: 'https://www.fdzhuang.site'
  },
  // 如需单独联调测试环境，改这里并把 ENV 切到 test。
  test: {
    baseUrl: ''
  }
}

const current = environments[ENV]

module.exports = {
  ENV,
  baseUrl: current.baseUrl || environments.production.baseUrl,
  imageBaseUrl: current.imageBaseUrl || current.baseUrl || environments.production.baseUrl
}
