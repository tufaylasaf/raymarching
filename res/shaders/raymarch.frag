#version 330 core
out vec4 FragColor;

// Camera settings
uniform vec2 iResolution;
uniform float iTime;

uniform vec3 cameraPos; // Camera position
uniform float yaw;       // Horizontal angle (yaw)
uniform float pitch;     // Vertical angle (pitch)

const float FOV = 1.0;
const int MAX_STEPS = 256;
const float MAX_DIST = 500.0;
const float EPSILON = 0.001;

vec2 unionOp(vec2 a, vec2 b){
    return (a.x < b.x) ? a : b;
}

// Sphere Signed Distance Function (SDF)
float sphereSDF(vec3 p, float radius) {
    return length(p) - radius;
}

float sdPlane( vec3 p, vec3 n, float h )
{
  return dot(p,n) + h;
}

// Scene mapping function
vec2 map(vec3 p) {
    float sphereDist = sphereSDF(p, 0.5);
    float sphereID = 1.0;
    vec2 sphere = vec2(sphereDist, sphereID);

    float planeDist = sdPlane(p, vec3(0,1,0), 1.0);
    float planeID = 2.0;
    vec2 plane = vec2(planeDist, planeID);

    vec2 res = unionOp(sphere, plane);

    return res;
}

// Ray marching function, returning the distance to the nearest surface
vec2 rayMarch(vec3 ro, vec3 rd) {
    vec2 hit, object;
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + object.x * rd;
        hit = map(p); 
        object.x += hit.x;
        object.y = hit.y;
        if(abs(hit.x) < EPSILON || object.x > MAX_DIST) break;
    }
    return object;
}

// Compute the normal at point `p` using the gradient of the SDF
vec3 getNormal(vec3 p) {
    vec2 e = vec2(EPSILON, 0.0);
    float dx = map(p + vec3(e.x, e.y, e.y)).x - map(p - vec3(e.x, e.y, e.y)).x;
    float dy = map(p + vec3(e.y, e.x, e.y)).x - map(p - vec3(e.y, e.x, e.y)).x;
    float dz = map(p + vec3(e.y, e.y, e.x)).x - map(p - vec3(e.y, e.y, e.x)).x;
    return normalize(vec3(dx, dy, dz));
}

// Basic lighting function (ambient and diffuse)
vec3 getLight(vec3 p, vec3 rd, vec3 color) {
    vec3 lightPos = vec3(20.0, 40.0, -30.0);
    vec3 L = normalize(lightPos - p);
    vec3 N = getNormal(p);
    vec3 V = -rd;
    vec3 R = reflect(-L, N);

    vec3 specularColor = vec3(0.5);
    vec3 specular = specularColor * pow(clamp(dot(R, V), 0.0, 1.0), 10.0);
    vec3 diff = color * clamp(dot(L, N), 0.0, 1.0);
    vec3 ambient = color * 0.05;

    // Soft shadow calculation
    float shadow = 1.0;
    float maxDistToLight = length(lightPos - p);
    float stepDist = 0.01;  // Small steps to increase shadow smoothness

    float t = EPSILON;  // Start a small distance from the surface
    for (int i = 0; i < 128; i++) {
        vec3 shadowPoint = p + L * t;
        float distToSurface = map(shadowPoint).x;

        // Calculate shadow factor based on proximity to objects
        shadow = min(shadow, 8.0 * distToSurface / t);
        
        t += distToSurface;  // Advance along the light direction by surface distance
        if (t > maxDistToLight || shadow <= 0.01) break;  // Exit early if fully in shadow
    }

    shadow = clamp(shadow, 0.0, 1.0);  // Clamp shadow factor to [0, 1]

    return (diff * shadow + ambient + specular * shadow);
}

vec3 getMaterial(vec3 p, float id){
    vec3 m;
    switch(int(id)){
        case 1:
            m = vec3(0.9, 0.9, 0.0); break;
        case 2:
            m = vec3(0.2 + 0.4 * mod(floor(p.x) + floor(p.z), 2.0)); break;
    }
    return m;
}

// Camera calculation
mat3 getCam(vec3 ro, float yaw, float pitch) {
    vec3 camF = normalize(vec3(cos(radians(yaw)) * cos(radians(pitch)),
                                sin(radians(pitch)),
                                sin(radians(yaw)) * cos(radians(pitch))));
    vec3 camR = normalize(cross(vec3(0, 1, 0), camF));
    vec3 camU = cross(camF, camR);
    return mat3(camR, camU, camF);
}

// Render function that accumulates color based on ray marching
void render(inout vec3 col, in vec2 uv) {
    vec3 ro = cameraPos;
    mat3 camMat = getCam(ro, yaw, pitch);
    vec3 rd = camMat * normalize(vec3(uv, FOV)); // Camera ray direction based on yaw and pitch
    
    vec2 object = rayMarch(ro, rd);
    
    vec3 bg = vec3(0.5, 0.8, 0.9);
    if (object.x < MAX_DIST) {
        vec3 p = ro + object.x * rd;
        vec3 m = getMaterial(p, object.y);
        col += getLight(p, rd, m);

        col = mix(col, bg, 1.0 - exp(-0.0008 * object.x * object.x));

    } else {
        col += bg - max(0.95 * rd.y, 0.0);
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    
    vec3 col;
    render(col, uv);

    float gamma = 2.2;
    col = pow(col, vec3(1.0 / gamma));

    FragColor = vec4(col, 1.0);
}
