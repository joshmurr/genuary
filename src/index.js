import {
  createCanvas,
  createProgram,
  createVAO,
  createTextCanvas,
  createTexture,
  createBayerMatrix,
  createSingleChannelTexture,
  createFramebuffer,
  getRes,
} from './utils'
const screen = { x: 1000, y: 1000 } //getRes()
const gl = createCanvas(screen.x, screen.y).getContext('webgl2')
let MOUSE = {
  x: 0,
  y: 0,
  click: 0,
}
const SCALE = 10
const RES = { x: Math.floor(screen.x / SCALE), y: Math.floor(screen.y / SCALE) }

const simple_vert = `#version 300 es
  in vec4 a_position;
  in vec2 a_texcoord;
  out vec2 v_texcoord;

  void main(){
    gl_Position = a_position;
    v_texcoord = a_texcoord;
  }
`
const in_frag = `#version 300 es
  #define TAU 6.28318530718
  #define MAX_ITER 5

  precision highp float;
  precision highp sampler2D;

  in vec2 v_texcoord;
  uniform sampler2D u_tex;
  uniform float u_frame;
  uniform vec2 u_resolution;
  uniform vec3 u_mouse;
  out vec4 outcolor;

  void main(){
    float time = u_frame * 0.001;

    vec2 uv = gl_FragCoord.xy / u_resolution;

    vec2 p = mod(uv*TAU, TAU)-250.0;

    vec2 i = vec2(p);
    float c = 1.0;
    float inten = .005;

    for (int n = 0; n < MAX_ITER; n++) {
      float t = time * (1.0 - (3.5 / float(n+1)));
      i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
      c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
    }
    c /= float(MAX_ITER);
    c = 1.17-pow(c, 1.4);
    vec3 colour = vec3(pow(abs(c), 8.0));
    colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);
    

	
    outcolor = vec4(colour, 1.0);
  }
`

const dd_fs = `#version 300 es
	#define MAX_ITERS 512
	#define MAX_DIST  100.
	#define EPS .01
	#define PI 3.1415926538
	#define TWO_PI 6.283185
	#define PHI 1.6180339887
	#define INV_PHI 0.6180339887
	#define DELTA				0.001
	#define RAY_COUNT			7
	#define RAY_LENGTH_MAX		100.0
	#define RAY_STEP_MAX		100
	#define LIGHT				vec3 (1.0, 1.0, -1.0)
	#define REFRACT_FACTOR		0.6
	#define REFRACT_INDEX		1.6
	#define AMBIENT				0.2
	#define SPECULAR_POWER		3.0
	#define SPECULAR_INTENSITY	0.5
	#define FADE_POWER			1.0
	#define M_PI				3.1415926535897932384626433832795
	#define GLOW_FACTOR			1.5
	#define LUMINOSITY_FACTOR	2.0

  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_frame;
  out vec4 outcolor;
	in vec4 v_position;


	vec3 rot3d(vec3 p, vec3 ax, float angle) {
		float d1 = dot(p, ax);
		vec3 cen = d1*ax;
		float rad = length(cen - p);
		vec3 right = normalize(cen - p);
		vec3 up = normalize(cross(right, ax));
		return cen + right*rad*cos(angle) + up*rad*sin(angle);
	}

	float sphere(vec3  p, float s) {
	  return length(p) - s;
	}

	float displacement(vec3 p, vec3 d, float t) {
		return sin(d.x*p.x+t)*sin(d.y*p.y+t)*sin(d.y*p.z+t);
	}

	float d2(vec3 p) {
		float t = u_frame * 0.015;
		//p /= 200.;
		p.x -= t;
		p.y += sin(p.x * 2. + t) * 0.12;
		vec3 c = 0.8 * vec3(sin(p.x + cos(u_frame * 2.0) * .8), sin(p.y + u_frame * 0.2), sin(p.z * cos(u_frame * 3.0) * 0.8));
		c = smoothstep(c+.5, c, vec3(.71));
		c = clamp(c, vec3(0), vec3(1.));

		return dot(c, vec3(0.3));

	}

	float intersectObjects(float d1, float d2) {
		if(d1 > d2) return d1;
		return d2;
	}

	float donut(vec3 p, vec2 t) {
		vec2 q = vec2(length(p.xz) - t.x, p.y);
		return length(q)-t.y;
	}

	float cube(vec3 p, float d) {
		return length(max(abs(p) - d, 0.0));
	}

	float smin(float d1, float d2, float k){
		float res = exp(-k*d1) + exp(-k*d2);
		return -log(max(0.0001, res)) / k;
	}

	float opu(float d1, float d2) {
		return min(d1, d2);
	}

	float plane(vec3 p, vec3 origin, vec3 normal) {
		return dot(p - origin, normal);
	}

	float xzPlane(vec3 p, float y) {
		return p.y - y;
	}

	float xyPlane(vec3 p, float z) {
		return p.z - z;
	}

	float doublePlane(vec3 p, vec3 origin, vec3 normal) {
		return max(dot(p - origin, normal), dot(-p - origin, normal));
	}

	float tetrahedron(vec3 p, float d) {
		float dn = 1.0 / sqrt(3.0);

		float sd1 = plane(p, vec3( d, d, d), vec3(-dn,  dn,  dn));
		float sd2 = plane(p, vec3( d,-d,-d), vec3( dn, -dn,  dn));
		float sd3 = plane(p, vec3(-d, d,-d), vec3( dn,  dn, -dn));
		float sd4 = plane(p, vec3(-d,-d, d), vec3(-dn, -dn, -dn));

		return max(max(sd1, sd2), max(sd3, sd4));
	}

	float octahedron(vec3 p, float d) {
		float t1 = tetrahedron( p, d);
		float t2 = tetrahedron(-p, d);

		return intersectObjects(t1, t2);
	}

	float dodecahedron(vec3 p, float d) {
		vec3 v = normalize(vec3(0.0, 1.0, PHI));
		vec3 w = normalize(vec3(0.0, 1.0,-PHI));

		float ds = doublePlane(p, d*v    , v);
		ds =   max(doublePlane(p, d*w    , w), ds);
		ds =   max(doublePlane(p, d*v.zxy, v.zxy),ds);
		ds =   max(doublePlane(p, d*v.yzx, v.yzx),ds);


		ds =   max(doublePlane(p, d*w.zxy, w.zxy),ds);
		ds =   max(doublePlane(p, d*w.yzx, w.yzx),ds);
		
		return ds;
	}

	float icosahedron(vec3 p, float d) {
		float h = 1.0/sqrt(3.0);

		vec3 v1 = h* vec3(1.0,1.0,1.0);
    vec3 v2 = h* vec3(-1.0,1.0,1.0);
    vec3 v3 = h* vec3(-1.0,1.0,-1.0);
    vec3 v4 = h* vec3(1.0,1.0,-1.0);
   
    vec3 v5 = h* vec3(0.0,INV_PHI,PHI);
    vec3 v6 = h* vec3(0.0,INV_PHI,-PHI);
    
    float ds = doublePlane(p,d*v1,v1);
    //max == intesect objects
		ds = max(doublePlane(p,d*v2,v2),ds);
    ds = max(doublePlane(p,d*v3,v3),ds); 
    ds = max(doublePlane(p,d*v4,v4),ds);
    ds = max(doublePlane(p,d*v5,v5),ds); 
    ds = max(doublePlane(p,d*v6,v6),ds);
    
    //plus cyclic permutaions of v5 and v6:
    ds = max(doublePlane(p,d*v5.zxy,v5.zxy),ds); 
    ds = max(doublePlane(p,d*v5.yzx,v5.yzx),ds);
    ds = max(doublePlane(p,d*v6.zxy,v6.zxy),ds);
    ds = max(doublePlane(p,d*v6.yzx,v6.yzx),ds);

		return ds;
	}

	float scene(vec3 p) {
		float res = 1e10;

    float time = u_frame * 0.01;

		//p = rot3d(p, vec3(1,0,0), time);
		vec3 q = rot3d(p, vec3(0,1,0), time);

		float k = 64.0;

		//float disp = displacement(p, vec3(6.8), time) * 0.2;
		float disp = d2(q);

		//res = smin(res, sphere(p, 1.5), k);// + disp;
		//res = smin(res, cube(p, 1.0), k);// + disp;
		//res = smin(res, octahedron(p, 1.0), k);// + disp;
		//res = smin(res, dodecahedron(p, 1.0), k);// + disp;
		res = smin(res, icosahedron(q, 1.5), k);// + disp;

    res = smin(res, xzPlane(p, -3.5), k);
    //res = smin(res, xyPlane(p, -1.75), k);

		return res;
	}

	vec3 get_normals(vec3 p) {
		float x1 = scene(p + vec3(EPS, 0, 0));
		float x2 = scene(p - vec3(EPS, 0, 0));
		float y1 = scene(p + vec3(0, EPS, 0));
		float y2 = scene(p - vec3(0, EPS, 0));
		float z1 = scene(p + vec3(0, 0, EPS));
		float z2 = scene(p - vec3(0, 0, EPS));
		return normalize(vec3(x1-x2, y1-y2, z1-z2));
	}

	float rayStepCount = 0.0;
	float intersect(vec3 ro, vec3 rd) {
		rayStepCount = 0.0;
		float d = 0., closest = 10000.;
		for(int i=0; i<MAX_ITERS; i++) {
			float td = scene(ro + rd*d);
			closest = min(closest, td);
			if(closest < EPS) break;
			d += td;
			++rayStepCount;
			if(d > MAX_DIST) break;
		}
		return closest < EPS ? d : -1.;
	}

	float checkers( in vec3 p ) {
    vec3 s = sign(fract(p*5.0)-.5);
    return .5 - .5*s.x*s.y;
	}

	mat3 mRotate (in vec3 angle) {
		float c = cos (angle.x);
		float s = sin (angle.x);
		mat3 rx = mat3 (1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);

		c = cos (angle.y);
		s = sin (angle.y);
		mat3 ry = mat3 (c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);

		c = cos (angle.z);
		s = sin (angle.z);
		mat3 rz = mat3 (c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);

		return rz * ry * rx;
	}

	
	vec3 k;
	float getDistance (in vec3 p) {
		float repeat = 20.0;
		vec3 q = p + repeat * 0.5;
		k = floor (q / repeat);
		q -= repeat * (k + 0.5);
		p = mRotate (k) * q;

		float top = p.y - 3.0;
		float angleStep = M_PI / max (2.0, abs (k.x + 2.0 * k.y + 4.0 * k.z));
		float angle = angleStep * (0.5 + floor (atan (p.x, p.z) / angleStep));
		float side = cos (angle) * p.z + sin (angle) * p.x - 2.0;
		float bottom = -p.y - 3.0;

		return max (top, max (side, bottom));
	}

  void main() {
		vec2 uv = (2. * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
		vec3 cam_pos = vec3(0, 1.1, 4);
		vec3 look_at = vec3(0);
		vec3 cam_dir = normalize(look_at - cam_pos);
		vec3 world_up = vec3(0, 1, 0);
		vec3 cam_right = normalize(cross(cam_dir, world_up));
		vec3 cam_up = normalize(cross(cam_right, cam_dir));
		float foc_dist = 1.0;
		vec3 pix_pos = cam_pos + foc_dist*cam_dir + cam_right*uv.x + cam_up*uv.y;
		vec3 ray_dir = normalize(pix_pos - cam_pos);

		float d = intersect(cam_pos, ray_dir);
		vec3 p = cam_pos + d*ray_dir;

		vec3 normals = get_normals(p);
		vec3 light_pos = vec3(10);
		vec3 light_dir = normalize(light_pos - p);
		float ambient = .1;
		float brightness = max(dot(light_dir, normals), ambient);
		vec3 col = d > 0. ? vec3(brightness) : vec3(0);// mix(vec3(1.00, 0.64, 0.79), vec3(0.74, 0.18, 0.40), vec3(uv.g, uv));
  
  if((d) > 5.0) {
      float check = checkers(p);
      //vec3 red = vec3(1.0, 0.3, 0.0);
      //vec3 blue = vec3(0.0, 0.5, 1.0);
      col *= mix(vec3(0.2), vec3(0.4), check);
    }

    //col *= vec3(1.0, 0.64, 0.8);

		outcolor = vec4(col, 1.0);
  }
`

const out_frag = `#version 300 es
  precision highp float;
  precision highp sampler2D;

  in vec2 v_texcoord;
  uniform sampler2D u_output;
  uniform vec2 u_resolution;
  out vec4 outcolor;


  void main(){
    outcolor = texture(u_output, v_texcoord);
  }
`

// SETUP SHADER PROGRAM --------------------------------
const program = createProgram(gl, simple_vert, dd_fs)
const output = createProgram(gl, simple_vert, out_frag)
//const actual_output = createProgram(gl, actual_out_vs, actual_out_fs)
// -----------------------------------------------------

// POSITION BUFFER -------------------------------------
const attributes = {
  a_position: [-1, -1, -1, 1, 1, -1, -1, 1, 1, 1, 1, -1],
  a_texcoord: [0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0],
}
const vao = createVAO(gl, program, attributes)
const out_vao = createVAO(gl, output, attributes)
// -----------------------------------------------------

// TEXTURE ---------------------------------------------
const black = new Uint8Array(RES.x * RES.y * 4).fill(128)
const text_canvas = createTextCanvas(
  RES.x,
  RES.y,
  'This is a longer sentence with words words...'
)
const text = createTexture(gl, RES.x, RES.y, text_canvas)
const tex_out = createTexture(gl, RES.x, RES.y)
const bayerMatrix = createBayerMatrix()
const tex_bayer = createSingleChannelTexture(gl, 8, 8, bayerMatrix)
// -----------------------------------------------------

// FRAMEBUFFER -----------------------------------------
const framebuffer = createFramebuffer(gl, tex_out)
// -----------------------------------------------------

// UNIFORMS --------------------------------------------
const u_tex = gl.getUniformLocation(program, 'u_tex')
const u_resolution = gl.getUniformLocation(program, 'u_resolution')
const u_mouse = gl.getUniformLocation(program, 'u_mouse')
const u_frame = gl.getUniformLocation(program, 'u_frame')

const u_resolutionOut = gl.getUniformLocation(output, 'u_resolution')
const u_frame_ = gl.getUniformLocation(output, 'u_frame')
const u_output = gl.getUniformLocation(output, 'u_output')
const u_bayer = gl.getUniformLocation(output, 'u_bayer')
// -----------------------------------------------------

let count = 0

let frame = 0
function step() {
  let a = count % 3
  let b = (count + 1) % 3
  let c = (count + 2) % 3

  gl.useProgram(program)
  gl.bindVertexArray(vao)
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex_out,
    0
  )
  gl.viewport(0, 0, RES.x, RES.y)

  gl.uniform1i(u_tex, 0)
  gl.activeTexture(gl.TEXTURE0 + 0)
  gl.bindTexture(gl.TEXTURE_2D, text)

  gl.uniform1f(u_frame, frame++)
  gl.uniform2f(u_resolution, RES.x, RES.y)
  gl.uniform3f(u_mouse, MOUSE.x, MOUSE.y, MOUSE.click)
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  gl.useProgram(output)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.bindVertexArray(out_vao)

  gl.viewport(0, 0, screen.x, screen.y)
  gl.uniform2f(u_resolutionOut, screen.x, screen.y)
  gl.uniform1i(u_output, 0)
  gl.activeTexture(gl.TEXTURE0 + 0)
  gl.bindTexture(gl.TEXTURE_2D, tex_out)
  gl.uniform1i(u_bayer, 1)
  gl.activeTexture(gl.TEXTURE0 + 1)
  gl.bindTexture(gl.TEXTURE_2D, tex_bayer)
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  count += 2

  requestAnimationFrame(step)
}
step()

//recordCanvas(
//document.getElementsByTagName('canvas')[0],
//15000,
//'10000_pixels',
//step
//)
function recordCanvas(canvas, duration, name, callback) {
  const videoStream = canvas.captureStream(60)
  const mediaRecorder = new MediaRecorder(videoStream)
  const downloadLink = document.createElement('a')
  downloadLink.innerText = 'Download'
  downloadLink.id = 'download'

  let chunks = []
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data)

  mediaRecorder.onstop = (e) => {
    const blob = new Blob(chunks, { type: 'video/webm; codecs=vp9' })
    chunks = []

    document.body.appendChild(downloadLink)
    downloadLink.href = URL.createObjectURL(blob)
    downloadLink.download = `${name}.webm`
  }
  mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data)
  }

  mediaRecorder.start()
  requestAnimationFrame(callback)
  setTimeout(() => mediaRecorder.stop(), duration)
}

document
  .getElementsByTagName('canvas')[0]
  .addEventListener('mousemove', function (e) {
    const rect = this.getBoundingClientRect()
    MOUSE.x = e.clientX - rect.left
    MOUSE.y = rect.height - (e.clientY - rect.top) - 1
    MOUSE.x /= SCALE
    MOUSE.y /= SCALE
  })

let timeout
window.addEventListener('mousemove', (e) => {
  clearTimeout(timeout)
  MOUSE.click = 1
  timeout = setTimeout(function () {
    MOUSE.click = 0
  }, 500)
})
window.addEventListener('mouseup', (e) => (MOUSE.click = 0))
