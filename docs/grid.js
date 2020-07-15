const Grid = {
  create ({
    numColumns,
    numRows,
    emptyCell,
    obstacleCells
  }) {
    if (typeof numColumns !== 'number' || numColumns <= 0) {
      throw new Error('numColumns must be a positive integer value')
    }

    if (typeof numRows !== 'number' || numRows <= 0) {
      throw new Error('numRows must be a positive integer value')
    }

    const size = numColumns * numRows

    const data = new Array(size).fill(emptyCell)

    const obstacleCellsCopy = obstacleCells.slice()

    const grid = {
      get obstacles () {
        return obstacleCellsCopy
      },

      get size () {
        return size
      },

      get numColumns () {
        return numColumns
      },

      get numRows () {
        return numRows
      },

      get data () {
        return data
      },

      get serialized () {
        const x = [
          numColumns.toString(16),
          numRows.toString(16),
          ...data.map(id => String.fromCharCode(id + 65))
        ].join('')
      },

      coordToIndex (column, row) {
        if (typeof column !== 'number') {
          throw new Error(`column must be an integer between 0 and ${numColumns - 1}`)
        }

        if (typeof row !== 'number') {
          throw new Error(`row must be an integer between 0 and ${numRows - 1}`)
        }

        return column + row * numColumns
      },

      indexToCoord (index, receivingObject) {
        if (typeof index !== 'number') {
          throw new Error(`index must be an integer between 0 and ${size - 1}`)
        }

        const column = index % numColumns
        const row = ~~(index / numColumns)

        if (receivingObject) {
          if (typeof receivingObject === 'object') {
            receivingObject.column = column
            receivingObject.row = row
            return receivingObject
          } else {
            throw new Error(`receivingObject must be an object not "${typeof receivingObject}".`)
          }
        }

        return {
          column,
          row
        }
      },

      readCoord (column, row) {
        const index = grid.coordToIndex(column, row)

        return grid.readIndex(index)
      },

      writeCoord (column, row, id) {
        const index = grid.coordToIndex(column, row)

        grid.writeIndex(index, id)
      },

      readIndex (index) {
        return data[index]
      },

      writeIndex (index, id) {
        data[index] = id
      }
    }

    return grid
  }
}

export default Grid
