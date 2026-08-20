const { getMyOrders, normalizeOrder } = require('../../../api/local-life')
const { dateTime } = require('../../../utils/format')

Page({
  data: {
    tabs: [
      { label: '全部', value: '' },
      { label: '待支付', value: 'WAIT_PAY' },
      { label: '待核销', value: 'PAID' },
      { label: '已核销', value: 'USED' },
      { label: '已取消', value: 'CANCELLED' },
      { label: '已退款', value: 'REFUND' }
    ],
    activeStatus: '',
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
      const params = { page: 1, pageSize: 100 }
      if (this.data.activeStatus) {
        params.status = this.data.activeStatus
      }
      const data = await getMyOrders(params)
      this.setData({
        list: (data.list || [])
          .map((item) => ({
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

  switchTab(event) {
    const status = event.currentTarget.dataset.status || ''
    if (status === this.data.activeStatus) return
    this.setData({ activeStatus: status, list: [] })
    this.load()
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/local-life/order/detail?id=${event.currentTarget.dataset.id}`
    })
  }
})
