import { Geometry } from 'gl-handler'
import { mat4 } from 'gl-matrix'
import { HSVtoRGB } from './utils'

export default class Icosahedron extends Geometry {
  constructor(gl) {
    super(gl)
    this._indexedGeometry = true

    this._verts = [
      0.0, 0.0, 1.0, 0.894, 0.0, 0.447, 0.276, 0.851, 0.447, -0.724, 0.526,
      0.447, -0.724, -0.526, 0.447, 0.276, -0.851, 0.447, 0.724, 0.526, -0.447,
      -0.276, 0.851, -0.447, -0.894, 0.0, -0.447, -0.276, -0.851, -0.447, 0.724,
      -0.526, -0.447, 0.0, 0.0, -1.0,
    ]

    this._indices = [
      0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 1, 11, 7, 6, 11, 8, 7, 11, 9, 8,
      11, 10, 9, 11, 6, 10, 1, 6, 2, 2, 7, 3, 3, 8, 4, 4, 9, 5, 5, 10, 1, 6, 7,
      2, 7, 8, 3, 8, 9, 4, 9, 10, 5, 10, 6, 1,
    ]

    this._normals = []
    // Vertex Normals
    for (let i = 0; i < this._verts.length; i += 3) {
      let x = this._verts[i]
      let y = this._verts[i + 1]
      let z = this._verts[i + 2]
      let len = Math.sqrt(x * x + y * y + z * z)
      this._normals.push(x / len, y / len, z / len)
    }

    // Colour per Vertex
    this._colors = []
    for (let i = 0; i < this._verts.length; i++) {
      const c = i / this._verts.length
      const [R, G, B] = HSVtoRGB(c, 1.0, 1.0)
      this._colors.push(R, G, B, 1.0)
    }
  }

  linkProgram(_program) {
    this._buffers.push(
      this.gl.createBuffer(),
      this.gl.createBuffer(),
      this.gl.createBuffer()
    )

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._buffers[0])
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this._verts),
      this.gl.STATIC_DRAW
    )
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._buffers[1])
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this._normals),
      this.gl.STATIC_DRAW
    )
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._buffers[2])
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this._colors),
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
    const normalAttrib = {
      i_Normal: {
        location: this.gl.getAttribLocation(_program, 'i_Normal'),
        num_components: 3,
        type: this.gl.FLOAT,
        size: 4,
      },
    }
    const colorAttrib = {
      i_Color: {
        location: this.gl.getAttribLocation(_program, 'i_Color'),
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
          {
            buffer_object: this._buffers[1],
            stride: 0,
            attributes: normalAttrib,
          },
          {
            buffer_object: this._buffers[2],
            stride: 0,
            attributes: colorAttrib,
          },
        ],
      },
    ]

    VAO_desc.forEach((VAO) => this.setupVAO(VAO.buffers, VAO.vao))
  }
}
