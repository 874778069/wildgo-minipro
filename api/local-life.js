const { imageUrl, request } = require('../utils/request')

const categoryNames = {
  SHRIMP_FISHING: '钓虾',
  BARBECUE: '烧烤',
  TEAM_BUILDING: '团建',
  CAMPING: '露营',
  OTHER: '其他'
}

const statusNames = {
  ONLINE: '营业中',
  SUSPENDED: '暂停营业'
}

function buildQuery(params) {
  const query = Object.keys(params || {})
    .filter((key) => params[key] !== undefined && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
  return query ? `?${query}` : ''
}

function getShopList(params) {
  return request({
    url: `/local-life/shop/list${buildQuery(params)}`,
    silent: true
  })
}

function getShopDetail(id) {
  return request({
    url: `/local-life/shop/detail/${id}`,
    silent: true
  })
}

function getShopProducts(shopId, params) {
  return request({
    url: `/local-life/shop/${shopId}/products${buildQuery(params)}`,
    silent: true
  })
}

function getShopProductDetail(id) {
  return request({
    url: `/local-life/shop-product/detail/${id}`,
    silent: true
  })
}

function unwrapList(data) {
  if (Array.isArray(data)) {
    return { list: data, total: data.length }
  }
  return {
    list: (data && data.list) || [],
    total: (data && typeof data.total === 'number') ? data.total : ((data && data.list) || []).length
  }
}

function money(value) {
  if (value === null || value === undefined || value === '') return ''
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return number.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function normalizeShop(item) {
  const status = item.businessStatus || item.status
  return {
    ...item,
    coverUrl: imageUrl(item.cover),
    businessStatus: status,
    businessStatusText: item.businessStatusText || statusNames[status] || '',
    isSuspended: status === 'SUSPENDED'
  }
}

function normalizeShopProduct(item) {
  const product = item.product || {}
  return {
    ...item,
    id: item.id,
    productId: item.productId || product.id,
    name: item.name || product.name || '',
    coverUrl: imageUrl(item.cover || product.cover),
    categoryCode: item.categoryCode || product.categoryCode || 'OTHER',
    categoryName: item.categoryName || categoryNames[item.categoryCode || product.categoryCode] || '其他',
    description: item.description || product.description || '',
    priceText: money(item.price),
    originalPriceText: money(item.originalPrice),
    hasOriginalPrice: item.originalPrice !== null && item.originalPrice !== undefined && item.originalPrice !== ''
  }
}

function normalizeShopProductDetail(data) {
  const item = normalizeShopProduct(data || {})
  return {
    ...item,
    shop: normalizeShop((data && data.shop) || {}),
    product: (data && data.product) || {}
  }
}

function todayBusinessHours(shop) {
  if (!shop) return '营业时间未配置'
  if (shop.todayBusinessHours) return shop.todayBusinessHours
  if (shop.businessHoursText) return shop.businessHoursText
  if (typeof shop.businessHours === 'string') return shop.businessHours

  const dayKeys = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const weekly = shop.businessHours && shop.businessHours.weekly
  if (!weekly) return '营业时间未配置'
  const periods = weekly[dayKeys[new Date().getDay()]] || []
  if (!periods.length) return '今日休息'
  return `今日 ${periods.map((period) => `${period.start}-${period.end}`).join('、')}`
}

module.exports = {
  categoryNames,
  statusNames,
  getShopList,
  getShopDetail,
  getShopProducts,
  getShopProductDetail,
  unwrapList,
  normalizeShop,
  normalizeShopProduct,
  normalizeShopProductDetail,
  todayBusinessHours
}
