const {
  getShopList,
  normalizeShop,
  unwrapList
} = require('../../../api/local-life')

Page({
  data: {
    shops: [],
    loading: true,
    loadingMore: false,
    error: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    skeletonItems: [1, 2, 3]
  },

  onLoad() {
    this.loadShops(true)
  },

  onPullDownRefresh() {
    this.loadShops(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading && !this.data.loadingMore) {
      this.loadShops(false)
    }
  },

  async loadShops(reset) {
    const page = reset ? 1 : this.data.page
    this.setData(reset
      ? { loading: true, error: false, page: 1, hasMore: true }
      : { loadingMore: true })

    try {
      const data = await getShopList({
        page,
        pageSize: this.data.pageSize
      })
      const result = unwrapList(data)
      const current = reset ? [] : this.data.shops
      const incoming = result.list
        .map(normalizeShop)
        .filter((shop) => shop.businessStatus === 'ONLINE' || shop.businessStatus === 'SUSPENDED')
      const shops = current.concat(incoming)
      this.setData({
        shops,
        page: page + 1,
        hasMore: result.list.length >= this.data.pageSize && page * this.data.pageSize < result.total,
        error: false
      })
    } catch (error) {
      this.setData({ error: true })
    } finally {
      this.setData({ loading: false, loadingMore: false })
    }
  },

  retry() {
    this.loadShops(true)
  },

  goDetail(event) {
    const id = event.detail.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/local-life/shop/detail?id=${id}`
    })
  }
})
