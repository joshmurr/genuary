#version 300 es
precision mediump float;

in vec3 i_Position;
in vec3 i_Normal;
in vec3 i_Color;

uniform mat4 u_ProjectionMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ModelMatrix;

out vec3 v_Color;
out vec3 v_Normal;

void main(){
    v_Color = i_Color;
    v_Normal = i_Normal;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(i_Position, 1.0);
}
