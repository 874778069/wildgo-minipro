const ENV = 'development'

const environments = {
  development: {
    baseUrl: 'http://106.55.255.101:3000'
  },
  production: {
    baseUrl: 'https://api.fdzhuang.site'
  },
  // 如需单独联调测试环境，改这里并把 ENV 切到 test。
  test: {
    baseUrl: ''
  }
}

const current = environments[ENV]

module.exports = {
  ENV,
  baseUrl: current.baseUrl || environments.production.baseUrl
}
