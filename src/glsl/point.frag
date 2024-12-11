uniform vec3 colorNear;
uniform vec3 colorFar;
uniform sampler2D pointTexture;

varying float vDistance;    
varying vec3 vColor;

void main() {
    // Color based on distance
    vec3 distance_col = mix(colorNear, colorFar, vDistance);
    // Sample the texture
    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
    // Blend the color with the texture

    vec4 finalColor = vec4(distance_col, 1.0) * vec4(vColor, 1.0) * texColor;
    
    // // Alpha test threshold
    if (finalColor.a == 0.0) discard;

    gl_FragColor = finalColor;
}
