// As described here: https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#implement-a-c-api-in-javascript
mergeInto(LibraryManager.library, {
    update_marker_tracking: function(id, confidence, px, py, pz, rx, ry, rz, rw) {
        // Requires this handler function to be defined. Defining it is the responsibility
        // of whoever calls into the aruco-meta-marker-tracker WASM.
        Module._update_marker_tracking(id, confidence, px, py, pz, rx, ry, rz, rw);
    }
});