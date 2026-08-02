const {
  ensureLogin,
  imageUrl,
  uploadFile,
  USER_KEY,
  wechatLogin
} = require('../../utils/request')

function shouldUploadAvatar(avatar) {
  if (!avatar) return false
  if (avatar.startsWith('/uploads/')) return false
  if (avatar.startsWith('http://tmp/') || avatar.startsWith('wxfile://')) return true
  return !/^https?:\/\//.test(avatar)
}

Page({
  data: {
    avatar: '',
    nickname: '',
    saving: false
  },

  onLoad() {
    this.loadProfile()
  },

  async loadProfile() {
    try {
      const login = await ensureLogin()
      const user = login.user || wx.getStorageSync(USER_KEY) || {}
      this.setData({
        avatar: imageUrl(user.avatar),
        nickname: user.nickname === '微信用户' ? '' : (user.nickname || '')
      })
    } catch {
      wx.showToast({ title: '微信登录失败', icon: 'none' })
    }
  },

  onChooseAvatar(event) {
    const avatar = event.detail && event.detail.avatarUrl
    if (!avatar) return
    this.setData({ avatar })
  },

  onNicknameInput(event) {
    this.setData({ nickname: event.detail.value })
  },

  async submit() {
    const nickname = (this.data.nickname || '').trim()
    let avatar = this.data.avatar

    if (!avatar) {
      wx.showToast({ title: '请先授权头像', icon: 'none' })
      return
    }
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (this.data.saving) return

    this.setData({ saving: true })
    try {
      if (shouldUploadAvatar(avatar)) {
        const uploaded = await uploadFile(avatar)
        avatar = uploaded.url
      }

      await wechatLogin({ nickname, avatar })
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/mine/mine' })
      }, 500)
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  }
})
