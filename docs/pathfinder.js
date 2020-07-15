const createPathFinderContext = ({ grid }) => {
  const { numColumns, numRows } = grid

  const NUM_CELLS = numColumns * numRows
  const MAXIMUM_DISTANCE_BETWEEN_NODES = numColumns * numRows

  const cachedShortestPaths = {}

  const findShortestPath = ({
    grid,
    startIndex,
    finishIndex,
    allowDiagonalMovement = false
  }) => {
    const cacheKey = `${grid.serialized}${startIndex}${finishIndex}${allowDiagonalMovement}`

    if (cacheKey in cachedShortestPaths) {
      return cachedShortestPaths[cacheKey]
    }

    const unvisitedNodesTable = {}
    const nodeDistanceTable = {}
    const previousNodeTable = {}

    const initializeTablesForIndex = (index, isObstacle) => {
      nodeDistanceTable[index] = {
        distance: MAXIMUM_DISTANCE_BETWEEN_NODES,
        index
      }

      if (!isObstacle) {
        unvisitedNodesTable[index] = true
      }
    }

    const initializeTablesForLinearGrid = () => {
      for (let index = 0; index < NUM_CELLS; index++) {
        const currentCell = grid.readIndex(index)
        const isObstacle = grid.obstacles.includes(currentCell)

        initializeTablesForIndex(index, isObstacle)
      }
    }

    const getIndexOfMinimumDistance = () => {
      let minimumDistance = MAXIMUM_DISTANCE_BETWEEN_NODES
      let indexOfMinimumDistance = -1

      const dists = Object.keys(nodeDistanceTable)
        .map(k => nodeDistanceTable[k])
        .filter(x => unvisitedNodesTable[x.index])

      dists.forEach(({ distance, index }) => {
        if (distance < minimumDistance) {
          minimumDistance = distance
          indexOfMinimumDistance = index
        }
      })

      return indexOfMinimumDistance
    }

    const distanceBetween = (indexA, indexB) => {
      const dx = (indexB % numColumns) - (indexA % numColumns)
      const dy = ~~(indexB / numColumns) - ~~(indexA / numColumns)

      return Math.sqrt(dx * dx + dy * dy)
    }

    const neighborsOf = (index) => {
      const neighbors = []

      const pick = (x, y) => {
        const pickedIndex = x + y * numColumns
        const item = unvisitedNodesTable[pickedIndex]

        if (item) {
          neighbors.push(pickedIndex)
        }
      }

      const x = index % numColumns
      const y = ~~(index / numColumns)

      const lookAbove = y - 1 >= 0
      const lookBelow = y + 1 < numRows
      const lookLeft = x - 1 >= 0
      const lookRight = x + 1 < numColumns

      lookAbove && pick(x, y - 1)
      lookBelow && pick(x, y + 1)
      lookLeft && pick(x - 1, y)
      lookRight && pick(x + 1, y)

      if (allowDiagonalMovement) {
        lookLeft && lookAbove && pick(x - 1, y - 1)
        lookRight && lookAbove && pick(x + 1, y - 1)
        lookLeft && lookBelow && pick(x - 1, y + 1)
        lookRight && lookBelow && pick(x + 1, y + 1)
      }

      return neighbors
    }

    const calculateNeighborDistancesTo = indexOfMinimumDistance => {
      const distance = nodeDistanceTable[indexOfMinimumDistance].distance
      const neighborIndices = neighborsOf(indexOfMinimumDistance)
      const numNeighbors = neighborIndices.length

      for (let i = 0; i < numNeighbors; i++) {
        const neighborIndex = neighborIndices[i]
        const distanceToNeighbor = distanceBetween(indexOfMinimumDistance, neighborIndex)
        const distanceToRoot = distance + distanceToNeighbor
        const neighborDistance = nodeDistanceTable[neighborIndex].distance

        if (distanceToRoot < neighborDistance) {
          nodeDistanceTable[neighborIndex] = {
            index: nodeDistanceTable[neighborIndex].index,
            distance: distanceToRoot
          }
          previousNodeTable[neighborIndex] = indexOfMinimumDistance
        }
      }
    }

    const unwindShortestPath = () => {
      const shortestPath = []

      if (previousNodeTable[finishIndex] || startIndex === finishIndex) {
        let index = finishIndex

        while (index !== undefined) {
          shortestPath.unshift(index)
          index = previousNodeTable[index]
        }
      }

      return shortestPath
    }

    initializeTablesForLinearGrid()

    nodeDistanceTable[startIndex].distance = 0

    while (Object.keys(unvisitedNodesTable).length) {
      const indexOfMinimumDistance = getIndexOfMinimumDistance(unvisitedNodesTable)

      if (indexOfMinimumDistance < 0) {
        break
      }

      delete unvisitedNodesTable[indexOfMinimumDistance]

      if (indexOfMinimumDistance === finishIndex) {
        break
      }

      calculateNeighborDistancesTo(indexOfMinimumDistance)
    }

    const shortestPath = unwindShortestPath()

    cachedShortestPaths[cacheKey] = [ ...shortestPath ]

    return shortestPath
  }

  const pathFinderContext = {
    findShortestPath
  }

  return pathFinderContext
}

const PathFinder = {
  create ({ grid }) {
    const pathFinder = createPathFinderContext({ grid })

    return pathFinder
  }
}

export default PathFinder
