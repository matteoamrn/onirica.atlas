

export default class Utils {
    static distance(a: THREE.Vector3, b: THREE.Vector3) {
        var deltaX = b.x - a.x;
        var deltaY = b.y - a.y;
        var deltaZ = b.z - a.z;
        var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        return distance;
    }
}
