(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BabylonAR = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
    ExampleMarkerTracker.CreateAsync = function () {
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
},{"../shared/constants":3,"../shared/dedicatedWorker":4}],2:[function(require,module,exports){
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
                trackedObject.setTracking(_this.__targetPosition, _this.__targetRotation, false);
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
    ExampleObjectTracker.CreateAsync = function (videoTexture, scene) {
        var objectTracker = new ExampleObjectTracker(videoTexture, scene);
        return exampleMarkerTracker_1.ExampleMarkerTracker.CreateAsync().then(function (tracker) {
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

},{"../shared/filteredVector3":5,"../shared/trackedNode":6,"./exampleMarkerTracker":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CDN_URL = "https://ar.babylonjs.com/";
var CDN_WASM_MODULES_URL = CDN_URL + "wasm/";
exports.EXAMPLE_MODULE_URL = CDN_WASM_MODULES_URL + "webpiled-aruco-ar.js";
exports.ARUCO_META_MARKER_TRACKER_URL = CDN_WASM_MODULES_URL + "aruco-meta-marker-tracker.js";
exports.IMAGE_TEMPLATE_TRACKER_URL = CDN_WASM_MODULES_URL + "image-template-tracker.js";
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}]},{},[2])(2)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU1hcmtlclRyYWNrZXIudHMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU9iamVjdFRyYWNrZXIudHMiLCJzcmMvdHMvc2hhcmVkL2NvbnN0YW50cy50cyIsInNyYy90cy9zaGFyZWQvZGVkaWNhdGVkV29ya2VyLnRzIiwic3JjL3RzL3NoYXJlZC9maWx0ZXJlZFZlY3RvcjMudHMiLCJzcmMvdHMvc2hhcmVkL3RyYWNrZWROb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSw2REFBMkQ7QUFDM0QsaURBQXdEO0FBS3hEO0lBR0k7SUFBdUIsQ0FBQztJQUVULGtDQUFhLEdBQTVCO1FBQ0ksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hCLFdBQVcsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFYyw4QkFBUyxHQUF4QixVQUF5QixLQUFtQjtRQUN4QyxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBRXhCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQixXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNoQzthQUNJLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNyQixNQUFNLENBQUMsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakUsV0FBVyxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDckM7YUFDSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDakIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE9B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QUFFO1lBQ2pDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0Q7YUFDSSxJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDdEMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2RDtRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFDTCxrQkFBQztBQUFELENBekRBLEFBeURDLENBekRnQyx5QkFBYSxHQXlEN0M7QUF6RFksa0NBQVciLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgeyBWaWRlb1RleHR1cmUgfSBmcm9tIFwiYmFieWxvbmpzXCJcblxuaW1wb3J0IHsgRGVkaWNhdGVkV29ya2VyIH0gZnJvbSBcIi4uL3NoYXJlZC9kZWRpY2F0ZWRXb3JrZXJcIlxuaW1wb3J0IHsgRVhBTVBMRV9NT0RVTEVfVVJMIH0gZnJvbSBcIi4uL3NoYXJlZC9jb25zdGFudHNcIlxuXG5kZWNsYXJlIHZhciBNb2R1bGU6IGFueTtcbmRlY2xhcmUgZnVuY3Rpb24gcG9zdE1lc3NhZ2UoZGF0YTogYW55KTogdm9pZDtcblxuZXhwb3J0IGNsYXNzIEV4YW1wbGVNYXJrZXJUcmFja2VyIHtcbiAgICBwcml2YXRlIF93b3JrZXI6IFdvcmtlcjtcblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25Jbml0aWFsaXplZCgpIHtcbiAgICAgICAgTW9kdWxlLl9yZXNldCgpO1xuICAgICAgICBwb3N0TWVzc2FnZSh7IGluaXRpYWxpemVkOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIG9uTWVzc2FnZShldmVudDogTWVzc2FnZUV2ZW50KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBldmVudC5kYXRhO1xuXG4gICAgICAgIGlmIChhcmdzLnJlc2V0KSB7XG4gICAgICAgICAgICBNb2R1bGUuX3Jlc2V0KCk7XG4gICAgICAgICAgICBwb3N0TWVzc2FnZSh7IHJlc2V0OiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGFyZ3MuY2FsaWJyYXRlKSB7XG4gICAgICAgICAgICBNb2R1bGUuX3NldF9jYWxpYnJhdGlvbl9mcm9tX2ZyYW1lX3NpemUoYXJncy53aWR0aCwgYXJncy5oZWlnaHQpO1xuICAgICAgICAgICAgcG9zdE1lc3NhZ2UoeyBjYWxpYnJhdGVkOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGFyZ3MudHJhY2spIHtcbiAgICAgICAgICAgIGxldCBidWYgPSBNb2R1bGUuX21hbGxvYyhhcmdzLmltYWdlRGF0YS5sZW5ndGggKiBhcmdzLmltYWdlRGF0YS5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICAgICAgICBNb2R1bGUuSEVBUDguc2V0KGFyZ3MuaW1hZ2VEYXRhLCBidWYpO1xuICAgICAgICAgICAgbGV0IG51bU1hcmtlcnMgPSBNb2R1bGUuX3Byb2Nlc3NfaW1hZ2UoYXJncy53aWR0aCwgYXJncy5oZWlnaHQsIGJ1ZiwgMSk7XG4gICAgICAgICAgICBNb2R1bGUuX2ZyZWUoYnVmKTtcblxuICAgICAgICAgICAgbGV0IG1hcmtlcnM6IGFueVtdID0gW107XG4gICAgICAgICAgICBsZXQgb2Zmc2V0OiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgbGV0IGlkOiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgbGV0IHR4OiBudW1iZXIgPSAwLjA7XG4gICAgICAgICAgICBsZXQgdHk6IG51bWJlciA9IDAuMDtcbiAgICAgICAgICAgIGxldCB0ejogbnVtYmVyID0gMC4wO1xuICAgICAgICAgICAgbGV0IHJ4OiBudW1iZXIgPSAwLjA7XG4gICAgICAgICAgICBsZXQgcnk6IG51bWJlciA9IDAuMDtcbiAgICAgICAgICAgIGxldCByejogbnVtYmVyID0gMC4wO1xuICAgICAgICAgICAgZm9yIChsZXQgbWFya2VySWR4ID0gMDsgbWFya2VySWR4IDwgbnVtTWFya2VyczsgbWFya2VySWR4KyspIHtcbiAgICAgICAgICAgICAgICBsZXQgcHRyID0gTW9kdWxlLl9nZXRfdHJhY2tlZF9tYXJrZXIobWFya2VySWR4KTtcblxuICAgICAgICAgICAgICAgIG9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgaWQgPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImkzMlwiKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gMTI7XG4gICAgICAgICAgICAgICAgdHggPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImRvdWJsZVwiKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcbiAgICAgICAgICAgICAgICB0eSA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSA4O1xuICAgICAgICAgICAgICAgIHR6ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XG4gICAgICAgICAgICAgICAgcnggPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImRvdWJsZVwiKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcbiAgICAgICAgICAgICAgICByeSA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSA4O1xuICAgICAgICAgICAgICAgIHJ6ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XG5cbiAgICAgICAgICAgICAgICBtYXJrZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgICAgIHR4OiB0eCxcbiAgICAgICAgICAgICAgICAgICAgdHk6IHR5LFxuICAgICAgICAgICAgICAgICAgICB0ejogdHosXG4gICAgICAgICAgICAgICAgICAgIHJ4OiByeCxcbiAgICAgICAgICAgICAgICAgICAgcnk6IHJ5LFxuICAgICAgICAgICAgICAgICAgICByejogcnpcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIG1hcmtlcnM6IG1hcmtlcnNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBDcmVhdGVBc3luYygpOiBQcm9taXNlPEV4YW1wbGVNYXJrZXJUcmFja2VyPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxFeGFtcGxlTWFya2VyVHJhY2tlcj4oKHJlc29sdmU6ICh0cmFja2VyOiBFeGFtcGxlTWFya2VyVHJhY2tlcikgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRyYWNrZXIgPSBuZXcgRXhhbXBsZU1hcmtlclRyYWNrZXIoKTtcbiAgICAgICAgICAgIHRyYWNrZXIuX3dvcmtlciA9IERlZGljYXRlZFdvcmtlci5jcmVhdGVGcm9tTG9jYXRpb24oXG4gICAgICAgICAgICAgICAgRVhBTVBMRV9NT0RVTEVfVVJMLFxuICAgICAgICAgICAgICAgIEV4YW1wbGVNYXJrZXJUcmFja2VyLm9uSW5pdGlhbGl6ZWQsXG4gICAgICAgICAgICAgICAgRXhhbXBsZU1hcmtlclRyYWNrZXIub25NZXNzYWdlKTtcbiAgICAgICAgICAgIHRyYWNrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyYWNrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xuICAgICAgICAgICAgICAgIHJlc29sdmUodHJhY2tlcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Q2FsaWJyYXRpb25Bc3luYyh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YS5jYWxpYnJhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXN1bHQuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl93b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgY2FsaWJyYXRlOiB0cnVlLFxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgcHVibGljIGZpbmRNYXJrZXJzSW5JbWFnZUFzeW5jKHZpZGVvVGV4dHVyZTogVmlkZW9UZXh0dXJlKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8YW55W10+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IERlZGljYXRlZFdvcmtlci51bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXI7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhLm1hcmtlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQuZGF0YS5tYXJrZXJzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXN1bHQuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fd29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHRyYWNrOiB0cnVlLFxuICAgICAgICAgICAgd2lkdGg6IHZpZGVvVGV4dHVyZS5nZXRTaXplKCkud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHZpZGVvVGV4dHVyZS5nZXRTaXplKCkuaGVpZ2h0LFxuICAgICAgICAgICAgaW1hZ2VEYXRhOiB2aWRlb1RleHR1cmUucmVhZFBpeGVscygpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBOdWxsYWJsZSwgT2JzZXJ2ZXIsIFF1YXRlcm5pb24sIFNjZW5lLCBTdHJpbmdEaWN0aW9uYXJ5LCBWZWN0b3IzLCBWaWRlb1RleHR1cmUgfSBmcm9tIFwiYmFieWxvbmpzXCI7XG5cbmltcG9ydCB7IEV4YW1wbGVNYXJrZXJUcmFja2VyIH0gZnJvbSBcIi4vZXhhbXBsZU1hcmtlclRyYWNrZXJcIlxuaW1wb3J0IHsgRmlsdGVyZWRWZWN0b3IzIH0gZnJvbSBcIi4uL3NoYXJlZC9maWx0ZXJlZFZlY3RvcjNcIlxuaW1wb3J0IHsgVHJhY2tlZE5vZGUgfSBmcm9tIFwiLi4vc2hhcmVkL3RyYWNrZWROb2RlXCJcblxuZXhwb3J0IGNsYXNzIEV4YW1wbGVPYmplY3RUcmFja2VyIHtcbiAgICBwcml2YXRlIF9zY2VuZTogU2NlbmU7XG4gICAgcHJpdmF0ZSBfdmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmU7XG4gICAgcHJpdmF0ZSBfcnVuVHJhY2tpbmdPYnNlcnZlcjogTnVsbGFibGU8T2JzZXJ2ZXI8U2NlbmU+PiA9IG51bGw7XG4gICAgcHJpdmF0ZSBfdHJhY2tlcjogRXhhbXBsZU1hcmtlclRyYWNrZXI7XG4gICAgcHJpdmF0ZSBfdHJhY2thYmxlT2JqZWN0czogU3RyaW5nRGljdGlvbmFyeTxUcmFja2VkTm9kZT4gPSBuZXcgU3RyaW5nRGljdGlvbmFyeTxUcmFja2VkTm9kZT4oKTtcblxuICAgIHByaXZhdGUgX19wb3NFc3RpbWF0ZTogVmVjdG9yMyA9IFZlY3RvcjMuWmVybygpO1xuICAgIHByaXZhdGUgX19wb3NFc3RpbWF0ZUNvdW50OiBudW1iZXIgPSAwO1xuICAgIHByaXZhdGUgX19yaWdodEVzdGltYXRlOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XG4gICAgcHJpdmF0ZSBfX3JpZ2h0RXN0aW1hdGVDb3VudDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlIF9fZm9yd2FyZEVzdGltYXRlOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XG4gICAgcHJpdmF0ZSBfX2ZvcndhcmRFc3RpbWF0ZUNvdW50OiBudW1iZXIgPSAwO1xuICAgIHByaXZhdGUgX19zY3JhdGNoVmVjOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XG4gICAgcHJpdmF0ZSBfX2ZpbHRlcmVkUG9zOiBGaWx0ZXJlZFZlY3RvcjMgPSBuZXcgRmlsdGVyZWRWZWN0b3IzKDAuMCwgMC4wLCAwLjApO1xuICAgIHByaXZhdGUgX19maWx0ZXJlZFJpZ2h0OiBGaWx0ZXJlZFZlY3RvcjMgPSBuZXcgRmlsdGVyZWRWZWN0b3IzKDAuMCwgMC4wLCAwLjApO1xuICAgIHByaXZhdGUgX19maWx0ZXJlZEZvcndhcmQ6IEZpbHRlcmVkVmVjdG9yMyA9IG5ldyBGaWx0ZXJlZFZlY3RvcjMoMC4wLCAwLjAsIDAuMCk7XG4gICAgcHJpdmF0ZSBfX3RhcmdldFBvc2l0aW9uOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XG4gICAgcHJpdmF0ZSBfX3RhcmdldFJvdGF0aW9uOiBRdWF0ZXJuaW9uID0gUXVhdGVybmlvbi5JZGVudGl0eSgpO1xuICAgIHByaXZhdGUgX191bElkOiBudW1iZXIgPSAtMTtcbiAgICBwcml2YXRlIF9fdXJJZDogbnVtYmVyID0gLTE7XG4gICAgcHJpdmF0ZSBfX2xsSWQ6IG51bWJlciA9IC0xO1xuICAgIHByaXZhdGUgX19scklkOiBudW1iZXIgPSAtMTtcblxuICAgIGNvbnN0cnVjdG9yKHZpZGVvVGV4dHVyZTogVmlkZW9UZXh0dXJlLCBzY2VuZTogU2NlbmUpIHtcbiAgICAgICAgdGhpcy5fc2NlbmUgPSBzY2VuZTtcbiAgICAgICAgdGhpcy5fdmlkZW9UZXh0dXJlID0gdmlkZW9UZXh0dXJlO1xuICAgIH1cblxuICAgIGFkZFRyYWNrYWJsZU9iamVjdCh1bDogbnVtYmVyLCB1cjogbnVtYmVyLCBsbDogbnVtYmVyLCBscjogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBbdWwsIHVyLCBsbCwgbHJdLnRvU3RyaW5nKCk7XG4gICAgICAgIHRoaXMuX3RyYWNrYWJsZU9iamVjdHMuYWRkKGRlc2NyaXB0b3IsIG5ldyBUcmFja2VkTm9kZShkZXNjcmlwdG9yLnRvU3RyaW5nKCksIHRoaXMuX3NjZW5lKSk7XG4gICAgICAgIHJldHVybiB0aGlzLl90cmFja2FibGVPYmplY3RzLmdldChkZXNjcmlwdG9yKTtcbiAgICB9XG5cbiAgICBwcm9jZXNzUmVzdWx0cyhyZXN1bHRzOiBhbnkpIHtcbiAgICAgICAgLy8gVE9ETzogVEhJUyBJUyBIQUNLRUQgQ09ERVxuXG4gICAgICAgIHRoaXMuX3RyYWNrYWJsZU9iamVjdHMuZm9yRWFjaCgoZGVzY3JpcHRvcjogc3RyaW5nLCB0cmFja2VkT2JqZWN0OiBUcmFja2VkTm9kZSkgPT4ge1xuICAgICAgICAgICAgdmFyIG51bXMgPSBkZXNjcmlwdG9yLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICB0aGlzLl9fdWxJZCA9IHBhcnNlSW50KG51bXNbMF0pO1xuICAgICAgICAgICAgdGhpcy5fX3VySWQgPSBwYXJzZUludChudW1zWzFdKTtcbiAgICAgICAgICAgIHRoaXMuX19sbElkID0gcGFyc2VJbnQobnVtc1syXSk7XG4gICAgICAgICAgICB0aGlzLl9fbHJJZCA9IHBhcnNlSW50KG51bXNbM10pO1xuXG4gICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGUuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlQ291bnQgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZS5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ID0gMC4wO1xuICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZS5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQgPSAwLjA7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19sbElkXSkge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX191cklkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbGxJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VySWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2NhbGVJblBsYWNlKDAuNSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50ICs9IDEuMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fbHJJZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xySWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc3VidHJhY3RJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xsSWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGVDb3VudCArPSAxLjA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX191bElkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdWxJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zdWJ0cmFjdEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbGxJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCArPSAxLjA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fdXJJZF0pIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fbHJJZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VySWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc3VidHJhY3RJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xySWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQgKz0gMS4wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fdWxJZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VySWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc3VidHJhY3RJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VsSWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGVDb3VudCArPSAxLjA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fbHJJZF0gJiYgcmVzdWx0c1t0aGlzLl9fdWxJZF0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX19scklkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX191bElkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2NhbGVJblBsYWNlKDAuNSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50ICs9IDEuMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50ICogdGhpcy5fX3JpZ2h0RXN0aW1hdGVDb3VudCAqIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGUuc2NhbGVJblBsYWNlKDEuMCAvIHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZS5zY2FsZUluUGxhY2UoMS4wIC8gdGhpcy5fX3JpZ2h0RXN0aW1hdGVDb3VudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZS5zY2FsZUluUGxhY2UoMS4wIC8gdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50KTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX19maWx0ZXJlZFBvcy5hZGRTYW1wbGUodGhpcy5fX3Bvc0VzdGltYXRlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZmlsdGVyZWRSaWdodC5hZGRTYW1wbGUodGhpcy5fX3JpZ2h0RXN0aW1hdGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19maWx0ZXJlZEZvcndhcmQuYWRkU2FtcGxlKHRoaXMuX19mb3J3YXJkRXN0aW1hdGUpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFBvc2l0aW9uLmNvcHlGcm9tKHRoaXMuX19maWx0ZXJlZFBvcyk7XG4gICAgICAgICAgICAgICAgUXVhdGVybmlvbi5Sb3RhdGlvblF1YXRlcm5pb25Gcm9tQXhpc1RvUmVmKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZmlsdGVyZWRSaWdodCwgXG4gICAgICAgICAgICAgICAgICAgIFZlY3RvcjMuQ3Jvc3ModGhpcy5fX2ZpbHRlcmVkRm9yd2FyZCwgdGhpcy5fX2ZpbHRlcmVkUmlnaHQpLCBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkRm9yd2FyZCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFJvdGF0aW9uKTtcblxuICAgICAgICAgICAgICAgIHRyYWNrZWRPYmplY3Quc2V0VHJhY2tpbmcoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRQb3NpdGlvbiwgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbiwgXG4gICAgICAgICAgICAgICAgICAgIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdHJhY2tlZE9iamVjdC5zZXRUcmFja2luZyhcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFBvc2l0aW9uLCBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFJvdGF0aW9uLCBcbiAgICAgICAgICAgICAgICAgICAgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXRDYWxpYnJhdGlvbkFzeW5jKHNjYWxhciA9IDEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RyYWNrZXIuc2V0Q2FsaWJyYXRpb25Bc3luYyhcbiAgICAgICAgICAgIE1hdGgucm91bmQoc2NhbGFyICogdGhpcy5fdmlkZW9UZXh0dXJlLmdldFNpemUoKS53aWR0aCksIFxuICAgICAgICAgICAgTWF0aC5yb3VuZChzY2FsYXIgKiB0aGlzLl92aWRlb1RleHR1cmUuZ2V0U2l6ZSgpLmhlaWdodCkpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRRdWF0ZXJuaW9uRnJvbVJvZHJpZ3Vlcyh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKSB7XG4gICAgICAgIHZhciByb3QgPSBuZXcgVmVjdG9yMygteCwgeSwgLXopO1xuICAgICAgICB2YXIgdGhldGEgPSByb3QubGVuZ3RoKCk7XG4gICAgICAgIHJvdC5zY2FsZUluUGxhY2UoMS4wIC8gdGhldGEpO1xuICAgICAgICBpZiAodGhldGEgIT09IDAuMCkge1xuICAgICAgICAgICAgcmV0dXJuIFF1YXRlcm5pb24uUm90YXRpb25BeGlzKHJvdCwgdGhldGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc3RhcnRUcmFja2luZygpIHtcbiAgICAgICAgdmFyIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fcnVuVHJhY2tpbmdPYnNlcnZlciA9IHRoaXMuX3NjZW5lLm9uQWZ0ZXJSZW5kZXJPYnNlcnZhYmxlLmFkZCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3RyYWNrZXIuZmluZE1hcmtlcnNJbkltYWdlQXN5bmModGhpcy5fdmlkZW9UZXh0dXJlKS50aGVuKG1hcmtlcnMgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2Vycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdHM6IGFueSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJzLmZvckVhY2gobWFya2VyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzW21hcmtlci5pZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBuZXcgVmVjdG9yMyhtYXJrZXIudHgsIC1tYXJrZXIudHksIG1hcmtlci50eiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBFeGFtcGxlT2JqZWN0VHJhY2tlci5nZXRRdWF0ZXJuaW9uRnJvbVJvZHJpZ3VlcyhtYXJrZXIucngsIG1hcmtlci5yeSwgbWFya2VyLnJ6KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXN1bHRzKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9wVHJhY2tpbmcoKSB7XG4gICAgICAgIHRoaXMuX3NjZW5lLm9uQWZ0ZXJSZW5kZXJPYnNlcnZhYmxlLnJlbW92ZSh0aGlzLl9ydW5UcmFja2luZ09ic2VydmVyKTtcbiAgICAgICAgdGhpcy5fcnVuVHJhY2tpbmdPYnNlcnZlciA9IG51bGw7XG4gICAgfVxuXG4gICAgc3RhdGljIENyZWF0ZUFzeW5jKHZpZGVvVGV4dHVyZTogVmlkZW9UZXh0dXJlLCBzY2VuZTogU2NlbmUpIHtcbiAgICAgICAgdmFyIG9iamVjdFRyYWNrZXIgPSBuZXcgRXhhbXBsZU9iamVjdFRyYWNrZXIodmlkZW9UZXh0dXJlLCBzY2VuZSk7XG4gICAgICAgIHJldHVybiBFeGFtcGxlTWFya2VyVHJhY2tlci5DcmVhdGVBc3luYygpLnRoZW4odHJhY2tlciA9PiB7XG4gICAgICAgICAgICBvYmplY3RUcmFja2VyLl90cmFja2VyID0gdHJhY2tlcjtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUcmFja2VyLnNldENhbGlicmF0aW9uQXN5bmMoKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0VHJhY2tlcjtcbiAgICAgICAgfSk7XG4gICAgfVxufSIsImNvbnN0IENETl9VUkw6IHN0cmluZyA9IFwiaHR0cHM6Ly9hci5iYWJ5bG9uanMuY29tL1wiO1xyXG5jb25zdCBDRE5fV0FTTV9NT0RVTEVTX1VSTDogc3RyaW5nID0gQ0ROX1VSTCArIFwid2FzbS9cIjtcclxuXHJcbmV4cG9ydCBjb25zdCBFWEFNUExFX01PRFVMRV9VUkw6IHN0cmluZyA9IENETl9XQVNNX01PRFVMRVNfVVJMICsgXCJ3ZWJwaWxlZC1hcnVjby1hci5qc1wiO1xyXG5leHBvcnQgY29uc3QgQVJVQ09fTUVUQV9NQVJLRVJfVFJBQ0tFUl9VUkw6IHN0cmluZyA9IENETl9XQVNNX01PRFVMRVNfVVJMICsgXCJhcnVjby1tZXRhLW1hcmtlci10cmFja2VyLmpzXCI7XHJcbmV4cG9ydCBjb25zdCBJTUFHRV9URU1QTEFURV9UUkFDS0VSX1VSTDogc3RyaW5nID0gQ0ROX1dBU01fTU9EVUxFU19VUkwgKyBcImltYWdlLXRlbXBsYXRlLXRyYWNrZXIuanNcIjtcclxuIiwiZXhwb3J0IGNsYXNzIERlZGljYXRlZFdvcmtlciB7XG5cbiAgICBwcml2YXRlIHN0YXRpYyBjcmVhdGVGcm9tU291cmNlcyguLi5zb3VyY2VzOiBhbnlbXSk6IFdvcmtlciB7XG4gICAgICAgIGxldCB3b3JrZXJDb2RlOiBzdHJpbmcgPSBcIlwiO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzb3VyY2VzLmxlbmd0aCAtIDE7IGlkeCsrKSB7XG4gICAgICAgICAgICB3b3JrZXJDb2RlICs9IHNvdXJjZXNbaWR4XS50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHdvcmtlckNvZGUgKz0gXCIoXCIgKyBzb3VyY2VzW3NvdXJjZXMubGVuZ3RoIC0gMV0udG9TdHJpbmcoKSArIFwiKSgpO1wiO1xuICAgICAgICByZXR1cm4gbmV3IFdvcmtlcih3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbd29ya2VyQ29kZV0pKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVGcm9tTG9jYXRpb24oanNVcmw6IHN0cmluZywgb25Jbml0aWFsaXplZDogKCkgPT4gdm9pZCwgb25NZXNzYWdlOiAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4gdm9pZCk6IFdvcmtlciB7XG4gICAgICAgIGxldCBtb2R1bGVEZWZpdGlvbjogc3RyaW5nID0gYE1vZHVsZSA9IHtcbiAgICAgICAgICAgIGxvY2F0ZUZpbGU6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFxcXCJgICsganNVcmwucmVwbGFjZSgvLmpzJC8sIFwiLndhc21cIikgKyBgXFxcIjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJ1bnRpbWVJbml0aWFsaXplZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIChgICsgb25Jbml0aWFsaXplZC50b1N0cmluZygpICsgYCkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtgO1xuICAgICAgICBsZXQgbWVzc2FnZUhhbmRsZXI6IHN0cmluZyA9IFwidGhpcy5vbm1lc3NhZ2UgPSBcIiArIG9uTWVzc2FnZS50b1N0cmluZygpICsgXCI7XCI7XG4gICAgICAgIGxldCBpbXBvcnRKYXZhc2NyaXB0OiBzdHJpbmcgPSBcImZ1bmN0aW9uIGltcG9ydEphdmFzY3JpcHQoKSB7IGltcG9ydFNjcmlwdHMoXFxcIlwiICsganNVcmwgKyBcIlxcXCIpOyB9XCI7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZyb21Tb3VyY2VzKG1vZHVsZURlZml0aW9uLCBtZXNzYWdlSGFuZGxlciwgaW1wb3J0SmF2YXNjcmlwdCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyB1bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXIoZXZlbnQ6IE1lc3NhZ2VFdmVudCk6IHZvaWQge1xuICAgICAgICB0aHJvdyBFcnJvcihcIlVuZXhwZWN0ZWQgbWVzc2FnZSBmcm9tIFdlYldvcmtlcjogXCIgKyBldmVudCk7XG4gICAgfVxufSIsImltcG9ydCB7IFZlY3RvcjMgfSBmcm9tIFwiYmFieWxvbmpzXCJcblxuZXhwb3J0IGNsYXNzIEZpbHRlcmVkVmVjdG9yMyBleHRlbmRzIFZlY3RvcjMge1xuICAgIHByaXZhdGUgX2lkeDogbnVtYmVyO1xuICAgIHByaXZhdGUgX3NhbXBsZXM6IFZlY3RvcjNbXTtcbiAgICBwcml2YXRlIF9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzOiBudW1iZXJbXTtcbiAgICBwcml2YXRlIF9zYW1wbGVBdmVyYWdlOiBWZWN0b3IzO1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHNhbXBsZUNvdW50OiBudW1iZXIgPSAxKSB7XG4gICAgICAgIHN1cGVyKHgsIHksIHopO1xuXG4gICAgICAgIHRoaXMuX2lkeCA9IDA7XG4gICAgICAgIHRoaXMuX3NhbXBsZXMgPSBbXTtcbiAgICAgICAgdGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzYW1wbGVDb3VudDsgKytpZHgpIHtcbiAgICAgICAgICAgIHRoaXMuX3NhbXBsZXMucHVzaChuZXcgVmVjdG9yMyh4LCB5LCB6KSk7XG4gICAgICAgICAgICB0aGlzLl9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzLnB1c2goMC4wKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3NhbXBsZUF2ZXJhZ2UgPSBuZXcgVmVjdG9yMyh4LCB5LCB6KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkU2FtcGxlKHNhbXBsZTogVmVjdG9yMyk6IHZvaWQge1xuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLnNjYWxlSW5QbGFjZSh0aGlzLl9zYW1wbGVzLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuX3NhbXBsZUF2ZXJhZ2Uuc3VidHJhY3RJblBsYWNlKHRoaXMuX3NhbXBsZXNbdGhpcy5faWR4XSk7XG4gICAgICAgIHRoaXMuX3NhbXBsZXNbdGhpcy5faWR4XS5jb3B5RnJvbShzYW1wbGUpO1xuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLmFkZEluUGxhY2UodGhpcy5fc2FtcGxlc1t0aGlzLl9pZHhdKTtcbiAgICAgICAgdGhpcy5fc2FtcGxlQXZlcmFnZS5zY2FsZUluUGxhY2UoMS4wIC8gdGhpcy5fc2FtcGxlcy5sZW5ndGgpO1xuICAgICAgICB0aGlzLl9pZHggPSAodGhpcy5faWR4ICsgMSkgJSB0aGlzLl9zYW1wbGVzLmxlbmd0aDtcblxuICAgICAgICBsZXQgYXZnU3F1YXJlZERpc3RhbmNlID0gMC4wO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB0aGlzLl9zYW1wbGVzLmxlbmd0aDsgKytpZHgpIHtcbiAgICAgICAgICAgIHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXNbaWR4XSA9IFZlY3RvcjMuRGlzdGFuY2VTcXVhcmVkKHRoaXMuX3NhbXBsZUF2ZXJhZ2UsIHRoaXMuX3NhbXBsZXNbaWR4XSk7XG4gICAgICAgICAgICBhdmdTcXVhcmVkRGlzdGFuY2UgKz0gdGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlc1tpZHhdO1xuICAgICAgICB9XG4gICAgICAgIGF2Z1NxdWFyZWREaXN0YW5jZSAvPSB0aGlzLl9zYW1wbGVzLmxlbmd0aDtcblxuICAgICAgICBsZXQgbnVtSW5jbHVkZWRTYW1wbGVzID0gMDtcbiAgICAgICAgdGhpcy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8PSB0aGlzLl9zYW1wbGVzLmxlbmd0aDsgKytpZHgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzW2lkeF0gPD0gYXZnU3F1YXJlZERpc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRJblBsYWNlKHRoaXMuX3NhbXBsZXNbaWR4XSk7XG4gICAgICAgICAgICAgICAgbnVtSW5jbHVkZWRTYW1wbGVzICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY2FsZUluUGxhY2UoMS4wIC8gbnVtSW5jbHVkZWRTYW1wbGVzKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgT2JzZXJ2YWJsZSwgUXVhdGVybmlvbiwgU2NlbmUsIFRyYW5zZm9ybU5vZGUsIFZlY3RvcjMgfSBmcm9tIFwiYmFieWxvbmpzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBUcmFja2VkTm9kZSBleHRlbmRzIFRyYW5zZm9ybU5vZGUge1xyXG4gICAgcHJpdmF0ZSBfaXNUcmFja2luZzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX25vdFRyYWNrZWRGcmFtZXNDb3VudDogbnVtYmVyOyAvLyBUT0RPOiBSZW1vdmUgdGhpcyBmZWF0dXJlLCB3aGljaCBvbmx5IGV4aXN0cyBhcyBhIHN0b3BnYXAuXHJcblxyXG4gICAgcHVibGljIG9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGU6IE9ic2VydmFibGU8VHJhY2tlZE5vZGU+O1xyXG4gICAgcHVibGljIG9uVHJhY2tpbmdMb3N0T2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUcmFja2VkTm9kZT47XHJcbiAgICBwdWJsaWMgZGlzYWJsZVdoZW5Ob3RUcmFja2VkOiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNjZW5lPzogU2NlbmUgfCBudWxsIHwgdW5kZWZpbmVkLCBkaXNhYmxlV2hlbk5vdFRyYWNrZWQ6IGJvb2xlYW4gPSB0cnVlKSB7XHJcbiAgICAgICAgc3VwZXIobmFtZSwgc2NlbmUsIHRydWUpO1xyXG5cclxuICAgICAgICB0aGlzLl9pc1RyYWNraW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlV2hlbk5vdFRyYWNrZWQgPSBkaXNhYmxlV2hlbk5vdFRyYWNrZWQ7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZVdoZW5Ob3RUcmFja2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RW5hYmxlZChmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9ub3RUcmFja2VkRnJhbWVzQ291bnQgPSAxMDtcclxuXHJcbiAgICAgICAgdGhpcy5vblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlID0gbmV3IE9ic2VydmFibGUob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5faXNUcmFja2luZykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlLm5vdGlmeU9ic2VydmVyKG9ic2VydmVyLCB0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMub25UcmFja2luZ0xvc3RPYnNlcnZhYmxlID0gbmV3IE9ic2VydmFibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5yb3RhdGlvblF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLklkZW50aXR5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGlzVHJhY2tpbmcoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVHJhY2tpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFRyYWNraW5nKHBvc2l0aW9uOiBWZWN0b3IzLCByb3RhdGlvbjogUXVhdGVybmlvbiwgaXNUcmFja2luZzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24uY29weUZyb20ocG9zaXRpb24pO1xyXG4gICAgICAgIHRoaXMucm90YXRpb25RdWF0ZXJuaW9uID8gdGhpcy5yb3RhdGlvblF1YXRlcm5pb24uY29weUZyb20ocm90YXRpb24pIDogdGhpcy5yb3RhdGlvblF1YXRlcm5pb24gPSByb3RhdGlvbi5jbG9uZSgpO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBmZWF0dXJlLCB3aGljaCBvbmx5IGV4aXN0cyBhcyBhIHN0b3BnYXAuXHJcbiAgICAgICAgaWYgKGlzVHJhY2tpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50ID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX25vdFRyYWNrZWRGcmFtZXNDb3VudCArPSAxO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50IDwgNSkge1xyXG4gICAgICAgICAgICAgICAgaXNUcmFja2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5faXNUcmFja2luZyAmJiBpc1RyYWNraW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25UcmFja2luZ0FjcXVpcmVkT2JzZXJ2YWJsZS5ub3RpZnlPYnNlcnZlcnModGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuX2lzVHJhY2tpbmcgJiYgIWlzVHJhY2tpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5vblRyYWNraW5nTG9zdE9ic2VydmFibGUubm90aWZ5T2JzZXJ2ZXJzKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9pc1RyYWNraW5nID0gaXNUcmFja2luZztcclxuICAgICAgICB0aGlzLnNldEVuYWJsZWQoIXRoaXMuZGlzYWJsZVdoZW5Ob3RUcmFja2VkIHx8IHRoaXMuX2lzVHJhY2tpbmcpO1xyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=
