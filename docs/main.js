import Logger from './logger.js'
import Renderer from './renderer.js'
import PathFinder from './pathfinder.js'
import Grid from './grid.js'

console.log({
  Logger,
  Renderer,
  PathFinder,
  Grid
})

const GRID_COLUMNS = 10
const GRID_ROWS = 10

const EMPTY_ID = 0
const START_ID = 1
const FINISH_ID = 2
const WALL_ID = 3

let DIAGONALS = false

const boot = () => {
  const logger = Logger.create({ id: 'con' })
  const log = logger.log

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

  const renderer = Renderer.create({
    width: 512,
    height: 512,
    parentElement: document.body
  })

  const { canvas, ctx } = renderer

  const grid = Grid.create({
    numColumns: GRID_COLUMNS,
    numRows: GRID_ROWS,
    emptyCell: EMPTY_ID,
    obstacleCells: [WALL_ID]
  })

  const pathFinder = PathFinder.create({ grid })

  const findShortestPath = ({
    grid, // 1d array
    start, // index of start of path
    finish // index of end of path
  }) => {
    log(`Finding path from ${start} to ${finish}`)

    const path = pathFinder.findShortestPath({
      grid,
      startIndex: start,
      finishIndex: finish,
      allowDiagonalMovement: DIAGONALS
    })

    if (path.length) {
      log(`The shortest path to target is ${path.length - 1} step${path.length <= 2 ? '' : 's'}`, path)
      const pg = grid.data.slice()
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
    for (let i = 0; i < grid.size; i++) {
      const tx = i % GRID_COLUMNS
      const ty = ~~(i / GRID_COLUMNS)
      const x = tx * tw
      const y = ty * th
      const t = grid.readIndex(i)
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
    grid,
    start: 22,
    finish: 77,
    path: []
  }

  const draw = () => {
    drawGrid(demo.grid)
    drawPath(demo.path)
  }

  const initializeDemo = () => {
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

    box.appendChild(logger.element)
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
      logger.clear()
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
    grid.writeIndex(demo.start, START_ID)
    grid.writeIndex(demo.finish, FINISH_ID)

    // add a wall
    const wallIndices = [20, 41, 42, 43, 45, 46, 47, 48, 49, 54, 64]

    wallIndices.forEach(index => grid.writeIndex(index, WALL_ID))

    demo.path = findShortestPath({
      grid,
      start: demo.start,
      finish: demo.finish
    })

    const moveStartToIndex = index => {
      const { x, y } = grid.indexToCoord(index)

      log(`Moving START to ${index} (${x}, ${y})`)

      grid.writeIndex(demo.start, EMPTY_ID)
      demo.start = index
      grid.writeIndex(demo.start, START_ID)
    }

    const moveFinishToIndex = index => {
      const { x, y } = grid.indexToCoord(index)

      log(`Moving FINISH to ${index} (${x}, ${y})`)

      grid.writeIndex(demo.finish, EMPTY_ID)
      demo.finish = index
      grid.writeIndex(demo.finish, FINISH_ID)
    }

    const toggleWall = index => {
      const wallState = grid.readIndex(index) === WALL_ID
        ? EMPTY_ID
        : WALL_ID

      grid.writeIndex(index, wallState)
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

      logger.clear()

      const currentCell = grid.readIndex(index)

      if (currentCell === START_ID) {
        demo.grid.selectFinish = false
        demo.grid.selectStart = !demo.grid.selectStart
        if (demo.grid.selectStart) {
          log('Click another tile to move the START position')
        }
      } else if (currentCell === FINISH_ID) {
        demo.grid.selectStart = false
        demo.grid.selectFinish = !demo.grid.selectFinish
        if (demo.grid.selectFinish) {
          log('Click another tile to move the FINISH position')
        }
      } else {
        if (demo.grid.selectStart) {
          if (currentCell !== EMPTY_ID) {
            log('Cannot move to an occupied location!')
            log('Click another tile to move the START position')
          } else {
            moveStartToIndex(index)
            demo.grid.selectStart = !demo.grid.selectStart
          }
        } else if (demo.grid.selectFinish) {
          if (currentCell !== EMPTY_ID) {
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

      if (!demo.grid.selectStart && !demo.grid.selectFinish) {
        demo.path = findShortestPath({
          grid: demo.grid,
          start: demo.start,
          finish: demo.finish
        })
      }
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
