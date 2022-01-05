#version 300 es
precision highp float;

uniform mat4 u_ProjectionMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ColourPalette;
uniform float u_PointSize;

in vec3 i_Position;
in float i_Age;
in float i_Life;
in vec3 i_Velocity;

out float v_Age;
out float v_Life;
out vec3 v_Position;
out vec3 v_Velocity;

void main(){
    v_Age = i_Age;
    v_Life = i_Life;
    float ageFactor = 1.0 + (1.0 - i_Age/i_Life);

    v_Position = i_Position;
    v_Velocity = i_Velocity;

    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(i_Position, 1.0);
    gl_PointSize = 1.8/gl_Position.z * u_PointSize * ageFactor;
}
