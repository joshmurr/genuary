import { GL_Handler, Geometry } from 'gl-handler'
import { vec3, mat4 } from 'gl-matrix'
import {
  generateIQPalette,
  recordCanvas,
  renderOffscreen,
  saveCanvasAsImage,
} from './utils'
import Icosahedron from './icosahedron'
import Quad from './quad'
import frag from './glsl/icos.frag.glsl'
import vert from './glsl/icos.vert.glsl'

import renderVert from './glsl/renderVert.glsl'
import renderFrag from './glsl/renderFrag.glsl'

type UniformDescs = {
  [key: string]: number | number[] | mat4 | vec3 | WebGLTexture
}

const G = new GL_Handler()
const canvas = G.canvas(512, 512, {})
const gl = G.gl

// PROGRAMS --------------------------
const program = G.shaderProgram(vert, frag)
const render = G.shaderProgram(renderVert, renderFrag)
// -----------------------------------
const camPos: [number, number, number] = [0, 0, 3]
let viewMat = G.viewMat({ pos: vec3.fromValues(...camPos) })
const projMat = G.defaultProjMat()
const modelMat = mat4.create()
const renderCam = mat4.ortho(mat4.create(), 0, 0, 512, 512, -1, 1)

const res = { x: 64, y: 64 }
const renderTex = G.createTexture(res.x, res.y, {
  type: 'RGB',
  filter: 'NEAREST',
})
const fbo = G.createFramebuffer(renderTex)
gl.bindFramebuffer(gl.FRAMEBUFFER, null)

// UNIFORMS ---------------------------
const baseUniforms: UniformDescs = {
  u_ModelMatrix: modelMat,
  u_ViewMatrix: viewMat,
  u_ProjectionMatrix: projMat,
}
const uniformSetters = G.getUniformSetters(program)

const renderUniforms: UniformDescs = {
  ...baseUniforms,
  u_Texture: renderTex,
}
const renderSetters = G.getUniformSetters(render)
// ------------------------------------

const icos = new Icosahedron(gl)
icos.linkProgram(program)
icos.rotate = { speed: 0.01, axis: [1, 0.5, 0.8] }

const quad = new Quad(gl)
quad.linkProgram(render)

gl.enable(gl.CULL_FACE)
gl.enable(gl.DEPTH_TEST)
gl.clearColor(0, 0, 0, 1)
gl.clearDepth(1.0)
function draw(now: number) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.viewport(0, 0, res.x, res.y)
  gl.useProgram(program)
  G.setUniforms(uniformSetters, {
    ...baseUniforms,
    u_ModelMatrix: icos.updateModelMatrix(now * 0.1),
  })
  gl.bindVertexArray(icos.VAO)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.drawElements(gl.LINES, 30 * 3, gl.UNSIGNED_SHORT, 0)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, 512, 512)
  gl.useProgram(render)
  G.setUniforms(renderSetters, {
    ...renderUniforms,
    //u_ViewMatrix: renderCam,
  })
  gl.bindVertexArray(quad.VAO)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.drawElements(gl.TRIANGLES, quad.numIndices, gl.UNSIGNED_SHORT, 0)

  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

  requestAnimationFrame(draw)
}

gl.canvas.addEventListener('click', () =>
  saveCanvasAsImage(gl.canvas, '03-space')
)

//const offscreen = renderOffscreen(gl.canvas, true)
//recordCanvas(offscreen, 40000, 'offscreen', draw)
requestAnimationFrame(draw)
//recordCanvas(gl.canvas, 5000, 'particles01', draw)
