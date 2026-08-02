const { baseUrl } = require('../config/env')

const TOKEN_KEY = 'wildgo_token'
const USER_KEY = 'wildgo_user'
let loginTask = null

function showError(message) {
  wx.showToast({ title: message || '网络开小差了', icon: 'none' })
}

function parseResponse(response) {
  const body = response.data || {}
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw {
      statusCode: response.statusCode,
      code: body.code || response.statusCode,
      message: body.msg || '请求失败'
    }
  }
  if (typeof body.code !== 'number' || !Object.prototype.hasOwnProperty.call(body, 'data')) {
    throw {
      statusCode: response.statusCode,
      message: '服务响应格式异常'
    }
  }
  if (body.code !== 0) {
    throw {
      statusCode: response.statusCode,
      code: body.code,
      message: body.msg || '请求失败'
    }
  }
  return body.data
}

function rawRequest(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      url: `${baseUrl}${options.url}`,
      success(response) {
        try {
          resolve(parseResponse(response))
        } catch (error) {
          reject(error)
        }
      },
      fail(error) {
        reject({
          statusCode: 0,
          message: error.errMsg || '网络请求失败'
        })
      }
    })
  })
}

function imageUrl(url) {
  if (!url || /^https?:\/\//.test(url)) return url
  return `${baseUrl}${url}`
}

function normalizeUser(user) {
  return user
    ? {
        ...user,
        avatar: imageUrl(user.avatar)
      }
    : user
}

function wechatLogin(profile) {
  if (loginTask) return loginTask
  loginTask = new Promise((resolve, reject) => {
    wx.login({
      success(result) {
        if (!result.code) {
          reject(new Error('微信登录失败'))
          return
        }
        rawRequest({
          url: '/auth/wechat-login',
          method: 'POST',
          data: { code: result.code, ...(profile || {}) }
        })
          .then((data) => {
            const user = normalizeUser(data.user)
            wx.setStorageSync(TOKEN_KEY, data.token)
            wx.setStorageSync(USER_KEY, user)
            resolve({ ...data, user })
          })
          .catch(reject)
      },
      fail(error) {
        reject({
          statusCode: 0,
          message: error.errMsg || '图片上传失败'
        })
      }
    })
  }).finally(() => {
    loginTask = null
  })
  return loginTask
}

function ensureLogin() {
  const token = wx.getStorageSync(TOKEN_KEY)
  const user = normalizeUser(wx.getStorageSync(USER_KEY))
  if (user) {
    wx.setStorageSync(USER_KEY, user)
  }
  return token
    ? Promise.resolve({ token, user })
    : wechatLogin()
}

function hasUserProfile(user) {
  const nickname = ((user && user.nickname) || '').trim()
  const avatar = ((user && user.avatar) || '').trim()
  return !!nickname && nickname !== '微信用户' && !!avatar
}

function showProfileRequiredModal() {
  wx.showToast({ title: '请先登录', icon: 'none' })
  wx.navigateTo({ url: '/pages/login/login' })
}

async function requireUserProfile() {
  const login = await ensureLogin()
  const user = login.user || wx.getStorageSync(USER_KEY) || {}

  if (hasUserProfile(user)) {
    return login
  }

  showProfileRequiredModal()
  throw {
    code: 'PROFILE_REQUIRED',
    message: '请先登录'
  }
}

async function request(options, retried) {
  const token = options.auth ? (await ensureLogin()).token : wx.getStorageSync(TOKEN_KEY)
  try {
    return await rawRequest({
      method: 'GET',
      ...options,
      header: {
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header
      }
    })
  } catch (error) {
    if (options.auth && error.statusCode === 401 && !retried) {
      wx.removeStorageSync(TOKEN_KEY)
      await wechatLogin()
      return request(options, true)
    }
    if (!options.silent) showError(error.message)
    throw error
  }
}

function uploadFile(filePath, formData = {}) {
  return ensureLogin().then(({ token }) => new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${baseUrl}/upload/user/image`,
      filePath,
      name: 'file',
      formData,
      header: { Authorization: `Bearer ${token}` },
      success(response) {
        try {
          response.data = JSON.parse(response.data || '{}')
          resolve(parseResponse(response))
        } catch (error) {
          reject(error)
        }
      },
      fail: reject
    })
  }))
}

function downloadFile(url) {
  const target = /^https?:\/\//.test(url) ? url : `${baseUrl}${url}`
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: target,
      success(response) {
        if (response.statusCode === 200) resolve(response.tempFilePath)
        else reject(response)
      },
      fail: reject
    })
  })
}

module.exports = {
  TOKEN_KEY,
  USER_KEY,
  request,
  ensureLogin,
  requireUserProfile,
  hasUserProfile,
  wechatLogin,
  uploadFile,
  downloadFile,
  imageUrl
}
