const { dateTime } = require('../../../utils/format')
const { imageUrl, request } = require('../../../utils/request')

Page({
  data: { id: 0, activity: null, loading: true },

  onLoad(options) {
    const id = Number(options.id)
    this.setData({ id })
    this.load()
  },

  async load() {
    try {
      const activity = await request({ url: `/activity/detail/${this.data.id}` })
      this.setData({
        activity: {
          ...activity,
          coverUrl: imageUrl(activity.cover || (activity.images[0] && activity.images[0].url)),
          imageList: (activity.images || []).map((item) => ({ ...item, url: imageUrl(item.url) })),
          startText: dateTime(activity.startTime),
          endText: dateTime(activity.endTime)
        }
      })
      wx.setNavigationBarTitle({ title: activity.title })
    } finally {
      this.setData({ loading: false })
    }
  },

  previewImage(event) {
    const urls = this.data.activity.imageList.map((item) => item.url)
    wx.previewImage({ current: event.currentTarget.dataset.url, urls })
  },

  goSignup() {
    wx.navigateTo({ url: `/pages/signup/signup?activityId=${this.data.id}` })
  }
})
