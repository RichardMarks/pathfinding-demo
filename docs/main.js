const GRID_COLUMNS = 10
const GRID_ROWS = 10

const START_ID = 1
const FINISH_ID = 2
const WALL_ID = 3

let DIAGONALS = false

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

const con = document.createElement('div')
con.id = 'con'

const log = function (...what) {
  what.forEach(x => {
    const line = document.createElement('pre')
    if (typeof x === 'string' || typeof x === 'number') {
      x = `${x}`
    } else {
      if (Array.isArray(x)) {
        x = JSON.stringify(x)
      } else {
        x = JSON.stringify(x, null, 2)
      }
    }
    line.innerText = x
    con.appendChild(line)
  })
}

const logGrid = grid => {
  const out = []
  for (let y = 0; y < GRID_ROWS; y++) {
    const row = []
    for (let x = 0; x < GRID_COLUMNS; x++) {
      row.push(grid[x+y*GRID_COLUMNS])
    }
    out.push(row.join(' '))
  }
  log(out.join('\n'))
}

log.clear = () => {
  while (con.firstChild) {
    con.removeChild(con.firstChild)
  }
}

const boot = () => {
  const neighborsOf = (idx, q) => {
    const neighbors = []

    const pick = (x, y) => {
      const item = q[x + y * GRID_COLUMNS]
      if (item) {
        neighbors.push(x + y * GRID_COLUMNS)
      } else {
        // log(`index ${x + y * GRID_COLUMNS} (${x}, ${y}) is not in q`)
      }
    }

    const x = idx % GRID_COLUMNS
    const y = ~~(idx / GRID_COLUMNS)

    y - 1 >= 0 && pick(x, y - 1)
    y + 1 < GRID_ROWS && pick(x, y + 1)
    x - 1 >= 0 && pick(x - 1, y)
    x + 1 < GRID_COLUMNS && pick(x + 1, y)

    if (DIAGONALS) {
      x - 1 >= 0 && y - 1 >= 0 && pick(x - 1, y - 1)
      x + 1 < GRID_COLUMNS && y - 1 >= 0 && pick(x + 1, y - 1)
      x - 1 >= 0 && y + 1 < GRID_ROWS && pick(x - 1, y + 1)
      x + 1 < GRID_COLUMNS && y + 1 < GRID_ROWS && pick(x + 1, y + 1)
    }

    return neighbors
  }

  const distanceBetween = (a, b) => {
    const dx = (b % GRID_COLUMNS) - (a % GRID_COLUMNS)
    const dy = ~~(b / GRID_COLUMNS) - ~~(a / GRID_COLUMNS)
    return Math.sqrt(dx * dx + dy * dy)
  }

  const findShortestPath = ({
    grid, // 1d array
    start, // index of start of path
    finish // index of end of path
  }) => {
    log(`Finding path from ${start} to ${finish}`)

    const q = {}
    const dist = {}
    const prev = {}
    const MAX_DISTANCE = GRID_COLUMNS * GRID_ROWS

    grid.forEach((t, idx) => {
      dist[idx] = { distance: MAX_DISTANCE, index: idx }
      if (t !== 3) {
        q[idx] = true
      }
    })

    dist[start].distance = 0

    // log(q)

    const getIndexOfMinimumDistance = q => {
      let minDist = MAX_DISTANCE
      let minIdx = -1
      const dists = Object.keys(dist).map(k => dist[k])
      dists.filter(x => q[x.index]).forEach(({ distance, index }) => {
        if (distance < minDist) {
          // log(`${index}: comparing ${distance} to ${minDist} (${distance < minDist})`)
          minDist = distance
          minIdx = index
        }
      })
      // log(`minimum distance index is ${minIdx}`)
      return minIdx
    }

    while (Object.keys(q).length) {
      // log(`${Object.keys(q).length} in q`)
      const indexOfMinimumDistance = getIndexOfMinimumDistance(q)

      if (indexOfMinimumDistance < 0) {
        // log('min dist is < 0')
        break
      }

      const d = dist[indexOfMinimumDistance]

      delete q[indexOfMinimumDistance]

      if (indexOfMinimumDistance === finish) {
        // log('min dist is finish')
        break
      }

      const neighbors = neighborsOf(indexOfMinimumDistance, q)
      // log('neighbors', neighbors)
      neighbors.forEach(n => {
        const alt = d.distance + distanceBetween(indexOfMinimumDistance, n)
        if (alt < dist[n].distance) {
          dist[n] = { index: dist[n].index, distance: alt }
          prev[n] = indexOfMinimumDistance
        }
      })
    }

    const path = []

    if (prev[finish] || start === finish) {
      let u = finish
      while (u !== undefined) {
        path.unshift(u)
        u = prev[u]
      }
    }

    if (path.length) {
      log(`The shortest path to target is ${path.length - 1} step${path.length <= 2 ? '' : 's'}`, path)
      const pg = grid.slice()
      const pp = path.slice()
      pp.shift()
      pp.pop()
      pp.forEach(index => pg[index] = '*')
      logGrid(pg)
    } else {
      log('No path to target!')
    }

    return path
  }

  const drawGrid = grid => {
    const tw = ~~(canvas.width / GRID_COLUMNS)
    const th = ~~(canvas.height / GRID_ROWS)
    const colors = ['#000', '#0f0', '#f00', '#aaa']
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < grid.length; i++) {
      const tx = i % GRID_COLUMNS
      const ty = ~~(i / GRID_COLUMNS)
      const x = tx * tw
      const y = ty * th
      const t = grid[i]
      const color = colors[t]
      if (t) {
        if (grid.selectStart && t == START_ID) {
          ctx.fillStyle = '#fff'
          ctx.fillRect(x - 1, y - 1, tw + 2, th + 2)
          ctx.fillStyle = '#000'
          ctx.fillRect(x, y, tw, th)
        } else if (grid.selectFinish && t == FINISH_ID) {
          ctx.fillStyle = '#fff'
          ctx.fillRect(x - 1, y - 1, tw + 2, th + 2)
          ctx.fillStyle = '#000'
          ctx.fillRect(x, y, tw, th)
        }
        ctx.fillStyle = color
        ctx.fillRect(x + 2, y + 2, tw - 4, th - 4)
      }
    }

    if (grid.selectStart || grid.selectFinish) {
      ctx.globalAlpha = 0.5
      ctx.fillStyle = grid.selectStart ? '#0f0' : '#f00'
      const x = grid.ghostX * tw
      const y = grid.ghostY * th
      ctx.fillRect(x + 4, y + 4, tw - 8, th - 8)
      ctx.globalAlpha = 1.0
    }

  }

  const drawPath = path => {
    const tw = ~~(canvas.width / GRID_COLUMNS)
    const th = ~~(canvas.height / GRID_ROWS)
    ctx.fillStyle = '#fff'
    path.forEach(i => {
      const x = i % GRID_COLUMNS
      const y = ~~(i / GRID_COLUMNS)
      const tx = x * tw
      const ty = y * th
      ctx.fillRect(tx + (tw/2) - 4, ty + (th/2) - 4, 8, 8)
    })
  }

  const demo = {
    grid: new Array(GRID_COLUMNS * GRID_ROWS).fill(0),
    start: 22,
    finish: 77,
    path: []
  }

  const draw = () => {
    drawGrid(demo.grid)
    drawPath(demo.path)
  }

  const initializeDemo = () => {
    canvas.width = 512
    canvas.height = 512

    const columns = document.createElement('div')
    columns.className = 'columns'


    const header = document.createElement('header')
    const headerH1 = document.createElement('h1')
    const headerAuthor = document.createElement('p')
    headerH1.innerText = `Dijkstra's Algorithm 2D Path-Finding Demo`
    headerAuthor.innerHTML = '&copy; 2020, Richard Marks &lt;<a href="https://richardmarks.us">https://richardmarks.us</a>&gt;'

    header.appendChild(headerH1)
    header.appendChild(headerAuthor)

    document.body.appendChild(header)
    document.body.appendChild(columns)

    const box = document.createElement('div')
    box.style.width = '100%'
    const help = document.createElement('div')
    help.className = 'help'

    help.innerHTML = `
      <p>Click on the grid to draw/erase walls.</p>
      <p>Click on the green or red square to move the targets.</p>
      <p>Toggle Enable Diagonal Movement to see how 4 vs 8 directional movement affects the shortest path.</p>
    `

    box.appendChild(con)
    box.appendChild(help)

    const lbox = document.createElement('div')

    const toggleDiagonalsLabel = document.createElement('label')
    toggleDiagonalsLabel.innerText = 'Enable Diagonal Movement'
    toggleDiagonalsLabel.htmlFor = 'diag'

    const toggleDiagonalsCheck = document.createElement('input')
    toggleDiagonalsCheck.id = 'diag'
    toggleDiagonalsCheck.type = 'checkbox'
    toggleDiagonalsCheck.checked = !!DIAGONALS
    toggleDiagonalsCheck.addEventListener('change', () => {
      DIAGONALS = !DIAGONALS
      log.clear()
      demo.path = findShortestPath({
        grid: demo.grid,
        start: demo.start,
        finish: demo.finish
      })
    }, false)

    lbox.appendChild(canvas)
    lbox.appendChild(toggleDiagonalsCheck)
    lbox.appendChild(toggleDiagonalsLabel)



    columns.appendChild(lbox)
    columns.appendChild(box)

    const grid = demo.grid

    // set start and finish points
    grid[demo.start] = START_ID
    grid[demo.finish] = FINISH_ID

    // add a wall
    grid[20] = WALL_ID
    grid[41] = WALL_ID
    grid[42] = WALL_ID
    grid[43] = WALL_ID
    grid[44] = WALL_ID
    grid[45] = WALL_ID
    grid[46] = WALL_ID
    grid[47] = WALL_ID
    grid[48] = WALL_ID
    grid[49] = WALL_ID
    grid[54] = WALL_ID
    grid[64] = WALL_ID

    demo.path = findShortestPath({
      grid,
      start: demo.start,
      finish: demo.finish
    })

    const moveStartToIndex = index => {
      const x = index % GRID_COLUMNS
      const y = ~~(index / GRID_COLUMNS)
      log(`Moving START to ${index} (${x}, ${y})`)
      demo.grid[demo.start] = 0
      demo.start = index
      demo.grid[demo.start] = START_ID
    }

    const moveFinishToIndex = index => {
      const x = index % GRID_COLUMNS
      const y = ~~(index / GRID_COLUMNS)
      log(`Moving FINISH to ${index} (${x}, ${y})`)
      demo.grid[demo.finish] = 0
      demo.finish = index
      demo.grid[demo.finish] = FINISH_ID
    }

    const toggleWall = index => {
      demo.grid[index] = demo.grid[index] === WALL_ID
        ? 0
        : WALL_ID
    }

    const getIndexFromMouseEvent = mouseEvent => {
      const tw = ~~(canvas.width / GRID_COLUMNS)
      const th = ~~(canvas.height / GRID_ROWS)
      const bound = canvas.getBoundingClientRect()
      const mx = mouseEvent.clientX - bound.left
      const my = mouseEvent.clientY - bound.top
      const tx = ~~(mx / tw)
      const ty = ~~(my / th)
      const index = tx + ty * GRID_COLUMNS
      return index
    }

    canvas.oncontextmenu = e => e.preventDefault()

    canvas.addEventListener('mouseup', mouseEvent => {
      // delete demo.grid.ghostX
      // delete demo.grid.ghostY
    }, false)

    canvas.addEventListener('mousemove', mouseEvent => {
      if (demo.grid.selectStart || demo.grid.selectFinish) {
        const index = getIndexFromMouseEvent(mouseEvent)
        const x = index % GRID_COLUMNS
        const y = ~~(index / GRID_COLUMNS)

        demo.grid.ghostX = x
        demo.grid.ghostY = y
      }
    }, false)

    canvas.addEventListener('mousedown', mouseEvent => {
      const index = getIndexFromMouseEvent(mouseEvent)
      const x = index % GRID_COLUMNS
      const y = ~~(index / GRID_COLUMNS)

      demo.grid.ghostX = x
      demo.grid.ghostY = y

      log.clear()

      if (demo.grid[index] === START_ID) {
        demo.grid.selectFinish = false
        demo.grid.selectStart = !demo.grid.selectStart
        if (demo.grid.selectStart) {
          log('Click another tile to move the START position')
        }
      } else if (demo.grid[index] === FINISH_ID) {
        demo.grid.selectStart = false
        demo.grid.selectFinish = !demo.grid.selectFinish
        if (demo.grid.selectFinish) {
          log('Click another tile to move the FINISH position')
        }
      } else {
        if (demo.grid.selectStart) {
          if (demo.grid[index] !== 0) {
            log('Cannot move to an occupied location!')
            log('Click another tile to move the START position')
          } else {
            moveStartToIndex(index)
            demo.grid.selectStart = !demo.grid.selectStart
          }
        } else if (demo.grid.selectFinish) {
          if (demo.grid[index] !== 0) {
            log('Cannot move to an occupied location!')
            log('Click another tile to move the FINISH position')
          } else {
            moveFinishToIndex(index)
            demo.grid.selectFinish = !demo.grid.selectFinish
          }
        } else {
          toggleWall(index)
        }
      }


      // toggleWall(index)

//       if (demo.grid[index] !== 0) {
//         log('Cannot move to an occupied location!')
//         return
//       }
//       log.clear()


//       if (!clickEvent.button) {
//         moveStartToIndex(index)
//       } else {
//         moveFinishToIndex(index)
//       }
      if (!demo.grid.selectStart && !demo.grid.selectFinish) {
        demo.path = findShortestPath({
          grid: demo.grid,
          start: demo.start,
          finish: demo.finish
        })
      }
      // draw()
    }, false)
  }

  initializeDemo()

  const mainLoop = () => {
    draw()
    window.requestAnimationFrame(mainLoop)
  }
  mainLoop()
}

document.addEventListener('DOMContentLoaded', boot, false)
