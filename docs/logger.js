const Logger = {
  create ({
    id
  }) {
    const loggingConsoleElement = document.createElement('div')

    loggingConsoleElement.id = id

    const logger = {
      log (...what) {
        what.forEach(x => {
          const lineElement = document.createElement('pre')

          if (typeof x === 'string' || typeof x === 'number') {
            x = `${x}`
          } else {
            if (Array.isArray(x)) {
              x = JSON.stringify(x)
            } else {
              x = JSON.stringify(x, null, 2)
            }
          }

          lineElement.innerText = x
          loggingConsoleElement.appendChild(lineElement)
        })
      },

      clear () {
        while (loggingConsoleElement.firstChild) {
          loggingConsoleElement.removeChild(loggingConsoleElement.firstChild)
        }
      },

      get element () {
        return loggingConsoleElement
      }
    }

    return logger
  }
}

export default Logger
