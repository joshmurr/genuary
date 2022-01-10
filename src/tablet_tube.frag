#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

out vec4 color;

#define MAX_DIST 99.
#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))


float map(vec3 p){
  float h = sin(u_time) * 0.5 + 0.5;
  p.xy *= rot(u_time*0.5);
  p.xz *= rot(u_time*0.5);
  //float h = 1.0;
  p.x -= clamp(p.x, -h, h);
  return length(vec2(length(p.xy) - 0.3, p.z))-.1;
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
