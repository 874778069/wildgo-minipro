const { getMyOrders, normalizeOrder } = require('../../../api/local-life')
const { dateTime } = require('../../../utils/format')

Page({
  data: {
    list: [],
    loading: true,
    error: false
  },

  onShow() {
    this.load()
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh())
  },

  async load() {
    this.setData({ loading: true, error: false })
    try {
      const data = await getMyOrders({ page: 1, pageSize: 100 })
      this.setData({
        list: (data.list || []).map((item) => ({
          ...normalizeOrder(item),
          createdText: dateTime(item.createdAt),
          usedText: item.usedAt ? dateTime(item.usedAt) : ''
        }))
      })
    } catch (error) {
      this.setData({ error: true })
    } finally {
      this.setData({ loading: false })
    }
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/local-life/order/detail?id=${event.currentTarget.dataset.id}`
    })
  }
})
