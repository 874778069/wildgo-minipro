const SIZE = 21
const DATA_CODEWORDS = 19
const ECC_CODEWORDS = 7

const expTable = new Array(512)
const logTable = new Array(256)
let value = 1
for (let index = 0; index < 255; index += 1) {
  expTable[index] = value
  logTable[value] = index
  value <<= 1
  if (value & 0x100) value ^= 0x11d
}
for (let index = 255; index < 512; index += 1) {
  expTable[index] = expTable[index - 255]
}

function multiply(left, right) {
  if (!left || !right) return 0
  return expTable[logTable[left] + logTable[right]]
}

function multiplyPolynomial(left, right) {
  const result = new Array(left.length + right.length - 1).fill(0)
  left.forEach((leftValue, leftIndex) => {
    right.forEach((rightValue, rightIndex) => {
      result[leftIndex + rightIndex] ^= multiply(leftValue, rightValue)
    })
  })
  return result
}

function errorCorrection(data) {
  let generator = [1]
  for (let index = 0; index < ECC_CODEWORDS; index += 1) {
    generator = multiplyPolynomial(generator, [1, expTable[index]])
  }
  const result = data.concat(new Array(ECC_CODEWORDS).fill(0))
  for (let index = 0; index < data.length; index += 1) {
    const factor = result[index]
    if (!factor) continue
    for (let offset = 0; offset < generator.length; offset += 1) {
      result[index + offset] ^= multiply(generator[offset], factor)
    }
  }
  return result.slice(DATA_CODEWORDS)
}

function pushBits(bits, number, length) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push(((number >>> index) & 1) === 1)
  }
}

function buildCodewords(text) {
  const bytes = Array.from(text).map((character) => character.charCodeAt(0))
  if (bytes.some((byte) => byte > 127) || bytes.length > 17) {
    throw new Error('核销码超出二维码容量')
  }
  const bits = []
  pushBits(bits, 4, 4)
  pushBits(bits, bytes.length, 8)
  bytes.forEach((byte) => pushBits(bits, byte, 8))
  const remaining = DATA_CODEWORDS * 8 - bits.length
  pushBits(bits, 0, Math.min(4, remaining))
  while (bits.length % 8) bits.push(false)

  const data = []
  for (let index = 0; index < bits.length; index += 8) {
    let byte = 0
    for (let offset = 0; offset < 8; offset += 1) {
      byte = (byte << 1) | (bits[index + offset] ? 1 : 0)
    }
    data.push(byte)
  }
  let padIndex = 0
  while (data.length < DATA_CODEWORDS) {
    data.push(padIndex % 2 === 0 ? 0xec : 0x11)
    padIndex += 1
  }
  return data.concat(errorCorrection(data))
}

function placeFinder(matrix, top, left) {
  for (let row = -1; row <= 7; row += 1) {
    for (let column = -1; column <= 7; column += 1) {
      const targetRow = top + row
      const targetColumn = left + column
      if (
        targetRow < 0 ||
        targetRow >= SIZE ||
        targetColumn < 0 ||
        targetColumn >= SIZE
      ) {
        continue
      }
      const dark =
        row >= 0 &&
        row <= 6 &&
        column >= 0 &&
        column <= 6 &&
        (row === 0 ||
          row === 6 ||
          column === 0 ||
          column === 6 ||
          (row >= 2 && row <= 4 && column >= 2 && column <= 4))
      matrix[targetRow][targetColumn] = dark
    }
  }
}

function bitLength(number) {
  let length = 0
  while (number) {
    length += 1
    number >>>= 1
  }
  return length
}

function formatBits() {
  const generator = 0x537
  const mask = 0x5412
  const data = 1 << 3
  let remainder = data << 10
  while (bitLength(remainder) >= bitLength(generator)) {
    remainder ^= generator << (bitLength(remainder) - bitLength(generator))
  }
  return ((data << 10) | remainder) ^ mask
}

function placeFormat(matrix) {
  const bits = formatBits()
  for (let index = 0; index < 15; index += 1) {
    const dark = ((bits >>> index) & 1) === 1
    let row
    if (index < 6) row = index
    else if (index < 8) row = index + 1
    else row = SIZE - 15 + index
    matrix[row][8] = dark

    let column
    if (index < 8) column = SIZE - index - 1
    else if (index === 8) column = 7
    else column = 15 - index - 1
    matrix[8][column] = dark
  }
  matrix[SIZE - 8][8] = true
}

function createQrMatrix(text) {
  const matrix = Array.from({ length: SIZE }, () =>
    new Array(SIZE).fill(null)
  )
  placeFinder(matrix, 0, 0)
  placeFinder(matrix, SIZE - 7, 0)
  placeFinder(matrix, 0, SIZE - 7)

  for (let index = 8; index < SIZE - 8; index += 1) {
    if (matrix[6][index] === null) matrix[6][index] = index % 2 === 0
    if (matrix[index][6] === null) matrix[index][6] = index % 2 === 0
  }
  placeFormat(matrix)

  const codewords = buildCodewords(text)
  const bits = []
  codewords.forEach((byte) => pushBits(bits, byte, 8))
  let bitIndex = 0
  let row = SIZE - 1
  let direction = -1
  for (let column = SIZE - 1; column > 0; column -= 2) {
    if (column === 6) column -= 1
    while (row >= 0 && row < SIZE) {
      for (let offset = 0; offset < 2; offset += 1) {
        const targetColumn = column - offset
        if (matrix[row][targetColumn] !== null) continue
        const source = bitIndex < bits.length ? bits[bitIndex] : false
        const masked = (row + targetColumn) % 2 === 0
        matrix[row][targetColumn] = source !== masked
        bitIndex += 1
      }
      row += direction
    }
    row -= direction
    direction = -direction
  }
  return matrix
}

module.exports = { createQrMatrix }
