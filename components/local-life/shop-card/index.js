Component({
  properties: {
    shop: {
      type: Object,
      value: {}
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent('select', { id: this.data.shop.id })
    }
  }
})
