const Renderer = {
  create ({
    width: canvasWidth,
    height: canvasHeight,
    parentElement,
    canvasElement
  }) {
    const canvas = canvasElement || document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const renderer = {
      get canvas () {
        return canvas
      },

      get ctx () {
        return ctx
      },

      setFillColor (color) {
        ctx.fillStyle = color
      },

      setOpacity (zeroToOne) {
        ctx.globalAlpha = zeroToOne
      },

      drawRectangle (x, y, width, height) {
        ctx.fillRect(x, y, width, height)
      }
    }

    return renderer
  }
}

export default Renderer
