export function createCanvas(width, height, name = 'canvas') {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  document.body.append(canvas)

  return canvas
}

export function createProgram(gl, vs, fs, transform_feedback_varyings = null) {
  const v_shader = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(v_shader, vs)
  gl.compileShader(v_shader)
  const f_shader = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(f_shader, fs)
  gl.compileShader(f_shader)

  const program = gl.createProgram()
  gl.attachShader(program, v_shader)
  gl.attachShader(program, f_shader)

  if (transform_feedback_varyings) {
    gl.transformFeedbackVaryings(
      program,
      transform_feedback_varyings,
      gl.INTERLEAVED_ATTRIBS
    )
  }

  gl.linkProgram(program)
  return program
}

export function createTexture(gl, w, h, data = null) {
  const t = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, t)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    w,
    h,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    data
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)

  return t
}

export function createSingleChannelTexture(gl, w, h, data = null) {
  const t = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, t)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R8,
    w,
    h,
    0,
    gl.RED,
    gl.UNSIGNED_BYTE,
    data
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  return t
}

export function createTextureFromCanvas(w, h, text) {
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.canvas.width = w
  ctx.canvas.height = h

  const lineWidth = 100
  const count = h / lineWidth
  const step = lineWidth * 2

  ctx.fillStyle = '#ddd'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#666'
  ctx.save()
  ctx.rotate(-0.785)
  for (let i = 0; i < count; i++) {
    ctx.fillRect(-w, i * step, w * 3, lineWidth)
  }
  ctx.restore()

  ctx.font = `${Math.floor(h * 0.33)}px sans-serif`
  ctx.fontWeight = 1000
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.save()
  ctx.scale(1, -1)
  ctx.fillStyle = 'black'
  ctx.fillText(text, w / 2, -h / 2)
  ctx.restore()
  return ctx.canvas
}

export function createVAO(gl, program, attrs) {
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  for (const name in attrs) {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(attrs[name]),
      gl.STATIC_DRAW
    )
    const location = gl.getAttribLocation(program, name)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
  }

  return vao
}

export function createBuffer(data) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW)

  return buffer
}

export function createVAOfromBuffer(program, buffer_opts) {
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer_opts.buffer)

  let offset = 0
  const attribs = buffer_opts.attributes
  for (const attr in attribs) {
    const location = gl.getAttribLocation(program, attr)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(
      location,
      attribs[attr].num_components,
      gl.FLOAT,
      false,
      buffer_opts.stride,
      offset
    )
    const type_size = 4

    offset += attribs[attr].num_components * type_size
  }
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  return vao
}

export function createFramebuffer(gl, tex) {
  const f = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, f)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0
  )
  return f
}

export function glEnumToString(gl, value) {
  for (let key in gl) {
    if (gl[key] === value) {
      return key
    }
  }
  return `0x${value.toString(16)}`
}

export function getErrors(gl) {
  const errors = gl.getError()
  if (errors > 0) {
    console.log(glEnumToString(gl, errors))
  }
}

export function log(...args) {
  const elem = document.createElement('pre')
  elem.textContent = [...args].join(' ')
  document.body.appendChild(elem)
}

export function readPixelsFromBuffer(x, y, w, h, attachment) {
  gl.readBuffer(attachment)
  const data = new Float32Array(4 * w * h)
  gl.readPixels(x, y, w, h, gl.RGBA, gl.FLOAT, data)
  log(glEnumToString(gl, attachment), data)

  return data
}

export function initVideo() {
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        video.srcObject = stream
      })
      .catch(function (error) {
        console.log('Something went wrong with the webcam...')
      })
  }
}

export function stopVideo(e) {
  const stream = video.srcObject
  const tracks = stream.getTracks()

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].stop()
  }

  video.srcObject = null
}

export function createData(w, h) {
  let d = []
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      let idx = (i + j * w) * 4
      d[idx] = i ^ j
      d[idx + 1] = i ^ j
      d[idx + 2] = i | j
      d[idx + 3] = 255
    }
  }
  return d
}

export function createBayerMatrix() {
  let d = []
  d.push(0, 32, 8, 40, 2, 34, 10, 42)
  d.push(48, 16, 56, 24, 50, 18, 58, 26)
  d.push(12, 44, 4, 36, 14, 46, 6, 38)
  d.push(60, 28, 52, 20, 62, 30, 54, 22)
  d.push(3, 35, 11, 43, 1, 33, 9, 41)
  d.push(51, 19, 59, 27, 49, 17, 57, 25)
  d.push(15, 47, 7, 39, 13, 45, 5, 37)
  d.push(63, 31, 55, 23, 61, 29, 53, 21)

  d = d.map((k) => Math.floor((k / 64) * 255))

  return new Uint8Array(d)
}

export function randomData(w, h) {
  let d = []
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      let idx = (i + j * w) * 4
      d[idx] = Math.random() * 255 - 128
      d[idx + 1] = Math.random() * 255 - 128
      d[idx + 2] = Math.random() * 255 - 128
      d[idx + 3] = Math.random() * 255 - 128
    }
  }
  return d
}

export function getRes() {
  return {
    x: window.innerWidth,
    y: window.innerHeight,
  }
}

export function drop(x, y) {
  gl.bindTexture(gl.TEXTURE_2D, textures[(count + 0) % 3])
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    x,
    y,
    1,
    1,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255])
  )
}

export function getTextHeight(w) {
  if (w > 200) return w / 10
  if (w > 150) return w / 8
  if (w > 100) return w / 3
  if (w > 0) return w / 6.5
}

export function stripes(ctx) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const lineWidth = 100
  const count = h / lineWidth
  const step = lineWidth * 2

  ctx.fillStyle = '#ddd'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#666'
  ctx.save()
  ctx.rotate(-0.785)
  for (let i = 0; i < count; i++) {
    ctx.fillRect(-w, i * step, w * 3, lineWidth)
  }
  ctx.restore()

  return ctx
}

export function createTextCanvas(w, h, text, bg_func = null) {
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.canvas.width = w
  ctx.canvas.height = h
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, w, h)
  let textHeight = getTextHeight(w)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  ctx.font = `bold ${textHeight}px sans-serif`
  //ctx.fontWeight = 8000

  const words = text.split(' ')
  const wordLen = (word) => ctx.measureText(word).width

  function generateNewLine(newLine, unused, maxLen) {
    newLine.push(unused.shift())
    while (wordLen(newLine.join(' ') + ' ' + unused[0]) < maxLen) {
      newLine.push(unused.shift())
    }
  }

  function generateStringArray(final, unused, maxLen) {
    if (unused.length < 1) return final
    else if (unused.length == 1) final.push(unused.pop())
    else if (unused.length >= 2) {
      let newLine = []
      generateNewLine(newLine, unused, maxLen)
      final.push(newLine.join(' '))
    }
    generateStringArray(final, unused, maxLen)
  }

  let lines = []
  generateStringArray(lines, words, w - 40)

  const totalHeight = lines.length * textHeight
  const yOffset = (h - totalHeight) / 2

  ctx.fillStyle = 'black'
  ctx.save()
  ctx.scale(1, -1)
  //ctx.translate(0, -h)
  //ctx.rotate(Math.PI / 2)
  ctx.translate(0, -h)
  for (let i = 0; i < lines.length; i++) {
    const lineYOffset = yOffset + i * textHeight
    ctx.fillText(lines[i], w / 2, lineYOffset)
  }
  ctx.restore()

  //bg_func(ctx)

  return ctx.canvas
}

export function noise_texture(ctx) {
  const simplex = new SimplexNoise()
  const w = ctx.canvas.width
  const h = ctx.canvas.height

  const img_data = ctx.getImageData(0, 0, w, h)
  const data = img_data.data

  const sx_scale = 0.00075

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const r = simplex.noise2D(x * sx_scale, y * sx_scale) * 0.5 + 0.5
      //const g = simplex.noise2D(x * sx_scale, y * sx_scale) * 0.5 + 0.5

      const rs = Math.round(r * 15) * 17 * 0.5
      //const gs = (Math.round(g * 15) * 17) / 2

      const p = (x + y * w) * 4

      const original_r = data[p + 0] / 255
      const original_g = data[p + 1] / 255
      const original_b = data[p + 2] / 255
      const original_a = data[p + 3] / 255

      data[p + 0] = original_r * rs
      data[p + 1] = original_g * rs
      data[p + 2] = original_b * rs
      data[p + 3] = original_a * (255 - rs)
    }
  }
  ctx.putImageData(img_data, 0, 0)

  return ctx
}

export function recordCanvas(canvas, duration, name, callback) {
  const videoStream = canvas.captureStream(60)
  const mediaRecorder = new MediaRecorder(videoStream)
  const downloadLink = document.createElement('a')
  downloadLink.innerText = 'Download'
  downloadLink.id = 'download'

  let chunks = []
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data)

  mediaRecorder.onstop = (e) => {
    const blob = new Blob(chunks, { type: 'video/webm; codecs=h264' })
    chunks = []

    document.body.appendChild(downloadLink)
    downloadLink.href = URL.createObjectURL(blob)
    downloadLink.download = `${name}.webm`
  }

  mediaRecorder.start()
  requestAnimationFrame(callback)
  setTimeout(() => mediaRecorder.stop(), duration)
}

export function renderOffscreen(glCanvas, display) {
  const renderCanvas = getRenderCanvas(glCanvas, display)
  const saveCtx = renderCanvas.getContext('2d')
  saveCtx.drawImage(glCanvas, 0, 0)

  return renderCanvas
}

export function saveCanvasAsImage(glCanvas, name) {
  const downloadImage = document.createElement('a')
  downloadImage.innerText = 'Download Image'
  downloadImage.id = 'downloadImage'
  downloadImage.download = `${name}.png`
  downloadImage.href = renderOffscreen(glCanvas)
    .toDataURL('image/png')
    .replace('image/png', 'image/octet-stream')
  document.body.appendChild(downloadImage)
}

export function getRenderCanvas(glCanvas, display) {
  let renderCanvas = document.getElementById('render-canvas')
  if (!renderCanvas) {
    renderCanvas = document.createElement('canvas')
    renderCanvas.id = 'render-canvas'
    renderCanvas.width = glCanvas.width
    renderCanvas.height = glCanvas.height
    if (display) document.body.appendChild(renderCanvas)
  }

  return renderCanvas
}

export function generateIQPalette(r) {
  //prettier-ignore
  return [
    r(), r(), r(), 0,
    r(), r(), r(), 0,
    r(), r(), r(), 0,
    r(), r(), r(), 0,
  ]
}
