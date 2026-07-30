Component({
  properties: {
    product: {
      type: Object,
      value: {}
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent('select', { id: this.data.product.id })
    }
  }
})
