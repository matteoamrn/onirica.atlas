import * as THREE from 'three';

interface ColorConstants {
    BASE: THREE.Color;
    NEIGHBOR: THREE.Color;
    AXES: THREE.Color;
}

const COLORS: ColorConstants = {
    BASE: new THREE.Color(0xe6e6e6),
    NEIGHBOR: new THREE.Color(0x727acf),
    AXES: new THREE.Color(0xe4e4e4),
};

export default COLORS;
