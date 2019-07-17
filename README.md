# BabylonAR

**Welcome to Babylon!**

BabylonAR is plugin intended to bring AR and computer vision functionality to Babylon.js Web apps.
Principally, this is done by encapsulating the power of existing open-source libraries (like the 
incomparable [OpenCV](https://opencv.org/)) into small and simple APIs that are easy to use, even
computer vision expertise.

**Questions?** Please join us on the [official forum](https://forum.babylonjs.com/), and feel free
to ping [syntheticmagus](https://forum.babylonjs.com/u/syntheticmagus) directly for questions about
BabylonAR.

## Quick Start and Common Tasks

### Prerequisites
- [git](https://git-scm.com/)
- [Node.js](https://nodejs.org)

Note: for Windows developers, the 
[Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10) is 
*strongly* recommended as an alternative to native command prompts, PowerShell, or Git Bash.

### Setting Up the Repository

In a Unix terminal or Git Bash, perform the following operations:

```
cd [ROOT DIRECTORY WHERE YOU WANT YOUR REPOSITORY TO LIVE]
git clone https://github.com/BabylonJS/BabylonAR
cd BabylonAR
npm install
```

If you want to be able to build the native libraries to WASM, install Emscripten using the 
following command:

```
gulp emscripten-install
```

### Building

BabylonAR uses `gulp` as its build system. To see a list of gulp tasks, enter the following 
command into your terminal:

```
gulp --tasks
```

To build the core BabylonAR offering, simply run the `gulp babylonAr` task.

```
gulp babylonAr
```

Building the WASM libraries is done the same way, although the underlying implementation is 
different. For example, to build the ArUcoMetaMarkerTracker WASM, run the following task:

```
gulp aruco-meta-marker-tracker
```

### Testing

Automated tests are not yet implemented for BabylonAR.

For manual testing -- for example, testing while fixing a bug or developing a new feature -- 
it may be convenient to serve local files for consumption by an in-browser test app. The
following `gulp` task launches a server which serves the local [dist](dist) folder, to which 
build tasks output their results, to http://localhost:8080/.

```
gulp serve
```

Note that because this tasks runs a server, the task does not exit automatically and so 
monopolizes the terminal in which it runs. It's therefore recommended to run the server from
a separate terminal, which will allow the server to run uninterrupted while you continue
coding, building, and testing. (The server does not need to be restarted when files are 
updated.)

#### Testing in the Playground

In certain cases, if you don't have a bespoke Web app in which to test your code, it can be
especially convenient to test inside the [Babylon.js Playground](https://www.babylonjs-playground.com/).
The Web-hosted Playground has restrictions on loading unsecured resources (`gulp serve` does not 
support HTTPS), but testing in the Playground is still possible using a locally-hosted Playground.

Follow the Babylon.js instructions to 
[run Babylon.js on a local webserver](https://doc.babylonjs.com/how_to/how_to_start#webserver),
after which the following link should be available to you: 
http://localhost:1338/Playground/index-local.html. From this Playground, you should be able to
access the resources hosted by `gulp serve` as though they were available in a separate CDN.

[Monaco](https://github.com/Microsoft/monaco-editor), the code editor used in the Babylon.js
Playground, sets local state in a way that requires special handling in order to be able to
load external resources. BabylonAR provides a version of its core offering that automatically 
accounts for this: [`babylonAr.playground.js`](dist/babylonAr.playground.js). To build this resource
run the following `gulp` task:

```
gulp babylonAr.playground
```

All together, these utilities will allow you to use locally-hosted versions of both the Playground
and BabylonAR to test as though both were being hosted on the Web. With the `babylonAr.playground.js`
target built and both the Babylon.js and BabylonAR webservers running, try pasting the following 
code into a [local Playground](http://localhost:1338/Playground/index-local.html).

```
var createScene = async function () {
    var scene = new BABYLON.Scene(engine);
    scene.createDefaultCameraOrLight();

    scene.clearColor = new BABYLON.Color3(1, 0, 0);
    await BABYLON.Tools.LoadScriptAsync("http://localhost:8080/babylonAr.playground.js");
    var worker = await BabylonAR.ExampleWorker.createAsync();
    await worker.sendMessageAsync("Welcome to Babylon!");
    console.log("Message sent to worker and received: Welcome to Babylon!");
    scene.clearColor = new BABYLON.Color3(0, 1, 0);

    return scene;
};
```

If, upon running this code, your canvas turns briefly red, then green, congratulations! You've 
successfully built, hosted, and tested BabylonAR!

### Deploying

As mentioned above, development builds are output to and tested from the [dist](dist) directory.
However, the CDN (https://ar.babylonjs.com/) is run out of the [docs](docs) directory; see the
[GitHub Pages documentation](https://help.github.com/en/articles/configuring-a-publishing-source-for-github-pages)
for information about why that is.

During active development, there should be no need to touch the actual CDN directory. However,
when such need arises -- for example, before submitting a pull request to the main repository --
deploying for distribution should require only the following `gulp` command:

```
gulp deploy
```