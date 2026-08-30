const {
  cancelOrder,
  getMyOrderDetail,
  mockPay,
  normalizeOrder,
  refundOrder
} = require('../../../api/local-life')
const { dateTime } = require('../../../utils/format')

Page({
  data: {
    id: 0,
    order: null,
    loading: true,
    paying: false,
    cancelling: false,
    refunding: false,
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
          paidText: data.paidAt ? dateTime(data.paidAt) : '-',
          usedText: data.usedAt ? dateTime(data.usedAt) : '-',
          cancelledText: data.cancelledAt ? dateTime(data.cancelledAt) : '-',
          refundedText: data.refundedAt ? dateTime(data.refundedAt) : '-'
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
              paidText: order.paidAt ? dateTime(order.paidAt) : '-',
              usedText: order.usedAt ? dateTime(order.usedAt) : '-',
              cancelledText: order.cancelledAt ? dateTime(order.cancelledAt) : '-',
              refundedText: order.refundedAt ? dateTime(order.refundedAt) : '-'
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

  cancel() {
    if (this.data.cancelling || !this.data.order) return
    wx.showModal({
      title: '取消订单',
      content: '确认取消这笔未支付订单吗？',
      confirmText: '确认取消',
      confirmColor: '#ff5a5f',
      success: async (result) => {
        if (!result.confirm) return
        this.setData({ cancelling: true })
        try {
          const order = await cancelOrder(this.data.order.id)
          this.setData({
            order: {
              ...normalizeOrder(order),
              createdText: dateTime(order.createdAt),
              paidText: order.paidAt ? dateTime(order.paidAt) : '-',
              usedText: order.usedAt ? dateTime(order.usedAt) : '-',
              cancelledText: order.cancelledAt ? dateTime(order.cancelledAt) : '-',
              refundedText: order.refundedAt ? dateTime(order.refundedAt) : '-'
            }
          })
          wx.showToast({ title: '已取消', icon: 'success' })
        } catch (error) {
          wx.showToast({
            title: error.message || '取消失败',
            icon: 'none'
          })
        } finally {
          this.setData({ cancelling: false })
        }
      }
    })
  },

  refund() {
    if (this.data.refunding || !this.data.order) return
    wx.showModal({
      title: '确认退款',
      content: '确认后订单将直接退款，核销码会立即失效。',
      confirmText: '确认退款',
      confirmColor: '#ff5a5f',
      success: async (result) => {
        if (!result.confirm) return
        this.setData({ refunding: true })
        try {
          const order = await refundOrder(this.data.order.id)
          this.setData({
            order: {
              ...normalizeOrder(order),
              createdText: dateTime(order.createdAt),
              paidText: order.paidAt ? dateTime(order.paidAt) : '-',
              usedText: order.usedAt ? dateTime(order.usedAt) : '-',
              cancelledText: order.cancelledAt ? dateTime(order.cancelledAt) : '-',
              refundedText: order.refundedAt ? dateTime(order.refundedAt) : '-'
            }
          })
          wx.showToast({ title: '退款成功', icon: 'success' })
        } catch (error) {
          wx.showToast({
            title: error.message || '退款失败',
            icon: 'none'
          })
        } finally {
          this.setData({ refunding: false })
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
