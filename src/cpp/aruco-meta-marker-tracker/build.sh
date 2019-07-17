#!/bin/bash

if [ ! -d build ]; then
    mkdir build
fi

ExportedFunctions=()
ExportedFunctions+=(_initialize)
ExportedFunctions+=(_uninitialize)
ExportedFunctions+=(_reset)
ExportedFunctions+=(_set_calibration)
ExportedFunctions+=(_set_calibration_from_frame_size)
ExportedFunctions+=(_add_marker)
ExportedFunctions+=(_process_image)
ExportedFunctionsString="$(IFS=,; echo "${ExportedFunctions[*]}")"

$1/em++ src/*.cpp extern/opencv-4.1.0/lib/*.bc -I extern/opencv-4.1.0/include/ -s WASM=1 -s "EXPORTED_FUNCTIONS=[$ExportedFunctionsString]" --js-library src/callbacks.js -std=c++17 -o build/aruco-meta-marker-tracker.js -s DISABLE_EXCEPTION_CATCHING=0 -O2