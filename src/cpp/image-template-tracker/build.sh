#!/bin/bash

if [ ! -d build ]; then
    mkdir build
fi

ExportedFunctions=()
ExportedFunctions+=(_initialize)
ExportedFunctions+=(_uninitialize)
ExportedFunctions+=(_track_template_in_image)
ExportedFunctionsString="$(IFS=,; echo "${ExportedFunctions[*]}")"

$1/em++ src/*.cpp extern/lib/*.bc -I extern/include/ -s WASM=1 -s "EXPORTED_FUNCTIONS=[$ExportedFunctionsString]" --js-library src/callbacks.js -std=c++14 -o build/image-template-tracker.js -s DISABLE_EXCEPTION_CATCHING=0 -O2
