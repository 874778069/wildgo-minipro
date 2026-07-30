const { imageUrl, request } = require('../../utils/request')

Page({
  data: {
    loading: true,
    banner: [],
    leftActivities: [],
    rightActivities: []
  },

  onLoad() {
    this.loadHome()
  },

  onPullDownRefresh() {
    this.loadHome().finally(() => wx.stopPullDownRefresh())
  },

  async loadHome() {
    try {
      const data = await request({ url: '/activity/home', silent: true })
      const activities = (data.recommendActivities || []).map((item, index) => ({
        ...item,
        coverUrl: imageUrl(item.cover || (item.images[0] && item.images[0].url)),
        imageHeight: index % 3 === 0 ? 390 : index % 3 === 1 ? 470 : 420
      }))
      this.setData({
        banner: (data.banner || []).map((item) => ({ ...item, image: imageUrl(item.image) })),
        leftActivities: activities.filter((_, index) => index % 2 === 0),
        rightActivities: activities.filter((_, index) => index % 2 === 1)
      })
    } catch {
      wx.showToast({ title: '首页加载失败，请下拉重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goActivityList() {
    wx.navigateTo({
      url: '/pages/activity/list/list',
      fail: (error) => {
        wx.showToast({
          title: error.errMsg || '活动列表打开失败',
          icon: 'none'
        })
      }
    })
  },

  goLocalLife() {
    wx.navigateTo({
      url: '/pages/local-life/shop/list',
      fail: (error) => {
        wx.showToast({
          title: error.errMsg || '门店列表打开失败',
          icon: 'none'
        })
      }
    })
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/activity/detail/detail?id=${event.currentTarget.dataset.id}` })
  }
})
