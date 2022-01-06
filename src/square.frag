#define MAX_ITERS 128
#define MAX_DIST  100.
#define EPS .001
#define PI 3.1415926538
#define TWO_PI 6.283185
#define PHI 1.6180339887
#define INV_PHI 0.6180339887
#define DELTA				0.001
#define RAY_COUNT			100
#define RAY_LENGTH_MAX		100.0
#define RAY_STEP_MAX		7
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

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;

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

vec3 opTwistX(vec3 p, float k) {
  float c = cos(k * p.x);
  float s = sin(k * p.x);
  float ry = p.y * c - p.z * s;
  float rz = p.y * s + p.z * c;
  vec3 q = vec3(p.x, ry, rz);
  return q;
}

vec3 opTwistY(vec3 p, float k) {
  float c = cos(k * p.y);
  float s = sin(k * p.y);
  float rx = p.x * c - p.z * s;
  float rz = p.x * s + p.z * c;
  vec3 q = vec3(rx, p.y, rz);
  return q;
}

//function opTwistZ(p, k) {
  //const c = Math.cos(k * p.z);
  //const s = Math.sin(k * p.z);
  //const rx = p.x * c - p.y * s;
  //const ry = p.x * s + p.y * c;
  //const q = new Vector3(rx, ry, p.z);
  //return q;
//}

float d2(vec3 p) {
  float t = u_time * 0.015;
  //p /= 200.;
  p.x -= t;
  p.y += sin(p.x * 2. + t) * 0.12;
  vec3 c = 0.8 * vec3(sin(p.x + cos(u_time * 2.0) * .8), sin(p.y + u_time * 0.2), sin(p.z * cos(u_time * 3.0) * 0.8));
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

float square(vec3 p, float d) {
  float pl = plane(p, vec3(d), vec3(0, 0, 1));
  float pl_l = plane(p, vec3(-d * 20., 0, 0), vec3(1, 0, 0));
  float pl_r = plane(p, vec3(d * 20., 0, 0), vec3(-1, 0, 0));
  return  min(min(pl, pl_l), pl_r);
}

float sdBox( vec3 p, vec3 b ) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
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

  float time = u_time * 0.1;

  //p = rot3d(p, vec3(1,0,0), time);
  vec3 q = rot3d(p, vec3(0,0,1), PI/2.);
  //vec3 q = p;

  float k = 64.0;

  //float disp = displacement(p, vec3(0.0001), time) * 0.2;
  //float disp = d2(q);

  //res = smin(res, sphere(p, 1.5), k);// + disp;
  //res = smin(res, cube(q, 1.0), k);// + disp;
  //res = smin(res, octahedron(p, 1.0), k);// + disp;
  //res = smin(res, dodecahedron(p, 1.0), k);// + disp;
  //res = smin(res, icosahedron(q, 1.5), k);// + disp;
  //res = smin(res, tetrahedron(p, 1.0), k);// + disp;
  
  float t = sin(time * 8.) * 1.2;
  float s = sign(t) * pow(t, 2.0);
  vec3 twist = opTwistX(q, s);
  //twist = opTwistY(twist, s * 0.5);
  float box = sdBox(twist, vec3(1, 1, 1));

  res = smin(res, box, k);

  //res = smin(res, xzPlane(p, -3.5), k);
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

void main(void) {
  vec2 uv = (2. * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
  vec3 cam_pos = vec3(0, 0.01, 4);
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
  vec3 col = d > 0. ? vec3(brightness) : vec3(0);

  col *= vec3(0.0, 0.86, 5.0);


  gl_FragColor = vec4(col, 1.0);
}
