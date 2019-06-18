if [ ! $EMSCRIPTEN ]; then
    echo "EMSCRIPTEN variable not defined; please navigate to your Emscripten repository and execute, \"source ./emsdk_env.sh\", then try again."
    echo "Build failed."
else
    if [ ! -d build ]; then
        mkdir build
    fi

    ./em++ src/*.cpp extern/lib/*.bc -I extern/include/ -s WASM=1 -s "EXPORTED_FUNCTIONS=[_initialize,_uninitialize,_reset,_set_calibration,_set_calibration_from_frame_size,_process_image,_get_tracked_marker]" -s "EXTRA_EXPORTED_RUNTIME_METHODS=[getValue]" -std=c++1y -o build/webpiled-aruco-ar.js -s DISABLE_EXCEPTION_CATCHING=0 -O2
fi