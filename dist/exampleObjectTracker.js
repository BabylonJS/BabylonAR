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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU1hcmtlclRyYWNrZXIudHMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU9iamVjdFRyYWNrZXIudHMiLCJzcmMvdHMvc2hhcmVkL2NvbnN0YW50cy50cyIsInNyYy90cy9zaGFyZWQvZGVkaWNhdGVkV29ya2VyLnRzIiwic3JjL3RzL3NoYXJlZC9maWx0ZXJlZFZlY3RvcjMudHMiLCJzcmMvdHMvc2hhcmVkL3RyYWNrZWROb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSw2REFBMkQ7QUFDM0QsaURBQXdEO0FBS3hEO0lBR0k7SUFBdUIsQ0FBQztJQUVULGtDQUFhLEdBQTVCO1FBQ0ksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hCLFdBQVcsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFYyw4QkFBUyxHQUF4QixVQUF5QixLQUFtQjtRQUN4QyxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBRXhCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQixXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNoQzthQUNJLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNyQixNQUFNLENBQUMsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakUsV0FBVyxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDckM7YUFDSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDakIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE9B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QUFVLEVBQUU7WUFDakMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzRDthQUNJLElBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUN0QyxJQUFJLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZEO1FBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUNMLGtCQUFDO0FBQUQsQ0F6REEsQUF5REMsQ0F6RGdDLHlCQUFhLEdBeUQ3QztBQXpEWSxrQ0FBVyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCB7IFZpZGVvVGV4dHVyZSB9IGZyb20gXCJiYWJ5bG9uanNcIlxuXG5pbXBvcnQgeyBEZWRpY2F0ZWRXb3JrZXIgfSBmcm9tIFwiLi4vc2hhcmVkL2RlZGljYXRlZFdvcmtlclwiXG5pbXBvcnQgeyBFWEFNUExFX01PRFVMRV9VUkwgfSBmcm9tIFwiLi4vc2hhcmVkL2NvbnN0YW50c1wiXG5cbmRlY2xhcmUgdmFyIE1vZHVsZTogYW55O1xuZGVjbGFyZSBmdW5jdGlvbiBwb3N0TWVzc2FnZShkYXRhOiBhbnkpOiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgRXhhbXBsZU1hcmtlclRyYWNrZXIge1xuICAgIHByaXZhdGUgX3dvcmtlcjogV29ya2VyO1xuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBvbkluaXRpYWxpemVkKCkge1xuICAgICAgICBNb2R1bGUuX3Jlc2V0KCk7XG4gICAgICAgIHBvc3RNZXNzYWdlKHsgaW5pdGlhbGl6ZWQ6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25NZXNzYWdlKGV2ZW50OiBNZXNzYWdlRXZlbnQpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYXJncyA9IGV2ZW50LmRhdGE7XG5cbiAgICAgICAgaWYgKGFyZ3MucmVzZXQpIHtcbiAgICAgICAgICAgIE1vZHVsZS5fcmVzZXQoKTtcbiAgICAgICAgICAgIHBvc3RNZXNzYWdlKHsgcmVzZXQ6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYXJncy5jYWxpYnJhdGUpIHtcbiAgICAgICAgICAgIE1vZHVsZS5fc2V0X2NhbGlicmF0aW9uX2Zyb21fZnJhbWVfc2l6ZShhcmdzLndpZHRoLCBhcmdzLmhlaWdodCk7XG4gICAgICAgICAgICBwb3N0TWVzc2FnZSh7IGNhbGlicmF0ZWQ6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYXJncy50cmFjaykge1xuICAgICAgICAgICAgbGV0IGJ1ZiA9IE1vZHVsZS5fbWFsbG9jKGFyZ3MuaW1hZ2VEYXRhLmxlbmd0aCAqIGFyZ3MuaW1hZ2VEYXRhLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgICAgICAgIE1vZHVsZS5IRUFQOC5zZXQoYXJncy5pbWFnZURhdGEsIGJ1Zik7XG4gICAgICAgICAgICBsZXQgbnVtTWFya2VycyA9IE1vZHVsZS5fcHJvY2Vzc19pbWFnZShhcmdzLndpZHRoLCBhcmdzLmhlaWdodCwgYnVmLCAxKTtcbiAgICAgICAgICAgIE1vZHVsZS5fZnJlZShidWYpO1xuXG4gICAgICAgICAgICBsZXQgbWFya2VyczogYW55W10gPSBbXTtcbiAgICAgICAgICAgIGxldCBvZmZzZXQ6IG51bWJlciA9IDA7XG4gICAgICAgICAgICBsZXQgaWQ6IG51bWJlciA9IDA7XG4gICAgICAgICAgICBsZXQgdHg6IG51bWJlciA9IDAuMDtcbiAgICAgICAgICAgIGxldCB0eTogbnVtYmVyID0gMC4wO1xuICAgICAgICAgICAgbGV0IHR6OiBudW1iZXIgPSAwLjA7XG4gICAgICAgICAgICBsZXQgcng6IG51bWJlciA9IDAuMDtcbiAgICAgICAgICAgIGxldCByeTogbnVtYmVyID0gMC4wO1xuICAgICAgICAgICAgbGV0IHJ6OiBudW1iZXIgPSAwLjA7XG4gICAgICAgICAgICBmb3IgKGxldCBtYXJrZXJJZHggPSAwOyBtYXJrZXJJZHggPCBudW1NYXJrZXJzOyBtYXJrZXJJZHgrKykge1xuICAgICAgICAgICAgICAgIGxldCBwdHIgPSBNb2R1bGUuX2dldF90cmFja2VkX21hcmtlcihtYXJrZXJJZHgpO1xuXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICBpZCA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiaTMyXCIpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSAxMjtcbiAgICAgICAgICAgICAgICB0eCA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSA4O1xuICAgICAgICAgICAgICAgIHR5ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XG4gICAgICAgICAgICAgICAgdHogPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImRvdWJsZVwiKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcbiAgICAgICAgICAgICAgICByeCA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSA4O1xuICAgICAgICAgICAgICAgIHJ5ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XG4gICAgICAgICAgICAgICAgcnogPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImRvdWJsZVwiKTtcblxuICAgICAgICAgICAgICAgIG1hcmtlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICAgICAgdHg6IHR4LFxuICAgICAgICAgICAgICAgICAgICB0eTogdHksXG4gICAgICAgICAgICAgICAgICAgIHR6OiB0eixcbiAgICAgICAgICAgICAgICAgICAgcng6IHJ4LFxuICAgICAgICAgICAgICAgICAgICByeTogcnksXG4gICAgICAgICAgICAgICAgICAgIHJ6OiByelxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgbWFya2VyczogbWFya2Vyc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIENyZWF0ZUFzeW5jKCk6IFByb21pc2U8RXhhbXBsZU1hcmtlclRyYWNrZXI+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEV4YW1wbGVNYXJrZXJUcmFja2VyPigocmVzb2x2ZTogKHRyYWNrZXI6IEV4YW1wbGVNYXJrZXJUcmFja2VyKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICBsZXQgdHJhY2tlciA9IG5ldyBFeGFtcGxlTWFya2VyVHJhY2tlcigpO1xuICAgICAgICAgICAgdHJhY2tlci5fd29ya2VyID0gRGVkaWNhdGVkV29ya2VyLmNyZWF0ZUZyb21Mb2NhdGlvbihcbiAgICAgICAgICAgICAgICBFWEFNUExFX01PRFVMRV9VUkwsXG4gICAgICAgICAgICAgICAgRXhhbXBsZU1hcmtlclRyYWNrZXIub25Jbml0aWFsaXplZCxcbiAgICAgICAgICAgICAgICBFeGFtcGxlTWFya2VyVHJhY2tlci5vbk1lc3NhZ2UpO1xuICAgICAgICAgICAgdHJhY2tlci5fd29ya2VyLm9ubWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdHJhY2tlci5fd29ya2VyLm9ubWVzc2FnZSA9IERlZGljYXRlZFdvcmtlci51bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXI7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0cmFja2VyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRDYWxpYnJhdGlvbkFzeW5jKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhLmNhbGlicmF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3VsdC5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3dvcmtlci5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBjYWxpYnJhdGU6IHRydWUsXG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZmluZE1hcmtlcnNJbkltYWdlQXN5bmModmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmUpOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTxhbnlbXT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRhdGEubWFya2Vycykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdC5kYXRhLm1hcmtlcnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3VsdC5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl93b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHJhY2s6IHRydWUsXG4gICAgICAgICAgICB3aWR0aDogdmlkZW9UZXh0dXJlLmdldFNpemUoKS53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdmlkZW9UZXh0dXJlLmdldFNpemUoKS5oZWlnaHQsXG4gICAgICAgICAgICBpbWFnZURhdGE6IHZpZGVvVGV4dHVyZS5yZWFkUGl4ZWxzKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxufSIsImltcG9ydCB7IE51bGxhYmxlLCBPYnNlcnZlciwgUXVhdGVybmlvbiwgU2NlbmUsIFN0cmluZ0RpY3Rpb25hcnksIFZlY3RvcjMsIFZpZGVvVGV4dHVyZSB9IGZyb20gXCJiYWJ5bG9uanNcIjtcblxuaW1wb3J0IHsgRXhhbXBsZU1hcmtlclRyYWNrZXIgfSBmcm9tIFwiLi9leGFtcGxlTWFya2VyVHJhY2tlclwiXG5pbXBvcnQgeyBGaWx0ZXJlZFZlY3RvcjMgfSBmcm9tIFwiLi4vc2hhcmVkL2ZpbHRlcmVkVmVjdG9yM1wiXG5pbXBvcnQgeyBUcmFja2VkTm9kZSB9IGZyb20gXCIuLi9zaGFyZWQvdHJhY2tlZE5vZGVcIlxuXG5leHBvcnQgY2xhc3MgRXhhbXBsZU9iamVjdFRyYWNrZXIge1xuICAgIHByaXZhdGUgX3NjZW5lOiBTY2VuZTtcbiAgICBwcml2YXRlIF92aWRlb1RleHR1cmU6IFZpZGVvVGV4dHVyZTtcbiAgICBwcml2YXRlIF9ydW5UcmFja2luZ09ic2VydmVyOiBOdWxsYWJsZTxPYnNlcnZlcjxTY2VuZT4+ID0gbnVsbDtcbiAgICBwcml2YXRlIF90cmFja2VyOiBFeGFtcGxlTWFya2VyVHJhY2tlcjtcbiAgICBwcml2YXRlIF90cmFja2FibGVPYmplY3RzOiBTdHJpbmdEaWN0aW9uYXJ5PFRyYWNrZWROb2RlPiA9IG5ldyBTdHJpbmdEaWN0aW9uYXJ5PFRyYWNrZWROb2RlPigpO1xuXG4gICAgcHJpdmF0ZSBfX3Bvc0VzdGltYXRlOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XG4gICAgcHJpdmF0ZSBfX3Bvc0VzdGltYXRlQ291bnQ6IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSBfX3JpZ2h0RXN0aW1hdGU6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcbiAgICBwcml2YXRlIF9fcmlnaHRFc3RpbWF0ZUNvdW50OiBudW1iZXIgPSAwO1xuICAgIHByaXZhdGUgX19mb3J3YXJkRXN0aW1hdGU6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcbiAgICBwcml2YXRlIF9fZm9yd2FyZEVzdGltYXRlQ291bnQ6IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSBfX3NjcmF0Y2hWZWM6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcbiAgICBwcml2YXRlIF9fZmlsdGVyZWRQb3M6IEZpbHRlcmVkVmVjdG9yMyA9IG5ldyBGaWx0ZXJlZFZlY3RvcjMoMC4wLCAwLjAsIDAuMCk7XG4gICAgcHJpdmF0ZSBfX2ZpbHRlcmVkUmlnaHQ6IEZpbHRlcmVkVmVjdG9yMyA9IG5ldyBGaWx0ZXJlZFZlY3RvcjMoMC4wLCAwLjAsIDAuMCk7XG4gICAgcHJpdmF0ZSBfX2ZpbHRlcmVkRm9yd2FyZDogRmlsdGVyZWRWZWN0b3IzID0gbmV3IEZpbHRlcmVkVmVjdG9yMygwLjAsIDAuMCwgMC4wKTtcbiAgICBwcml2YXRlIF9fdGFyZ2V0UG9zaXRpb246IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcbiAgICBwcml2YXRlIF9fdGFyZ2V0Um90YXRpb246IFF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLklkZW50aXR5KCk7XG4gICAgcHJpdmF0ZSBfX3VsSWQ6IG51bWJlciA9IC0xO1xuICAgIHByaXZhdGUgX191cklkOiBudW1iZXIgPSAtMTtcbiAgICBwcml2YXRlIF9fbGxJZDogbnVtYmVyID0gLTE7XG4gICAgcHJpdmF0ZSBfX2xySWQ6IG51bWJlciA9IC0xO1xuXG4gICAgY29uc3RydWN0b3IodmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmUsIHNjZW5lOiBTY2VuZSkge1xuICAgICAgICB0aGlzLl9zY2VuZSA9IHNjZW5lO1xuICAgICAgICB0aGlzLl92aWRlb1RleHR1cmUgPSB2aWRlb1RleHR1cmU7XG4gICAgfVxuXG4gICAgYWRkVHJhY2thYmxlT2JqZWN0KHVsOiBudW1iZXIsIHVyOiBudW1iZXIsIGxsOiBudW1iZXIsIGxyOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgZGVzY3JpcHRvciA9IFt1bCwgdXIsIGxsLCBscl0udG9TdHJpbmcoKTtcbiAgICAgICAgdGhpcy5fdHJhY2thYmxlT2JqZWN0cy5hZGQoZGVzY3JpcHRvciwgbmV3IFRyYWNrZWROb2RlKGRlc2NyaXB0b3IudG9TdHJpbmcoKSwgdGhpcy5fc2NlbmUpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RyYWNrYWJsZU9iamVjdHMuZ2V0KGRlc2NyaXB0b3IpO1xuICAgIH1cblxuICAgIHByb2Nlc3NSZXN1bHRzKHJlc3VsdHM6IGFueSkge1xuICAgICAgICAvLyBUT0RPOiBUSElTIElTIEhBQ0tFRCBDT0RFXG5cbiAgICAgICAgdGhpcy5fdHJhY2thYmxlT2JqZWN0cy5mb3JFYWNoKChkZXNjcmlwdG9yOiBzdHJpbmcsIHRyYWNrZWRPYmplY3Q6IFRyYWNrZWROb2RlKSA9PiB7XG4gICAgICAgICAgICB2YXIgbnVtcyA9IGRlc2NyaXB0b3Iuc3BsaXQoJywnKTtcbiAgICAgICAgICAgIHRoaXMuX191bElkID0gcGFyc2VJbnQobnVtc1swXSk7XG4gICAgICAgICAgICB0aGlzLl9fdXJJZCA9IHBhcnNlSW50KG51bXNbMV0pO1xuICAgICAgICAgICAgdGhpcy5fX2xsSWQgPSBwYXJzZUludChudW1zWzJdKTtcbiAgICAgICAgICAgIHRoaXMuX19scklkID0gcGFyc2VJbnQobnVtc1szXSk7XG5cbiAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGVDb3VudCA9IDAuMDtcbiAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCA9IDAuMDtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX2xsSWRdKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX3VySWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX19sbElkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdXJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zY2FsZUluUGxhY2UoMC41KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlQ291bnQgKz0gMS4wO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19scklkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbHJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zdWJ0cmFjdEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbGxJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX3VsSWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX191bElkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnN1YnRyYWN0SW5QbGFjZShyZXN1bHRzW3RoaXMuX19sbElkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX191cklkXSkge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19scklkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdXJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zdWJ0cmFjdEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbHJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCArPSAxLjA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX191bElkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdXJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zdWJ0cmFjdEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdWxJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19scklkXSAmJiByZXN1bHRzW3RoaXMuX191bElkXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xySWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VsSWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zY2FsZUluUGxhY2UoMC41KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlQ291bnQgKz0gMS4wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5fX3Bvc0VzdGltYXRlQ291bnQgKiB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ICogdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5zY2FsZUluUGxhY2UoMS4wIC8gdGhpcy5fX3Bvc0VzdGltYXRlQ291bnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLnNjYWxlSW5QbGFjZSgxLjAgLyB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlLnNjYWxlSW5QbGFjZSgxLjAgLyB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkUG9zLmFkZFNhbXBsZSh0aGlzLl9fcG9zRXN0aW1hdGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19maWx0ZXJlZFJpZ2h0LmFkZFNhbXBsZSh0aGlzLl9fcmlnaHRFc3RpbWF0ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkRm9yd2FyZC5hZGRTYW1wbGUodGhpcy5fX2ZvcndhcmRFc3RpbWF0ZSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0UG9zaXRpb24uY29weUZyb20odGhpcy5fX2ZpbHRlcmVkUG9zKTtcbiAgICAgICAgICAgICAgICBRdWF0ZXJuaW9uLlJvdGF0aW9uUXVhdGVybmlvbkZyb21BeGlzVG9SZWYoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19maWx0ZXJlZFJpZ2h0LCBcbiAgICAgICAgICAgICAgICAgICAgVmVjdG9yMy5Dcm9zcyh0aGlzLl9fZmlsdGVyZWRGb3J3YXJkLCB0aGlzLl9fZmlsdGVyZWRSaWdodCksIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZmlsdGVyZWRGb3J3YXJkLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0Um90YXRpb24pO1xuXG4gICAgICAgICAgICAgICAgdHJhY2tlZE9iamVjdC5zZXRUcmFja2luZyhcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFBvc2l0aW9uLCBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFJvdGF0aW9uLCBcbiAgICAgICAgICAgICAgICAgICAgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cmFja2VkT2JqZWN0LnNldFRyYWNraW5nKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0UG9zaXRpb24sIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0Um90YXRpb24sIFxuICAgICAgICAgICAgICAgICAgICBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNldENhbGlicmF0aW9uQXN5bmMoc2NhbGFyID0gMSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdHJhY2tlci5zZXRDYWxpYnJhdGlvbkFzeW5jKFxuICAgICAgICAgICAgTWF0aC5yb3VuZChzY2FsYXIgKiB0aGlzLl92aWRlb1RleHR1cmUuZ2V0U2l6ZSgpLndpZHRoKSwgXG4gICAgICAgICAgICBNYXRoLnJvdW5kKHNjYWxhciAqIHRoaXMuX3ZpZGVvVGV4dHVyZS5nZXRTaXplKCkuaGVpZ2h0KSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFF1YXRlcm5pb25Gcm9tUm9kcmlndWVzKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpIHtcbiAgICAgICAgdmFyIHJvdCA9IG5ldyBWZWN0b3IzKC14LCB5LCAteik7XG4gICAgICAgIHZhciB0aGV0YSA9IHJvdC5sZW5ndGgoKTtcbiAgICAgICAgcm90LnNjYWxlSW5QbGFjZSgxLjAgLyB0aGV0YSk7XG4gICAgICAgIGlmICh0aGV0YSAhPT0gMC4wKSB7XG4gICAgICAgICAgICByZXR1cm4gUXVhdGVybmlvbi5Sb3RhdGlvbkF4aXMocm90LCB0aGV0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzdGFydFRyYWNraW5nKCkge1xuICAgICAgICB2YXIgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9ydW5UcmFja2luZ09ic2VydmVyID0gdGhpcy5fc2NlbmUub25BZnRlclJlbmRlck9ic2VydmFibGUuYWRkKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fdHJhY2tlci5maW5kTWFya2Vyc0luSW1hZ2VBc3luYyh0aGlzLl92aWRlb1RleHR1cmUpLnRoZW4obWFya2VycyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0czogYW55ID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbbWFya2VyLmlkXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5ldyBWZWN0b3IzKG1hcmtlci50eCwgLW1hcmtlci50eSwgbWFya2VyLnR6KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IEV4YW1wbGVPYmplY3RUcmFja2VyLmdldFF1YXRlcm5pb25Gcm9tUm9kcmlndWVzKG1hcmtlci5yeCwgbWFya2VyLnJ5LCBtYXJrZXIucnopXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3VsdHMocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0b3BUcmFja2luZygpIHtcbiAgICAgICAgdGhpcy5fc2NlbmUub25BZnRlclJlbmRlck9ic2VydmFibGUucmVtb3ZlKHRoaXMuX3J1blRyYWNraW5nT2JzZXJ2ZXIpO1xuICAgICAgICB0aGlzLl9ydW5UcmFja2luZ09ic2VydmVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBzdGF0aWMgQ3JlYXRlQXN5bmModmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmUsIHNjZW5lOiBTY2VuZSkge1xuICAgICAgICB2YXIgb2JqZWN0VHJhY2tlciA9IG5ldyBFeGFtcGxlT2JqZWN0VHJhY2tlcih2aWRlb1RleHR1cmUsIHNjZW5lKTtcbiAgICAgICAgcmV0dXJuIEV4YW1wbGVNYXJrZXJUcmFja2VyLkNyZWF0ZUFzeW5jKCkudGhlbih0cmFja2VyID0+IHtcbiAgICAgICAgICAgIG9iamVjdFRyYWNrZXIuX3RyYWNrZXIgPSB0cmFja2VyO1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRyYWNrZXIuc2V0Q2FsaWJyYXRpb25Bc3luYygpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUcmFja2VyO1xuICAgICAgICB9KTtcbiAgICB9XG59IiwiY29uc3QgQ0ROX1VSTDogc3RyaW5nID0gXCJodHRwczovL2FyLmJhYnlsb25qcy5jb20vXCI7XG5jb25zdCBDRE5fV0FTTV9NT0RVTEVTX1VSTDogc3RyaW5nID0gQ0ROX1VSTCArIFwid2FzbS9cIjtcblxuZXhwb3J0IGNvbnN0IEVYQU1QTEVfTU9EVUxFX1VSTDogc3RyaW5nID0gQ0ROX1dBU01fTU9EVUxFU19VUkwgKyBcIndlYnBpbGVkLWFydWNvLWFyLmpzXCI7XG5leHBvcnQgY29uc3QgQVJVQ09fTUVUQV9NQVJLRVJfVFJBQ0tFUl9VUkw6IHN0cmluZyA9IENETl9XQVNNX01PRFVMRVNfVVJMICsgXCJhcnVjby1tZXRhLW1hcmtlci10cmFja2VyLmpzXCI7XG5leHBvcnQgY29uc3QgSU1BR0VfVEVNUExBVEVfVFJBQ0tFUl9VUkw6IHN0cmluZyA9IENETl9XQVNNX01PRFVMRVNfVVJMICsgXCJpbWFnZS10ZW1wbGF0ZS10cmFja2VyLmpzXCI7XG4iLCJleHBvcnQgY2xhc3MgRGVkaWNhdGVkV29ya2VyIHtcblxuICAgIHByaXZhdGUgc3RhdGljIGNyZWF0ZUZyb21Tb3VyY2VzKC4uLnNvdXJjZXM6IGFueVtdKTogV29ya2VyIHtcbiAgICAgICAgbGV0IHdvcmtlckNvZGU6IHN0cmluZyA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHNvdXJjZXMubGVuZ3RoIC0gMTsgaWR4KyspIHtcbiAgICAgICAgICAgIHdvcmtlckNvZGUgKz0gc291cmNlc1tpZHhdLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgd29ya2VyQ29kZSArPSBcIihcIiArIHNvdXJjZXNbc291cmNlcy5sZW5ndGggLSAxXS50b1N0cmluZygpICsgXCIpKCk7XCI7XG4gICAgICAgIHJldHVybiBuZXcgV29ya2VyKHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFt3b3JrZXJDb2RlXSkpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZUZyb21Mb2NhdGlvbihqc1VybDogc3RyaW5nLCBvbkluaXRpYWxpemVkOiAoKSA9PiB2b2lkLCBvbk1lc3NhZ2U6IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB2b2lkKTogV29ya2VyIHtcbiAgICAgICAgbGV0IG1vZHVsZURlZml0aW9uOiBzdHJpbmcgPSBgTW9kdWxlID0ge1xuICAgICAgICAgICAgbG9jYXRlRmlsZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXFxcImAgKyBqc1VybC5yZXBsYWNlKC8uanMkLywgXCIud2FzbVwiKSArIGBcXFwiO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uUnVudGltZUluaXRpYWxpemVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgKGAgKyBvbkluaXRpYWxpemVkLnRvU3RyaW5nKCkgKyBgKSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O2A7XG4gICAgICAgIGxldCBtZXNzYWdlSGFuZGxlcjogc3RyaW5nID0gXCJ0aGlzLm9ubWVzc2FnZSA9IFwiICsgb25NZXNzYWdlLnRvU3RyaW5nKCkgKyBcIjtcIjtcbiAgICAgICAgbGV0IGltcG9ydEphdmFzY3JpcHQ6IHN0cmluZyA9IFwiZnVuY3Rpb24gaW1wb3J0SmF2YXNjcmlwdCgpIHsgaW1wb3J0U2NyaXB0cyhcXFwiXCIgKyBqc1VybCArIFwiXFxcIik7IH1cIjtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRnJvbVNvdXJjZXMobW9kdWxlRGVmaXRpb24sIG1lc3NhZ2VIYW5kbGVyLCBpbXBvcnRKYXZhc2NyaXB0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIHVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcihldmVudDogTWVzc2FnZUV2ZW50KTogdm9pZCB7XG4gICAgICAgIHRocm93IEVycm9yKFwiVW5leHBlY3RlZCBtZXNzYWdlIGZyb20gV2ViV29ya2VyOiBcIiArIGV2ZW50KTtcbiAgICB9XG59IiwiaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gXCJiYWJ5bG9uanNcIlxuXG5leHBvcnQgY2xhc3MgRmlsdGVyZWRWZWN0b3IzIGV4dGVuZHMgVmVjdG9yMyB7XG4gICAgcHJpdmF0ZSBfaWR4OiBudW1iZXI7XG4gICAgcHJpdmF0ZSBfc2FtcGxlczogVmVjdG9yM1tdO1xuICAgIHByaXZhdGUgX3NhbXBsZVNxdWFyZWREaXN0YW5jZXM6IG51bWJlcltdO1xuICAgIHByaXZhdGUgX3NhbXBsZUF2ZXJhZ2U6IFZlY3RvcjM7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgc2FtcGxlQ291bnQ6IG51bWJlciA9IDEpIHtcbiAgICAgICAgc3VwZXIoeCwgeSwgeik7XG5cbiAgICAgICAgdGhpcy5faWR4ID0gMDtcbiAgICAgICAgdGhpcy5fc2FtcGxlcyA9IFtdO1xuICAgICAgICB0aGlzLl9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzID0gW107XG4gICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHNhbXBsZUNvdW50OyArK2lkeCkge1xuICAgICAgICAgICAgdGhpcy5fc2FtcGxlcy5wdXNoKG5ldyBWZWN0b3IzKHgsIHksIHopKTtcbiAgICAgICAgICAgIHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXMucHVzaCgwLjApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2FtcGxlQXZlcmFnZSA9IG5ldyBWZWN0b3IzKHgsIHksIHopO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRTYW1wbGUoc2FtcGxlOiBWZWN0b3IzKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3NhbXBsZUF2ZXJhZ2Uuc2NhbGVJblBsYWNlKHRoaXMuX3NhbXBsZXMubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5fc2FtcGxlQXZlcmFnZS5zdWJ0cmFjdEluUGxhY2UodGhpcy5fc2FtcGxlc1t0aGlzLl9pZHhdKTtcbiAgICAgICAgdGhpcy5fc2FtcGxlc1t0aGlzLl9pZHhdLmNvcHlGcm9tKHNhbXBsZSk7XG4gICAgICAgIHRoaXMuX3NhbXBsZUF2ZXJhZ2UuYWRkSW5QbGFjZSh0aGlzLl9zYW1wbGVzW3RoaXMuX2lkeF0pO1xuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLnNjYWxlSW5QbGFjZSgxLjAgLyB0aGlzLl9zYW1wbGVzLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuX2lkeCA9ICh0aGlzLl9pZHggKyAxKSAlIHRoaXMuX3NhbXBsZXMubGVuZ3RoO1xuXG4gICAgICAgIGxldCBhdmdTcXVhcmVkRGlzdGFuY2UgPSAwLjA7XG4gICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHRoaXMuX3NhbXBsZXMubGVuZ3RoOyArK2lkeCkge1xuICAgICAgICAgICAgdGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlc1tpZHhdID0gVmVjdG9yMy5EaXN0YW5jZVNxdWFyZWQodGhpcy5fc2FtcGxlQXZlcmFnZSwgdGhpcy5fc2FtcGxlc1tpZHhdKTtcbiAgICAgICAgICAgIGF2Z1NxdWFyZWREaXN0YW5jZSArPSB0aGlzLl9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzW2lkeF07XG4gICAgICAgIH1cbiAgICAgICAgYXZnU3F1YXJlZERpc3RhbmNlIC89IHRoaXMuX3NhbXBsZXMubGVuZ3RoO1xuXG4gICAgICAgIGxldCBudW1JbmNsdWRlZFNhbXBsZXMgPSAwO1xuICAgICAgICB0aGlzLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDw9IHRoaXMuX3NhbXBsZXMubGVuZ3RoOyArK2lkeCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXNbaWR4XSA8PSBhdmdTcXVhcmVkRGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEluUGxhY2UodGhpcy5fc2FtcGxlc1tpZHhdKTtcbiAgICAgICAgICAgICAgICBudW1JbmNsdWRlZFNhbXBsZXMgKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjYWxlSW5QbGFjZSgxLjAgLyBudW1JbmNsdWRlZFNhbXBsZXMpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBPYnNlcnZhYmxlLCBRdWF0ZXJuaW9uLCBTY2VuZSwgVHJhbnNmb3JtTm9kZSwgVmVjdG9yMyB9IGZyb20gXCJiYWJ5bG9uanNcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFRyYWNrZWROb2RlIGV4dGVuZHMgVHJhbnNmb3JtTm9kZSB7XHJcbiAgICBwcml2YXRlIF9pc1RyYWNraW5nOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfbm90VHJhY2tlZEZyYW1lc0NvdW50OiBudW1iZXI7IC8vIFRPRE86IFJlbW92ZSB0aGlzIGZlYXR1cmUsIHdoaWNoIG9ubHkgZXhpc3RzIGFzIGEgc3RvcGdhcC5cclxuXHJcbiAgICBwdWJsaWMgb25UcmFja2luZ0FjcXVpcmVkT2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUcmFja2VkTm9kZT47XHJcbiAgICBwdWJsaWMgb25UcmFja2luZ0xvc3RPYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFRyYWNrZWROb2RlPjtcclxuICAgIHB1YmxpYyBkaXNhYmxlV2hlbk5vdFRyYWNrZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2NlbmU/OiBTY2VuZSB8IG51bGwgfCB1bmRlZmluZWQsIGRpc2FibGVXaGVuTm90VHJhY2tlZDogYm9vbGVhbiA9IHRydWUpIHtcclxuICAgICAgICBzdXBlcihuYW1lLCBzY2VuZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2lzVHJhY2tpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRpc2FibGVXaGVuTm90VHJhY2tlZCA9IGRpc2FibGVXaGVuTm90VHJhY2tlZDtcclxuICAgICAgICBpZiAodGhpcy5kaXNhYmxlV2hlbk5vdFRyYWNrZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRFbmFibGVkKGZhbHNlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX25vdFRyYWNrZWRGcmFtZXNDb3VudCA9IDEwO1xyXG5cclxuICAgICAgICB0aGlzLm9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGUgPSBuZXcgT2JzZXJ2YWJsZShvYnNlcnZlciA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc1RyYWNraW5nKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGUubm90aWZ5T2JzZXJ2ZXIob2JzZXJ2ZXIsIHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5vblRyYWNraW5nTG9zdE9ic2VydmFibGUgPSBuZXcgT2JzZXJ2YWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnJvdGF0aW9uUXVhdGVybmlvbiA9IFF1YXRlcm5pb24uSWRlbnRpdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaXNUcmFja2luZygpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNUcmFja2luZztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0VHJhY2tpbmcocG9zaXRpb246IFZlY3RvcjMsIHJvdGF0aW9uOiBRdWF0ZXJuaW9uLCBpc1RyYWNraW5nOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvbi5jb3B5RnJvbShwb3NpdGlvbik7XHJcbiAgICAgICAgdGhpcy5yb3RhdGlvblF1YXRlcm5pb24gPyB0aGlzLnJvdGF0aW9uUXVhdGVybmlvbi5jb3B5RnJvbShyb3RhdGlvbikgOiB0aGlzLnJvdGF0aW9uUXVhdGVybmlvbiA9IHJvdGF0aW9uLmNsb25lKCk7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IFJlbW92ZSB0aGlzIGZlYXR1cmUsIHdoaWNoIG9ubHkgZXhpc3RzIGFzIGEgc3RvcGdhcC5cclxuICAgICAgICBpZiAoaXNUcmFja2luZykge1xyXG4gICAgICAgICAgICB0aGlzLl9ub3RUcmFja2VkRnJhbWVzQ291bnQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50ICs9IDE7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9ub3RUcmFja2VkRnJhbWVzQ291bnQgPCA1KSB7XHJcbiAgICAgICAgICAgICAgICBpc1RyYWNraW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9pc1RyYWNraW5nICYmIGlzVHJhY2tpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5vblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlLm5vdGlmeU9ic2VydmVycyh0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5faXNUcmFja2luZyAmJiAhaXNUcmFja2luZykge1xyXG4gICAgICAgICAgICB0aGlzLm9uVHJhY2tpbmdMb3N0T2JzZXJ2YWJsZS5ub3RpZnlPYnNlcnZlcnModGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2lzVHJhY2tpbmcgPSBpc1RyYWNraW5nO1xyXG4gICAgICAgIHRoaXMuc2V0RW5hYmxlZCghdGhpcy5kaXNhYmxlV2hlbk5vdFRyYWNrZWQgfHwgdGhpcy5faXNUcmFja2luZyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==
