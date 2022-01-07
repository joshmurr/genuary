import { Geometry } from 'gl-handler'
import { mat4 } from 'gl-matrix'

export default class Quad extends Geometry {
  constructor(gl) {
    super(gl)
    this._indexedGeometry = true
    this._verts = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]
    this._texCoords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]

    this._normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]
    // For use with TRIANGLES
    this._indices = [0, 1, 2, 0, 2, 3]
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
      new Float32Array(this._texCoords),
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
    const texAttrib = {
      i_TexCoord: {
        location: this.gl.getAttribLocation(_program, 'i_TexCoord'),
        num_components: 2,
        type: this.gl.FLOAT,
        size: 1,
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
            attributes: texAttrib,
          },
        ],
      },
    ]

    VAO_desc.forEach((VAO) => this.setupVAO(VAO.buffers, VAO.vao))
  }
}
