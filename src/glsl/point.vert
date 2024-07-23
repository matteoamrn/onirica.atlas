uniform float size;

varying float vDistance;
varying vec3 vColor;
attribute vec3 color;   

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float cameraDistance = length(cameraPosition - position);
    float distanceFromCenter = length(cameraPosition - vec3(0.));
    vDistance = (cameraDistance) / (distanceFromCenter*1.5);
    vColor = color;
    float scale = size / -mvPosition.z;
    gl_PointSize = scale;
    gl_Position = projectionMatrix * mvPosition;
}
