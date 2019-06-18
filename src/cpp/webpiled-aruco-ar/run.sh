if [ ! $EMSCRIPTEN ]; then
    echo "EMSCRIPTEN variable not defined; please navigate to your Emscripten repository and execute, \"source ./emsdk_env.sh\", then try again."
    echo "Run failed."
else
    echo "Serving with emrun.  Type \"localhost:8080\" in your preferred browser to view the web page."
    echo "Press CTRL+C to terminate."
    emrun --no_browser --port=8080 .
fi