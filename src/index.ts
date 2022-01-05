import { GL_Handler, Geometry } from 'gl-handler'
import { vec3, mat4 } from 'gl-matrix'
import {
  generateIQPalette,
  recordCanvas,
  renderOffscreen,
  saveCanvasAsImage,
} from './utils'
import ParticleSystem from './particleSystem'
import updateVert from './glsl/updateVert.glsl'
import updateFrag from './glsl/passthruFrag.glsl'
import renderVert from './glsl/renderVert.glsl'
import renderFrag from './glsl/renderFrag.glsl'

export interface PSOptions {
  dimensions?: number
  numParticles?: number
  birthRate?: number
  lifeRange?: number[]
  directionRange?: [number, number]
  speedRange?: [number, number]
  gravity?: [number, number]
}

type UniformDescs = {
  [key: string]: number | number[] | mat4 | vec3 | WebGLTexture
}

const G = new GL_Handler()
const canvas = G.canvas(1000, 1000)
const gl = G.gl

// PROGRAMS --------------------------
const transformFeedbackVaryings = [
  'v_Position',
  'v_Velocity',
  'v_Age',
  'v_Life',
]
const updateProgram = G.shaderProgram(
  updateVert,
  updateFrag,
  transformFeedbackVaryings
)
const renderProgram = G.shaderProgram(renderVert, renderFrag)
// -----------------------------------
let random = []
for (let i = 0; i < 512 * 512; ++i) {
  random.push(Math.random() * 255)
  random.push(Math.random() * 255)
  random.push(Math.random() * 255)
}
const rgTex = G.createTexture(512, 512, 'RGB', new Uint8Array(random))

const camPos: [number, number, number] = [0, 2, 3]
let viewMat = G.viewMat({ pos: vec3.fromValues(...camPos) })
const projMat = G.defaultProjMat()
const modelMat = mat4.create()

// UNIFORMS ---------------------------
const updateUniforms: UniformDescs = {
  u_TimeDelta: 0,
  u_TotalTime: 0,
  u_RgNoise: rgTex,
  u_Gravity: [0, 0, 0],
  u_Force: 1.8,
}

const renderUniforms: UniformDescs = {
  u_ModelMatrix: modelMat,
  u_ViewMatrix: viewMat,
  u_ProjectionMatrix: projMat,
  u_PointSize: 2,
  u_ColourPalette: new Float32Array(generateIQPalette(Math.random)),
}
const updateUniformSetters = G.getUniformSetters(updateProgram)
const renderUniformSetters = G.getUniformSetters(renderProgram)
// ------------------------------------

const opts: PSOptions = {
  numParticles: 50000,
  lifeRange: [1, 8],
  dimensions: 3,
  birthRate: 10,
}
const ps = new ParticleSystem(gl, opts)
ps.linkProgram(updateProgram, renderProgram)
//ps.rotate = { speed: 0.01, axis: [0, 1, 0] }

const state = [
  {
    update: ps.VAOs[0],
    render: ps.VAOs[2],
  },
  {
    update: ps.VAOs[1],
    render: ps.VAOs[3],
  },
]

let count = 0
let oldTimestamp = 0
let deltaTime = 0
let time = 0
function draw(now: number) {
  if (oldTimestamp != 0) {
    deltaTime = now - oldTimestamp
    if (deltaTime > 500.0) {
      deltaTime = 0.0
    }
  }
  oldTimestamp = now
  time += deltaTime

  gl.enable(gl.BLEND)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.clearColor(0, 0, 0, 1)

  const numParticles = ps.getNumParticles(deltaTime)

  gl.useProgram(updateProgram)
  G.setUniforms(updateUniformSetters, {
    ...updateUniforms,
    u_Force: 0.4,
    u_TimeDelta: deltaTime * 0.001,
    u_TotalTime: time * 0.001,
  })
  gl.bindVertexArray(state[count % 2].update)
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, ps.buffers[++count % 2])

  gl.enable(gl.RASTERIZER_DISCARD)

  gl.beginTransformFeedback(gl.POINTS)
  gl.drawArrays(gl.POINTS, 0, numParticles)
  gl.endTransformFeedback()
  gl.disable(gl.RASTERIZER_DISCARD)
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null)

  gl.bindVertexArray(state[++count % 2].render)
  gl.useProgram(renderProgram)
  G.setUniforms(renderUniformSetters, {
    ...renderUniforms,
    u_ModelMatrix: ps.updateModelMatrix(time * 0.05),
  })
  gl.drawArrays(gl.POINTS, 0, Math.max(numParticles - 50, 0))

  count++

  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

  //renderOffscreen(gl.canvas)
  requestAnimationFrame(draw)
  //setTimeout(() => requestAnimationFrame(draw), 50)
}

gl.canvas.addEventListener('click', () =>
  saveCanvasAsImage(gl.canvas, '03-space')
)

//const offscreen = renderOffscreen(gl.canvas, true)
//recordCanvas(offscreen, 40000, 'offscreen', draw)
requestAnimationFrame(draw)
//recordCanvas(gl.canvas, 5000, 'particles01', draw)
