#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_time;

const float PI = 3.1415926535;
const float TAU = 2.0 * PI;

float snoise(vec2 v);
vec3 hsv2rgb(vec3 c);
mat2 rotate(float t);

vec4 draw_texture(vec2 pos) {
    float wobbly_edge = snoise(pos * 10.0) * 0.03;
    float value = length(pos) > (0.43 + wobbly_edge) ? 0.0 : 0.7;
    float hue = length(pos);
    return vec4(hsv2rgb(vec3(hue, 0.62, value)), 1.0);
}

vec4 draw_circle(vec2 pos, float radius, float rotate_angle) {
    pos = rotate(rotate_angle) * pos;
    float angle = atan(pos.y, pos.x);
    float wobbly_edge = snoise(pos * 15.1) * 0.03;

    if (length(pos) < (radius + wobbly_edge)) {
        return vec4(0.0, 0.0, 0.0, 0.28);
    } else {
        return draw_texture(pos);
    }
}

vec4 draw(vec2 pos) {
    vec4 color = vec4(vec3(1.0), 0.0);
    float t = u_time * 0.75;
    float num_circles = 6.0;

    for (int i = 0; i < num_circles; ++i) {
        // Wiggle the circles around
        float offset_size = (num_circles - (i + 1.0)) * 0.0125;
        float angle = offset_size * PI / 32.0;
        vec2 offset = vec2(cos(t + angle), sin(t + angle)) * vec2(offset_size);
        // Circle size
        float radius = i * 0.04 + 0.15;

        // Rotate each circle in turn
        // Get a float value from 0..num_circles (don't rotate the last circle)
        float circle_to_rotate = mod(t / PI, num_circles - 1.0);
        // Get the fractional component of the value
        float rotate_index = mod(circle_to_rotate, 1.0) * TAU;
        // How much to rotate if this is the circle to rotate
        float rotate_amount = (sin(rotate_index + 3.0 * PI / 2.0) + 1.0) / 2.0 * PI;
        // Actual rotation amount (0.0 if not rotating)
        float rotate_angle = floor(circle_to_rotate) == i ? rotate_amount : 0.0;

        // Location on the buffer
        vec2 st = offset + pos / u_resolution.xy;
        vec2 pos = vec2(0.5) - st;

        // Draw the sample
        vec4 circle = draw_circle(pos, radius, rotate_angle);
        color = mix(color, circle, circle.a);
    }

    return color;
}

void main() {
    vec4 color = vec4(0.0);

    // Perform SSAA on the sampleing routine (draw)
    float ssaa_amount = 3.0;
    for (int i = 0; i < ssaa_amount; ++i)
        for (int j = 0; j < ssaa_amount; ++j)
            color += draw(gl_FragCoord.xy + vec2(i, j) / ssaa_amount);

    gl_FragColor = color / (ssaa_amount * ssaa_amount);
}

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
    vec2 i = floor(v + dot(v, C.yy));
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
