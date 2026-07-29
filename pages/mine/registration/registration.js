const { dateTime, statusMap } = require('../../../utils/format')
const { imageUrl, request } = require('../../../utils/request')

Page({
  data: { list: [], loading: true },

  onShow() {
    this.load()
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh())
  },

  async load() {
    this.setData({ loading: true })
    try {
      const data = await request({
        url: '/activity-registration/my?page=1&pageSize=100',
        auth: true
      })
      this.setData({
        list: (data.list || []).map((item) => ({
          ...item,
          createdText: dateTime(item.createdAt),
          statusText: statusMap[item.status] || item.status,
          coverUrl: imageUrl(item.activity.cover)
        }))
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/activity/detail/detail?id=${event.currentTarget.dataset.id}` })
  },

  cancel(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({
      title: '取消报名',
      content: '确认取消这条活动报名吗？',
      success: async (result) => {
        if (!result.confirm) return
        await request({
          url: `/activity-registration/cancel/${id}`,
          method: 'POST',
          auth: true
        })
        wx.showToast({ title: '已取消', icon: 'success' })
        this.load()
      }
    })
  }
})
