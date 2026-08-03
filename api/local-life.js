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

function getShopProductShop(id) {
  return request({
    url: `/local-life/shop-product/detail/${id}/shop`,
    silent: true
  })
}

function getShopProductShops(id) {
  return request({
    url: `/local-life/shop-product/detail/${id}/shops`,
    silent: true
  })
}

function createOrder(shopProductId) {
  return request({
    url: '/local-life/order/create',
    method: 'POST',
    data: { shopProductId },
    auth: true
  })
}

function mockPay(orderNo) {
  return request({
    url: '/local-life/order/mock-pay',
    method: 'POST',
    data: { orderNo },
    auth: true
  })
}

function getMyOrders(params) {
  return request({
    url: `/local-life/order/my${buildQuery(params)}`,
    auth: true,
    silent: true
  })
}

function getMyOrderDetail(id) {
  return request({
    url: `/local-life/order/detail/${id}`,
    auth: true,
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

function imageUrls(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map(imageUrl).filter(Boolean)
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map(imageUrl).filter(Boolean)
    }
    if (typeof parsed === 'string' && parsed !== value) {
      return imageUrls(parsed)
    }
  } catch (error) {
    return [imageUrl(value)].filter(Boolean)
  }
  return [imageUrl(value)].filter(Boolean)
}

function normalizeShop(item) {
  const status = item.businessStatus || item.status
  const shopImages = imageUrls(item.cover)
  return {
    ...item,
    coverUrl: shopImages[0] || '',
    imageUrls: shopImages,
    hasImages: shopImages.length > 0,
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

const orderStatusNames = {
  WAIT_PAY: '待支付',
  PAID: '待核销',
  USED: '已核销',
  CANCELLED: '已取消',
  REFUND: '已退款'
}

function normalizeOrder(item) {
  const verification = (item && item.verification) || null
  return {
    ...(item || {}),
    productCoverUrl: imageUrl(item && item.productCoverSnapshot),
    unitPriceText: money(item && item.unitPriceSnapshot),
    originalAmountText: money(item && item.originalAmount),
    discountAmountText: money(item && item.discountAmount),
    amountText: money(item && item.amount),
    statusText: orderStatusNames[item && item.status] || '',
    verification,
    verificationCode: verification && verification.code
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

function weeklyBusinessHours(shop) {
  const dayMap = [
    ['MONDAY', '周一'],
    ['TUESDAY', '周二'],
    ['WEDNESDAY', '周三'],
    ['THURSDAY', '周四'],
    ['FRIDAY', '周五'],
    ['SATURDAY', '周六'],
    ['SUNDAY', '周日']
  ]
  const weekly = shop && shop.businessHours && shop.businessHours.weekly
  if (!weekly) return []
  return dayMap.map(([key, label]) => {
    const periods = weekly[key] || []
    return {
      key,
      label,
      text: periods.length ? periods.map((period) => `${period.start}-${period.end}`).join('、') : '休息'
    }
  })
}

module.exports = {
  categoryNames,
  statusNames,
  getShopList,
  getShopDetail,
  getShopProducts,
  getShopProductDetail,
  getShopProductShop,
  getShopProductShops,
  createOrder,
  mockPay,
  getMyOrders,
  getMyOrderDetail,
  unwrapList,
  normalizeShop,
  normalizeShopProduct,
  normalizeShopProductDetail,
  normalizeOrder,
  orderStatusNames,
  todayBusinessHours,
  weeklyBusinessHours
}
