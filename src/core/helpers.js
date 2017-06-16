export function forEach(ref, cb) {
    if ( !ref || !ref.constructor ) { return null; }
    if ( ref.constructor === Array ) {
        for ( var k = 0; k < ref.length; k++) {
            cb(ref[k], k);
        }
    } else {
        for ( var k in ref ) {
            cb(ref[k], k);
        }
    }
}
