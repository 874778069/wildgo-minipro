const { imageUrl, request } = require('../../../utils/request')

Page({
  data: { list: [], page: 1, pageSize: 10, total: 0, loading: false, finished: false },

  onLoad() {
    this.load(true)
  },

  onShow() {
    if (!this.data.loading && !this.data.list.length) {
      this.load(true)
    }
  },

  onPullDownRefresh() {
    this.load(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    this.load(false)
  },

  async load(reset) {
    if (this.data.loading || (!reset && this.data.finished)) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const data = await request({ url: `/activity/list?page=${page}&pageSize=${this.data.pageSize}` })
      const incoming = (data.list || []).map((item) => ({
        ...item,
        coverUrl: imageUrl(item.cover || (item.images[0] && item.images[0].url))
      }))
      const list = reset ? incoming : this.data.list.concat(incoming)
      this.setData({
        list,
        total: data.total,
        page: page + 1,
        finished: list.length >= data.total
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/activity/detail/detail?id=${event.currentTarget.dataset.id}` })
  }
})
