const ENV = 'production'

const environments = {
  production: {
    baseUrl: 'https://api.fdzhuang.site'
  },
  // 测试环境域名确定后只需填写这里，并将 ENV 改为 test。
  test: {
    baseUrl: ''
  }
}

const current = environments[ENV]

module.exports = {
  ENV,
  baseUrl: current.baseUrl || environments.production.baseUrl
}
