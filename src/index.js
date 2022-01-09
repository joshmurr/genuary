import { vec2 } from 'gl-matrix'
import { Node, DifferentialLine } from './node'
import { recordFromCanvas } from './utils'

const dims = { x: 512, y: 512 }
const canvas = document.createElement('canvas')
canvas.width = dims.x
canvas.height = dims.y

const ctx = canvas.getContext('2d')
document.body.appendChild(canvas)

const maxForce = 1.1
const maxSpeed = 1.0
const desiredSeperation = 55
const seperationCohesionRatio = 1.8
const maxEdgeLen = 5

const diffLine = new DifferentialLine(
  maxForce,
  maxSpeed,
  desiredSeperation,
  seperationCohesionRatio,
  maxEdgeLen
)

const nNodesToStart = 20

for (let i = 0; i < nNodesToStart; i++) {
  const t = (i / nNodesToStart) * Math.PI * 2
  const x = canvas.width / 2 + Math.cos(t) * 10
  const y = canvas.width / 2 + Math.sin(t) * 10
  diffLine.addNode(x, y)
}

ctx.lineWidth = 3
ctx.lineCap = 'round'
ctx.strokeStyle = '#0F0'
ctx.fillStyle = 'black'

let timeout = null
let play = true
function draw() {
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  diffLine.run()
  diffLine.render(ctx)

  timeout = setTimeout(draw, 30)
  //if (play) requestAnimationFrame(draw)
}

canvas.addEventListener('click', () => clearTimeout(timeout))
//canvas.addEventListener('click', () => (play = !play))
//canvas.addEventListener('click', draw)

draw()
