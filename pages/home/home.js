Page({
  data: {
    categories: [
      {
        id: 1,
        name: '境外游',
        en: 'EXPLORE WORLD',
        className: 'green'
      },
      {
        id: 2,
        name: '国内游',
        en: 'DISCOVER CHINA',
        className: 'purple'
      },
      {
        id: 3,
        name: '公司团建',
        en: 'TEAM BUILDING',
        className: 'purple'
      },
      {
        id: 4,
        name: '户外活动',
        en: 'OUTDOOR LIFE',
        className: 'green'
      }
    ],

    leftTrips: [],

    rightTrips: []
  },

  onLoad() {
    const trips = [
      {
        id: 1,
        tag: '境外游',
        title: '新加坡 × 马来西亚',
        desc: '双飞5天4晚 · 新航直飞',
        price: 3099,
        days: '5天4晚',
        image: '/assets/xinma-poster.jpg',
        imageHeight: 390
      },
      {
        id: 2,
        tag: '国内游',
        title: '西藏 · 拉萨',
        desc: '高原秘境',
        price: 6999,
        days: '6天5晚',
        image: '/assets/xinma-poster.jpg',
        imageHeight: 500
      },
      {
        id: 3,
        tag: '公司团建',
        title: '清迈雨林团建',
        desc: '飞跃丛林',
        price: 3999,
        days: '4天3晚',
        image: '/assets/xinma-poster.jpg',
        imageHeight: 430
      },
      {
        id: 4,
        tag: '户外活动',
        title: '川西雪山徒步',
        desc: '雪山露营',
        price: 4599,
        days: '5天4晚',
        image: '/assets/xinma-poster.jpg',
        imageHeight: 350
      },
      {
        id: 5,
        tag: '境外游',
        title: '日本 · 北海道',
        desc: '花海列车',
        price: 8999,
        days: '7天6晚',
        image: '/assets/xinma-poster.jpg',
        imageHeight: 480
      },
      {
        id: 6,
        tag: '国内游',
        title: '云南 · 香格里拉',
        desc: '藏地秘境',
        price: 3999,
        days: '5天4晚',
        image: '/assets/xinma-poster.jpg',
        imageHeight: 360
      }
    ]

    const leftTrips = []
    const rightTrips = []

    trips.forEach((item, index) => {
      if (index % 2 === 0) {
        leftTrips.push(item)
      } else {
        rightTrips.push(item)
      }
    })

    this.setData({
      leftTrips,
      rightTrips
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id

    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  goCategory(e) {
    const name = e.currentTarget.dataset.name

    wx.showToast({
      title: name,
      icon: 'none'
    })
  }
})