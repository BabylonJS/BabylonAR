# webpiled-aruco-ar

The encapsulation layer and scripts to build the final WebAssembly and JavaScript for the webpiled ArUco 
marker tracking for Babylon.js.  To build, execute build.sh.  To host the build output in a local debug 
browser, execute run.sh; the output can then be tested by visiting http://localhost:8080.

### NOTE
Sometimes, especially on Windows, the process of pulling down this repository can remove
execution permissions from the bash scripts (build.sh and run.sh).  If this happens, you can just add 
the appropriate permissions back to the scripts before trying to execute them.

```bash
chmod +x build.sh
chmod +x run.sh
```