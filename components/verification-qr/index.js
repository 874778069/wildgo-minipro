const { createQrMatrix } = require('../../utils/qr-code')

Component({
  properties: {
    value: {
      type: String,
      value: '',
      observer() {
        this.draw()
      }
    }
  },

  lifetimes: {
    ready() {
      this.componentReady = true
      this.draw()
    }
  },

  methods: {
    draw() {
      if (!this.componentReady || !this.data.value) return
      this.createSelectorQuery()
        .select('#verificationQr')
        .fields({ node: true, size: true })
        .exec((results) => {
          const result = results && results[0]
          if (!result || !result.node) return
          const canvas = result.node
          const context = canvas.getContext('2d')
          const pixelRatio = wx.getWindowInfo().pixelRatio || 1
          canvas.width = result.width * pixelRatio
          canvas.height = result.height * pixelRatio
          context.scale(pixelRatio, pixelRatio)
          context.fillStyle = '#ffffff'
          context.fillRect(0, 0, result.width, result.height)

          const matrix = createQrMatrix(this.data.value)
          const quietZone = 4
          const cells = matrix.length + quietZone * 2
          const moduleSize = Math.floor(
            Math.min(result.width, result.height) / cells
          )
          const qrSize = moduleSize * cells
          const offsetX = Math.floor((result.width - qrSize) / 2)
          const offsetY = Math.floor((result.height - qrSize) / 2)
          context.fillStyle = '#09090b'
          matrix.forEach((row, rowIndex) => {
            row.forEach((dark, columnIndex) => {
              if (!dark) return
              context.fillRect(
                offsetX + (columnIndex + quietZone) * moduleSize,
                offsetY + (rowIndex + quietZone) * moduleSize,
                moduleSize,
                moduleSize
              )
            })
          })
        })
    }
  }
})
