const {
  createOrder,
  getShopProductDetail,
  getShopProductShops,
  normalizeShop,
  normalizeShopProductDetail,
  payOrder,
  todayBusinessHours
} = require('../../../api/local-life')
const { requireUserProfile } = require('../../../utils/request')

Page({
  data: {
    id: 0,
    detail: null,
    shops: [],
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
      const [data, shopData] = await Promise.all([
        getShopProductDetail(this.data.id),
        getShopProductShops(this.data.id)
      ])
      const detail = normalizeShopProductDetail(data)
      const currentShopProducts = (Array.isArray(shopData) ? shopData : [])
        .filter((item) => Number(item.id) === Number(detail.id))
      const shops = currentShopProducts.map((item) => {
        const shop = normalizeShop(item.shop || {})
        shop.shopProductId = item.id
        shop.priceText = item.price !== undefined ? String(item.price) : ''
        shop.businessHoursText = todayBusinessHours(shop)
        return shop
      })
      if (!shops.length && detail.shop && detail.shop.id) {
        const shop = normalizeShop(detail.shop)
        shop.shopProductId = detail.id
        shop.priceText = detail.price !== undefined ? String(detail.price) : ''
        shop.businessHoursText = todayBusinessHours(shop)
        shops.push(shop)
      }
      this.setData({ detail, shops })
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

  callShop(event) {
    const shopId = Number(event.currentTarget.dataset.id)
    const shop = (this.data.shops || []).find((item) => item.id === shopId)
    const phone = shop && shop.phone
    if (!phone) {
      wx.showToast({ title: '门店暂未填写电话', icon: 'none' })
      return
    }
    wx.makePhoneCall({ phoneNumber: phone })
  },

  goShop(event) {
    const id = Number(event.currentTarget.dataset.id)
    if (!id) return
    wx.navigateTo({
      url: `/pages/local-life/shop/detail?id=${id}`
    })
  },

  async buy() {
    if (this.data.buying || !this.data.detail) return
    try {
      await requireUserProfile()
      wx.showModal({
        title: '模拟微信支付',
        content: '当前为测试支付，不会发起微信扣款。确认代表支付成功，取消代表取消支付。',
        confirmText: '支付成功',
        cancelText: '取消支付',
        success: async (result) => {
          this.setData({ buying: true })
          try {
            const order = result.confirm
              ? await payOrder(this.data.detail.id)
              : await createOrder(this.data.detail.id)
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
    } catch (error) {
      if (error && error.code === 'PROFILE_REQUIRED') return
      wx.showToast({
        title: error.message || '创建订单失败',
        icon: 'none'
      })
    }
  }
})
