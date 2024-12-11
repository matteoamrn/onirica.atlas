uniform float size;

varying float vDistance;
varying vec3 vColor;
attribute vec3 color;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float cameraDistance = length(cameraPosition - position);
    float safeDistance = max(cameraDistance, 0.0001);
    float normalizedDistance = safeDistance / 100.0; //fading term
    vDistance = clamp(normalizedDistance, 0.0, 1.0);
    vColor = color;

    // Scale point size with distance from camera
    float scale = size / (mvPosition.z * -0.7); // Adjust factor to stabilize size
    gl_PointSize = max(scale, 1.0); // Ensure point size stays positive

    // Projection transformation
    gl_Position = projectionMatrix * mvPosition;
}
