const { imageUrl, request } = require('../../../utils/request')

Page({
  data: {
    list: [],
    leftList: [],
    rightList: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    finished: false
  },

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
      const baseIndex = reset ? 0 : this.data.list.length
      const incoming = (data.list || []).map((item, index) => ({
        ...item,
        coverUrl: imageUrl(item.cover || (item.images[0] && item.images[0].url)),
        expired: item.endTime ? new Date(item.endTime).getTime() < Date.now() : false,
        imageHeight: (baseIndex + index) % 3 === 0
          ? 430
          : (baseIndex + index) % 3 === 1
            ? 520
            : 470
      }))
      const list = reset ? incoming : this.data.list.concat(incoming)
      this.setData({
        list,
        leftList: list.filter((_, index) => index % 2 === 0),
        rightList: list.filter((_, index) => index % 2 === 1),
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
