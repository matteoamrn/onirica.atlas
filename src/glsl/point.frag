uniform vec3 colorNear;
uniform vec3 colorFar;
uniform sampler2D pointTexture;

varying float vDistance;    
varying vec3 vColor;

void main() {
    vec3 distance_col = mix(colorNear, colorFar, vDistance);
    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
    vec4 finalColor = vec4(distance_col, 1.0) * vec4(vColor, 1.0) * texColor;
    
    if (finalColor.a < 0.1) discard;

    gl_FragColor = finalColor;
}
