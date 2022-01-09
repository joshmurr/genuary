import { vec2 } from 'gl-matrix'

const clamp = (val, lb, up) => Math.max(Math.min(val, up), lb)

const vec2limit = function (vec, lim) {
  const [x, y] = vec
  const n = Math.hypot(x, y)
  const f = Math.min(n, lim) / n
  const _x = x * f
  const _y = y * f
  vec[0] = _x
  vec[1] = _y
  return vec2.fromValues(_x, _y)
}

export class DifferentialLine {
  constructor(
    maxForce,
    maxSpeed,
    desiredSeperation,
    seperationCohesionRatio,
    maxEdgeLength
  ) {
    this.maxForce = maxForce
    this.maxSpeed = maxSpeed
    this.desiredSeperation = desiredSeperation
    this.seperationCohesionRatio = seperationCohesionRatio
    this.maxEdgeLength = maxEdgeLength
    this.nodes = []
  }

  run() {
    for (const node of this.nodes) {
      node.run(this.nodes)
    }
    this.growth()
  }

  addNode(x, y) {
    const node = new Node(
      x,
      y,
      this.maxForce,
      this.maxSpeed,
      this.desiredSeperation,
      this.seperationCohesionRatio
    )
    this.nodes.push(node)
  }

  addNodeAt(node, idx) {
    this.nodes.splice(idx, 0, node)
  }

  growth() {
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const n1 = this.nodes[i]
      const n2 = this.nodes[i + 1]
      const d = vec2.dist(n1.position, n2.position)
      if (d > this.maxEdgeLength) {
        const idx = this.nodes.indexOf(n2)
        const middleNode = vec2.create()
        vec2.add(middleNode, n1.position, n2.position)
        vec2.scale(middleNode, middleNode, 0.5)
        this.addNodeAt(
          new Node(
            middleNode[0],
            middleNode[1],
            this.maxForce,
            this.maxSpeed,
            this.desiredSeperation,
            this.seperationCohesionRatio
          ),
          idx
        )
      }
    }
  }

  render(ctx) {
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const n1 = this.nodes[i]
      const n2 = this.nodes[i + 1]
      ctx.beginPath()
      const [x, y] = n1.position
      const [x2, y2] = n2.position
      ctx.moveTo(x + 0, y + 0)
      ctx.lineTo(x2 + 0, y2 + 0)
      if (i === this.nodes.length - 2) {
        const n3 = this.nodes[0]
        const [x3, y3] = n3.position
        ctx.moveTo(x2 + 0, y2 + 0)
        ctx.lineTo(x3 + 0, y3 + 0)
      }

      ctx.stroke()
    }
  }
}

export class Node {
  constructor(
    x,
    y,
    maxForce,
    maxSpeed,
    desiredSeperation,
    seperationCohesionRatio
  ) {
    this.position = vec2.fromValues(x, y)
    this.velocity = vec2.fromValues(Math.random() - 0.5, Math.random() - 0.5)
    this.acceleration = vec2.fromValues(0, 0)
    this.maxSpeed = maxSpeed
    this.maxForce = maxForce
    this.desiredSeperation = desiredSeperation
    this.seperationCohesionRatio = seperationCohesionRatio
  }

  run(otherNodes) {
    this.differentiate(otherNodes)
    this.update()
  }

  update() {
    vec2.add(this.velocity, this.velocity, this.acceleration)
    vec2limit(this.velocity, this.maxSpeed)
    vec2.add(this.position, this.position, this.velocity)
    vec2.scale(this.acceleration, this.acceleration, 0)
  }

  differentiate(otherNodes) {
    const seperation = this.seperate(otherNodes)
    const cohesion = this.edgeCohesion(otherNodes)

    vec2.scale(seperation, seperation, this.seperationCohesionRatio)

    vec2.add(this.acceleration, this.acceleration, seperation)
    vec2.add(this.acceleration, this.acceleration, cohesion)
  }

  seperate(otherNodes) {
    const steer = vec2.fromValues(0, 0)
    let count = 0

    for (const node of otherNodes) {
      if (node === this) break
      const d = vec2.dist(this.position, node.position)
      if (d > 0 && d < this.desiredSeperation) {
        const diff = vec2.sub(vec2.create(), this.position, node.position)
        vec2.normalize(diff, diff)
        vec2.scale(diff, diff, 1 / d)
        vec2.add(steer, steer, diff)
        count++
      }
    }
    if (count > 0) {
      vec2.scale(steer, steer, 1 / count)
    }
    if (vec2.len(steer) > 0) {
      vec2.normalize(steer, steer)
      vec2.scale(steer, steer, this.maxSpeed)
      vec2.sub(steer, steer, this.velocity)
      vec2limit(steer, this.maxForce)
    }
    return steer
  }

  edgeCohesion(otherNodes) {
    const sum = vec2.fromValues(0, 0)
    const idx = otherNodes.indexOf(this)
    if (idx !== 0 && idx !== otherNodes.length - 1) {
      const prevNodePos = otherNodes[idx - 1].position
      const nextNodePos = otherNodes[idx + 1].position
      vec2.add(sum, sum, prevNodePos)
      vec2.add(sum, sum, nextNodePos)
    } else if (idx === 0) {
      const prevNodePos = otherNodes[otherNodes.length - 1].position
      const nextNodePos = otherNodes[1].position
      vec2.add(sum, sum, prevNodePos)
      vec2.add(sum, sum, nextNodePos)
    } else if (idx === otherNodes.length - 1) {
      const prevNodePos = otherNodes[idx - 1].position
      const nextNodePos = otherNodes[0].position
      vec2.add(sum, sum, prevNodePos)
      vec2.add(sum, sum, nextNodePos)
    }
    vec2.scale(sum, sum, 0.5)
    return this.seek(sum)
  }

  seek(target) {
    const desired = vec2.sub(vec2.create(), target, this.position)
    vec2.normalize(desired, desired)
    vec2.scale(desired, desired, this.maxSpeed)
    const steer = vec2.sub(vec2.create(), desired, this.velocity)
    vec2limit(steer, this.maxForce)
    return steer
  }
}
