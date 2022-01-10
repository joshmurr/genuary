#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

out vec4 color;

#define MAX_DIST 99.
#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))


float sdHexagon(vec2 p, float r){
  const vec3 k = vec3(-0.866025404,0.5,0.577350269);
  p = abs(p);
  p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
  p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
  return length(p)*sign(p.y);
}

float sdStar5(in vec2 p, in float r, in float rf) {
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x,k1.y);
    p.x = abs(p.x);
    p -= 2.0*max(dot(k1,p),0.0)*k1;
    p -= 2.0*max(dot(k2,p),0.0)*k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1);
    float h = clamp( dot(p,ba)/dot(ba,ba), 0.0, r );
    return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
}

float map(vec3 p){
  p.xy *= rot(u_time*0.5);
  p.xz *= rot(u_time*0.5);
  float sdf2d = sdHexagon(p.xy, 0.6);
  return sdHexagon(vec2(sdf2d, p.z), 0.3);
}

void main(){
  vec2 uv= (gl_FragCoord.xy-.5 * u_resolution)/u_resolution.y;
  vec3 rd=normalize(vec3(uv,1));

  vec3 p=vec3(0,0,-3);
  float d=1.;
  float i=0.;
  for(;++i<MAX_DIST && d>.001;){
    d = map(p);
    p += rd*d;
  }
  if(d<.001){
    color = vec4(vec3(3./i), 1);
  }
}
