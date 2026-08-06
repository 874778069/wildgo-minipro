const {
  getShopDetail,
  getShopProducts,
  normalizeShop,
  normalizeShopProduct,
  todayBusinessHours,
  unwrapList,
  weeklyBusinessHours
} = require('../../../api/local-life')

Page({
  data: {
    id: 0,
    shop: null,
    shopImages: [],
    hasShopImages: false,
    hasMultipleShopImages: false,
    products: [],
    weeklyHours: [],
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
      const weeklyHours = weeklyBusinessHours(shop)
      const products = unwrapList(productData).list
        .filter((item) => !item.status || item.status === 'ONLINE')
        .filter((item) => !item.product || !item.product.status || item.product.status === 'ONLINE')
        .map(normalizeShopProduct)
      const shopImages = shop.imageUrls || []
      console.log('shop detail images', shopImages)
      this.setData({
        shop,
        products,
        weeklyHours,
        shopImages,
        hasShopImages: shopImages.length > 0,
        hasMultipleShopImages: shopImages.length > 1
      })
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

  openLocation() {
    const shop = this.data.shop
    if (!shop || !shop.hasLocation) {
      wx.showToast({ title: '暂无门店定位', icon: 'none' })
      return
    }
    wx.openLocation({
      latitude: Number(shop.latitude),
      longitude: Number(shop.longitude),
      name: shop.name || '门店位置',
      address: shop.address || '',
      scale: 16
    })
  },

  previewImage(event) {
    const current = event.currentTarget.dataset.url
    const urls = this.data.shopImages || []
    console.log('preview shop image', current, urls)
    if (!current || !urls.length) return
    wx.previewImage({ current, urls })
  },

  goProduct(event) {
    const id = event.detail.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/local-life/shop-product/detail?id=${id}`
    })
  }
})
