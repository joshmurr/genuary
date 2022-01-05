import { mat4, vec3 } from 'gl-matrix'

export interface PSOptions {
  dimensions?: number
  numParticles?: number
  birthRate?: number
  lifeRange?: number[]
  directionRange?: [number, number]
  speedRange?: [number, number]
  gravity?: [number, number]
}

export type UniformDescs = {
  [key: string]: number | number[] | mat4 | vec3 | WebGLTexture
}
