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

},{"../shared/filteredVector3":5,"../shared/trackedNode":6,"./exampleMarkerTracker":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXAMPLE_MODULE_URL = "https://syntheticmagus.github.io/prototyping/babylonar/wasm/webpiled-aruco-ar.js";

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU1hcmtlclRyYWNrZXIudHMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU9iamVjdFRyYWNrZXIudHMiLCJzcmMvdHMvc2hhcmVkL2NvbnN0YW50cy50cyIsInNyYy90cy9zaGFyZWQvZGVkaWNhdGVkV29ya2VyLnRzIiwic3JjL3RzL3NoYXJlZC9maWx0ZXJlZFZlY3RvcjMudHMiLCJzcmMvdHMvc2hhcmVkL3RyYWNrZWROb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSw2REFBMkQ7QUFDM0QsaURBQXdEO0FBS3hEO0lBR0k7SUFBdUIsQ0FBQztJQUVULGtDQUFhLEdBQTVCO1FBQ0ksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hCLFdBQVcsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFYyw4QkFBUyxHQUF4QixVQUF5QixLQUFtQjtRQUN4QyxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBRXhCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQixXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNoQzthQUNJLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNyQixNQUFNLENBQUMsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakUsV0FBVyxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDckM7YUFDSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDakIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE9B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Q0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFDTCxrQkFBQztBQUFELENBekRBLEFBeURDLENBekRnQyx5QkFBYSxHQXlEN0M7QUF6RFksa0NBQVciLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgeyBWaWRlb1RleHR1cmUgfSBmcm9tIFwiYmFieWxvbmpzXCJcclxuXHJcbmltcG9ydCB7IERlZGljYXRlZFdvcmtlciB9IGZyb20gXCIuLi9zaGFyZWQvZGVkaWNhdGVkV29ya2VyXCJcclxuaW1wb3J0IHsgRVhBTVBMRV9NT0RVTEVfVVJMIH0gZnJvbSBcIi4uL3NoYXJlZC9jb25zdGFudHNcIlxyXG5cclxuZGVjbGFyZSB2YXIgTW9kdWxlOiBhbnk7XHJcbmRlY2xhcmUgZnVuY3Rpb24gcG9zdE1lc3NhZ2UoZGF0YTogYW55KTogdm9pZDtcclxuXHJcbmV4cG9ydCBjbGFzcyBFeGFtcGxlTWFya2VyVHJhY2tlciB7XHJcbiAgICBwcml2YXRlIF93b3JrZXI6IFdvcmtlcjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBvbkluaXRpYWxpemVkKCkge1xyXG4gICAgICAgIE1vZHVsZS5fcmVzZXQoKTtcclxuICAgICAgICBwb3N0TWVzc2FnZSh7IGluaXRpYWxpemVkOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIG9uTWVzc2FnZShldmVudDogTWVzc2FnZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgYXJncyA9IGV2ZW50LmRhdGE7XHJcblxyXG4gICAgICAgIGlmIChhcmdzLnJlc2V0KSB7XHJcbiAgICAgICAgICAgIE1vZHVsZS5fcmVzZXQoKTtcclxuICAgICAgICAgICAgcG9zdE1lc3NhZ2UoeyByZXNldDogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoYXJncy5jYWxpYnJhdGUpIHtcclxuICAgICAgICAgICAgTW9kdWxlLl9zZXRfY2FsaWJyYXRpb25fZnJvbV9mcmFtZV9zaXplKGFyZ3Mud2lkdGgsIGFyZ3MuaGVpZ2h0KTtcclxuICAgICAgICAgICAgcG9zdE1lc3NhZ2UoeyBjYWxpYnJhdGVkOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChhcmdzLnRyYWNrKSB7XHJcbiAgICAgICAgICAgIGxldCBidWYgPSBNb2R1bGUuX21hbGxvYyhhcmdzLmltYWdlRGF0YS5sZW5ndGggKiBhcmdzLmltYWdlRGF0YS5CWVRFU19QRVJfRUxFTUVOVCk7XHJcbiAgICAgICAgICAgIE1vZHVsZS5IRUFQOC5zZXQoYXJncy5pbWFnZURhdGEsIGJ1Zik7XHJcbiAgICAgICAgICAgIGxldCBudW1NYXJrZXJzID0gTW9kdWxlLl9wcm9jZXNzX2ltYWdlKGFyZ3Mud2lkdGgsIGFyZ3MuaGVpZ2h0LCBidWYsIDEpO1xyXG4gICAgICAgICAgICBNb2R1bGUuX2ZyZWUoYnVmKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBtYXJrZXJzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICBsZXQgb2Zmc2V0OiBudW1iZXIgPSAwO1xyXG4gICAgICAgICAgICBsZXQgaWQ6IG51bWJlciA9IDA7XHJcbiAgICAgICAgICAgIGxldCB0eDogbnVtYmVyID0gMC4wO1xyXG4gICAgICAgICAgICBsZXQgdHk6IG51bWJlciA9IDAuMDtcclxuICAgICAgICAgICAgbGV0IHR6OiBudW1iZXIgPSAwLjA7XHJcbiAgICAgICAgICAgIGxldCByeDogbnVtYmVyID0gMC4wO1xyXG4gICAgICAgICAgICBsZXQgcnk6IG51bWJlciA9IDAuMDtcclxuICAgICAgICAgICAgbGV0IHJ6OiBudW1iZXIgPSAwLjA7XHJcbiAgICAgICAgICAgIGZvciAobGV0IG1hcmtlcklkeCA9IDA7IG1hcmtlcklkeCA8IG51bU1hcmtlcnM7IG1hcmtlcklkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHRyID0gTW9kdWxlLl9nZXRfdHJhY2tlZF9tYXJrZXIobWFya2VySWR4KTtcclxuXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWQgPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImkzMlwiKTtcclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSAxMjtcclxuICAgICAgICAgICAgICAgIHR4ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcclxuICAgICAgICAgICAgICAgIHR5ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcclxuICAgICAgICAgICAgICAgIHR6ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcclxuICAgICAgICAgICAgICAgIHJ4ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcclxuICAgICAgICAgICAgICAgIHJ5ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcclxuICAgICAgICAgICAgICAgIHJ6ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgbWFya2Vycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgdHg6IHR4LFxyXG4gICAgICAgICAgICAgICAgICAgIHR5OiB0eSxcclxuICAgICAgICAgICAgICAgICAgICB0ejogdHosXHJcbiAgICAgICAgICAgICAgICAgICAgcng6IHJ4LFxyXG4gICAgICAgICAgICAgICAgICAgIHJ5OiByeSxcclxuICAgICAgICAgICAgICAgICAgICByejogcnpcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBwb3N0TWVzc2FnZSh7XHJcbiAgICAgICAgICAgICAgICBtYXJrZXJzOiBtYXJrZXJzXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZUFzeW5jKCk6IFByb21pc2U8RXhhbXBsZU1hcmtlclRyYWNrZXI+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8RXhhbXBsZU1hcmtlclRyYWNrZXI+KChyZXNvbHZlOiAodHJhY2tlcjogRXhhbXBsZU1hcmtlclRyYWNrZXIpID0+IHZvaWQpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRyYWNrZXIgPSBuZXcgRXhhbXBsZU1hcmtlclRyYWNrZXIoKTtcclxuICAgICAgICAgICAgdHJhY2tlci5fd29ya2VyID0gRGVkaWNhdGVkV29ya2VyLmNyZWF0ZUZyb21Mb2NhdGlvbihcclxuICAgICAgICAgICAgICAgIEVYQU1QTEVfTU9EVUxFX1VSTCxcclxuICAgICAgICAgICAgICAgIEV4YW1wbGVNYXJrZXJUcmFja2VyLm9uSW5pdGlhbGl6ZWQsXHJcbiAgICAgICAgICAgICAgICBFeGFtcGxlTWFya2VyVHJhY2tlci5vbk1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB0cmFja2VyLl93b3JrZXIub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRyYWNrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0cmFja2VyKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0Q2FsaWJyYXRpb25Bc3luYyh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSAocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRhdGEuY2FsaWJyYXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXN1bHQuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5fd29ya2VyLnBvc3RNZXNzYWdlKHtcclxuICAgICAgICAgICAgY2FsaWJyYXRlOiB0cnVlLFxyXG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmaW5kTWFya2Vyc0luSW1hZ2VBc3luYyh2aWRlb1RleHR1cmU6IFZpZGVvVGV4dHVyZSk6IFByb21pc2U8YW55W10+IHtcclxuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8YW55W10+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IChyZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRhdGEubWFya2Vycykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0LmRhdGEubWFya2Vycyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzdWx0LmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLl93b3JrZXIucG9zdE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICB0cmFjazogdHJ1ZSxcclxuICAgICAgICAgICAgd2lkdGg6IHZpZGVvVGV4dHVyZS5nZXRTaXplKCkud2lkdGgsXHJcbiAgICAgICAgICAgIGhlaWdodDogdmlkZW9UZXh0dXJlLmdldFNpemUoKS5oZWlnaHQsXHJcbiAgICAgICAgICAgIGltYWdlRGF0YTogdmlkZW9UZXh0dXJlLnJlYWRQaXhlbHMoKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IE51bGxhYmxlLCBPYnNlcnZlciwgUXVhdGVybmlvbiwgU2NlbmUsIFN0cmluZ0RpY3Rpb25hcnksIFZlY3RvcjMsIFZpZGVvVGV4dHVyZSB9IGZyb20gXCJiYWJ5bG9uanNcIjtcclxuXHJcbmltcG9ydCB7IEV4YW1wbGVNYXJrZXJUcmFja2VyIH0gZnJvbSBcIi4vZXhhbXBsZU1hcmtlclRyYWNrZXJcIlxyXG5pbXBvcnQgeyBGaWx0ZXJlZFZlY3RvcjMgfSBmcm9tIFwiLi4vc2hhcmVkL2ZpbHRlcmVkVmVjdG9yM1wiXHJcbmltcG9ydCB7IFRyYWNrZWROb2RlIH0gZnJvbSBcIi4uL3NoYXJlZC90cmFja2VkTm9kZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgRXhhbXBsZU9iamVjdFRyYWNrZXIge1xyXG4gICAgcHJpdmF0ZSBfc2NlbmU6IFNjZW5lO1xyXG4gICAgcHJpdmF0ZSBfdmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmU7XHJcbiAgICBwcml2YXRlIF9ydW5UcmFja2luZ09ic2VydmVyOiBOdWxsYWJsZTxPYnNlcnZlcjxTY2VuZT4+ID0gbnVsbDtcclxuICAgIHByaXZhdGUgX3RyYWNrZXI6IEV4YW1wbGVNYXJrZXJUcmFja2VyO1xyXG4gICAgcHJpdmF0ZSBfdHJhY2thYmxlT2JqZWN0czogU3RyaW5nRGljdGlvbmFyeTxUcmFja2VkTm9kZT4gPSBuZXcgU3RyaW5nRGljdGlvbmFyeTxUcmFja2VkTm9kZT4oKTtcclxuXHJcbiAgICBwcml2YXRlIF9fcG9zRXN0aW1hdGU6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcclxuICAgIHByaXZhdGUgX19wb3NFc3RpbWF0ZUNvdW50OiBudW1iZXIgPSAwO1xyXG4gICAgcHJpdmF0ZSBfX3JpZ2h0RXN0aW1hdGU6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcclxuICAgIHByaXZhdGUgX19yaWdodEVzdGltYXRlQ291bnQ6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIF9fZm9yd2FyZEVzdGltYXRlOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XHJcbiAgICBwcml2YXRlIF9fZm9yd2FyZEVzdGltYXRlQ291bnQ6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIF9fc2NyYXRjaFZlYzogVmVjdG9yMyA9IFZlY3RvcjMuWmVybygpO1xyXG4gICAgcHJpdmF0ZSBfX2ZpbHRlcmVkUG9zOiBGaWx0ZXJlZFZlY3RvcjMgPSBuZXcgRmlsdGVyZWRWZWN0b3IzKDAuMCwgMC4wLCAwLjApO1xyXG4gICAgcHJpdmF0ZSBfX2ZpbHRlcmVkUmlnaHQ6IEZpbHRlcmVkVmVjdG9yMyA9IG5ldyBGaWx0ZXJlZFZlY3RvcjMoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICBwcml2YXRlIF9fZmlsdGVyZWRGb3J3YXJkOiBGaWx0ZXJlZFZlY3RvcjMgPSBuZXcgRmlsdGVyZWRWZWN0b3IzKDAuMCwgMC4wLCAwLjApO1xyXG4gICAgcHJpdmF0ZSBfX3RhcmdldFBvc2l0aW9uOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XHJcbiAgICBwcml2YXRlIF9fdGFyZ2V0Um90YXRpb246IFF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLklkZW50aXR5KCk7XHJcbiAgICBwcml2YXRlIF9fdWxJZDogbnVtYmVyID0gLTE7XHJcbiAgICBwcml2YXRlIF9fdXJJZDogbnVtYmVyID0gLTE7XHJcbiAgICBwcml2YXRlIF9fbGxJZDogbnVtYmVyID0gLTE7XHJcbiAgICBwcml2YXRlIF9fbHJJZDogbnVtYmVyID0gLTE7XHJcblxyXG4gICAgY29uc3RydWN0b3IodmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmUsIHNjZW5lOiBTY2VuZSkge1xyXG4gICAgICAgIHRoaXMuX3NjZW5lID0gc2NlbmU7XHJcbiAgICAgICAgdGhpcy5fdmlkZW9UZXh0dXJlID0gdmlkZW9UZXh0dXJlO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRyYWNrYWJsZU9iamVjdCh1bDogbnVtYmVyLCB1cjogbnVtYmVyLCBsbDogbnVtYmVyLCBscjogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3QgZGVzY3JpcHRvciA9IFt1bCwgdXIsIGxsLCBscl0udG9TdHJpbmcoKTtcclxuICAgICAgICB0aGlzLl90cmFja2FibGVPYmplY3RzLmFkZChkZXNjcmlwdG9yLCBuZXcgVHJhY2tlZE5vZGUoZGVzY3JpcHRvci50b1N0cmluZygpLCB0aGlzLl9zY2VuZSkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90cmFja2FibGVPYmplY3RzLmdldChkZXNjcmlwdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzUmVzdWx0cyhyZXN1bHRzOiBhbnkpIHtcclxuICAgICAgICAvLyBUT0RPOiBUSElTIElTIEhBQ0tFRCBDT0RFXHJcblxyXG4gICAgICAgIHRoaXMuX3RyYWNrYWJsZU9iamVjdHMuZm9yRWFjaCgoZGVzY3JpcHRvcjogc3RyaW5nLCB0cmFja2VkT2JqZWN0OiBUcmFja2VkTm9kZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgbnVtcyA9IGRlc2NyaXB0b3Iuc3BsaXQoJywnKTtcclxuICAgICAgICAgICAgdGhpcy5fX3VsSWQgPSBwYXJzZUludChudW1zWzBdKTtcclxuICAgICAgICAgICAgdGhpcy5fX3VySWQgPSBwYXJzZUludChudW1zWzFdKTtcclxuICAgICAgICAgICAgdGhpcy5fX2xsSWQgPSBwYXJzZUludChudW1zWzJdKTtcclxuICAgICAgICAgICAgdGhpcy5fX2xySWQgPSBwYXJzZUludChudW1zWzNdKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5zZXQoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50ID0gMC4wO1xyXG4gICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZS5zZXQoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQgPSAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGUuc2V0KDAuMCwgMC4wLCAwLjApO1xyXG4gICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQgPSAwLjA7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fbGxJZF0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX191cklkXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xsSWRdLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VySWRdLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zY2FsZUluUGxhY2UoMC41KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlQ291bnQgKz0gMS4wO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19scklkXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xySWRdLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zdWJ0cmFjdEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbGxJZF0ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLm5vcm1hbGl6ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQgKz0gMS4wO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fdWxJZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX191bElkXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc3VidHJhY3RJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xsSWRdLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCArPSAxLjA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX191cklkXSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX2xySWRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdXJJZF0ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnN1YnRyYWN0SW5QbGFjZShyZXN1bHRzW3RoaXMuX19scklkXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMubm9ybWFsaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQgKz0gMS4wO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fdWxJZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX191cklkXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc3VidHJhY3RJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VsSWRdLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX2xySWRdICYmIHJlc3VsdHNbdGhpcy5fX3VsSWRdKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xySWRdLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdWxJZF0ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2NhbGVJblBsYWNlKDAuNSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50ICs9IDEuMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50ICogdGhpcy5fX3JpZ2h0RXN0aW1hdGVDb3VudCAqIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5zY2FsZUluUGxhY2UoMS4wIC8gdGhpcy5fX3Bvc0VzdGltYXRlQ291bnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGUuc2NhbGVJblBsYWNlKDEuMCAvIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZS5zY2FsZUluUGxhY2UoMS4wIC8gdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9fZmlsdGVyZWRQb3MuYWRkU2FtcGxlKHRoaXMuX19wb3NFc3RpbWF0ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9fZmlsdGVyZWRSaWdodC5hZGRTYW1wbGUodGhpcy5fX3JpZ2h0RXN0aW1hdGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkRm9yd2FyZC5hZGRTYW1wbGUodGhpcy5fX2ZvcndhcmRFc3RpbWF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFBvc2l0aW9uLmNvcHlGcm9tKHRoaXMuX19maWx0ZXJlZFBvcyk7XHJcbiAgICAgICAgICAgICAgICBRdWF0ZXJuaW9uLlJvdGF0aW9uUXVhdGVybmlvbkZyb21BeGlzVG9SZWYoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkUmlnaHQsIFxyXG4gICAgICAgICAgICAgICAgICAgIFZlY3RvcjMuQ3Jvc3ModGhpcy5fX2ZpbHRlcmVkRm9yd2FyZCwgdGhpcy5fX2ZpbHRlcmVkUmlnaHQpLCBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZmlsdGVyZWRGb3J3YXJkLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgdHJhY2tlZE9iamVjdC5zZXRUcmFja2luZyhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0UG9zaXRpb24sIFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbiwgXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0cmFja2VkT2JqZWN0LnNldFRyYWNraW5nKFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRQb3NpdGlvbiwgXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFJvdGF0aW9uLCBcclxuICAgICAgICAgICAgICAgICAgICB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNldENhbGlicmF0aW9uQXN5bmMoc2NhbGFyID0gMSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90cmFja2VyLnNldENhbGlicmF0aW9uQXN5bmMoXHJcbiAgICAgICAgICAgIE1hdGgucm91bmQoc2NhbGFyICogdGhpcy5fdmlkZW9UZXh0dXJlLmdldFNpemUoKS53aWR0aCksIFxyXG4gICAgICAgICAgICBNYXRoLnJvdW5kKHNjYWxhciAqIHRoaXMuX3ZpZGVvVGV4dHVyZS5nZXRTaXplKCkuaGVpZ2h0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldFF1YXRlcm5pb25Gcm9tUm9kcmlndWVzKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpIHtcclxuICAgICAgICB2YXIgcm90ID0gbmV3IFZlY3RvcjMoLXgsIHksIC16KTtcclxuICAgICAgICB2YXIgdGhldGEgPSByb3QubGVuZ3RoKCk7XHJcbiAgICAgICAgcm90LnNjYWxlSW5QbGFjZSgxLjAgLyB0aGV0YSk7XHJcbiAgICAgICAgaWYgKHRoZXRhICE9PSAwLjApIHtcclxuICAgICAgICAgICAgcmV0dXJuIFF1YXRlcm5pb24uUm90YXRpb25BeGlzKHJvdCwgdGhldGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBzdGFydFRyYWNraW5nKCkge1xyXG4gICAgICAgIHZhciBydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fcnVuVHJhY2tpbmdPYnNlcnZlciA9IHRoaXMuX3NjZW5lLm9uQWZ0ZXJSZW5kZXJPYnNlcnZhYmxlLmFkZCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcnVubmluZykge1xyXG4gICAgICAgICAgICAgICAgcnVubmluZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fdHJhY2tlci5maW5kTWFya2Vyc0luSW1hZ2VBc3luYyh0aGlzLl92aWRlb1RleHR1cmUpLnRoZW4obWFya2VycyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdHM6IGFueSA9IHt9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzW21hcmtlci5pZF0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5ldyBWZWN0b3IzKG1hcmtlci50eCwgLW1hcmtlci50eSwgbWFya2VyLnR6KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogRXhhbXBsZU9iamVjdFRyYWNrZXIuZ2V0UXVhdGVybmlvbkZyb21Sb2RyaWd1ZXMobWFya2VyLnJ4LCBtYXJrZXIucnksIG1hcmtlci5yeilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXN1bHRzKHJlc3VsdHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdG9wVHJhY2tpbmcoKSB7XHJcbiAgICAgICAgdGhpcy5fc2NlbmUub25BZnRlclJlbmRlck9ic2VydmFibGUucmVtb3ZlKHRoaXMuX3J1blRyYWNraW5nT2JzZXJ2ZXIpO1xyXG4gICAgICAgIHRoaXMuX3J1blRyYWNraW5nT2JzZXJ2ZXIgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBjcmVhdGVBc3luYyh2aWRlb1RleHR1cmU6IFZpZGVvVGV4dHVyZSwgc2NlbmU6IFNjZW5lKSB7XHJcbiAgICAgICAgdmFyIG9iamVjdFRyYWNrZXIgPSBuZXcgRXhhbXBsZU9iamVjdFRyYWNrZXIodmlkZW9UZXh0dXJlLCBzY2VuZSk7XHJcbiAgICAgICAgcmV0dXJuIEV4YW1wbGVNYXJrZXJUcmFja2VyLmNyZWF0ZUFzeW5jKCkudGhlbih0cmFja2VyID0+IHtcclxuICAgICAgICAgICAgb2JqZWN0VHJhY2tlci5fdHJhY2tlciA9IHRyYWNrZXI7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUcmFja2VyLnNldENhbGlicmF0aW9uQXN5bmMoKTtcclxuICAgICAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRyYWNrZXI7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgY29uc3QgRVhBTVBMRV9NT0RVTEVfVVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vc3ludGhldGljbWFndXMuZ2l0aHViLmlvL3Byb3RvdHlwaW5nL2JhYnlsb25hci93YXNtL3dlYnBpbGVkLWFydWNvLWFyLmpzXCI7IiwiZXhwb3J0IGNsYXNzIERlZGljYXRlZFdvcmtlciB7XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlRnJvbVNvdXJjZXMoLi4uc291cmNlczogYW55W10pOiBXb3JrZXIge1xyXG4gICAgICAgIGxldCB3b3JrZXJDb2RlOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHNvdXJjZXMubGVuZ3RoIC0gMTsgaWR4KyspIHtcclxuICAgICAgICAgICAgd29ya2VyQ29kZSArPSBzb3VyY2VzW2lkeF0udG9TdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd29ya2VyQ29kZSArPSBcIihcIiArIHNvdXJjZXNbc291cmNlcy5sZW5ndGggLSAxXS50b1N0cmluZygpICsgXCIpKCk7XCI7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXb3JrZXIod2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW3dvcmtlckNvZGVdKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlRnJvbUxvY2F0aW9uKGpzVXJsOiBzdHJpbmcsIG9uSW5pdGlhbGl6ZWQ6ICgpID0+IHZvaWQsIG9uTWVzc2FnZTogKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHZvaWQpOiBXb3JrZXIge1xyXG4gICAgICAgIGxldCBtb2R1bGVEZWZpdGlvbjogc3RyaW5nID0gYE1vZHVsZSA9IHtcclxuICAgICAgICAgICAgbG9jYXRlRmlsZTogZnVuY3Rpb24gKHBhdGgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcXFwiYCArIGpzVXJsLnJlcGxhY2UoLy5qcyQvLCBcIi53YXNtXCIpICsgYFxcXCI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uUnVudGltZUluaXRpYWxpemVkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAoYCArIG9uSW5pdGlhbGl6ZWQudG9TdHJpbmcoKSArIGApKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O2A7XHJcbiAgICAgICAgbGV0IG1lc3NhZ2VIYW5kbGVyOiBzdHJpbmcgPSBcInRoaXMub25tZXNzYWdlID0gXCIgKyBvbk1lc3NhZ2UudG9TdHJpbmcoKSArIFwiO1wiO1xyXG4gICAgICAgIGxldCBpbXBvcnRKYXZhc2NyaXB0OiBzdHJpbmcgPSBcImZ1bmN0aW9uIGltcG9ydEphdmFzY3JpcHQoKSB7IGltcG9ydFNjcmlwdHMoXFxcIlwiICsganNVcmwgKyBcIlxcXCIpOyB9XCI7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRnJvbVNvdXJjZXMobW9kdWxlRGVmaXRpb24sIG1lc3NhZ2VIYW5kbGVyLCBpbXBvcnRKYXZhc2NyaXB0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcihldmVudDogTWVzc2FnZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJVbmV4cGVjdGVkIG1lc3NhZ2UgZnJvbSBXZWJXb3JrZXI6IFwiICsgZXZlbnQpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gXCJiYWJ5bG9uanNcIlxyXG5cclxuZXhwb3J0IGNsYXNzIEZpbHRlcmVkVmVjdG9yMyBleHRlbmRzIFZlY3RvcjMge1xyXG4gICAgcHJpdmF0ZSBfaWR4OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9zYW1wbGVzOiBWZWN0b3IzW107XHJcbiAgICBwcml2YXRlIF9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzOiBudW1iZXJbXTtcclxuICAgIHByaXZhdGUgX3NhbXBsZUF2ZXJhZ2U6IFZlY3RvcjM7XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHNhbXBsZUNvdW50OiBudW1iZXIgPSAxKSB7XHJcbiAgICAgICAgc3VwZXIoeCwgeSwgeik7XHJcblxyXG4gICAgICAgIHRoaXMuX2lkeCA9IDA7XHJcbiAgICAgICAgdGhpcy5fc2FtcGxlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXMgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzYW1wbGVDb3VudDsgKytpZHgpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2FtcGxlcy5wdXNoKG5ldyBWZWN0b3IzKHgsIHksIHopKTtcclxuICAgICAgICAgICAgdGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlcy5wdXNoKDAuMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlID0gbmV3IFZlY3RvcjMoeCwgeSwgeik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZFNhbXBsZShzYW1wbGU6IFZlY3RvcjMpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLnNjYWxlSW5QbGFjZSh0aGlzLl9zYW1wbGVzLmxlbmd0aCk7XHJcbiAgICAgICAgdGhpcy5fc2FtcGxlQXZlcmFnZS5zdWJ0cmFjdEluUGxhY2UodGhpcy5fc2FtcGxlc1t0aGlzLl9pZHhdKTtcclxuICAgICAgICB0aGlzLl9zYW1wbGVzW3RoaXMuX2lkeF0uY29weUZyb20oc2FtcGxlKTtcclxuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLmFkZEluUGxhY2UodGhpcy5fc2FtcGxlc1t0aGlzLl9pZHhdKTtcclxuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLnNjYWxlSW5QbGFjZSgxLjAgLyB0aGlzLl9zYW1wbGVzLmxlbmd0aCk7XHJcbiAgICAgICAgdGhpcy5faWR4ID0gKHRoaXMuX2lkeCArIDEpICUgdGhpcy5fc2FtcGxlcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGxldCBhdmdTcXVhcmVkRGlzdGFuY2UgPSAwLjA7XHJcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdGhpcy5fc2FtcGxlcy5sZW5ndGg7ICsraWR4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXNbaWR4XSA9IFZlY3RvcjMuRGlzdGFuY2VTcXVhcmVkKHRoaXMuX3NhbXBsZUF2ZXJhZ2UsIHRoaXMuX3NhbXBsZXNbaWR4XSk7XHJcbiAgICAgICAgICAgIGF2Z1NxdWFyZWREaXN0YW5jZSArPSB0aGlzLl9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF2Z1NxdWFyZWREaXN0YW5jZSAvPSB0aGlzLl9zYW1wbGVzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgbGV0IG51bUluY2x1ZGVkU2FtcGxlcyA9IDA7XHJcbiAgICAgICAgdGhpcy5zZXQoMC4wLCAwLjAsIDAuMCk7XHJcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDw9IHRoaXMuX3NhbXBsZXMubGVuZ3RoOyArK2lkeCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlc1tpZHhdIDw9IGF2Z1NxdWFyZWREaXN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRJblBsYWNlKHRoaXMuX3NhbXBsZXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICBudW1JbmNsdWRlZFNhbXBsZXMgKz0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNjYWxlSW5QbGFjZSgxLjAgLyBudW1JbmNsdWRlZFNhbXBsZXMpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgT2JzZXJ2YWJsZSwgUXVhdGVybmlvbiwgU2NlbmUsIFRyYW5zZm9ybU5vZGUsIFZlY3RvcjMgfSBmcm9tIFwiYmFieWxvbmpzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBUcmFja2VkTm9kZSBleHRlbmRzIFRyYW5zZm9ybU5vZGUge1xyXG4gICAgcHJpdmF0ZSBfaXNUcmFja2luZzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX25vdFRyYWNrZWRGcmFtZXNDb3VudDogbnVtYmVyOyAvLyBUT0RPOiBSZW1vdmUgdGhpcyBmZWF0dXJlLCB3aGljaCBvbmx5IGV4aXN0cyBhcyBhIHN0b3BnYXAuXHJcblxyXG4gICAgcHVibGljIG9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGU6IE9ic2VydmFibGU8VHJhY2tlZE5vZGU+O1xyXG4gICAgcHVibGljIG9uVHJhY2tpbmdMb3N0T2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUcmFja2VkTm9kZT47XHJcbiAgICBwdWJsaWMgZGlzYWJsZVdoZW5Ob3RUcmFja2VkOiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNjZW5lPzogU2NlbmUgfCBudWxsIHwgdW5kZWZpbmVkLCBkaXNhYmxlV2hlbk5vdFRyYWNrZWQ6IGJvb2xlYW4gPSB0cnVlKSB7XHJcbiAgICAgICAgc3VwZXIobmFtZSwgc2NlbmUsIHRydWUpO1xyXG5cclxuICAgICAgICB0aGlzLl9pc1RyYWNraW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlV2hlbk5vdFRyYWNrZWQgPSBkaXNhYmxlV2hlbk5vdFRyYWNrZWQ7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZVdoZW5Ob3RUcmFja2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RW5hYmxlZChmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9ub3RUcmFja2VkRnJhbWVzQ291bnQgPSAxMDtcclxuXHJcbiAgICAgICAgdGhpcy5vblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlID0gbmV3IE9ic2VydmFibGUob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5faXNUcmFja2luZykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlLm5vdGlmeU9ic2VydmVyKG9ic2VydmVyLCB0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMub25UcmFja2luZ0xvc3RPYnNlcnZhYmxlID0gbmV3IE9ic2VydmFibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5yb3RhdGlvblF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLklkZW50aXR5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGlzVHJhY2tpbmcoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVHJhY2tpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFRyYWNraW5nKHBvc2l0aW9uOiBWZWN0b3IzLCByb3RhdGlvbjogUXVhdGVybmlvbiwgaXNUcmFja2luZzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24uY29weUZyb20ocG9zaXRpb24pO1xyXG4gICAgICAgIHRoaXMucm90YXRpb25RdWF0ZXJuaW9uID8gdGhpcy5yb3RhdGlvblF1YXRlcm5pb24uY29weUZyb20ocm90YXRpb24pIDogdGhpcy5yb3RhdGlvblF1YXRlcm5pb24gPSByb3RhdGlvbi5jbG9uZSgpO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBmZWF0dXJlLCB3aGljaCBvbmx5IGV4aXN0cyBhcyBhIHN0b3BnYXAuXHJcbiAgICAgICAgaWYgKGlzVHJhY2tpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50ID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX25vdFRyYWNrZWRGcmFtZXNDb3VudCArPSAxO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50IDwgNSkge1xyXG4gICAgICAgICAgICAgICAgaXNUcmFja2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5faXNUcmFja2luZyAmJiBpc1RyYWNraW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25UcmFja2luZ0FjcXVpcmVkT2JzZXJ2YWJsZS5ub3RpZnlPYnNlcnZlcnModGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuX2lzVHJhY2tpbmcgJiYgIWlzVHJhY2tpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5vblRyYWNraW5nTG9zdE9ic2VydmFibGUubm90aWZ5T2JzZXJ2ZXJzKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9pc1RyYWNraW5nID0gaXNUcmFja2luZztcclxuICAgICAgICB0aGlzLnNldEVuYWJsZWQoIXRoaXMuZGlzYWJsZVdoZW5Ob3RUcmFja2VkIHx8IHRoaXMuX2lzVHJhY2tpbmcpO1xyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=
