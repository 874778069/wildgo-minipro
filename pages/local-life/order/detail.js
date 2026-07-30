const {
  getMyOrderDetail,
  mockPay,
  normalizeOrder
} = require('../../../api/local-life')
const { dateTime } = require('../../../utils/format')

Page({
  data: {
    id: 0,
    order: null,
    loading: true,
    paying: false,
    error: false
  },

  onLoad(options) {
    const id = Number(options.id)
    if (!id) {
      this.setData({ loading: false, error: true })
      return
    }
    this.setData({ id })
  },

  onShow() {
    if (this.data.id) this.load()
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh())
  },

  async load() {
    this.setData({ loading: true, error: false })
    try {
      const data = await getMyOrderDetail(this.data.id)
      this.setData({
        order: {
          ...normalizeOrder(data),
          createdText: dateTime(data.createdAt),
          paidText: data.paidAt ? dateTime(data.paidAt) : ''
        }
      })
    } catch (error) {
      this.setData({ error: true })
    } finally {
      this.setData({ loading: false })
    }
  },

  retry() {
    this.load()
  },

  pay() {
    if (this.data.paying || !this.data.order) return
    wx.showModal({
      title: '模拟支付',
      content: '当前为测试支付，不会发起微信扣款。确认模拟支付成功？',
      confirmText: '确认支付',
      success: async (result) => {
        if (!result.confirm) return
        this.setData({ paying: true })
        try {
          const order = await mockPay(this.data.order.orderNo)
          this.setData({
            order: {
              ...normalizeOrder(order),
              createdText: dateTime(order.createdAt),
              paidText: order.paidAt ? dateTime(order.paidAt) : ''
            }
          })
          wx.showToast({ title: '模拟支付成功', icon: 'success' })
        } catch (error) {
          wx.showToast({
            title: error.message || '模拟支付失败',
            icon: 'none'
          })
        } finally {
          this.setData({ paying: false })
        }
      }
    })
  },

  copyCode() {
    const code = this.data.order && this.data.order.verificationCode
    if (!code) return
    wx.setClipboardData({ data: code })
  }
})
