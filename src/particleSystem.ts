import { Geometry } from 'gl-handler'
import { mat4 } from 'gl-matrix'

export interface PSOptions {
  dimensions?: number
  numParticles?: number
  birthRate?: number
  lifeRange?: number[]
  directionRange?: [number, number]
  speedRange?: [number, number]
  gravity?: [number, number]
}

export default class ParticleSystem extends Geometry {
  private _options: PSOptions = {
    dimensions: 2,
    numParticles: 100,
    birthRate: 0.5,
    lifeRange: [1.01, 1.15],
    directionRange: [Math.PI / 2 - 0.5, Math.PI / 2 + 0.5], // -PI to PI
    speedRange: [0.5, 1.0],
    gravity: [0.0, -0.8],
  }
  private _read = 0
  private _write = 1
  private _bornParticles = 0

  constructor(gl: WebGL2RenderingContext, _options?: PSOptions) {
    super(gl)

    this._options = {
      ...this._options,
      ..._options,
    }

    this._verts = []

    for (let i = 0; i < this._options.numParticles; ++i) {
      // Position
      for (let i = 0; i < this._options.dimensions; ++i) {
        this._verts.push(0)
      }
      // Velocity
      for (let i = 0; i < this._options.dimensions; ++i) {
        this._verts.push(0)
      }

      // Life
      let life =
        this._options.lifeRange[0] +
        Math.random() *
          (this._options.lifeRange[1] - this._options.lifeRange[0])
      this._verts.push(life + 0.1, life)
    }
  }

  get read() {
    return this._read
  }
  get write() {
    return this._write
  }
  set read(_val) {
    this._read = _val
  }
  set write(_val) {
    this._write = _val
  }

  get VAOs() {
    return this._VAOs
  }
  get buffers() {
    return this._buffers
  }

  get VAO() {
    const tmp = this._read
    this._read = this._write
    this._write = tmp
    return this._VAOs[tmp]
  }

  get numVertices() {
    // return this._numParticles;
    return this._bornParticles
  }

  linkProgram(_updateProgram: WebGLProgram, _renderProgram: WebGLProgram) {
    this._buffers.push(this.gl.createBuffer(), this.gl.createBuffer())

    const data = new Float32Array(this._verts)
    /* PUT DATA IN THE BUFFERS */
    for (const buffer of this._buffers) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
      this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STREAM_DRAW)
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)

    this._VAOs.push(
      this.gl.createVertexArray() /* update 1 */,
      this.gl.createVertexArray() /* update 2 */,
      this.gl.createVertexArray() /* render 1 */,
      this.gl.createVertexArray() /* render 2 */
    )

    const updateAttributes = {
      i_Position: {
        location: this.gl.getAttribLocation(_updateProgram, 'i_Position'),
        num_components: this._options.dimensions,
        type: this.gl.FLOAT,
        size: 4,
      },
      i_Velocity: {
        location: this.gl.getAttribLocation(_updateProgram, 'i_Velocity'),
        num_components: this._options.dimensions,
        type: this.gl.FLOAT,
        size: 4,
      },
      i_Age: {
        location: this.gl.getAttribLocation(_updateProgram, 'i_Age'),
        num_components: 1,
        type: this.gl.FLOAT,
        size: 4,
      },
      i_Life: {
        location: this.gl.getAttribLocation(_updateProgram, 'i_Life'),
        num_components: 1,
        type: this.gl.FLOAT,
        size: 4,
      },
    }

    const renderAttributes = {
      i_Position: {
        location: this.gl.getAttribLocation(_renderProgram, 'i_Position'),
        num_components: this._options.dimensions,
        type: this.gl.FLOAT,
        size: 4,
      },
      i_Velocity: {
        location: this.gl.getAttribLocation(_renderProgram, 'i_Velocity'),
        num_components: this._options.dimensions,
        type: this.gl.FLOAT,
        size: 4,
      },
      i_Age: {
        location: this.gl.getAttribLocation(_renderProgram, 'i_Age'),
        num_components: 1,
        type: this.gl.FLOAT,
        size: 4,
      },
      i_Life: {
        location: this.gl.getAttribLocation(_renderProgram, 'i_Life'),
        num_components: 1,
        type: this.gl.FLOAT,
        size: 4,
      },
    }

    const VAO_desc = [
      {
        vao: this._VAOs[0],
        buffers: [
          {
            buffer_object: this._buffers[0],
            stride: 4 * (this._options.dimensions * 2 + 2),
            attributes: updateAttributes,
          },
        ],
      },
      {
        vao: this._VAOs[1],
        buffers: [
          {
            buffer_object: this._buffers[1],
            stride: 4 * (this._options.dimensions * 2 + 2),
            attributes: updateAttributes,
          },
        ],
      },
      {
        vao: this._VAOs[2],
        buffers: [
          {
            buffer_object: this._buffers[0],
            stride: 4 * (this._options.dimensions * 2 + 2),
            attributes: renderAttributes,
          },
        ],
      },
      {
        vao: this._VAOs[3],
        buffers: [
          {
            buffer_object: this._buffers[1],
            stride: 4 * (this._options.dimensions * 2 + 2),
            attributes: renderAttributes,
          },
        ],
      },
    ]

    VAO_desc.forEach((VAO) => this.setupVAO(VAO.buffers, VAO.vao))
  }

  public getNumParticles(_dT: number) {
    const num_part = this._bornParticles
    if (this._bornParticles < this._options.numParticles) {
      this._bornParticles = Math.min(
        this._options.numParticles,
        Math.floor(this._bornParticles + this._options.birthRate * _dT)
      )
    }
    return num_part
  }

  public step(_dT: number) {
    const num_part = this._bornParticles
    if (this._bornParticles < this._options.numParticles) {
      this._bornParticles = Math.min(
        this._options.numParticles,
        Math.floor(this._bornParticles + this._options.birthRate * _dT)
      )
    }
  }
}
