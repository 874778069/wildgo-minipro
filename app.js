const { ensureLogin } = require('./utils/request')

App({
  globalData: { selectedActivity: null },
  onLaunch() {
    ensureLogin().catch(() => {
      // 首页活动为公开数据，微信登录失败时仍允许浏览。
    })
  }
})
