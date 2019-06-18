(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BabylonAR = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dedicatedWorker_1 = require("../shared/dedicatedWorker");
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
            tracker._worker = dedicatedWorker_1.DedicatedWorker.createFromLocation(ExampleMarkerTracker.MODULE_URL, ExampleMarkerTracker.onInitialized, ExampleMarkerTracker.onMessage);
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
    ExampleMarkerTracker.MODULE_URL = "https://syntheticmagus.github.io/webpiled-aruco-ar/v0.02/webpiled-aruco-ar/webpiled-aruco-ar.js";
    return ExampleMarkerTracker;
}());
exports.ExampleMarkerTracker = ExampleMarkerTracker;

},{"../shared/dedicatedWorker":3}],2:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = (typeof window !== "undefined" ? window['BABYLON'] : typeof global !== "undefined" ? global['BABYLON'] : null);
var exampleMarkerTracker_1 = require("./exampleMarkerTracker");
var filteredVector3_1 = require("../shared/filteredVector3");
var trackedNode_1 = require("../shared/trackedNode");
var ArUcoMetaMarkerObjectTracker = /** @class */ (function () {
    function ArUcoMetaMarkerObjectTracker(videoTexture, scene) {
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
    ArUcoMetaMarkerObjectTracker.prototype.addTrackableObject = function (ul, ur, ll, lr) {
        var descriptor = [ul, ur, ll, lr].toString();
        this._trackableObjects.add(descriptor, new trackedNode_1.TrackedNode(descriptor.toString(), this._scene));
        return this._trackableObjects.get(descriptor);
    };
    ArUcoMetaMarkerObjectTracker.prototype.processResults = function (results) {
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
    ArUcoMetaMarkerObjectTracker.prototype.setCalibrationAsync = function (scalar) {
        if (scalar === void 0) { scalar = 1; }
        return this._tracker.setCalibrationAsync(Math.round(scalar * this._videoTexture.getSize().width), Math.round(scalar * this._videoTexture.getSize().height));
    };
    ArUcoMetaMarkerObjectTracker.getQuaternionFromRodrigues = function (x, y, z) {
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
    ArUcoMetaMarkerObjectTracker.prototype.startTracking = function () {
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
                                rotation: ArUcoMetaMarkerObjectTracker.getQuaternionFromRodrigues(marker.rx, marker.ry, marker.rz)
                            };
                        });
                        _this.processResults(results);
                    }
                    running = false;
                });
            }
        });
    };
    ArUcoMetaMarkerObjectTracker.prototype.stopTracking = function () {
        this._scene.onAfterRenderObservable.remove(this._runTrackingObserver);
        this._runTrackingObserver = null;
    };
    ArUcoMetaMarkerObjectTracker.createAsync = function (videoTexture, scene) {
        var objectTracker = new ArUcoMetaMarkerObjectTracker(videoTexture, scene);
        return exampleMarkerTracker_1.ExampleMarkerTracker.createAsync().then(function (tracker) {
            objectTracker._tracker = tracker;
            return objectTracker.setCalibrationAsync();
        }).then(function () {
            return objectTracker;
        });
    };
    return ArUcoMetaMarkerObjectTracker;
}());
exports.ArUcoMetaMarkerObjectTracker = ArUcoMetaMarkerObjectTracker;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../shared/filteredVector3":4,"../shared/trackedNode":5,"./exampleMarkerTracker":1}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU1hcmtlclRyYWNrZXIudHMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU9iamVjdFRyYWNrZXIudHMiLCJzcmMvdHMvc2hhcmVkL2RlZGljYXRlZFdvcmtlci50cyIsInNyYy90cy9zaGFyZWQvZmlsdGVyZWRWZWN0b3IzLnRzIiwic3JjL3RzL3NoYXJlZC90cmFja2VkTm9kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDRUEsNkRBQTJEO0FBSzNEO0lBS0k7SUFBdUIsQ0FBQztJQUVULGtDQUFhLEdBQTVCO1FBQ0ksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hCLFdBQVcsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFYyw4QkFBUyxHQUF4QixVQUF5QixLQUFtQjtRQUN4QyxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBRXhCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQixXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNoQzthQUNJLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNyQixNQUFNLENBQUMsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakUsV0FBVyxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDckM7YUFDSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDakIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJ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VSxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBQ0wsa0JBQUM7QUFBRCxDQXpEQSxBQXlEQyxDQXpEZ0MseUJBQWEsR0F5RDdDO0FBekRZLGtDQUFXIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHsgVmlkZW9UZXh0dXJlIH0gZnJvbSBcImJhYnlsb25qc1wiXG5cbmltcG9ydCB7IERlZGljYXRlZFdvcmtlciB9IGZyb20gXCIuLi9zaGFyZWQvZGVkaWNhdGVkV29ya2VyXCJcblxuZGVjbGFyZSB2YXIgTW9kdWxlOiBhbnk7XG5kZWNsYXJlIGZ1bmN0aW9uIHBvc3RNZXNzYWdlKGRhdGE6IGFueSk6IHZvaWQ7XG5cbmV4cG9ydCBjbGFzcyBFeGFtcGxlTWFya2VyVHJhY2tlciB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgTU9EVUxFX1VSTDogc3RyaW5nID0gXCJodHRwczovL3N5bnRoZXRpY21hZ3VzLmdpdGh1Yi5pby93ZWJwaWxlZC1hcnVjby1hci92MC4wMi93ZWJwaWxlZC1hcnVjby1hci93ZWJwaWxlZC1hcnVjby1hci5qc1wiO1xuICAgIFxuICAgIHByaXZhdGUgX3dvcmtlcjogV29ya2VyO1xuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBvbkluaXRpYWxpemVkKCkge1xuICAgICAgICBNb2R1bGUuX3Jlc2V0KCk7XG4gICAgICAgIHBvc3RNZXNzYWdlKHsgaW5pdGlhbGl6ZWQ6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25NZXNzYWdlKGV2ZW50OiBNZXNzYWdlRXZlbnQpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYXJncyA9IGV2ZW50LmRhdGE7XG5cbiAgICAgICAgaWYgKGFyZ3MucmVzZXQpIHtcbiAgICAgICAgICAgIE1vZHVsZS5fcmVzZXQoKTtcbiAgICAgICAgICAgIHBvc3RNZXNzYWdlKHsgcmVzZXQ6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYXJncy5jYWxpYnJhdGUpIHtcbiAgICAgICAgICAgIE1vZHVsZS5fc2V0X2NhbGlicmF0aW9uX2Zyb21fZnJhbWVfc2l6ZShhcmdzLndpZHRoLCBhcmdzLmhlaWdodCk7XG4gICAgICAgICAgICBwb3N0TWVzc2FnZSh7IGNhbGlicmF0ZWQ6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYXJncy50cmFjaykge1xuICAgICAgICAgICAgbGV0IGJ1ZiA9IE1vZHVsZS5fbWFsbG9jKGFyZ3MuaW1hZ2VEYXRhLmxlbmd0aCAqIGFyZ3MuaW1hZ2VEYXRhLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgICAgICAgIE1vZHVsZS5IRUFQOC5zZXQoYXJncy5pbWFnZURhdGEsIGJ1Zik7XG4gICAgICAgICAgICBsZXQgbnVtTWFya2VycyA9IE1vZHVsZS5fcHJvY2Vzc19pbWFnZShhcmdzLndpZHRoLCBhcmdzLmhlaWdodCwgYnVmLCAxKTtcbiAgICAgICAgICAgIE1vZHVsZS5fZnJlZShidWYpO1xuXG4gICAgICAgICAgICBsZXQgbWFya2VyczogYW55W10gPSBbXTtcbiAgICAgICAgICAgIGxldCBvZmZzZXQ6IG51bWJlciA9IDA7XG4gICAgICAgICAgICBsZXQgaWQ6IG51bWJlciA9IDA7XG4gICAgICAgICAgICBsZXQgdHg6IG51bWJlciA9IDAuMDtcbiAgICAgICAgICAgIGxldCB0eTogbnVtYmVyID0gMC4wO1xuICAgICAgICAgICAgbGV0IHR6OiBudW1iZXIgPSAwLjA7XG4gICAgICAgICAgICBsZXQgcng6IG51bWJlciA9IDAuMDtcbiAgICAgICAgICAgIGxldCByeTogbnVtYmVyID0gMC4wO1xuICAgICAgICAgICAgbGV0IHJ6OiBudW1iZXIgPSAwLjA7XG4gICAgICAgICAgICBmb3IgKGxldCBtYXJrZXJJZHggPSAwOyBtYXJrZXJJZHggPCBudW1NYXJrZXJzOyBtYXJrZXJJZHgrKykge1xuICAgICAgICAgICAgICAgIGxldCBwdHIgPSBNb2R1bGUuX2dldF90cmFja2VkX21hcmtlcihtYXJrZXJJZHgpO1xuXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICBpZCA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiaTMyXCIpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSAxMjtcbiAgICAgICAgICAgICAgICB0eCA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSA4O1xuICAgICAgICAgICAgICAgIHR5ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XG4gICAgICAgICAgICAgICAgdHogPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImRvdWJsZVwiKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcbiAgICAgICAgICAgICAgICByeCA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSA4O1xuICAgICAgICAgICAgICAgIHJ5ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XG4gICAgICAgICAgICAgICAgcnogPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImRvdWJsZVwiKTtcblxuICAgICAgICAgICAgICAgIG1hcmtlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICAgICAgdHg6IHR4LFxuICAgICAgICAgICAgICAgICAgICB0eTogdHksXG4gICAgICAgICAgICAgICAgICAgIHR6OiB0eixcbiAgICAgICAgICAgICAgICAgICAgcng6IHJ4LFxuICAgICAgICAgICAgICAgICAgICByeTogcnksXG4gICAgICAgICAgICAgICAgICAgIHJ6OiByelxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgbWFya2VyczogbWFya2Vyc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZUFzeW5jKCk6IFByb21pc2U8RXhhbXBsZU1hcmtlclRyYWNrZXI+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEV4YW1wbGVNYXJrZXJUcmFja2VyPigocmVzb2x2ZTogKHRyYWNrZXI6IEV4YW1wbGVNYXJrZXJUcmFja2VyKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICBsZXQgdHJhY2tlciA9IG5ldyBFeGFtcGxlTWFya2VyVHJhY2tlcigpO1xuICAgICAgICAgICAgdHJhY2tlci5fd29ya2VyID0gRGVkaWNhdGVkV29ya2VyLmNyZWF0ZUZyb21Mb2NhdGlvbihcbiAgICAgICAgICAgICAgICBFeGFtcGxlTWFya2VyVHJhY2tlci5NT0RVTEVfVVJMLFxuICAgICAgICAgICAgICAgIEV4YW1wbGVNYXJrZXJUcmFja2VyLm9uSW5pdGlhbGl6ZWQsXG4gICAgICAgICAgICAgICAgRXhhbXBsZU1hcmtlclRyYWNrZXIub25NZXNzYWdlKTtcbiAgICAgICAgICAgIHRyYWNrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyYWNrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xuICAgICAgICAgICAgICAgIHJlc29sdmUodHJhY2tlcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Q2FsaWJyYXRpb25Bc3luYyh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YS5jYWxpYnJhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXN1bHQuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl93b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgY2FsaWJyYXRlOiB0cnVlLFxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgcHVibGljIGZpbmRNYXJrZXJzSW5JbWFnZUFzeW5jKHZpZGVvVGV4dHVyZTogVmlkZW9UZXh0dXJlKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8YW55W10+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IERlZGljYXRlZFdvcmtlci51bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXI7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhLm1hcmtlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQuZGF0YS5tYXJrZXJzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXN1bHQuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fd29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHRyYWNrOiB0cnVlLFxuICAgICAgICAgICAgd2lkdGg6IHZpZGVvVGV4dHVyZS5nZXRTaXplKCkud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHZpZGVvVGV4dHVyZS5nZXRTaXplKCkuaGVpZ2h0LFxuICAgICAgICAgICAgaW1hZ2VEYXRhOiB2aWRlb1RleHR1cmUucmVhZFBpeGVscygpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBOdWxsYWJsZSwgT2JzZXJ2ZXIsIFF1YXRlcm5pb24sIFNjZW5lLCBTdHJpbmdEaWN0aW9uYXJ5LCBWZWN0b3IzLCBWaWRlb1RleHR1cmUgfSBmcm9tIFwiYmFieWxvbmpzXCI7XG5cbmltcG9ydCB7IEV4YW1wbGVNYXJrZXJUcmFja2VyIH0gZnJvbSBcIi4vZXhhbXBsZU1hcmtlclRyYWNrZXJcIlxuaW1wb3J0IHsgRmlsdGVyZWRWZWN0b3IzIH0gZnJvbSBcIi4uL3NoYXJlZC9maWx0ZXJlZFZlY3RvcjNcIlxuaW1wb3J0IHsgVHJhY2tlZE5vZGUgfSBmcm9tIFwiLi4vc2hhcmVkL3RyYWNrZWROb2RlXCJcblxuZXhwb3J0IGNsYXNzIEFyVWNvTWV0YU1hcmtlck9iamVjdFRyYWNrZXIge1xuICAgIHByaXZhdGUgX3NjZW5lOiBTY2VuZTtcbiAgICBwcml2YXRlIF92aWRlb1RleHR1cmU6IFZpZGVvVGV4dHVyZTtcbiAgICBwcml2YXRlIF9ydW5UcmFja2luZ09ic2VydmVyOiBOdWxsYWJsZTxPYnNlcnZlcjxTY2VuZT4+ID0gbnVsbDtcbiAgICBwcml2YXRlIF90cmFja2VyOiBFeGFtcGxlTWFya2VyVHJhY2tlcjtcbiAgICBwcml2YXRlIF90cmFja2FibGVPYmplY3RzOiBTdHJpbmdEaWN0aW9uYXJ5PFRyYWNrZWROb2RlPiA9IG5ldyBTdHJpbmdEaWN0aW9uYXJ5PFRyYWNrZWROb2RlPigpO1xuXG4gICAgcHJpdmF0ZSBfX3Bvc0VzdGltYXRlOiBWZWN0b3IzID0gVmVjdG9yMy5aZXJvKCk7XG4gICAgcHJpdmF0ZSBfX3Bvc0VzdGltYXRlQ291bnQ6IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSBfX3JpZ2h0RXN0aW1hdGU6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcbiAgICBwcml2YXRlIF9fcmlnaHRFc3RpbWF0ZUNvdW50OiBudW1iZXIgPSAwO1xuICAgIHByaXZhdGUgX19mb3J3YXJkRXN0aW1hdGU6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcbiAgICBwcml2YXRlIF9fZm9yd2FyZEVzdGltYXRlQ291bnQ6IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSBfX3NjcmF0Y2hWZWM6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcbiAgICBwcml2YXRlIF9fZmlsdGVyZWRQb3M6IEZpbHRlcmVkVmVjdG9yMyA9IG5ldyBGaWx0ZXJlZFZlY3RvcjMoMC4wLCAwLjAsIDAuMCk7XG4gICAgcHJpdmF0ZSBfX2ZpbHRlcmVkUmlnaHQ6IEZpbHRlcmVkVmVjdG9yMyA9IG5ldyBGaWx0ZXJlZFZlY3RvcjMoMC4wLCAwLjAsIDAuMCk7XG4gICAgcHJpdmF0ZSBfX2ZpbHRlcmVkRm9yd2FyZDogRmlsdGVyZWRWZWN0b3IzID0gbmV3IEZpbHRlcmVkVmVjdG9yMygwLjAsIDAuMCwgMC4wKTtcbiAgICBwcml2YXRlIF9fdGFyZ2V0UG9zaXRpb246IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcbiAgICBwcml2YXRlIF9fdGFyZ2V0Um90YXRpb246IFF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLklkZW50aXR5KCk7XG4gICAgcHJpdmF0ZSBfX3VsSWQ6IG51bWJlciA9IC0xO1xuICAgIHByaXZhdGUgX191cklkOiBudW1iZXIgPSAtMTtcbiAgICBwcml2YXRlIF9fbGxJZDogbnVtYmVyID0gLTE7XG4gICAgcHJpdmF0ZSBfX2xySWQ6IG51bWJlciA9IC0xO1xuXG4gICAgY29uc3RydWN0b3IodmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmUsIHNjZW5lOiBTY2VuZSkge1xuICAgICAgICB0aGlzLl9zY2VuZSA9IHNjZW5lO1xuICAgICAgICB0aGlzLl92aWRlb1RleHR1cmUgPSB2aWRlb1RleHR1cmU7XG4gICAgfVxuXG4gICAgYWRkVHJhY2thYmxlT2JqZWN0KHVsOiBudW1iZXIsIHVyOiBudW1iZXIsIGxsOiBudW1iZXIsIGxyOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgZGVzY3JpcHRvciA9IFt1bCwgdXIsIGxsLCBscl0udG9TdHJpbmcoKTtcbiAgICAgICAgdGhpcy5fdHJhY2thYmxlT2JqZWN0cy5hZGQoZGVzY3JpcHRvciwgbmV3IFRyYWNrZWROb2RlKGRlc2NyaXB0b3IudG9TdHJpbmcoKSwgdGhpcy5fc2NlbmUpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RyYWNrYWJsZU9iamVjdHMuZ2V0KGRlc2NyaXB0b3IpO1xuICAgIH1cblxuICAgIHByb2Nlc3NSZXN1bHRzKHJlc3VsdHM6IGFueSkge1xuICAgICAgICAvLyBUT0RPOiBUSElTIElTIEhBQ0tFRCBDT0RFXG5cbiAgICAgICAgdGhpcy5fdHJhY2thYmxlT2JqZWN0cy5mb3JFYWNoKChkZXNjcmlwdG9yOiBzdHJpbmcsIHRyYWNrZWRPYmplY3Q6IFRyYWNrZWROb2RlKSA9PiB7XG4gICAgICAgICAgICB2YXIgbnVtcyA9IGRlc2NyaXB0b3Iuc3BsaXQoJywnKTtcbiAgICAgICAgICAgIHRoaXMuX191bElkID0gcGFyc2VJbnQobnVtc1swXSk7XG4gICAgICAgICAgICB0aGlzLl9fdXJJZCA9IHBhcnNlSW50KG51bXNbMV0pO1xuICAgICAgICAgICAgdGhpcy5fX2xsSWQgPSBwYXJzZUludChudW1zWzJdKTtcbiAgICAgICAgICAgIHRoaXMuX19scklkID0gcGFyc2VJbnQobnVtc1szXSk7XG5cbiAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGVDb3VudCA9IDAuMDtcbiAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCA9IDAuMDtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX2xsSWRdKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX3VySWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX19sbElkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdXJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zY2FsZUluUGxhY2UoMC41KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlQ291bnQgKz0gMS4wO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19scklkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbHJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zdWJ0cmFjdEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbGxJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX3VsSWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX191bElkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnN1YnRyYWN0SW5QbGFjZShyZXN1bHRzW3RoaXMuX19sbElkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX191cklkXSkge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19scklkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdXJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zdWJ0cmFjdEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbHJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCArPSAxLjA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX191bElkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdXJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zdWJ0cmFjdEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdWxJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHRzW3RoaXMuX19scklkXSAmJiByZXN1bHRzW3RoaXMuX191bElkXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xySWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VsSWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5zY2FsZUluUGxhY2UoMC41KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlQ291bnQgKz0gMS4wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5fX3Bvc0VzdGltYXRlQ291bnQgKiB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50ICogdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5zY2FsZUluUGxhY2UoMS4wIC8gdGhpcy5fX3Bvc0VzdGltYXRlQ291bnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlLnNjYWxlSW5QbGFjZSgxLjAgLyB0aGlzLl9fcmlnaHRFc3RpbWF0ZUNvdW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlLnNjYWxlSW5QbGFjZSgxLjAgLyB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkUG9zLmFkZFNhbXBsZSh0aGlzLl9fcG9zRXN0aW1hdGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19maWx0ZXJlZFJpZ2h0LmFkZFNhbXBsZSh0aGlzLl9fcmlnaHRFc3RpbWF0ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkRm9yd2FyZC5hZGRTYW1wbGUodGhpcy5fX2ZvcndhcmRFc3RpbWF0ZSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0UG9zaXRpb24uY29weUZyb20odGhpcy5fX2ZpbHRlcmVkUG9zKTtcbiAgICAgICAgICAgICAgICBRdWF0ZXJuaW9uLlJvdGF0aW9uUXVhdGVybmlvbkZyb21BeGlzVG9SZWYoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19maWx0ZXJlZFJpZ2h0LCBcbiAgICAgICAgICAgICAgICAgICAgVmVjdG9yMy5Dcm9zcyh0aGlzLl9fZmlsdGVyZWRGb3J3YXJkLCB0aGlzLl9fZmlsdGVyZWRSaWdodCksIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZmlsdGVyZWRGb3J3YXJkLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0Um90YXRpb24pO1xuXG4gICAgICAgICAgICAgICAgdHJhY2tlZE9iamVjdC5zZXRUcmFja2luZyhcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFBvc2l0aW9uLCBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3RhcmdldFJvdGF0aW9uLCBcbiAgICAgICAgICAgICAgICAgICAgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cmFja2VkT2JqZWN0LnNldFRyYWNraW5nKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0UG9zaXRpb24sIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0Um90YXRpb24sIFxuICAgICAgICAgICAgICAgICAgICB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2V0Q2FsaWJyYXRpb25Bc3luYyhzY2FsYXIgPSAxKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90cmFja2VyLnNldENhbGlicmF0aW9uQXN5bmMoXG4gICAgICAgICAgICBNYXRoLnJvdW5kKHNjYWxhciAqIHRoaXMuX3ZpZGVvVGV4dHVyZS5nZXRTaXplKCkud2lkdGgpLCBcbiAgICAgICAgICAgIE1hdGgucm91bmQoc2NhbGFyICogdGhpcy5fdmlkZW9UZXh0dXJlLmdldFNpemUoKS5oZWlnaHQpKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UXVhdGVybmlvbkZyb21Sb2RyaWd1ZXMoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcikge1xuICAgICAgICB2YXIgcm90ID0gbmV3IFZlY3RvcjMoLXgsIHksIC16KTtcbiAgICAgICAgdmFyIHRoZXRhID0gcm90Lmxlbmd0aCgpO1xuICAgICAgICByb3Quc2NhbGVJblBsYWNlKDEuMCAvIHRoZXRhKTtcbiAgICAgICAgaWYgKHRoZXRhICE9PSAwLjApIHtcbiAgICAgICAgICAgIHJldHVybiBRdWF0ZXJuaW9uLlJvdGF0aW9uQXhpcyhyb3QsIHRoZXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHN0YXJ0VHJhY2tpbmcoKSB7XG4gICAgICAgIHZhciBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3J1blRyYWNraW5nT2JzZXJ2ZXIgPSB0aGlzLl9zY2VuZS5vbkFmdGVyUmVuZGVyT2JzZXJ2YWJsZS5hZGQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl90cmFja2VyLmZpbmRNYXJrZXJzSW5JbWFnZUFzeW5jKHRoaXMuX3ZpZGVvVGV4dHVyZSkudGhlbihtYXJrZXJzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHRzOiBhbnkgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1ttYXJrZXIuaWRdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbmV3IFZlY3RvcjMobWFya2VyLnR4LCAtbWFya2VyLnR5LCBtYXJrZXIudHopLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogQXJVY29NZXRhTWFya2VyT2JqZWN0VHJhY2tlci5nZXRRdWF0ZXJuaW9uRnJvbVJvZHJpZ3VlcyhtYXJrZXIucngsIG1hcmtlci5yeSwgbWFya2VyLnJ6KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXN1bHRzKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9wVHJhY2tpbmcoKSB7XG4gICAgICAgIHRoaXMuX3NjZW5lLm9uQWZ0ZXJSZW5kZXJPYnNlcnZhYmxlLnJlbW92ZSh0aGlzLl9ydW5UcmFja2luZ09ic2VydmVyKTtcbiAgICAgICAgdGhpcy5fcnVuVHJhY2tpbmdPYnNlcnZlciA9IG51bGw7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUFzeW5jKHZpZGVvVGV4dHVyZTogVmlkZW9UZXh0dXJlLCBzY2VuZTogU2NlbmUpIHtcbiAgICAgICAgdmFyIG9iamVjdFRyYWNrZXIgPSBuZXcgQXJVY29NZXRhTWFya2VyT2JqZWN0VHJhY2tlcih2aWRlb1RleHR1cmUsIHNjZW5lKTtcbiAgICAgICAgcmV0dXJuIEV4YW1wbGVNYXJrZXJUcmFja2VyLmNyZWF0ZUFzeW5jKCkudGhlbih0cmFja2VyID0+IHtcbiAgICAgICAgICAgIG9iamVjdFRyYWNrZXIuX3RyYWNrZXIgPSB0cmFja2VyO1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRyYWNrZXIuc2V0Q2FsaWJyYXRpb25Bc3luYygpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUcmFja2VyO1xuICAgICAgICB9KTtcbiAgICB9XG59IiwiZXhwb3J0IGNsYXNzIERlZGljYXRlZFdvcmtlciB7XG5cbiAgICBwcml2YXRlIHN0YXRpYyBjcmVhdGVGcm9tU291cmNlcyguLi5zb3VyY2VzOiBhbnlbXSk6IFdvcmtlciB7XG4gICAgICAgIGxldCB3b3JrZXJDb2RlOiBzdHJpbmcgPSBcIlwiO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzb3VyY2VzLmxlbmd0aCAtIDE7IGlkeCsrKSB7XG4gICAgICAgICAgICB3b3JrZXJDb2RlICs9IHNvdXJjZXNbaWR4XS50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHdvcmtlckNvZGUgKz0gXCIoXCIgKyBzb3VyY2VzW3NvdXJjZXMubGVuZ3RoIC0gMV0udG9TdHJpbmcoKSArIFwiKSgpO1wiO1xuICAgICAgICByZXR1cm4gbmV3IFdvcmtlcih3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbd29ya2VyQ29kZV0pKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVGcm9tTG9jYXRpb24oanNVcmw6IHN0cmluZywgb25Jbml0aWFsaXplZDogKCkgPT4gdm9pZCwgb25NZXNzYWdlOiAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4gdm9pZCk6IFdvcmtlciB7XG4gICAgICAgIGxldCBtb2R1bGVEZWZpdGlvbjogc3RyaW5nID0gYE1vZHVsZSA9IHtcbiAgICAgICAgICAgIGxvY2F0ZUZpbGU6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFxcXCJgICsganNVcmwucmVwbGFjZSgvLmpzJC8sIFwiLndhc21cIikgKyBgXFxcIjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJ1bnRpbWVJbml0aWFsaXplZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIChgICsgb25Jbml0aWFsaXplZC50b1N0cmluZygpICsgYCkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtgO1xuICAgICAgICBsZXQgbWVzc2FnZUhhbmRsZXI6IHN0cmluZyA9IFwidGhpcy5vbm1lc3NhZ2UgPSBcIiArIG9uTWVzc2FnZS50b1N0cmluZygpICsgXCI7XCI7XG4gICAgICAgIGxldCBpbXBvcnRKYXZhc2NyaXB0OiBzdHJpbmcgPSBcImZ1bmN0aW9uIGltcG9ydEphdmFzY3JpcHQoKSB7IGltcG9ydFNjcmlwdHMoXFxcIlwiICsganNVcmwgKyBcIlxcXCIpOyB9XCI7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZyb21Tb3VyY2VzKG1vZHVsZURlZml0aW9uLCBtZXNzYWdlSGFuZGxlciwgaW1wb3J0SmF2YXNjcmlwdCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyB1bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXIoZXZlbnQ6IE1lc3NhZ2VFdmVudCk6IHZvaWQge1xuICAgICAgICB0aHJvdyBFcnJvcihcIlVuZXhwZWN0ZWQgbWVzc2FnZSBmcm9tIFdlYldvcmtlcjogXCIgKyBldmVudCk7XG4gICAgfVxufSIsImltcG9ydCB7IFZlY3RvcjMgfSBmcm9tIFwiYmFieWxvbmpzXCJcblxuZXhwb3J0IGNsYXNzIEZpbHRlcmVkVmVjdG9yMyBleHRlbmRzIFZlY3RvcjMge1xuICAgIHByaXZhdGUgX2lkeDogbnVtYmVyO1xuICAgIHByaXZhdGUgX3NhbXBsZXM6IFZlY3RvcjNbXTtcbiAgICBwcml2YXRlIF9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzOiBudW1iZXJbXTtcbiAgICBwcml2YXRlIF9zYW1wbGVBdmVyYWdlOiBWZWN0b3IzO1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHNhbXBsZUNvdW50OiBudW1iZXIgPSAxKSB7XG4gICAgICAgIHN1cGVyKHgsIHksIHopO1xuXG4gICAgICAgIHRoaXMuX2lkeCA9IDA7XG4gICAgICAgIHRoaXMuX3NhbXBsZXMgPSBbXTtcbiAgICAgICAgdGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzYW1wbGVDb3VudDsgKytpZHgpIHtcbiAgICAgICAgICAgIHRoaXMuX3NhbXBsZXMucHVzaChuZXcgVmVjdG9yMyh4LCB5LCB6KSk7XG4gICAgICAgICAgICB0aGlzLl9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzLnB1c2goMC4wKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3NhbXBsZUF2ZXJhZ2UgPSBuZXcgVmVjdG9yMyh4LCB5LCB6KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkU2FtcGxlKHNhbXBsZTogVmVjdG9yMyk6IHZvaWQge1xuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLnNjYWxlSW5QbGFjZSh0aGlzLl9zYW1wbGVzLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuX3NhbXBsZUF2ZXJhZ2Uuc3VidHJhY3RJblBsYWNlKHRoaXMuX3NhbXBsZXNbdGhpcy5faWR4XSk7XG4gICAgICAgIHRoaXMuX3NhbXBsZXNbdGhpcy5faWR4XS5jb3B5RnJvbShzYW1wbGUpO1xuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLmFkZEluUGxhY2UodGhpcy5fc2FtcGxlc1t0aGlzLl9pZHhdKTtcbiAgICAgICAgdGhpcy5fc2FtcGxlQXZlcmFnZS5zY2FsZUluUGxhY2UoMS4wIC8gdGhpcy5fc2FtcGxlcy5sZW5ndGgpO1xuICAgICAgICB0aGlzLl9pZHggPSAodGhpcy5faWR4ICsgMSkgJSB0aGlzLl9zYW1wbGVzLmxlbmd0aDtcblxuICAgICAgICBsZXQgYXZnU3F1YXJlZERpc3RhbmNlID0gMC4wO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB0aGlzLl9zYW1wbGVzLmxlbmd0aDsgKytpZHgpIHtcbiAgICAgICAgICAgIHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXNbaWR4XSA9IFZlY3RvcjMuRGlzdGFuY2VTcXVhcmVkKHRoaXMuX3NhbXBsZUF2ZXJhZ2UsIHRoaXMuX3NhbXBsZXNbaWR4XSk7XG4gICAgICAgICAgICBhdmdTcXVhcmVkRGlzdGFuY2UgKz0gdGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlc1tpZHhdO1xuICAgICAgICB9XG4gICAgICAgIGF2Z1NxdWFyZWREaXN0YW5jZSAvPSB0aGlzLl9zYW1wbGVzLmxlbmd0aDtcblxuICAgICAgICBsZXQgbnVtSW5jbHVkZWRTYW1wbGVzID0gMDtcbiAgICAgICAgdGhpcy5zZXQoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8PSB0aGlzLl9zYW1wbGVzLmxlbmd0aDsgKytpZHgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzW2lkeF0gPD0gYXZnU3F1YXJlZERpc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRJblBsYWNlKHRoaXMuX3NhbXBsZXNbaWR4XSk7XG4gICAgICAgICAgICAgICAgbnVtSW5jbHVkZWRTYW1wbGVzICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY2FsZUluUGxhY2UoMS4wIC8gbnVtSW5jbHVkZWRTYW1wbGVzKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgT2JzZXJ2YWJsZSwgUXVhdGVybmlvbiwgU2NlbmUsIFRyYW5zZm9ybU5vZGUsIFZlY3RvcjMgfSBmcm9tIFwiYmFieWxvbmpzXCJcblxuZXhwb3J0IGNsYXNzIFRyYWNrZWROb2RlIGV4dGVuZHMgVHJhbnNmb3JtTm9kZSB7XG4gICAgcHJpdmF0ZSBfaXNUcmFja2luZzogYm9vbGVhbjtcbiAgICBwcml2YXRlIF9ub3RUcmFja2VkRnJhbWVzQ291bnQ6IG51bWJlcjsgLy8gVE9ETzogUmVtb3ZlIHRoaXMgZmVhdHVyZSwgd2hpY2ggb25seSBleGlzdHMgYXMgYSBzdG9wZ2FwLlxuXG4gICAgcHVibGljIG9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGU6IE9ic2VydmFibGU8VHJhY2tlZE5vZGU+O1xuICAgIHB1YmxpYyBvblRyYWNraW5nTG9zdE9ic2VydmFibGU6IE9ic2VydmFibGU8VHJhY2tlZE5vZGU+O1xuICAgIHB1YmxpYyBkaXNhYmxlV2hlbk5vdFRyYWNrZWQ6IGJvb2xlYW47XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBzY2VuZT86IFNjZW5lIHwgbnVsbCB8IHVuZGVmaW5lZCwgZGlzYWJsZVdoZW5Ob3RUcmFja2VkOiBib29sZWFuID0gdHJ1ZSkge1xuICAgICAgICBzdXBlcihuYW1lLCBzY2VuZSwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5faXNUcmFja2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc2FibGVXaGVuTm90VHJhY2tlZCA9IGRpc2FibGVXaGVuTm90VHJhY2tlZDtcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZVdoZW5Ob3RUcmFja2VkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEVuYWJsZWQoZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50ID0gMTA7XG5cbiAgICAgICAgdGhpcy5vblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlID0gbmV3IE9ic2VydmFibGUob2JzZXJ2ZXIgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzVHJhY2tpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGUubm90aWZ5T2JzZXJ2ZXIob2JzZXJ2ZXIsIHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5vblRyYWNraW5nTG9zdE9ic2VydmFibGUgPSBuZXcgT2JzZXJ2YWJsZSgpO1xuXG4gICAgICAgIHRoaXMucm90YXRpb25RdWF0ZXJuaW9uID0gUXVhdGVybmlvbi5JZGVudGl0eSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpc1RyYWNraW5nKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNUcmFja2luZztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0VHJhY2tpbmcocG9zaXRpb246IFZlY3RvcjMsIHJvdGF0aW9uOiBRdWF0ZXJuaW9uLCBpc1RyYWNraW5nOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMucG9zaXRpb24uY29weUZyb20ocG9zaXRpb24pO1xuICAgICAgICB0aGlzLnJvdGF0aW9uUXVhdGVybmlvbiA/IHRoaXMucm90YXRpb25RdWF0ZXJuaW9uLmNvcHlGcm9tKHJvdGF0aW9uKSA6IHRoaXMucm90YXRpb25RdWF0ZXJuaW9uID0gcm90YXRpb24uY2xvbmUoKTtcblxuICAgICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBmZWF0dXJlLCB3aGljaCBvbmx5IGV4aXN0cyBhcyBhIHN0b3BnYXAuXG4gICAgICAgIGlmIChpc1RyYWNraW5nKSB7XG4gICAgICAgICAgICB0aGlzLl9ub3RUcmFja2VkRnJhbWVzQ291bnQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50ICs9IDE7XG4gICAgICAgICAgICBpZiAodGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50IDwgNSkge1xuICAgICAgICAgICAgICAgIGlzVHJhY2tpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl9pc1RyYWNraW5nICYmIGlzVHJhY2tpbmcpIHtcbiAgICAgICAgICAgIHRoaXMub25UcmFja2luZ0FjcXVpcmVkT2JzZXJ2YWJsZS5ub3RpZnlPYnNlcnZlcnModGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5faXNUcmFja2luZyAmJiAhaXNUcmFja2luZykge1xuICAgICAgICAgICAgdGhpcy5vblRyYWNraW5nTG9zdE9ic2VydmFibGUubm90aWZ5T2JzZXJ2ZXJzKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lzVHJhY2tpbmcgPSBpc1RyYWNraW5nO1xuICAgICAgICB0aGlzLnNldEVuYWJsZWQoIXRoaXMuZGlzYWJsZVdoZW5Ob3RUcmFja2VkIHx8IHRoaXMuX2lzVHJhY2tpbmcpO1xuICAgIH1cbn1cblxuIl19
