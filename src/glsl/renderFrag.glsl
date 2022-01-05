#version 300 es
precision highp float;

in float v_Age;
in float v_Life;
in vec3 v_Position;
in vec3 v_Velocity;

uniform mat4 u_ColourPalette;

out vec4 o_FragColor;

vec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d){
    return a+b*cos(6.28318*(c*t+d));
}

void main() {
    float t = 0.01 + v_Age/v_Life;
    float distance = length(2.0 * gl_PointCoord - 1.0);
    if (distance > 1.0) {
        discard;
    }
    o_FragColor = vec4(
            palette(t,
                u_ColourPalette[0].rgb,
                u_ColourPalette[1].rgb,
                u_ColourPalette[2].rgb,
                u_ColourPalette[3].rgb), 1.0-t
            );
}
