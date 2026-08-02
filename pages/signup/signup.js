const { ensureLogin, request, requireUserProfile } = require('../../utils/request')

Page({
  data: { activityId: 0, activity: {}, submitting: false },

  onLoad(options) {
    this.setData({ activityId: Number(options.activityId) })
    ensureLogin().catch(() => wx.showToast({ title: '登录失败，请稍后重试', icon: 'none' }))
    request({ url: `/activity/detail/${options.activityId}` })
      .then((activity) => this.setData({ activity }))
  },

  async submitForm(event) {
    const values = event.detail.value
    if (!values.name || !values.name.trim()) {
      wx.showToast({ title: '请填写姓名', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(values.phone || '')) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    try {
      await requireUserProfile()
      await request({
        url: '/activity-registration/create',
        method: 'POST',
        auth: true,
        data: {
          activityId: this.data.activityId,
          name: values.name.trim(),
          phone: values.phone,
          wechat: values.wechat && values.wechat.trim(),
          remark: values.remark && values.remark.trim()
        }
      })
      wx.showModal({
        title: '报名成功',
        content: '可在“我的报名”中查看状态',
        showCancel: false,
        success: () => wx.redirectTo({ url: '/pages/mine/registration/registration' })
      })
    } catch (error) {
      if (error && error.code !== 'PROFILE_REQUIRED') {
        wx.showToast({
          title: error.message || '提交报名失败',
          icon: 'none'
        })
      }
    } finally {
      this.setData({ submitting: false })
    }
  }
})
