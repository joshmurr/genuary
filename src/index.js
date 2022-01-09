import { vec2 } from 'gl-matrix'
import { Node, DifferentialLine } from './node'

const dims = { x: 512, y: 512 }
const canvas = document.createElement('canvas')
canvas.width = dims.x
canvas.height = dims.y

const ctx = canvas.getContext('2d')
document.body.appendChild(canvas)

const maxForce = vec2.fromValues(0.9, 0.9)
const maxSpeed = 1
const desiredSeperation = 9
const seperationCohesionRatio = 1.9
const maxEdgeLen = 5

const diffLine = new DifferentialLine(
  maxForce,
  maxSpeed,
  desiredSeperation,
  seperationCohesionRatio,
  maxEdgeLen
)

const nNodesToStart = 30

for (let i = 0; i < nNodesToStart; i++) {
  const t = (i / nNodesToStart) * Math.PI * 2
  const x = Math.cos(t) * 10
  const y = Math.sin(t) * 10
  diffLine.addNode(x, y)
}

ctx.strokeStyle = 'black'

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  diffLine.run()
  diffLine.render(ctx)

  //requestAnimationFrame(draw)
}

canvas.addEventListener('click', draw)

draw()
