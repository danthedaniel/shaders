#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

const float PI = 3.1415926535;
const float TAU = 2.0 * PI;

// From: https://www.laurivan.com/rgb-to-hsv-to-rgb-for-shaders/
vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Take a value in the range low..high and translate it to the range 0..1
float range_adjust(float value, float low, float high) {
    return value / (high - low) - low;
}

// Draw a flower
// offset:      xy positional offset
// hue_offset:  hue shift
// radius_mod:  radius modifier
vec4 flower(vec2 offset, float hue_offset, float radius_mod) {
    vec2 st = offset + gl_FragCoord.xy / u_resolution.xy;
    vec2 pos = vec2(0.5) - st;

    float radius = length(pos) * radius_mod;
    float angle = atan(pos.y, pos.x) + sin(u_time) * radius;
    float f = abs(cos(angle * 3.0 + u_time));

    float value = vec3(1.0 - step(f, radius));
    float hue = range_adjust(sin((u_time + hue_offset) / 15.0), -1.0, 1.0);
    vec3 hsv = vec3(hue / 4.0 + 0.5, 0.9, value);

    return vec4(hsv2rgb(hsv), value);
}

void main() {
    vec4 color = flower(vec2(0.0), 0.0, 3.0);

    for (int i = 0; i < 6; ++i) {
        float angle = i / 6.0 * TAU ;
        vec2 offset = vec2(cos(angle + u_time / 4.0), sin(angle + u_time / 4.0)) * 0.3;
        vec4 flower = flower(offset, 8.0 * angle, 7.0);
        color = mix(flower, color, color.a);
    }

    gl_FragColor = color;
}
