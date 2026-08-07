const { imageUrl, request } = require('../../utils/request')

Page({
  data: {
    loading: true,
    banner: [],
    leftItems: [],
    rightItems: []
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
      const sourceItems = data.recommendItems || (data.recommendActivities || []).map((item) => ({
        ...item,
        type: 'ACTIVITY',
        targetUrl: `/pages/activity/detail/detail?id=${item.id}`,
        cover: item.cover || (item.images[0] && item.images[0].url)
      }))
      const items = sourceItems.map((item, index) => ({
        ...item,
        coverUrl: imageUrl(item.cover),
        typeText: item.type === 'SHOP_PRODUCT' ? '套餐' : '活动',
        subtitle: item.type === 'SHOP_PRODUCT' ? item.shopName : (item.location || '地点待定'),
        priceText: Number(item.price).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'),
        imageHeight: index % 3 === 0 ? 390 : index % 3 === 1 ? 470 : 420
      }))
      this.setData({
        banner: (data.banner || []).map((item) => ({ ...item, image: imageUrl(item.image) })),
        leftItems: items.filter((_, index) => index % 2 === 0),
        rightItems: items.filter((_, index) => index % 2 === 1)
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

  goActivityDetail(event) {
    wx.navigateTo({ url: `/pages/activity/detail/detail?id=${event.currentTarget.dataset.id}` })
  },

  goRecommendDetail(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    wx.navigateTo({ url })
  }
})
