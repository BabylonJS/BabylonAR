var externalDefine = window.define;var externalRequire = window.require;window.define = undefined;window.require = undefined;
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BabylonAR = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./exampleWorker/exampleWorker"));
__export(require("./exampleObjectTracker/exampleObjectTracker"));

},{"./exampleObjectTracker/exampleObjectTracker":3,"./exampleWorker/exampleWorker":4}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dedicatedWorker_1 = require("../shared/dedicatedWorker");
var constants_1 = require("../shared/constants");
var ExampleMarkerTracker = /** @class */ (function () {
    function ExampleMarkerTracker() {
    }
    ExampleMarkerTracker.onInitialized = function () {
        Module._reset();
        postMessage({ initialized: true });
    };
    ExampleMarkerTracker.onMessage = function (event) {
        var args = event.data;
        if (args.reset) {
            Module._reset();
            postMessage({ reset: true });
        }
        else if (args.calibrate) {
            Module._set_calibration_from_frame_size(args.width, args.height);
            postMessage({ calibrated: true });
        }
        else if (args.track) {
            var buf = Module._malloc(args.imageData.length * args.imageData.BYTES_PER_ELEMENT);
            Module.HEAP8.set(args.imageData, buf);
            var numMarkers = Module._process_image(args.width, args.height, buf, 1);
            Module._free(buf);
            var markers = [];
            var offset = 0;
            var id = 0;
            var tx = 0.0;
            var ty = 0.0;
            var tz = 0.0;
            var rx = 0.0;
            var ry = 0.0;
            var rz = 0.0;
            for (var markerIdx = 0; markerIdx < numMarkers; markerIdx++) {
                var ptr = Module._get_tracked_marker(markerIdx);
                offset = 0;
                id = Module.getValue(ptr + offset, "i32");
                offset += 12;
                tx = Module.getValue(ptr + offset, "double");
                offset += 8;
                ty = Module.getValue(ptr + offset, "double");
                offset += 8;
                tz = Module.getValue(ptr + offset, "double");
                offset += 8;
                rx = Module.getValue(ptr + offset, "double");
                offset += 8;
                ry = Module.getValue(ptr + offset, "double");
                offset += 8;
                rz = Module.getValue(ptr + offset, "double");
                markers.push({
                    id: id,
                    tx: tx,
                    ty: ty,
                    tz: tz,
                    rx: rx,
                    ry: ry,
                    rz: rz
                });
            }
            postMessage({
                markers: markers
            });
        }
    };
    ExampleMarkerTracker.createAsync = function () {
        return new Promise(function (resolve) {
            var tracker = new ExampleMarkerTracker();
            tracker._worker = dedicatedWorker_1.DedicatedWorker.createFromLocation(constants_1.EXAMPLE_MODULE_URL, ExampleMarkerTracker.onInitialized, ExampleMarkerTracker.onMessage);
            tracker._worker.onmessage = function (event) {
                tracker._worker.onmessage = dedicatedWorker_1.DedicatedWorker.unexpectedMessageHandler;
                resolve(tracker);
            };
        });
    };
    ExampleMarkerTracker.prototype.setCalibrationAsync = function (width, height) {
        var _this = this;
        var promise = new Promise(function (resolve, reject) {
            _this._worker.onmessage = function (result) {
                _this._worker.onmessage = dedicatedWorker_1.DedicatedWorker.unexpectedMessageHandler;
                if (result.data.calibrated) {
                    resolve();
                }
                else {
                    reject(result.data);
                }
            };
        });
        this._worker.postMessage({
            calibrate: true,
            width: width,
            height: height
        });
        return promise;
    };
    ExampleMarkerTracker.prototype.findMarkersInImageAsync = function (videoTexture) {
        var _this = this;
        var promise = new Promise(function (resolve, reject) {
            _this._worker.onmessage = function (result) {
                _this._worker.onmessage = dedicatedWorker_1.DedicatedWorker.unexpectedMessageHandler;
                if (result.data.markers) {
                    resolve(result.data.markers);
                }
                else {
                    reject(result.data);
                }
            };
        });
        this._worker.postMessage({
            track: true,
            width: videoTexture.getSize().width,
            height: videoTexture.getSize().height,
            imageData: videoTexture.readPixels()
        });
        return promise;
    };
    return ExampleMarkerTracker;
}());
exports.ExampleMarkerTracker = ExampleMarkerTracker;

},{"../shared/constants":5,"../shared/dedicatedWorker":6}],3:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = (typeof window !== "undefined" ? window['BABYLON'] : typeof global !== "undefined" ? global['BABYLON'] : null);
var exampleMarkerTracker_1 = require("./exampleMarkerTracker");
var filteredVector3_1 = require("../shared/filteredVector3");
var trackedNode_1 = require("../shared/trackedNode");
var ExampleObjectTracker = /** @class */ (function () {
    function ExampleObjectTracker(videoTexture, scene) {
        this._runTrackingObserver = null;
        this._trackableObjects = new babylonjs_1.StringDictionary();
        this.__posEstimate = babylonjs_1.Vector3.Zero();
        this.__posEstimateCount = 0;
        this.__rightEstimate = babylonjs_1.Vector3.Zero();
        this.__rightEstimateCount = 0;
        this.__forwardEstimate = babylonjs_1.Vector3.Zero();
        this.__forwardEstimateCount = 0;
        this.__scratchVec = babylonjs_1.Vector3.Zero();
        this.__filteredPos = new filteredVector3_1.FilteredVector3(0.0, 0.0, 0.0);
        this.__filteredRight = new filteredVector3_1.FilteredVector3(0.0, 0.0, 0.0);
        this.__filteredForward = new filteredVector3_1.FilteredVector3(0.0, 0.0, 0.0);
        this.__targetPosition = babylonjs_1.Vector3.Zero();
        this.__targetRotation = babylonjs_1.Quaternion.Identity();
        this.__ulId = -1;
        this.__urId = -1;
        this.__llId = -1;
        this.__lrId = -1;
        this._scene = scene;
        this._videoTexture = videoTexture;
    }
    ExampleObjectTracker.prototype.addTrackableObject = function (ul, ur, ll, lr) {
        var descriptor = [ul, ur, ll, lr].toString();
        this._trackableObjects.add(descriptor, new trackedNode_1.TrackedNode(descriptor.toString(), this._scene));
        return this._trackableObjects.get(descriptor);
    };
    ExampleObjectTracker.prototype.processResults = function (results) {
        // TODO: THIS IS HACKED CODE
        var _this = this;
        this._trackableObjects.forEach(function (descriptor, trackedObject) {
            var nums = descriptor.split(',');
            _this.__ulId = parseInt(nums[0]);
            _this.__urId = parseInt(nums[1]);
            _this.__llId = parseInt(nums[2]);
            _this.__lrId = parseInt(nums[3]);
            _this.__posEstimate.set(0.0, 0.0, 0.0);
            _this.__posEstimateCount = 0.0;
            _this.__rightEstimate.set(0.0, 0.0, 0.0);
            _this.__rightEstimateCount = 0.0;
            _this.__forwardEstimate.set(0.0, 0.0, 0.0);
            _this.__forwardEstimateCount = 0.0;
            if (results[_this.__llId]) {
                if (results[_this.__urId]) {
                    _this.__scratchVec.set(0.0, 0.0, 0.0);
                    _this.__scratchVec.addInPlace(results[_this.__llId].position);
                    _this.__scratchVec.addInPlace(results[_this.__urId].position);
                    _this.__scratchVec.scaleInPlace(0.5);
                    _this.__posEstimate.addInPlace(_this.__scratchVec);
                    _this.__posEstimateCount += 1.0;
                }
                if (results[_this.__lrId]) {
                    _this.__scratchVec.set(0.0, 0.0, 0.0);
                    _this.__scratchVec.addInPlace(results[_this.__lrId].position);
                    _this.__scratchVec.subtractInPlace(results[_this.__llId].position);
                    _this.__scratchVec.normalize();
                    _this.__rightEstimate.addInPlace(_this.__scratchVec);
                    _this.__rightEstimateCount += 1.0;
                }
                if (results[_this.__ulId]) {
                    _this.__scratchVec.set(0.0, 0.0, 0.0);
                    _this.__scratchVec.addInPlace(results[_this.__ulId].position);
                    _this.__scratchVec.subtractInPlace(results[_this.__llId].position);
                    _this.__scratchVec.normalize();
                    _this.__forwardEstimate.addInPlace(_this.__scratchVec);
                    _this.__forwardEstimateCount += 1.0;
                }
            }
            if (results[_this.__urId]) {
                if (results[_this.__lrId]) {
                    _this.__scratchVec.set(0.0, 0.0, 0.0);
                    _this.__scratchVec.addInPlace(results[_this.__urId].position);
                    _this.__scratchVec.subtractInPlace(results[_this.__lrId].position);
                    _this.__scratchVec.normalize();
                    _this.__forwardEstimate.addInPlace(_this.__scratchVec);
                    _this.__forwardEstimateCount += 1.0;
                }
                if (results[_this.__ulId]) {
                    _this.__scratchVec.set(0.0, 0.0, 0.0);
                    _this.__scratchVec.addInPlace(results[_this.__urId].position);
                    _this.__scratchVec.subtractInPlace(results[_this.__ulId].position);
                    _this.__scratchVec.normalize();
                    _this.__rightEstimate.addInPlace(_this.__scratchVec);
                    _this.__rightEstimateCount += 1.0;
                }
            }
            if (results[_this.__lrId] && results[_this.__ulId]) {
                _this.__scratchVec.set(0.0, 0.0, 0.0);
                _this.__scratchVec.addInPlace(results[_this.__lrId].position);
                _this.__scratchVec.addInPlace(results[_this.__ulId].position);
                _this.__scratchVec.scaleInPlace(0.5);
                _this.__posEstimate.addInPlace(_this.__scratchVec);
                _this.__posEstimateCount += 1.0;
            }
            if (_this.__posEstimateCount * _this.__rightEstimateCount * _this.__forwardEstimateCount > 0) {
                _this.__posEstimate.scaleInPlace(1.0 / _this.__posEstimateCount);
                _this.__rightEstimate.scaleInPlace(1.0 / _this.__rightEstimateCount);
                _this.__forwardEstimate.scaleInPlace(1.0 / _this.__forwardEstimateCount);
                _this.__filteredPos.addSample(_this.__posEstimate);
                _this.__filteredRight.addSample(_this.__rightEstimate);
                _this.__filteredForward.addSample(_this.__forwardEstimate);
                _this.__targetPosition.copyFrom(_this.__filteredPos);
                babylonjs_1.Quaternion.RotationQuaternionFromAxisToRef(_this.__filteredRight, babylonjs_1.Vector3.Cross(_this.__filteredForward, _this.__filteredRight), _this.__filteredForward, _this.__targetRotation);
                trackedObject.setTracking(_this.__targetPosition, _this.__targetRotation, true);
            }
            else {
                trackedObject.setTracking(_this.__targetPosition, _this.__targetRotation, true);
            }
        });
    };
    ExampleObjectTracker.prototype.setCalibrationAsync = function (scalar) {
        if (scalar === void 0) { scalar = 1; }
        return this._tracker.setCalibrationAsync(Math.round(scalar * this._videoTexture.getSize().width), Math.round(scalar * this._videoTexture.getSize().height));
    };
    ExampleObjectTracker.getQuaternionFromRodrigues = function (x, y, z) {
        var rot = new babylonjs_1.Vector3(-x, y, -z);
        var theta = rot.length();
        rot.scaleInPlace(1.0 / theta);
        if (theta !== 0.0) {
            return babylonjs_1.Quaternion.RotationAxis(rot, theta);
        }
        else {
            return null;
        }
    };
    ;
    ExampleObjectTracker.prototype.startTracking = function () {
        var _this = this;
        var running = false;
        this._runTrackingObserver = this._scene.onAfterRenderObservable.add(function () {
            if (!running) {
                running = true;
                _this._tracker.findMarkersInImageAsync(_this._videoTexture).then(function (markers) {
                    if (markers) {
                        var results = {};
                        markers.forEach(function (marker) {
                            results[marker.id] = {
                                position: new babylonjs_1.Vector3(marker.tx, -marker.ty, marker.tz),
                                rotation: ExampleObjectTracker.getQuaternionFromRodrigues(marker.rx, marker.ry, marker.rz)
                            };
                        });
                        _this.processResults(results);
                    }
                    running = false;
                });
            }
        });
    };
    ExampleObjectTracker.prototype.stopTracking = function () {
        this._scene.onAfterRenderObservable.remove(this._runTrackingObserver);
        this._runTrackingObserver = null;
    };
    ExampleObjectTracker.createAsync = function (videoTexture, scene) {
        var objectTracker = new ExampleObjectTracker(videoTexture, scene);
        return exampleMarkerTracker_1.ExampleMarkerTracker.createAsync().then(function (tracker) {
            objectTracker._tracker = tracker;
            return objectTracker.setCalibrationAsync();
        }).then(function () {
            return objectTracker;
        });
    };
    return ExampleObjectTracker;
}());
exports.ExampleObjectTracker = ExampleObjectTracker;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../shared/filteredVector3":7,"../shared/trackedNode":8,"./exampleMarkerTracker":2}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dedicatedWorker_1 = require("../shared/dedicatedWorker");
var constants_1 = require("../shared/constants");
var ExampleWorker = /** @class */ (function () {
    function ExampleWorker() {
    }
    ExampleWorker.onInitialized = function () {
        postMessage({
            message: "Got a module!"
        });
    };
    ExampleWorker.onMessage = function (event) {
        var data = event.data;
        data.wentToWorker = true;
        postMessage(data);
    };
    ExampleWorker.createAsync = function () {
        return new Promise(function (resolve) {
            var exampleWorker = new ExampleWorker();
            exampleWorker._worker = dedicatedWorker_1.DedicatedWorker.createFromLocation(constants_1.EXAMPLE_MODULE_URL, ExampleWorker.onInitialized, ExampleWorker.onMessage);
            exampleWorker._worker.onmessage = function (event) {
                exampleWorker._worker.onmessage = dedicatedWorker_1.DedicatedWorker.unexpectedMessageHandler;
                resolve(exampleWorker);
            };
        });
    };
    ExampleWorker.prototype.sendMessageAsync = function (data) {
        var _this = this;
        var promise = new Promise(function (resolve) {
            _this._worker.onmessage = function (event) {
                resolve(event.data);
                _this._worker.onmessage = dedicatedWorker_1.DedicatedWorker.unexpectedMessageHandler;
            };
        });
        this._worker.postMessage(data);
        return promise;
    };
    return ExampleWorker;
}());
exports.ExampleWorker = ExampleWorker;

},{"../shared/constants":5,"../shared/dedicatedWorker":6}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXAMPLE_MODULE_URL = "https://syntheticmagus.github.io/prototyping/babylonar/wasm/webpiled-aruco-ar.js";

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DedicatedWorker = /** @class */ (function () {
    function DedicatedWorker() {
    }
    DedicatedWorker.createFromSources = function () {
        var sources = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sources[_i] = arguments[_i];
        }
        var workerCode = "";
        for (var idx = 0; idx < sources.length - 1; idx++) {
            workerCode += sources[idx].toString();
        }
        workerCode += "(" + sources[sources.length - 1].toString() + ")();";
        return new Worker(window.URL.createObjectURL(new Blob([workerCode])));
    };
    DedicatedWorker.createFromLocation = function (jsUrl, onInitialized, onMessage) {
        var moduleDefition = "Module = {\n            locateFile: function (path) {\n                return \"" + jsUrl.replace(/.js$/, ".wasm") + "\";\n            },\n            onRuntimeInitialized: function () {\n                (" + onInitialized.toString() + ")();\n            }\n        };";
        var messageHandler = "this.onmessage = " + onMessage.toString() + ";";
        var importJavascript = "function importJavascript() { importScripts(\"" + jsUrl + "\"); }";
        return this.createFromSources(moduleDefition, messageHandler, importJavascript);
    };
    DedicatedWorker.unexpectedMessageHandler = function (event) {
        throw Error("Unexpected message from WebWorker: " + event);
    };
    return DedicatedWorker;
}());
exports.DedicatedWorker = DedicatedWorker;

},{}],7:[function(require,module,exports){
(function (global){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = (typeof window !== "undefined" ? window['BABYLON'] : typeof global !== "undefined" ? global['BABYLON'] : null);
var FilteredVector3 = /** @class */ (function (_super) {
    __extends(FilteredVector3, _super);
    function FilteredVector3(x, y, z, sampleCount) {
        if (sampleCount === void 0) { sampleCount = 1; }
        var _this = _super.call(this, x, y, z) || this;
        _this._idx = 0;
        _this._samples = [];
        _this._sampleSquaredDistances = [];
        for (var idx = 0; idx < sampleCount; ++idx) {
            _this._samples.push(new babylonjs_1.Vector3(x, y, z));
            _this._sampleSquaredDistances.push(0.0);
        }
        _this._sampleAverage = new babylonjs_1.Vector3(x, y, z);
        return _this;
    }
    FilteredVector3.prototype.addSample = function (sample) {
        this._sampleAverage.scaleInPlace(this._samples.length);
        this._sampleAverage.subtractInPlace(this._samples[this._idx]);
        this._samples[this._idx].copyFrom(sample);
        this._sampleAverage.addInPlace(this._samples[this._idx]);
        this._sampleAverage.scaleInPlace(1.0 / this._samples.length);
        this._idx = (this._idx + 1) % this._samples.length;
        var avgSquaredDistance = 0.0;
        for (var idx = 0; idx < this._samples.length; ++idx) {
            this._sampleSquaredDistances[idx] = babylonjs_1.Vector3.DistanceSquared(this._sampleAverage, this._samples[idx]);
            avgSquaredDistance += this._sampleSquaredDistances[idx];
        }
        avgSquaredDistance /= this._samples.length;
        var numIncludedSamples = 0;
        this.set(0.0, 0.0, 0.0);
        for (var idx = 0; idx <= this._samples.length; ++idx) {
            if (this._sampleSquaredDistances[idx] <= avgSquaredDistance) {
                this.addInPlace(this._samples[idx]);
                numIncludedSamples += 1;
            }
        }
        this.scaleInPlace(1.0 / numIncludedSamples);
    };
    return FilteredVector3;
}(babylonjs_1.Vector3));
exports.FilteredVector3 = FilteredVector3;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],8:[function(require,module,exports){
(function (global){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = (typeof window !== "undefined" ? window['BABYLON'] : typeof global !== "undefined" ? global['BABYLON'] : null);
var TrackedNode = /** @class */ (function (_super) {
    __extends(TrackedNode, _super);
    function TrackedNode(name, scene, disableWhenNotTracked) {
        if (disableWhenNotTracked === void 0) { disableWhenNotTracked = true; }
        var _this = _super.call(this, name, scene, true) || this;
        _this._isTracking = false;
        _this.disableWhenNotTracked = disableWhenNotTracked;
        if (_this.disableWhenNotTracked) {
            _this.setEnabled(false);
        }
        _this._notTrackedFramesCount = 10;
        _this.onTrackingAcquiredObservable = new babylonjs_1.Observable(function (observer) {
            if (_this._isTracking) {
                _this.onTrackingAcquiredObservable.notifyObserver(observer, _this);
            }
        });
        _this.onTrackingLostObservable = new babylonjs_1.Observable();
        _this.rotationQuaternion = babylonjs_1.Quaternion.Identity();
        return _this;
    }
    TrackedNode.prototype.isTracking = function () {
        return this._isTracking;
    };
    TrackedNode.prototype.setTracking = function (position, rotation, isTracking) {
        this.position.copyFrom(position);
        this.rotationQuaternion ? this.rotationQuaternion.copyFrom(rotation) : this.rotationQuaternion = rotation.clone();
        // TODO: Remove this feature, which only exists as a stopgap.
        if (isTracking) {
            this._notTrackedFramesCount = 0;
        }
        else {
            this._notTrackedFramesCount += 1;
            if (this._notTrackedFramesCount < 5) {
                isTracking = true;
            }
        }
        if (!this._isTracking && isTracking) {
            this.onTrackingAcquiredObservable.notifyObservers(this);
        }
        else if (this._isTracking && !isTracking) {
            this.onTrackingLostObservable.notifyObservers(this);
        }
        this._isTracking = isTracking;
        this.setEnabled(!this.disableWhenNotTracked || this._isTracking);
    };
    return TrackedNode;
}(babylonjs_1.TransformNode));
exports.TrackedNode = TrackedNode;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvYmFieWxvbkFyLnRzIiwic3JjL3RzL2V4YW1wbGVPYmplY3RUcmFja2VyL2V4YW1wbGVNYXJrZXJUcmFja2VyLnRzIiwic3JjL3RzL2V4YW1wbGVPYmplY3RUcmFja2VyL2V4YW1wbGVPYmplY3RUcmFja2VyLnRzIiwic3JjL3RzL2V4YW1wbGVXb3JrZXIvZXhhbXBsZVdvcmtlci50cyIsInNyYy90cy9zaGFyZWQvY29uc3RhbnRzLnRzIiwic3JjL3RzL3NoYXJlZC9kZWRpY2F0ZWRXb3JrZXIudHMiLCJzcmMvdHMvc2hhcmVkL2ZpbHRlcmVkVmVjdG9yMy50cyIsInNyYy90cy9zaGFyZWQvdHJhY2tlZE5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztBQ0FBLG1EQUE2QztBQUM3QyxpRUFBMkQ7Ozs7O0FDQzNELDZEQUEyRDtBQUMzRCxpREFBd0Q7QUFLeEQ7SUFHSTtJQUF1QixDQUFDO0lBRVQsa0NBQWEsR0FBNUI7UUFDSSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDaEIsV0FBVyxDQUFDLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVjLDhCQUFTLEdBQXhCLFVBQXlCLEtBQW1CO1FBQ3hDLElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFFeEIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1osTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2hCLFdBQVcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ2hDO2FBQ0ksSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ3JCLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqRSxXQUFXLENBQUMsRUFBRSxVQUFV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QUFFO2dCQUNqQyxVQUFVLEdBQUcsSUFBSSxDQUFDO2FBQ3JCO1NBQ0o7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxVQUFVLEVBQUU7WUFDakMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzRDthQUNJLElBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUN0QyxJQUFJLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZEO1FBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUNMLGtCQUFDO0FBQUQsQ0F6REEsQUF5REMsQ0F6RGdDLHlCQUFhLEdBeUQ3QztBQXpEWSxrQ0FBVyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImV4cG9ydCAqIGZyb20gXCIuL2V4YW1wbGVXb3JrZXIvZXhhbXBsZVdvcmtlclwiXG5leHBvcnQgKiBmcm9tIFwiLi9leGFtcGxlT2JqZWN0VHJhY2tlci9leGFtcGxlT2JqZWN0VHJhY2tlclwiIiwiaW1wb3J0IHsgVmlkZW9UZXh0dXJlIH0gZnJvbSBcImJhYnlsb25qc1wiXHJcblxyXG5pbXBvcnQgeyBEZWRpY2F0ZWRXb3JrZXIgfSBmcm9tIFwiLi4vc2hhcmVkL2RlZGljYXRlZFdvcmtlclwiXHJcbmltcG9ydCB7IEVYQU1QTEVfTU9EVUxFX1VSTCB9IGZyb20gXCIuLi9zaGFyZWQvY29uc3RhbnRzXCJcclxuXHJcbmRlY2xhcmUgdmFyIE1vZHVsZTogYW55O1xyXG5kZWNsYXJlIGZ1bmN0aW9uIHBvc3RNZXNzYWdlKGRhdGE6IGFueSk6IHZvaWQ7XHJcblxyXG5leHBvcnQgY2xhc3MgRXhhbXBsZU1hcmtlclRyYWNrZXIge1xyXG4gICAgcHJpdmF0ZSBfd29ya2VyOiBXb3JrZXI7XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25Jbml0aWFsaXplZCgpIHtcclxuICAgICAgICBNb2R1bGUuX3Jlc2V0KCk7XHJcbiAgICAgICAgcG9zdE1lc3NhZ2UoeyBpbml0aWFsaXplZDogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBvbk1lc3NhZ2UoZXZlbnQ6IE1lc3NhZ2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGFyZ3MgPSBldmVudC5kYXRhO1xyXG5cclxuICAgICAgICBpZiAoYXJncy5yZXNldCkge1xyXG4gICAgICAgICAgICBNb2R1bGUuX3Jlc2V0KCk7XHJcbiAgICAgICAgICAgIHBvc3RNZXNzYWdlKHsgcmVzZXQ6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGFyZ3MuY2FsaWJyYXRlKSB7XHJcbiAgICAgICAgICAgIE1vZHVsZS5fc2V0X2NhbGlicmF0aW9uX2Zyb21fZnJhbWVfc2l6ZShhcmdzLndpZHRoLCBhcmdzLmhlaWdodCk7XHJcbiAgICAgICAgICAgIHBvc3RNZXNzYWdlKHsgY2FsaWJyYXRlZDogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoYXJncy50cmFjaykge1xyXG4gICAgICAgICAgICBsZXQgYnVmID0gTW9kdWxlLl9tYWxsb2MoYXJncy5pbWFnZURhdGEubGVuZ3RoICogYXJncy5pbWFnZURhdGEuQllURVNfUEVSX0VMRU1FTlQpO1xyXG4gICAgICAgICAgICBNb2R1bGUuSEVBUDguc2V0KGFyZ3MuaW1hZ2VEYXRhLCBidWYpO1xyXG4gICAgICAgICAgICBsZXQgbnVtTWFya2VycyA9IE1vZHVsZS5fcHJvY2Vzc19pbWFnZShhcmdzLndpZHRoLCBhcmdzLmhlaWdodCwgYnVmLCAxKTtcclxuICAgICAgICAgICAgTW9kdWxlLl9mcmVlKGJ1Zik7XHJcblxyXG4gICAgICAgICAgICBsZXQgbWFya2VyczogYW55W10gPSBbXTtcclxuICAgICAgICAgICAgbGV0IG9mZnNldDogbnVtYmVyID0gMDtcclxuICAgICAgICAgICAgbGV0IGlkOiBudW1iZXIgPSAwO1xyXG4gICAgICAgICAgICBsZXQgdHg6IG51bWJlciA9IDAuMDtcclxuICAgICAgICAgICAgbGV0IHR5OiBudW1iZXIgPSAwLjA7XHJcbiAgICAgICAgICAgIGxldCB0ejogbnVtYmVyID0gMC4wO1xyXG4gICAgICAgICAgICBsZXQgcng6IG51bWJlciA9IDAuMDtcclxuICAgICAgICAgICAgbGV0IHJ5OiBudW1iZXIgPSAwLjA7XHJcbiAgICAgICAgICAgIGxldCByejogbnVtYmVyID0gMC4wO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBtYXJrZXJJZHggPSAwOyBtYXJrZXJJZHggPCBudW1NYXJrZXJzOyBtYXJrZXJJZHgrKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IHB0ciA9IE1vZHVsZS5fZ2V0X3RyYWNrZWRfbWFya2VyKG1hcmtlcklkeCk7XHJcblxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gMDtcclxuICAgICAgICAgICAgICAgIGlkID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJpMzJcIik7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gMTI7XHJcbiAgICAgICAgICAgICAgICB0eCA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XHJcbiAgICAgICAgICAgICAgICB0eSA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XHJcbiAgICAgICAgICAgICAgICB0eiA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XHJcbiAgICAgICAgICAgICAgICByeCA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XHJcbiAgICAgICAgICAgICAgICByeSA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XHJcbiAgICAgICAgICAgICAgICByeiA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIG1hcmtlcnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHR4OiB0eCxcclxuICAgICAgICAgICAgICAgICAgICB0eTogdHksXHJcbiAgICAgICAgICAgICAgICAgICAgdHo6IHR6LFxyXG4gICAgICAgICAgICAgICAgICAgIHJ4OiByeCxcclxuICAgICAgICAgICAgICAgICAgICByeTogcnksXHJcbiAgICAgICAgICAgICAgICAgICAgcno6IHJ6XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcG9zdE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICAgICAgbWFya2VyczogbWFya2Vyc1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVBc3luYygpOiBQcm9taXNlPEV4YW1wbGVNYXJrZXJUcmFja2VyPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEV4YW1wbGVNYXJrZXJUcmFja2VyPigocmVzb2x2ZTogKHRyYWNrZXI6IEV4YW1wbGVNYXJrZXJUcmFja2VyKSA9PiB2b2lkKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0cmFja2VyID0gbmV3IEV4YW1wbGVNYXJrZXJUcmFja2VyKCk7XHJcbiAgICAgICAgICAgIHRyYWNrZXIuX3dvcmtlciA9IERlZGljYXRlZFdvcmtlci5jcmVhdGVGcm9tTG9jYXRpb24oXHJcbiAgICAgICAgICAgICAgICBFWEFNUExFX01PRFVMRV9VUkwsXHJcbiAgICAgICAgICAgICAgICBFeGFtcGxlTWFya2VyVHJhY2tlci5vbkluaXRpYWxpemVkLFxyXG4gICAgICAgICAgICAgICAgRXhhbXBsZU1hcmtlclRyYWNrZXIub25NZXNzYWdlKTtcclxuICAgICAgICAgICAgdHJhY2tlci5fd29ya2VyLm9ubWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0cmFja2VyLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUodHJhY2tlcik7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldENhbGlicmF0aW9uQXN5bmMod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IERlZGljYXRlZFdvcmtlci51bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhLmNhbGlicmF0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzdWx0LmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3dvcmtlci5wb3N0TWVzc2FnZSh7XHJcbiAgICAgICAgICAgIGNhbGlicmF0ZTogdHJ1ZSxcclxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZmluZE1hcmtlcnNJbkltYWdlQXN5bmModmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmUpOiBQcm9taXNlPGFueVtdPiB7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPGFueVtdPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSAocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhLm1hcmtlcnMpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdC5kYXRhLm1hcmtlcnMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3VsdC5kYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5fd29ya2VyLnBvc3RNZXNzYWdlKHtcclxuICAgICAgICAgICAgdHJhY2s6IHRydWUsXHJcbiAgICAgICAgICAgIHdpZHRoOiB2aWRlb1RleHR1cmUuZ2V0U2l6ZSgpLndpZHRoLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IHZpZGVvVGV4dHVyZS5nZXRTaXplKCkuaGVpZ2h0LFxyXG4gICAgICAgICAgICBpbWFnZURhdGE6IHZpZGVvVGV4dHVyZS5yZWFkUGl4ZWxzKClcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBOdWxsYWJsZSwgT2JzZXJ2ZXIsIFF1YXRlcm5pb24sIFNjZW5lLCBTdHJpbmdEaWN0aW9uYXJ5LCBWZWN0b3IzLCBWaWRlb1RleHR1cmUgfSBmcm9tIFwiYmFieWxvbmpzXCI7XHJcblxyXG5pbXBvcnQgeyBFeGFtcGxlTWFya2VyVHJhY2tlciB9IGZyb20gXCIuL2V4YW1wbGVNYXJrZXJUcmFja2VyXCJcclxuaW1wb3J0IHsgRmlsdGVyZWRWZWN0b3IzIH0gZnJvbSBcIi4uL3NoYXJlZC9maWx0ZXJlZFZlY3RvcjNcIlxyXG5pbXBvcnQgeyBUcmFja2VkTm9kZSB9IGZyb20gXCIuLi9zaGFyZWQvdHJhY2tlZE5vZGVcIlxyXG5cclxuZXhwb3J0IGNsYXNzIEV4YW1wbGVPYmplY3RUcmFja2VyIHtcclxuICAgIHByaXZhdGUgX3NjZW5lOiBTY2VuZTtcclxuICAgIHByaXZhdGUgX3ZpZGVvVGV4dHVyZTogVmlkZW9UZXh0dXJlO1xyXG4gICAgcHJpdmF0ZSBfcnVuVHJhY2tpbmdPYnNlcnZlcjogTnVsbGFibGU8T2JzZXJ2ZXI8U2NlbmU+PiA9IG51bGw7XHJcbiAgICBwcml2YXRlIF90cmFja2VyOiBFeGFtcGxlTWFya2VyVHJhY2tlcjtcclxuICAgIHByaXZhdGUgX3RyYWNrYWJsZU9iamVjdHM6IFN0cmluZ0RpY3Rpb25hcnk8VHJhY2tlZE5vZGU+ID0gbmV3IFN0cmluZ0RpY3Rpb25hcnk8VHJhY2tlZE5vZGU+KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBfX3Bvc0VzdGltYXRlOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XHJcbiAgICBwcml2YXRlIF9fcG9zRXN0aW1hdGVDb3VudDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgX19yaWdodEVzdGltYXRlOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XHJcbiAgICBwcml2YXRlIF9fcmlnaHRFc3RpbWF0ZUNvdW50OiBudW1iZXIgPSAwO1xyXG4gICAgcHJpdmF0ZSBfX2ZvcndhcmRFc3RpbWF0ZTogVmVjdG9yMyA9IFZlY3RvcjMuWmVybygpO1xyXG4gICAgcHJpdmF0ZSBfX2ZvcndhcmRFc3RpbWF0ZUNvdW50OiBudW1iZXIgPSAwO1xyXG4gICAgcHJpdmF0ZSBfX3NjcmF0Y2hWZWM6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcclxuICAgIHByaXZhdGUgX19maWx0ZXJlZFBvczogRmlsdGVyZWRWZWN0b3IzID0gbmV3IEZpbHRlcmVkVmVjdG9yMygwLjAsIDAuMCwgMC4wKTtcclxuICAgIHByaXZhdGUgX19maWx0ZXJlZFJpZ2h0OiBGaWx0ZXJlZFZlY3RvcjMgPSBuZXcgRmlsdGVyZWRWZWN0b3IzKDAuMCwgMC4wLCAwLjApO1xyXG4gICAgcHJpdmF0ZSBfX2ZpbHRlcmVkRm9yd2FyZDogRmlsdGVyZWRWZWN0b3IzID0gbmV3IEZpbHRlcmVkVmVjdG9yMygwLjAsIDAuMCwgMC4wKTtcclxuICAgIHByaXZhdGUgX190YXJnZXRQb3NpdGlvbjogVmVjdG9yMyA9IFZlY3RvcjMuWmVybygpO1xyXG4gICAgcHJpdmF0ZSBfX3RhcmdldFJvdGF0aW9uOiBRdWF0ZXJuaW9uID0gUXVhdGVybmlvbi5JZGVudGl0eSgpO1xyXG4gICAgcHJpdmF0ZSBfX3VsSWQ6IG51bWJlciA9IC0xO1xyXG4gICAgcHJpdmF0ZSBfX3VySWQ6IG51bWJlciA9IC0xO1xyXG4gICAgcHJpdmF0ZSBfX2xsSWQ6IG51bWJlciA9IC0xO1xyXG4gICAgcHJpdmF0ZSBfX2xySWQ6IG51bWJlciA9IC0xO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHZpZGVvVGV4dHVyZTogVmlkZW9UZXh0dXJlLCBzY2VuZTogU2NlbmUpIHtcclxuICAgICAgICB0aGlzLl9zY2VuZSA9IHNjZW5lO1xyXG4gICAgICAgIHRoaXMuX3ZpZGVvVGV4dHVyZSA9IHZpZGVvVGV4dHVyZTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRUcmFja2FibGVPYmplY3QodWw6IG51bWJlciwgdXI6IG51bWJlciwgbGw6IG51bWJlciwgbHI6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBbdWwsIHVyLCBsbCwgbHJdLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgdGhpcy5fdHJhY2thYmxlT2JqZWN0cy5hZGQoZGVzY3JpcHRvciwgbmV3IFRyYWNrZWROb2RlKGRlc2NyaXB0b3IudG9TdHJpbmcoKSwgdGhpcy5fc2NlbmUpKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJhY2thYmxlT2JqZWN0cy5nZXQoZGVzY3JpcHRvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1Jlc3VsdHMocmVzdWx0czogYW55KSB7XHJcbiAgICAgICAgLy8gVE9ETzogVEhJUyBJUyBIQUNLRUQgQ09ERVxyXG5cclxuICAgICAgICB0aGlzLl90cmFja2FibGVPYmplY3RzLmZvckVhY2goKGRlc2NyaXB0b3I6IHN0cmluZywgdHJhY2tlZE9iamVjdDogVHJhY2tlZE5vZGUpID0+IHtcclxuICAgICAgICAgICAgdmFyIG51bXMgPSBkZXNjcmlwdG9yLnNwbGl0KCcsJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX191bElkID0gcGFyc2VJbnQobnVtc1swXSk7XHJcbiAgICAgICAgICAgIHRoaXMuX191cklkID0gcGFyc2VJbnQobnVtc1sxXSk7XHJcbiAgICAgICAgICAgIHRoaXMuX19sbElkID0gcGFyc2VJbnQobnVtc1syXSk7XHJcbiAgICAgICAgICAgIHRoaXMuX19scklkID0gcGFyc2VJbnQobnVtc1szXSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGUuc2V0KDAuMCwgMC4wLCAwLjApO1xyXG4gICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGVDb3VudCA9IDAuMDtcclxuICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGUuc2V0KDAuMCwgMC4wLCAwLjApO1xyXG4gICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ID0gMC4wO1xyXG4gICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlLnNldCgwLjAsIDAuMCwgMC4wKTtcclxuICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50ID0gMC4wO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX2xsSWRdKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fdXJJZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX19sbElkXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX191cklkXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2NhbGVJblBsYWNlKDAuNSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50ICs9IDEuMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fbHJJZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX19scklkXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc3VidHJhY3RJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xsSWRdLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX3VsSWRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdWxJZF0ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnN1YnRyYWN0SW5QbGFjZShyZXN1bHRzW3RoaXMuX19sbElkXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMubm9ybWFsaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQgKz0gMS4wO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fdXJJZF0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19scklkXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VySWRdLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zdWJ0cmFjdEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbHJJZF0ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLm5vcm1hbGl6ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX3VsSWRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdXJJZF0ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnN1YnRyYWN0SW5QbGFjZShyZXN1bHRzW3RoaXMuX191bElkXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMubm9ybWFsaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGVDb3VudCArPSAxLjA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19scklkXSAmJiByZXN1bHRzW3RoaXMuX191bElkXSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX19scklkXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VsSWRdLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNjYWxlSW5QbGFjZSgwLjUpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGVDb3VudCArPSAxLjA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9fcG9zRXN0aW1hdGVDb3VudCAqIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQgKiB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGUuc2NhbGVJblBsYWNlKDEuMCAvIHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLnNjYWxlSW5QbGFjZSgxLjAgLyB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGUuc2NhbGVJblBsYWNlKDEuMCAvIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkUG9zLmFkZFNhbXBsZSh0aGlzLl9fcG9zRXN0aW1hdGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkUmlnaHQuYWRkU2FtcGxlKHRoaXMuX19yaWdodEVzdGltYXRlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX19maWx0ZXJlZEZvcndhcmQuYWRkU2FtcGxlKHRoaXMuX19mb3J3YXJkRXN0aW1hdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRQb3NpdGlvbi5jb3B5RnJvbSh0aGlzLl9fZmlsdGVyZWRQb3MpO1xyXG4gICAgICAgICAgICAgICAgUXVhdGVybmlvbi5Sb3RhdGlvblF1YXRlcm5pb25Gcm9tQXhpc1RvUmVmKFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19maWx0ZXJlZFJpZ2h0LCBcclxuICAgICAgICAgICAgICAgICAgICBWZWN0b3IzLkNyb3NzKHRoaXMuX19maWx0ZXJlZEZvcndhcmQsIHRoaXMuX19maWx0ZXJlZFJpZ2h0KSwgXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkRm9yd2FyZCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0Um90YXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRyYWNrZWRPYmplY3Quc2V0VHJhY2tpbmcoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFBvc2l0aW9uLCBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0Um90YXRpb24sIFxyXG4gICAgICAgICAgICAgICAgICAgIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHJhY2tlZE9iamVjdC5zZXRUcmFja2luZyhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0UG9zaXRpb24sIFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbiwgXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRDYWxpYnJhdGlvbkFzeW5jKHNjYWxhciA9IDEpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJhY2tlci5zZXRDYWxpYnJhdGlvbkFzeW5jKFxyXG4gICAgICAgICAgICBNYXRoLnJvdW5kKHNjYWxhciAqIHRoaXMuX3ZpZGVvVGV4dHVyZS5nZXRTaXplKCkud2lkdGgpLCBcclxuICAgICAgICAgICAgTWF0aC5yb3VuZChzY2FsYXIgKiB0aGlzLl92aWRlb1RleHR1cmUuZ2V0U2l6ZSgpLmhlaWdodCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRRdWF0ZXJuaW9uRnJvbVJvZHJpZ3Vlcyh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKSB7XHJcbiAgICAgICAgdmFyIHJvdCA9IG5ldyBWZWN0b3IzKC14LCB5LCAteik7XHJcbiAgICAgICAgdmFyIHRoZXRhID0gcm90Lmxlbmd0aCgpO1xyXG4gICAgICAgIHJvdC5zY2FsZUluUGxhY2UoMS4wIC8gdGhldGEpO1xyXG4gICAgICAgIGlmICh0aGV0YSAhPT0gMC4wKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBRdWF0ZXJuaW9uLlJvdGF0aW9uQXhpcyhyb3QsIHRoZXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgc3RhcnRUcmFja2luZygpIHtcclxuICAgICAgICB2YXIgcnVubmluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3J1blRyYWNraW5nT2JzZXJ2ZXIgPSB0aGlzLl9zY2VuZS5vbkFmdGVyUmVuZGVyT2JzZXJ2YWJsZS5hZGQoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXJ1bm5pbmcpIHtcclxuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3RyYWNrZXIuZmluZE1hcmtlcnNJbkltYWdlQXN5bmModGhpcy5fdmlkZW9UZXh0dXJlKS50aGVuKG1hcmtlcnMgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHRzOiBhbnkgPSB7fTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1ttYXJrZXIuaWRdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBuZXcgVmVjdG9yMyhtYXJrZXIudHgsIC1tYXJrZXIudHksIG1hcmtlci50eiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IEV4YW1wbGVPYmplY3RUcmFja2VyLmdldFF1YXRlcm5pb25Gcm9tUm9kcmlndWVzKG1hcmtlci5yeCwgbWFya2VyLnJ5LCBtYXJrZXIucnopXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmVzdWx0cyhyZXN1bHRzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcFRyYWNraW5nKCkge1xyXG4gICAgICAgIHRoaXMuX3NjZW5lLm9uQWZ0ZXJSZW5kZXJPYnNlcnZhYmxlLnJlbW92ZSh0aGlzLl9ydW5UcmFja2luZ09ic2VydmVyKTtcclxuICAgICAgICB0aGlzLl9ydW5UcmFja2luZ09ic2VydmVyID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgY3JlYXRlQXN5bmModmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmUsIHNjZW5lOiBTY2VuZSkge1xyXG4gICAgICAgIHZhciBvYmplY3RUcmFja2VyID0gbmV3IEV4YW1wbGVPYmplY3RUcmFja2VyKHZpZGVvVGV4dHVyZSwgc2NlbmUpO1xyXG4gICAgICAgIHJldHVybiBFeGFtcGxlTWFya2VyVHJhY2tlci5jcmVhdGVBc3luYygpLnRoZW4odHJhY2tlciA9PiB7XHJcbiAgICAgICAgICAgIG9iamVjdFRyYWNrZXIuX3RyYWNrZXIgPSB0cmFja2VyO1xyXG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0VHJhY2tlci5zZXRDYWxpYnJhdGlvbkFzeW5jKCk7XHJcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUcmFja2VyO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRGVkaWNhdGVkV29ya2VyIH0gZnJvbSBcIi4uL3NoYXJlZC9kZWRpY2F0ZWRXb3JrZXJcIlxyXG5pbXBvcnQgeyBFWEFNUExFX01PRFVMRV9VUkwgfSBmcm9tIFwiLi4vc2hhcmVkL2NvbnN0YW50c1wiXHJcblxyXG5kZWNsYXJlIGZ1bmN0aW9uIHBvc3RNZXNzYWdlKGRhdGE6IGFueSk6IHZvaWQ7XHJcblxyXG5leHBvcnQgY2xhc3MgRXhhbXBsZVdvcmtlciB7XHJcbiAgICBwcml2YXRlIF93b3JrZXI6IFdvcmtlcjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBvbkluaXRpYWxpemVkKCk6IHZvaWQge1xyXG4gICAgICAgIHBvc3RNZXNzYWdlKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogXCJHb3QgYSBtb2R1bGUhXCJcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBvbk1lc3NhZ2UoZXZlbnQ6IE1lc3NhZ2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGxldCBkYXRhID0gZXZlbnQuZGF0YTtcclxuICAgICAgICBkYXRhLndlbnRUb1dvcmtlciA9IHRydWU7XHJcbiAgICAgICAgcG9zdE1lc3NhZ2UoZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVBc3luYygpOiBQcm9taXNlPEV4YW1wbGVXb3JrZXI+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8RXhhbXBsZVdvcmtlcj4oKHJlc29sdmU6ICh3b3JrZXI6IEV4YW1wbGVXb3JrZXIpID0+IHZvaWQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGV4YW1wbGVXb3JrZXIgPSBuZXcgRXhhbXBsZVdvcmtlcigpO1xyXG4gICAgICAgICAgICBleGFtcGxlV29ya2VyLl93b3JrZXIgPSBEZWRpY2F0ZWRXb3JrZXIuY3JlYXRlRnJvbUxvY2F0aW9uKFxyXG4gICAgICAgICAgICAgICAgRVhBTVBMRV9NT0RVTEVfVVJMLFxyXG4gICAgICAgICAgICAgICAgRXhhbXBsZVdvcmtlci5vbkluaXRpYWxpemVkLFxyXG4gICAgICAgICAgICAgICAgRXhhbXBsZVdvcmtlci5vbk1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBleGFtcGxlV29ya2VyLl93b3JrZXIub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGV4YW1wbGVXb3JrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShleGFtcGxlV29ya2VyKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2VuZE1lc3NhZ2VBc3luYyhkYXRhOiBhbnkpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIGxldCBwcm9taXNlID0gbmV3IFByb21pc2U8YW55PigocmVzb2x2ZTogKHZhbHVlOiBhbnkpID0+IHZvaWQpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGV2ZW50LmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IERlZGljYXRlZFdvcmtlci51bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXI7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3dvcmtlci5wb3N0TWVzc2FnZShkYXRhKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgY29uc3QgRVhBTVBMRV9NT0RVTEVfVVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vc3ludGhldGljbWFndXMuZ2l0aHViLmlvL3Byb3RvdHlwaW5nL2JhYnlsb25hci93YXNtL3dlYnBpbGVkLWFydWNvLWFyLmpzXCI7IiwiZXhwb3J0IGNsYXNzIERlZGljYXRlZFdvcmtlciB7XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlRnJvbVNvdXJjZXMoLi4uc291cmNlczogYW55W10pOiBXb3JrZXIge1xyXG4gICAgICAgIGxldCB3b3JrZXJDb2RlOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHNvdXJjZXMubGVuZ3RoIC0gMTsgaWR4KyspIHtcclxuICAgICAgICAgICAgd29ya2VyQ29kZSArPSBzb3VyY2VzW2lkeF0udG9TdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd29ya2VyQ29kZSArPSBcIihcIiArIHNvdXJjZXNbc291cmNlcy5sZW5ndGggLSAxXS50b1N0cmluZygpICsgXCIpKCk7XCI7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXb3JrZXIod2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW3dvcmtlckNvZGVdKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlRnJvbUxvY2F0aW9uKGpzVXJsOiBzdHJpbmcsIG9uSW5pdGlhbGl6ZWQ6ICgpID0+IHZvaWQsIG9uTWVzc2FnZTogKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHZvaWQpOiBXb3JrZXIge1xyXG4gICAgICAgIGxldCBtb2R1bGVEZWZpdGlvbjogc3RyaW5nID0gYE1vZHVsZSA9IHtcclxuICAgICAgICAgICAgbG9jYXRlRmlsZTogZnVuY3Rpb24gKHBhdGgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcXFwiYCArIGpzVXJsLnJlcGxhY2UoLy5qcyQvLCBcIi53YXNtXCIpICsgYFxcXCI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uUnVudGltZUluaXRpYWxpemVkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAoYCArIG9uSW5pdGlhbGl6ZWQudG9TdHJpbmcoKSArIGApKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O2A7XHJcbiAgICAgICAgbGV0IG1lc3NhZ2VIYW5kbGVyOiBzdHJpbmcgPSBcInRoaXMub25tZXNzYWdlID0gXCIgKyBvbk1lc3NhZ2UudG9TdHJpbmcoKSArIFwiO1wiO1xyXG4gICAgICAgIGxldCBpbXBvcnRKYXZhc2NyaXB0OiBzdHJpbmcgPSBcImZ1bmN0aW9uIGltcG9ydEphdmFzY3JpcHQoKSB7IGltcG9ydFNjcmlwdHMoXFxcIlwiICsganNVcmwgKyBcIlxcXCIpOyB9XCI7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRnJvbVNvdXJjZXMobW9kdWxlRGVmaXRpb24sIG1lc3NhZ2VIYW5kbGVyLCBpbXBvcnRKYXZhc2NyaXB0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcihldmVudDogTWVzc2FnZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJVbmV4cGVjdGVkIG1lc3NhZ2UgZnJvbSBXZWJXb3JrZXI6IFwiICsgZXZlbnQpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gXCJiYWJ5bG9uanNcIlxyXG5cclxuZXhwb3J0IGNsYXNzIEZpbHRlcmVkVmVjdG9yMyBleHRlbmRzIFZlY3RvcjMge1xyXG4gICAgcHJpdmF0ZSBfaWR4OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9zYW1wbGVzOiBWZWN0b3IzW107XHJcbiAgICBwcml2YXRlIF9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzOiBudW1iZXJbXTtcclxuICAgIHByaXZhdGUgX3NhbXBsZUF2ZXJhZ2U6IFZlY3RvcjM7XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHNhbXBsZUNvdW50OiBudW1iZXIgPSAxKSB7XHJcbiAgICAgICAgc3VwZXIoeCwgeSwgeik7XHJcblxyXG4gICAgICAgIHRoaXMuX2lkeCA9IDA7XHJcbiAgICAgICAgdGhpcy5fc2FtcGxlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXMgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzYW1wbGVDb3VudDsgKytpZHgpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2FtcGxlcy5wdXNoKG5ldyBWZWN0b3IzKHgsIHksIHopKTtcclxuICAgICAgICAgICAgdGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlcy5wdXNoKDAuMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlID0gbmV3IFZlY3RvcjMoeCwgeSwgeik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZFNhbXBsZShzYW1wbGU6IFZlY3RvcjMpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLnNjYWxlSW5QbGFjZSh0aGlzLl9zYW1wbGVzLmxlbmd0aCk7XHJcbiAgICAgICAgdGhpcy5fc2FtcGxlQXZlcmFnZS5zdWJ0cmFjdEluUGxhY2UodGhpcy5fc2FtcGxlc1t0aGlzLl9pZHhdKTtcclxuICAgICAgICB0aGlzLl9zYW1wbGVzW3RoaXMuX2lkeF0uY29weUZyb20oc2FtcGxlKTtcclxuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLmFkZEluUGxhY2UodGhpcy5fc2FtcGxlc1t0aGlzLl9pZHhdKTtcclxuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLnNjYWxlSW5QbGFjZSgxLjAgLyB0aGlzLl9zYW1wbGVzLmxlbmd0aCk7XHJcbiAgICAgICAgdGhpcy5faWR4ID0gKHRoaXMuX2lkeCArIDEpICUgdGhpcy5fc2FtcGxlcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGxldCBhdmdTcXVhcmVkRGlzdGFuY2UgPSAwLjA7XHJcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdGhpcy5fc2FtcGxlcy5sZW5ndGg7ICsraWR4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXNbaWR4XSA9IFZlY3RvcjMuRGlzdGFuY2VTcXVhcmVkKHRoaXMuX3NhbXBsZUF2ZXJhZ2UsIHRoaXMuX3NhbXBsZXNbaWR4XSk7XHJcbiAgICAgICAgICAgIGF2Z1NxdWFyZWREaXN0YW5jZSArPSB0aGlzLl9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF2Z1NxdWFyZWREaXN0YW5jZSAvPSB0aGlzLl9zYW1wbGVzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgbGV0IG51bUluY2x1ZGVkU2FtcGxlcyA9IDA7XHJcbiAgICAgICAgdGhpcy5zZXQoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDw9IHRoaXMuX3NhbXBsZXMubGVuZ3RoOyArK2lkeCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlc1tpZHhdIDw9IGF2Z1NxdWFyZWREaXN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRJblBsYWNlKHRoaXMuX3NhbXBsZXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICBudW1JbmNsdWRlZFNhbXBsZXMgKz0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNjYWxlSW5QbGFjZSgxLjAgLyBudW1JbmNsdWRlZFNhbXBsZXMpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgT2JzZXJ2YWJsZSwgUXVhdGVybmlvbiwgU2NlbmUsIFRyYW5zZm9ybU5vZGUsIFZlY3RvcjMgfSBmcm9tIFwiYmFieWxvbmpzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBUcmFja2VkTm9kZSBleHRlbmRzIFRyYW5zZm9ybU5vZGUge1xyXG4gICAgcHJpdmF0ZSBfaXNUcmFja2luZzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX25vdFRyYWNrZWRGcmFtZXNDb3VudDogbnVtYmVyOyAvLyBUT0RPOiBSZW1vdmUgdGhpcyBmZWF0dXJlLCB3aGljaCBvbmx5IGV4aXN0cyBhcyBhIHN0b3BnYXAuXHJcblxyXG4gICAgcHVibGljIG9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGU6IE9ic2VydmFibGU8VHJhY2tlZE5vZGU+O1xyXG4gICAgcHVibGljIG9uVHJhY2tpbmdMb3N0T2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUcmFja2VkTm9kZT47XHJcbiAgICBwdWJsaWMgZGlzYWJsZVdoZW5Ob3RUcmFja2VkOiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNjZW5lPzogU2NlbmUgfCBudWxsIHwgdW5kZWZpbmVkLCBkaXNhYmxlV2hlbk5vdFRyYWNrZWQ6IGJvb2xlYW4gPSB0cnVlKSB7XHJcbiAgICAgICAgc3VwZXIobmFtZSwgc2NlbmUsIHRydWUpO1xyXG5cclxuICAgICAgICB0aGlzLl9pc1RyYWNraW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlV2hlbk5vdFRyYWNrZWQgPSBkaXNhYmxlV2hlbk5vdFRyYWNrZWQ7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZVdoZW5Ob3RUcmFja2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RW5hYmxlZChmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9ub3RUcmFja2VkRnJhbWVzQ291bnQgPSAxMDtcclxuXHJcbiAgICAgICAgdGhpcy5vblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlID0gbmV3IE9ic2VydmFibGUob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5faXNUcmFja2luZykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlLm5vdGlmeU9ic2VydmVyKG9ic2VydmVyLCB0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMub25UcmFja2luZ0xvc3RPYnNlcnZhYmxlID0gbmV3IE9ic2VydmFibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5yb3RhdGlvblF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLklkZW50aXR5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGlzVHJhY2tpbmcoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVHJhY2tpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFRyYWNraW5nKHBvc2l0aW9uOiBWZWN0b3IzLCByb3RhdGlvbjogUXVhdGVybmlvbiwgaXNUcmFja2luZzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24uY29weUZyb20ocG9zaXRpb24pO1xyXG4gICAgICAgIHRoaXMucm90YXRpb25RdWF0ZXJuaW9uID8gdGhpcy5yb3RhdGlvblF1YXRlcm5pb24uY29weUZyb20ocm90YXRpb24pIDogdGhpcy5yb3RhdGlvblF1YXRlcm5pb24gPSByb3RhdGlvbi5jbG9uZSgpO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBmZWF0dXJlLCB3aGljaCBvbmx5IGV4aXN0cyBhcyBhIHN0b3BnYXAuXHJcbiAgICAgICAgaWYgKGlzVHJhY2tpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50ID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX25vdFRyYWNrZWRGcmFtZXNDb3VudCArPSAxO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50IDwgNSkge1xyXG4gICAgICAgICAgICAgICAgaXNUcmFja2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5faXNUcmFja2luZyAmJiBpc1RyYWNraW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25UcmFja2luZ0FjcXVpcmVkT2JzZXJ2YWJsZS5ub3RpZnlPYnNlcnZlcnModGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuX2lzVHJhY2tpbmcgJiYgIWlzVHJhY2tpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5vblRyYWNraW5nTG9zdE9ic2VydmFibGUubm90aWZ5T2JzZXJ2ZXJzKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9pc1RyYWNraW5nID0gaXNUcmFja2luZztcclxuICAgICAgICB0aGlzLnNldEVuYWJsZWQoIXRoaXMuZGlzYWJsZVdoZW5Ob3RUcmFja2VkIHx8IHRoaXMuX2lzVHJhY2tpbmcpO1xyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=

window.define = externalDefine;window.require = externalRequire;
