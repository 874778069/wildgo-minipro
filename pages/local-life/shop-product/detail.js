const {
  createOrder,
  getShopProductDetail,
  normalizeShopProductDetail
} = require('../../../api/local-life')

Page({
  data: {
    id: 0,
    detail: null,
    loading: true,
    error: false,
    buying: false
  },

  onLoad(options) {
    const id = Number(options.id)
    if (!id) {
      this.setData({ loading: false, error: true })
      return
    }
    this.setData({ id })
    this.loadDetail()
  },

  onPullDownRefresh() {
    this.loadDetail().finally(() => wx.stopPullDownRefresh())
  },

  async loadDetail() {
    this.setData({ loading: true, error: false })
    try {
      const data = await getShopProductDetail(this.data.id)
      const detail = normalizeShopProductDetail(data)
      this.setData({ detail })
      wx.setNavigationBarTitle({ title: detail.name || '套餐详情' })
    } catch (error) {
      this.setData({ error: true })
    } finally {
      this.setData({ loading: false })
    }
  },

  retry() {
    this.loadDetail()
  },

  callShop() {
    const phone = this.data.detail && this.data.detail.shop && this.data.detail.shop.phone
    if (!phone) {
      wx.showToast({ title: '门店暂未填写电话', icon: 'none' })
      return
    }
    wx.makePhoneCall({ phoneNumber: phone })
  },

  async buy() {
    if (this.data.buying || !this.data.detail) return
    this.setData({ buying: true })
    try {
      const order = await createOrder(this.data.detail.id)
      wx.navigateTo({
        url: `/pages/local-life/order/detail?id=${order.id}`
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '创建订单失败',
        icon: 'none'
      })
    } finally {
      this.setData({ buying: false })
    }
  }
})
