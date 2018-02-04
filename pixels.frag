#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_time;

const float PI = 3.1415926535;
const float TAU = 2.0 * PI;

float snoise(vec2 v);

mat2 rotate(float t) {
    return mat2(
        cos(t), -sin(t),
        sin(t),  cos(t)
    );
}

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float t = u_time / 2.0 + PI / 4.0;
    vec2 pos = rotate(t) * (vec2(0.5) - st) + vec2(0.0, 0.5 * cos(st.y));

    float threshold = sin(u_time) / 2.0 + 1.0;
    float upper = step(0.5 + threshold / 6.0, snoise(floor(pos * 30.0)));
    vec2 lowerOffset = rotate(t - PI / 4) * vec2(-0.15, 0.15);
    float lower = 0.3 * step(0.5 + threshold / 6.0, snoise(floor(pos * 30.0 + lowerOffset)));
    float value = clamp(upper + lower, 0.0, 1.0);

    float upperHue = snoise(floor(pos * 30.0) / 30.0);
    float lowerHue = snoise(floor(pos * 30.0 + lowerOffset) / 30.0);
    float hue = upper == 0 ? lowerHue : upperHue;

    vec3 color = hsv2rgb(vec3(hue, 0.8, value));

    gl_FragColor = vec4(color, 1.0);
}

// Noise shit
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
    const vec4 C = vec4(
         0.211324865405187, // (3.0-sqrt(3.0))/6.0
         0.366025403784439, // 0.5*(sqrt(3.0)-1.0)
        -0.577350269189626, // -1.0 + 2.0 * C.x
         0.024390243902439  // 1.0 / 41.0
    );
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i); // Avoid truncation effects in permutation
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m * m * m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}
