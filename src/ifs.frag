#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

#define PI 3.14159265359
#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))

float sdSphere( vec3 p, float s ){
  return length(p)-s;
}

float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}


float sdCutHollowSphere( vec3 p, float r, float h, float t ) {
  // sampling independent computations (only depend on shape)
  float w = sqrt(r*r-h*h);
  
  // sampling dependant computations
  vec2 q = vec2( length(p.xz), p.y );
  return ((h*q.x<w*q.y) ? length(q-vec2(w,h)) : 
                          abs(length(q)-r) ) - t;
}

float sdHexagon(vec2 p, float r){
  const vec3 k = vec3(-0.866025404,0.5,0.577350269);
  p = abs(p);
  p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
  p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
  return length(p)*sign(p.y);
}

float smin(float d1, float d2, float k){
		float res = exp(-k*d1) + exp(-k*d2);
		return -log(max(0.0001, res)) / k;
	}

float map(vec3 p){
  float res = 1e10;
  p.xy*=rot(u_time*PI * 0.2);
  p.xz*=rot(u_time*PI * 0.2);
  //p.yz*=rot(u_time*PI * 0.2);
  float s = 1.0;
  for(int i=0; i<4; i++){
    p=abs(p)-1.9;
    if(p.x<p.y)p.xy=p.yx;
    if(p.x<p.z)p.xz=p.zx;
    if(p.y<p.z)p.yz=p.zy;

    p.xy-=.3;
    p *= 2.0;
    s *= 2.0;
    
    //p.xz *= rot(0.1);
    //p.zx *= rot(0.1);
    //p.zx *= rot(0.1);
    
    //p.yz*=rot(u_time*PI * 0.2);
  }
  p /= s;
  //float h=sin(u_time * 2.) * 3. * cos(u_time * 0.45);
  float h = 0.76;
  p.x-=clamp(p.x,-h,h);
  // torus SDF
  float k = 1.;

  float sdf2d = sdHexagon(p.xy, 0.9);
  res = smin(res, sdHexagon(vec2(sdf2d, p.z), 0.1), k);
  //res = smin(res, sdTorus(p, vec2(.001, 0.05)), k);
  //res = smin(res, sdCutHollowSphere(p, 0.9, 0.5, 0.2), k);
  //res = smin(res, sdSphere(p, 0.5), k);
  //float k = sdSphere(p, 0.5);
  return res;// length(vec2(length(p.xy)-.5,p.z))-.05;
}

void main(){
    vec2 uv=(gl_FragCoord.xy-.5*u_resolution)/u_resolution.y;
    vec3 rd=normalize(vec3(uv,1));
    vec3 p=vec3(0,0,-20);
    float d=1.,i,l,o,e,c;
    vec3 q;
    for(;++i<99.&&d>.001;){
      if(i>30.5) {
        l=log(e+=1e-4)/1e2; //accumulate shadow value if currently marching shadows
        //d /= d;
      } else {
        c+=exp(-e*1e3)/2e2; 
      }
      //p +=d*e*.7;
      p+=rd*(d=map(p));
      c += l;
    }
    if(d<.001)fragColor = vec4(vec3(3./i), 1) * vec4(4.3, 2.8, 8.8, 1) + c;
}
