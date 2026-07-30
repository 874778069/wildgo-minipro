const {
  ensureLogin,
  USER_KEY,
  TOKEN_KEY,
  imageUrl,
  request,
  wechatLogin
} = require('../../utils/request')

Page({
  data: {
    user: { nickname: 'WildGo 旅行者', avatar: '' },
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
        user: {
          ...user,
          nickname: user.nickname || 'WildGo 旅行者',
          avatar: imageUrl(user.avatar)
        },
        registrationCount: registrations.total || 0,
        orderCount: orders.total || 0
      })
    } catch {
      wx.showToast({ title: '登录信息加载失败', icon: 'none' })
    }
  },

  goRegistrations() {
    wx.navigateTo({ url: '/pages/mine/registration/registration' })
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/mine/order/list' })
  },

  syncProfile() {
    wx.getUserProfile({
      desc: '用于在 WildGo 展示您的头像和昵称',
      success: async ({ userInfo }) => {
        wx.removeStorageSync(TOKEN_KEY)
        await wechatLogin({
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl
        })
        this.load()
      }
    })
  },

  comingSoon() {
    wx.showToast({ title: '功能建设中', icon: 'none' })
  }
})
