const { dateTime } = require('../../../utils/format')
const {
  downloadFile,
  imageUrl,
  request,
  requireUserProfile
} = require('../../../utils/request')

function fileSize(size) {
  const value = Number(size) || 0
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)}KB`
  return `${(value / 1024 / 1024).toFixed(1)}MB`
}

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
          attachmentList: (activity.attachments || []).map((item) => ({
            ...item,
            url: imageUrl(item.url),
            sizeText: fileSize(item.size),
            iconText: String(item.fileType || '').toUpperCase()
          })),
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

  async openAttachment(event) {
    const { url, type } = event.currentTarget.dataset
    wx.showLoading({ title: '打开中' })
    try {
      const filePath = await downloadFile(url)
      await new Promise((resolve, reject) => {
        wx.openDocument({
          filePath,
          fileType: type,
          showMenu: true,
          success: resolve,
          fail: reject
        })
      })
    } catch (error) {
      wx.showToast({ title: '附件打开失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async goSignup() {
    try {
      await requireUserProfile()
    } catch (error) {
      if (error && error.code === 'PROFILE_REQUIRED') return
      wx.showToast({ title: error.message || '请先登录', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/signup/signup?activityId=${this.data.id}` })
  }
})
