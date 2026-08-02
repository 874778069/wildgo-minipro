const {
  ensureLogin,
  hasUserProfile,
  imageUrl,
  request,
  USER_KEY
} = require('../../utils/request')

const DEFAULT_NICKNAME = 'WildGo 旅行者'

Page({
  data: {
    loggedIn: false,
    user: { nickname: DEFAULT_NICKNAME, avatar: '' },
    registrationCount: 0,
    orderCount: 0
  },

  onShow() {
    this.load()
  },

  async load() {
    try {
      const login = await ensureLogin()
      const user = login.user || wx.getStorageSync(USER_KEY) || {}
      const loggedIn = hasUserProfile(user)

      this.setData({
        loggedIn,
        user: {
          ...user,
          nickname: loggedIn ? user.nickname : DEFAULT_NICKNAME,
          avatar: loggedIn ? imageUrl(user.avatar) : ''
        }
      })

      if (!loggedIn) {
        this.setData({ registrationCount: 0, orderCount: 0 })
        return
      }

      const [registrations, orders] = await Promise.all([
        request({
          url: '/activity-registration/my?page=1&pageSize=1',
          auth: true,
          silent: true
        }),
        request({
          url: '/local-life/order/my?page=1&pageSize=1',
          auth: true,
          silent: true
        })
      ])

      this.setData({
        registrationCount: registrations.total || 0,
        orderCount: orders.total || 0
      })
    } catch {
      wx.showToast({ title: '登录信息加载失败', icon: 'none' })
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goRegistrations() {
    if (!this.data.loggedIn) {
      this.goLogin()
      return
    }
    wx.navigateTo({ url: '/pages/mine/registration/registration' })
  },

  goOrders() {
    if (!this.data.loggedIn) {
      this.goLogin()
      return
    }
    wx.navigateTo({ url: '/pages/mine/order/list' })
  },

  comingSoon() {
    wx.showToast({ title: '功能建设中', icon: 'none' })
  }
})
