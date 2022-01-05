import { GL_Handler, Geometry } from 'gl-handler'
import { vec3, mat4 } from 'gl-matrix'
import SimplexNoise from 'simplex-noise'

type UniformDescs = {
  [key: string]: number | number[] | mat4 | vec3 | WebGLTexture
}

export default class PointSphere extends Geometry {
  private _numPoints: number

  constructor(gl: WebGL2RenderingContext, _numPoints: number) {
    super(gl)

    this._verts = []
    this._numPoints = _numPoints

    const simplex = new SimplexNoise()
    for (let i = 0; i < _numPoints; i++) {
      const x = Math.random() * 2 - 1
      const z = Math.random() * 2 - 1
      const y = simplex.noise2D(x, z) * 0.5
      const y_ = simplex.noise2D(x * 2, z * 2) * 0.6
      this._verts.push(x, y * y_, z)
    }
  }

  public linkProgram(_program: WebGLProgram) {
    /*
     * Finds all the relevant uniforms and attributes in the specified
     * program and links.
     */
    this._buffers.push(this.gl.createBuffer())

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._buffers[0])
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this._verts),
      this.gl.STATIC_DRAW
    )

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)

    const positionAttrib = {
      i_Position: {
        location: this.gl.getAttribLocation(_program, 'i_Position'),
        num_components: 3,
        type: this.gl.FLOAT,
        size: 4,
      },
    }

    this._VAOs.push(this.gl.createVertexArray())
    const VAO_desc = [
      {
        vao: this._VAOs[0],
        buffers: [
          {
            buffer_object: this._buffers[0],
            stride: 0,
            attributes: positionAttrib,
          },
        ],
      },
    ]
    VAO_desc.forEach((VAO) => this.setupVAO(VAO.buffers, VAO.vao))
  }
}

const vert = `#version 300 es
precision mediump float;

in vec3 i_Position;

uniform mat4 u_ProjectionMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ModelMatrix;

void main(){
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(i_Position, 1.0);
    gl_PointSize = (gl_Position.z * -1.0) + 6.0;
}`

const frag = `#version 300 es
precision mediump float;

out vec4 OUTCOLOUR;

void main(){
    float distance = length(2.0 * gl_PointCoord - 1.0);
    if (distance > 1.0) {
            discard;
    }
    OUTCOLOUR = vec4(0.0, 0.0, 0.0, 1.0);
}`

const G = new GL_Handler()
const canvas = G.canvas(512, 512)
const gl = G.gl
const pointsProgram = G.shaderProgram(vert, frag)

const camPos: [number, number, number] = [0, 2, 3]
let viewMat = G.viewMat({ pos: vec3.fromValues(...camPos) })
const projMat = G.defaultProjMat()
const modelMat = mat4.create()

const points = new PointSphere(gl, 10000)
points.linkProgram(pointsProgram)
points.rotate = { speed: 0.0005, axis: [0, 1, 0] }

const baseUniforms: UniformDescs = {
  u_ModelMatrix: modelMat,
  u_ViewMatrix: viewMat,
  u_ProjectionMatrix: projMat,
}

const uniformSetters = G.getUniformSetters(pointsProgram)
gl.useProgram(pointsProgram)
G.setUniforms(uniformSetters, baseUniforms)
gl.bindVertexArray(points.VAO)
gl.clearDepth(1.0)
gl.enable(gl.CULL_FACE)
gl.enable(gl.DEPTH_TEST)

function draw(time) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.clearColor(0.9, 0.9, 0.9, 1)

  G.setUniforms(uniformSetters, {
    ...baseUniforms,
    u_ModelMatrix: points.updateModelMatrix(time),
  })

  gl.drawArrays(gl.POINTS, 0, points.numVertices)

  requestAnimationFrame(draw)
}

requestAnimationFrame(draw)
