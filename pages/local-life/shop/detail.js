const {
  getShopDetail,
  getShopProducts,
  normalizeShop,
  normalizeShopProduct,
  todayBusinessHours,
  unwrapList
} = require('../../../api/local-life')

Page({
  data: {
    id: 0,
    shop: null,
    products: [],
    loading: true,
    error: false
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
      const [shopData, productData] = await Promise.all([
        getShopDetail(this.data.id),
        getShopProducts(this.data.id, { page: 1, pageSize: 100 })
      ])
      const shop = normalizeShop(shopData)
      if (shop.businessStatus !== 'ONLINE' && shop.businessStatus !== 'SUSPENDED') {
        throw new Error('门店暂不可用')
      }
      shop.businessHoursText = todayBusinessHours(shop)
      const products = unwrapList(productData).list
        .filter((item) => !item.status || item.status === 'ONLINE')
        .filter((item) => !item.product || !item.product.status || item.product.status === 'ONLINE')
        .map(normalizeShopProduct)
      this.setData({ shop, products })
      wx.setNavigationBarTitle({ title: shop.name || '门店详情' })
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
    const phone = this.data.shop && this.data.shop.phone
    if (!phone) {
      wx.showToast({ title: '门店暂未填写电话', icon: 'none' })
      return
    }
    wx.makePhoneCall({ phoneNumber: phone })
  },

  goProduct(event) {
    const id = event.detail.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/local-life/shop-product/detail?id=${id}`
    })
  }
})
