(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BabylonAR = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleMarkerTracker = void 0;
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
        return __awaiter(this, void 0, void 0, function () {
            var promise, _a, _b, _c;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        promise = new Promise(function (resolve, reject) {
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
                        _b = (_a = this._worker).postMessage;
                        _c = {
                            track: true,
                            width: videoTexture.getSize().width,
                            height: videoTexture.getSize().height
                        };
                        return [4 /*yield*/, videoTexture.readPixels()];
                    case 1:
                        _b.apply(_a, [(_c.imageData = _d.sent(),
                                _c)]);
                        return [4 /*yield*/, promise];
                    case 2: return [2 /*return*/, _d.sent()];
                }
            });
        });
    };
    return ExampleMarkerTracker;
}());
exports.ExampleMarkerTracker = ExampleMarkerTracker;

},{"../shared/constants":3,"../shared/dedicatedWorker":4}],2:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleObjectTracker = void 0;
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

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../shared/filteredVector3":5,"../shared/trackedNode":6,"./exampleMarkerTracker":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMAGE_TEMPLATE_TRACKER_URL = exports.ARUCO_META_MARKER_TRACKER_URL = exports.EXAMPLE_MODULE_URL = void 0;
var CDN_URL = "https://ar.babylonjs.com/";
var CDN_WASM_MODULES_URL = CDN_URL + "wasm/";
exports.EXAMPLE_MODULE_URL = CDN_WASM_MODULES_URL + "webpiled-aruco-ar.js";
exports.ARUCO_META_MARKER_TRACKER_URL = CDN_WASM_MODULES_URL + "aruco-meta-marker-tracker.js";
exports.IMAGE_TEMPLATE_TRACKER_URL = CDN_WASM_MODULES_URL + "image-template-tracker.js";

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DedicatedWorker = void 0;
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
(function (global){(function (){
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
exports.FilteredVector3 = void 0;
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

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],6:[function(require,module,exports){
(function (global){(function (){
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
exports.TrackedNode = void 0;
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

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[2])(2)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU1hcmtlclRyYWNrZXIudHMiLCJzcmMvdHMvZXhhbXBsZU9iamVjdFRyYWNrZXIvZXhhbXBsZU9iamVjdFRyYWNrZXIudHMiLCJzcmMvdHMvc2hhcmVkL2NvbnN0YW50cy50cyIsInNyYy90cy9zaGFyZWQvZGVkaWNhdGVkV29ya2VyLnRzIiwic3JjL3RzL3NoYXJlZC9maWx0ZXJlZFZlY3RvcjMudHMiLCJzcmMvdHMvc2hhcmVkL3RyYWNrZWROb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDRUEsNkRBQTJEO0FBQzNELGlEQUF3RDtBQUt4RDtJQUdJO0lBQXVCLENBQUM7SUFFVCxrQ0FBYSxHQUE1QjtRQUNJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQixXQUFXLENBQUMsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRWMsOEJBQVMsR0FBeEIsVUFBeUIsS0FBbUI7UUFDeEMsSUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztRQUV4QixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDWixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDaEIsV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDaEM7YUFDSSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDckIsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pFLFdBQVcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ3JDO2FBQ0ksSUFBSSxJQUFJLENBQUMsS0FBSyxF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QUFJLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLEVBQUU7Z0JBQ2pDLFVBQVUsR0FBRyxJQUFJLENBQUM7YUFDckI7U0FDSjtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLFVBQVUsRUFBRTtZQUNqQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzNEO2FBQ0ksSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3RDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkQ7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBQ0wsa0JBQUM7QUFBRCxDQXpEQSxBQXlEQyxDQXpEZ0MseUJBQWEsR0F5RDdDO0FBekRZLGtDQUFXIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHsgVmlkZW9UZXh0dXJlIH0gZnJvbSBcImJhYnlsb25qc1wiXG5cbmltcG9ydCB7IERlZGljYXRlZFdvcmtlciB9IGZyb20gXCIuLi9zaGFyZWQvZGVkaWNhdGVkV29ya2VyXCJcbmltcG9ydCB7IEVYQU1QTEVfTU9EVUxFX1VSTCB9IGZyb20gXCIuLi9zaGFyZWQvY29uc3RhbnRzXCJcblxuZGVjbGFyZSB2YXIgTW9kdWxlOiBhbnk7XG5kZWNsYXJlIGZ1bmN0aW9uIHBvc3RNZXNzYWdlKGRhdGE6IGFueSk6IHZvaWQ7XG5cbmV4cG9ydCBjbGFzcyBFeGFtcGxlTWFya2VyVHJhY2tlciB7XG4gICAgcHJpdmF0ZSBfd29ya2VyOiBXb3JrZXI7XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cblxuICAgIHByaXZhdGUgc3RhdGljIG9uSW5pdGlhbGl6ZWQoKSB7XG4gICAgICAgIE1vZHVsZS5fcmVzZXQoKTtcbiAgICAgICAgcG9zdE1lc3NhZ2UoeyBpbml0aWFsaXplZDogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBvbk1lc3NhZ2UoZXZlbnQ6IE1lc3NhZ2VFdmVudCk6IHZvaWQge1xuICAgICAgICBjb25zdCBhcmdzID0gZXZlbnQuZGF0YTtcblxuICAgICAgICBpZiAoYXJncy5yZXNldCkge1xuICAgICAgICAgICAgTW9kdWxlLl9yZXNldCgpO1xuICAgICAgICAgICAgcG9zdE1lc3NhZ2UoeyByZXNldDogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhcmdzLmNhbGlicmF0ZSkge1xuICAgICAgICAgICAgTW9kdWxlLl9zZXRfY2FsaWJyYXRpb25fZnJvbV9mcmFtZV9zaXplKGFyZ3Mud2lkdGgsIGFyZ3MuaGVpZ2h0KTtcbiAgICAgICAgICAgIHBvc3RNZXNzYWdlKHsgY2FsaWJyYXRlZDogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhcmdzLnRyYWNrKSB7XG4gICAgICAgICAgICBsZXQgYnVmID0gTW9kdWxlLl9tYWxsb2MoYXJncy5pbWFnZURhdGEubGVuZ3RoICogYXJncy5pbWFnZURhdGEuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgICAgICAgTW9kdWxlLkhFQVA4LnNldChhcmdzLmltYWdlRGF0YSwgYnVmKTtcbiAgICAgICAgICAgIGxldCBudW1NYXJrZXJzID0gTW9kdWxlLl9wcm9jZXNzX2ltYWdlKGFyZ3Mud2lkdGgsIGFyZ3MuaGVpZ2h0LCBidWYsIDEpO1xuICAgICAgICAgICAgTW9kdWxlLl9mcmVlKGJ1Zik7XG5cbiAgICAgICAgICAgIGxldCBtYXJrZXJzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgbGV0IG9mZnNldDogbnVtYmVyID0gMDtcbiAgICAgICAgICAgIGxldCBpZDogbnVtYmVyID0gMDtcbiAgICAgICAgICAgIGxldCB0eDogbnVtYmVyID0gMC4wO1xuICAgICAgICAgICAgbGV0IHR5OiBudW1iZXIgPSAwLjA7XG4gICAgICAgICAgICBsZXQgdHo6IG51bWJlciA9IDAuMDtcbiAgICAgICAgICAgIGxldCByeDogbnVtYmVyID0gMC4wO1xuICAgICAgICAgICAgbGV0IHJ5OiBudW1iZXIgPSAwLjA7XG4gICAgICAgICAgICBsZXQgcno6IG51bWJlciA9IDAuMDtcbiAgICAgICAgICAgIGZvciAobGV0IG1hcmtlcklkeCA9IDA7IG1hcmtlcklkeCA8IG51bU1hcmtlcnM7IG1hcmtlcklkeCsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHB0ciA9IE1vZHVsZS5fZ2V0X3RyYWNrZWRfbWFya2VyKG1hcmtlcklkeCk7XG5cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSAwO1xuICAgICAgICAgICAgICAgIGlkID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJpMzJcIik7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDEyO1xuICAgICAgICAgICAgICAgIHR4ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XG4gICAgICAgICAgICAgICAgdHkgPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImRvdWJsZVwiKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcbiAgICAgICAgICAgICAgICB0eiA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSA4O1xuICAgICAgICAgICAgICAgIHJ4ID0gTW9kdWxlLmdldFZhbHVlKHB0ciArIG9mZnNldCwgXCJkb3VibGVcIik7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDg7XG4gICAgICAgICAgICAgICAgcnkgPSBNb2R1bGUuZ2V0VmFsdWUocHRyICsgb2Zmc2V0LCBcImRvdWJsZVwiKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gODtcbiAgICAgICAgICAgICAgICByeiA9IE1vZHVsZS5nZXRWYWx1ZShwdHIgKyBvZmZzZXQsIFwiZG91YmxlXCIpO1xuXG4gICAgICAgICAgICAgICAgbWFya2Vycy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgICAgICB0eDogdHgsXG4gICAgICAgICAgICAgICAgICAgIHR5OiB0eSxcbiAgICAgICAgICAgICAgICAgICAgdHo6IHR6LFxuICAgICAgICAgICAgICAgICAgICByeDogcngsXG4gICAgICAgICAgICAgICAgICAgIHJ5OiByeSxcbiAgICAgICAgICAgICAgICAgICAgcno6IHJ6XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBtYXJrZXJzOiBtYXJrZXJzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgQ3JlYXRlQXN5bmMoKTogUHJvbWlzZTxFeGFtcGxlTWFya2VyVHJhY2tlcj4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8RXhhbXBsZU1hcmtlclRyYWNrZXI+KChyZXNvbHZlOiAodHJhY2tlcjogRXhhbXBsZU1hcmtlclRyYWNrZXIpID0+IHZvaWQpID0+IHtcbiAgICAgICAgICAgIGxldCB0cmFja2VyID0gbmV3IEV4YW1wbGVNYXJrZXJUcmFja2VyKCk7XG4gICAgICAgICAgICB0cmFja2VyLl93b3JrZXIgPSBEZWRpY2F0ZWRXb3JrZXIuY3JlYXRlRnJvbUxvY2F0aW9uKFxuICAgICAgICAgICAgICAgIEVYQU1QTEVfTU9EVUxFX1VSTCxcbiAgICAgICAgICAgICAgICBFeGFtcGxlTWFya2VyVHJhY2tlci5vbkluaXRpYWxpemVkLFxuICAgICAgICAgICAgICAgIEV4YW1wbGVNYXJrZXJUcmFja2VyLm9uTWVzc2FnZSk7XG4gICAgICAgICAgICB0cmFja2VyLl93b3JrZXIub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICB0cmFja2VyLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRyYWNrZXIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldENhbGlicmF0aW9uQXN5bmMod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IERlZGljYXRlZFdvcmtlci51bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXI7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRhdGEuY2FsaWJyYXRlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzdWx0LmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fd29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIGNhbGlicmF0ZTogdHJ1ZSxcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBmaW5kTWFya2Vyc0luSW1hZ2VBc3luYyh2aWRlb1RleHR1cmU6IFZpZGVvVGV4dHVyZSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPGFueVtdPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YS5tYXJrZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0LmRhdGEubWFya2Vycyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzdWx0LmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3dvcmtlci5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0cmFjazogdHJ1ZSxcbiAgICAgICAgICAgIHdpZHRoOiB2aWRlb1RleHR1cmUuZ2V0U2l6ZSgpLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB2aWRlb1RleHR1cmUuZ2V0U2l6ZSgpLmhlaWdodCxcbiAgICAgICAgICAgIGltYWdlRGF0YTogYXdhaXQgdmlkZW9UZXh0dXJlLnJlYWRQaXhlbHMoKVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYXdhaXQgcHJvbWlzZTtcbiAgICB9XG59IiwiaW1wb3J0IHsgTnVsbGFibGUsIE9ic2VydmVyLCBRdWF0ZXJuaW9uLCBTY2VuZSwgU3RyaW5nRGljdGlvbmFyeSwgVmVjdG9yMywgVmlkZW9UZXh0dXJlIH0gZnJvbSBcImJhYnlsb25qc1wiO1xuXG5pbXBvcnQgeyBFeGFtcGxlTWFya2VyVHJhY2tlciB9IGZyb20gXCIuL2V4YW1wbGVNYXJrZXJUcmFja2VyXCJcbmltcG9ydCB7IEZpbHRlcmVkVmVjdG9yMyB9IGZyb20gXCIuLi9zaGFyZWQvZmlsdGVyZWRWZWN0b3IzXCJcbmltcG9ydCB7IFRyYWNrZWROb2RlIH0gZnJvbSBcIi4uL3NoYXJlZC90cmFja2VkTm9kZVwiXG5cbmV4cG9ydCBjbGFzcyBFeGFtcGxlT2JqZWN0VHJhY2tlciB7XG4gICAgcHJpdmF0ZSBfc2NlbmU6IFNjZW5lO1xuICAgIHByaXZhdGUgX3ZpZGVvVGV4dHVyZTogVmlkZW9UZXh0dXJlO1xuICAgIHByaXZhdGUgX3J1blRyYWNraW5nT2JzZXJ2ZXI6IE51bGxhYmxlPE9ic2VydmVyPFNjZW5lPj4gPSBudWxsO1xuICAgIHByaXZhdGUgX3RyYWNrZXI6IEV4YW1wbGVNYXJrZXJUcmFja2VyO1xuICAgIHByaXZhdGUgX3RyYWNrYWJsZU9iamVjdHM6IFN0cmluZ0RpY3Rpb25hcnk8VHJhY2tlZE5vZGU+ID0gbmV3IFN0cmluZ0RpY3Rpb25hcnk8VHJhY2tlZE5vZGU+KCk7XG5cbiAgICBwcml2YXRlIF9fcG9zRXN0aW1hdGU6IFZlY3RvcjMgPSBWZWN0b3IzLlplcm8oKTtcbiAgICBwcml2YXRlIF9fcG9zRXN0aW1hdGVDb3VudDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlIF9fcmlnaHRFc3RpbWF0ZTogVmVjdG9yMyA9IFZlY3RvcjMuWmVybygpO1xuICAgIHByaXZhdGUgX19yaWdodEVzdGltYXRlQ291bnQ6IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSBfX2ZvcndhcmRFc3RpbWF0ZTogVmVjdG9yMyA9IFZlY3RvcjMuWmVybygpO1xuICAgIHByaXZhdGUgX19mb3J3YXJkRXN0aW1hdGVDb3VudDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlIF9fc2NyYXRjaFZlYzogVmVjdG9yMyA9IFZlY3RvcjMuWmVybygpO1xuICAgIHByaXZhdGUgX19maWx0ZXJlZFBvczogRmlsdGVyZWRWZWN0b3IzID0gbmV3IEZpbHRlcmVkVmVjdG9yMygwLjAsIDAuMCwgMC4wKTtcbiAgICBwcml2YXRlIF9fZmlsdGVyZWRSaWdodDogRmlsdGVyZWRWZWN0b3IzID0gbmV3IEZpbHRlcmVkVmVjdG9yMygwLjAsIDAuMCwgMC4wKTtcbiAgICBwcml2YXRlIF9fZmlsdGVyZWRGb3J3YXJkOiBGaWx0ZXJlZFZlY3RvcjMgPSBuZXcgRmlsdGVyZWRWZWN0b3IzKDAuMCwgMC4wLCAwLjApO1xuICAgIHByaXZhdGUgX190YXJnZXRQb3NpdGlvbjogVmVjdG9yMyA9IFZlY3RvcjMuWmVybygpO1xuICAgIHByaXZhdGUgX190YXJnZXRSb3RhdGlvbjogUXVhdGVybmlvbiA9IFF1YXRlcm5pb24uSWRlbnRpdHkoKTtcbiAgICBwcml2YXRlIF9fdWxJZDogbnVtYmVyID0gLTE7XG4gICAgcHJpdmF0ZSBfX3VySWQ6IG51bWJlciA9IC0xO1xuICAgIHByaXZhdGUgX19sbElkOiBudW1iZXIgPSAtMTtcbiAgICBwcml2YXRlIF9fbHJJZDogbnVtYmVyID0gLTE7XG5cbiAgICBjb25zdHJ1Y3Rvcih2aWRlb1RleHR1cmU6IFZpZGVvVGV4dHVyZSwgc2NlbmU6IFNjZW5lKSB7XG4gICAgICAgIHRoaXMuX3NjZW5lID0gc2NlbmU7XG4gICAgICAgIHRoaXMuX3ZpZGVvVGV4dHVyZSA9IHZpZGVvVGV4dHVyZTtcbiAgICB9XG5cbiAgICBhZGRUcmFja2FibGVPYmplY3QodWw6IG51bWJlciwgdXI6IG51bWJlciwgbGw6IG51bWJlciwgbHI6IG51bWJlcikge1xuICAgICAgICBjb25zdCBkZXNjcmlwdG9yID0gW3VsLCB1ciwgbGwsIGxyXS50b1N0cmluZygpO1xuICAgICAgICB0aGlzLl90cmFja2FibGVPYmplY3RzLmFkZChkZXNjcmlwdG9yLCBuZXcgVHJhY2tlZE5vZGUoZGVzY3JpcHRvci50b1N0cmluZygpLCB0aGlzLl9zY2VuZSkpO1xuICAgICAgICByZXR1cm4gdGhpcy5fdHJhY2thYmxlT2JqZWN0cy5nZXQoZGVzY3JpcHRvcik7XG4gICAgfVxuXG4gICAgcHJvY2Vzc1Jlc3VsdHMocmVzdWx0czogYW55KSB7XG4gICAgICAgIC8vIFRPRE86IFRISVMgSVMgSEFDS0VEIENPREVcblxuICAgICAgICB0aGlzLl90cmFja2FibGVPYmplY3RzLmZvckVhY2goKGRlc2NyaXB0b3I6IHN0cmluZywgdHJhY2tlZE9iamVjdDogVHJhY2tlZE5vZGUpID0+IHtcbiAgICAgICAgICAgIHZhciBudW1zID0gZGVzY3JpcHRvci5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgdGhpcy5fX3VsSWQgPSBwYXJzZUludChudW1zWzBdKTtcbiAgICAgICAgICAgIHRoaXMuX191cklkID0gcGFyc2VJbnQobnVtc1sxXSk7XG4gICAgICAgICAgICB0aGlzLl9fbGxJZCA9IHBhcnNlSW50KG51bXNbMl0pO1xuICAgICAgICAgICAgdGhpcy5fX2xySWQgPSBwYXJzZUludChudW1zWzNdKTtcblxuICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZUNvdW50ID0gMC4wO1xuICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGUuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGVDb3VudCA9IDAuMDtcbiAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGUuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50ID0gMC4wO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fbGxJZF0pIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fdXJJZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xsSWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX191cklkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNjYWxlSW5QbGFjZSgwLjUpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGVDb3VudCArPSAxLjA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX2xySWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX19scklkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnN1YnRyYWN0SW5QbGFjZShyZXN1bHRzW3RoaXMuX19sbElkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQgKz0gMS4wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0c1t0aGlzLl9fdWxJZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFZlYy5hZGRJblBsYWNlKHJlc3VsdHNbdGhpcy5fX3VsSWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc3VidHJhY3RJblBsYWNlKHJlc3VsdHNbdGhpcy5fX2xsSWRdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlLmFkZEluUGxhY2UodGhpcy5fX3NjcmF0Y2hWZWMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQgKz0gMS4wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX3VySWRdKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX2xySWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX191cklkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnN1YnRyYWN0SW5QbGFjZShyZXN1bHRzW3RoaXMuX19scklkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZvcndhcmRFc3RpbWF0ZUNvdW50ICs9IDEuMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX3VsSWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNldCgwLjAsIDAuMCwgMC4wKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuYWRkSW5QbGFjZShyZXN1bHRzW3RoaXMuX191cklkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnN1YnRyYWN0SW5QbGFjZShyZXN1bHRzW3RoaXMuX191bElkXS5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGUuYWRkSW5QbGFjZSh0aGlzLl9fc2NyYXRjaFZlYyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQgKz0gMS4wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5fX2xySWRdICYmIHJlc3VsdHNbdGhpcy5fX3VsSWRdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3NjcmF0Y2hWZWMuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fbHJJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLmFkZEluUGxhY2UocmVzdWx0c1t0aGlzLl9fdWxJZF0ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHRoaXMuX19zY3JhdGNoVmVjLnNjYWxlSW5QbGFjZSgwLjUpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuX19wb3NFc3RpbWF0ZS5hZGRJblBsYWNlKHRoaXMuX19zY3JhdGNoVmVjKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fcG9zRXN0aW1hdGVDb3VudCArPSAxLjA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9fcG9zRXN0aW1hdGVDb3VudCAqIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQgKiB0aGlzLl9fZm9yd2FyZEVzdGltYXRlQ291bnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3Bvc0VzdGltYXRlLnNjYWxlSW5QbGFjZSgxLjAgLyB0aGlzLl9fcG9zRXN0aW1hdGVDb3VudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3JpZ2h0RXN0aW1hdGUuc2NhbGVJblBsYWNlKDEuMCAvIHRoaXMuX19yaWdodEVzdGltYXRlQ291bnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19mb3J3YXJkRXN0aW1hdGUuc2NhbGVJblBsYWNlKDEuMCAvIHRoaXMuX19mb3J3YXJkRXN0aW1hdGVDb3VudCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9fZmlsdGVyZWRQb3MuYWRkU2FtcGxlKHRoaXMuX19wb3NFc3RpbWF0ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkUmlnaHQuYWRkU2FtcGxlKHRoaXMuX19yaWdodEVzdGltYXRlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZmlsdGVyZWRGb3J3YXJkLmFkZFNhbXBsZSh0aGlzLl9fZm9yd2FyZEVzdGltYXRlKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRQb3NpdGlvbi5jb3B5RnJvbSh0aGlzLl9fZmlsdGVyZWRQb3MpO1xuICAgICAgICAgICAgICAgIFF1YXRlcm5pb24uUm90YXRpb25RdWF0ZXJuaW9uRnJvbUF4aXNUb1JlZihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2ZpbHRlcmVkUmlnaHQsIFxuICAgICAgICAgICAgICAgICAgICBWZWN0b3IzLkNyb3NzKHRoaXMuX19maWx0ZXJlZEZvcndhcmQsIHRoaXMuX19maWx0ZXJlZFJpZ2h0KSwgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19maWx0ZXJlZEZvcndhcmQsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbik7XG5cbiAgICAgICAgICAgICAgICB0cmFja2VkT2JqZWN0LnNldFRyYWNraW5nKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0UG9zaXRpb24sIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fdGFyZ2V0Um90YXRpb24sIFxuICAgICAgICAgICAgICAgICAgICB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyYWNrZWRPYmplY3Quc2V0VHJhY2tpbmcoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRQb3NpdGlvbiwgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbiwgXG4gICAgICAgICAgICAgICAgICAgIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2V0Q2FsaWJyYXRpb25Bc3luYyhzY2FsYXIgPSAxKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90cmFja2VyLnNldENhbGlicmF0aW9uQXN5bmMoXG4gICAgICAgICAgICBNYXRoLnJvdW5kKHNjYWxhciAqIHRoaXMuX3ZpZGVvVGV4dHVyZS5nZXRTaXplKCkud2lkdGgpLCBcbiAgICAgICAgICAgIE1hdGgucm91bmQoc2NhbGFyICogdGhpcy5fdmlkZW9UZXh0dXJlLmdldFNpemUoKS5oZWlnaHQpKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UXVhdGVybmlvbkZyb21Sb2RyaWd1ZXMoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcikge1xuICAgICAgICB2YXIgcm90ID0gbmV3IFZlY3RvcjMoLXgsIHksIC16KTtcbiAgICAgICAgdmFyIHRoZXRhID0gcm90Lmxlbmd0aCgpO1xuICAgICAgICByb3Quc2NhbGVJblBsYWNlKDEuMCAvIHRoZXRhKTtcbiAgICAgICAgaWYgKHRoZXRhICE9PSAwLjApIHtcbiAgICAgICAgICAgIHJldHVybiBRdWF0ZXJuaW9uLlJvdGF0aW9uQXhpcyhyb3QsIHRoZXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHN0YXJ0VHJhY2tpbmcoKSB7XG4gICAgICAgIHZhciBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3J1blRyYWNraW5nT2JzZXJ2ZXIgPSB0aGlzLl9zY2VuZS5vbkFmdGVyUmVuZGVyT2JzZXJ2YWJsZS5hZGQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl90cmFja2VyLmZpbmRNYXJrZXJzSW5JbWFnZUFzeW5jKHRoaXMuX3ZpZGVvVGV4dHVyZSkudGhlbihtYXJrZXJzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHRzOiBhbnkgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1ttYXJrZXIuaWRdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbmV3IFZlY3RvcjMobWFya2VyLnR4LCAtbWFya2VyLnR5LCBtYXJrZXIudHopLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogRXhhbXBsZU9iamVjdFRyYWNrZXIuZ2V0UXVhdGVybmlvbkZyb21Sb2RyaWd1ZXMobWFya2VyLnJ4LCBtYXJrZXIucnksIG1hcmtlci5yeilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmVzdWx0cyhyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RvcFRyYWNraW5nKCkge1xuICAgICAgICB0aGlzLl9zY2VuZS5vbkFmdGVyUmVuZGVyT2JzZXJ2YWJsZS5yZW1vdmUodGhpcy5fcnVuVHJhY2tpbmdPYnNlcnZlcik7XG4gICAgICAgIHRoaXMuX3J1blRyYWNraW5nT2JzZXJ2ZXIgPSBudWxsO1xuICAgIH1cblxuICAgIHN0YXRpYyBDcmVhdGVBc3luYyh2aWRlb1RleHR1cmU6IFZpZGVvVGV4dHVyZSwgc2NlbmU6IFNjZW5lKSB7XG4gICAgICAgIHZhciBvYmplY3RUcmFja2VyID0gbmV3IEV4YW1wbGVPYmplY3RUcmFja2VyKHZpZGVvVGV4dHVyZSwgc2NlbmUpO1xuICAgICAgICByZXR1cm4gRXhhbXBsZU1hcmtlclRyYWNrZXIuQ3JlYXRlQXN5bmMoKS50aGVuKHRyYWNrZXIgPT4ge1xuICAgICAgICAgICAgb2JqZWN0VHJhY2tlci5fdHJhY2tlciA9IHRyYWNrZXI7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0VHJhY2tlci5zZXRDYWxpYnJhdGlvbkFzeW5jKCk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRyYWNrZXI7XG4gICAgICAgIH0pO1xuICAgIH1cbn0iLCJjb25zdCBDRE5fVVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vYXIuYmFieWxvbmpzLmNvbS9cIjtcclxuY29uc3QgQ0ROX1dBU01fTU9EVUxFU19VUkw6IHN0cmluZyA9IENETl9VUkwgKyBcIndhc20vXCI7XHJcblxyXG5leHBvcnQgY29uc3QgRVhBTVBMRV9NT0RVTEVfVVJMOiBzdHJpbmcgPSBDRE5fV0FTTV9NT0RVTEVTX1VSTCArIFwid2VicGlsZWQtYXJ1Y28tYXIuanNcIjtcclxuZXhwb3J0IGNvbnN0IEFSVUNPX01FVEFfTUFSS0VSX1RSQUNLRVJfVVJMOiBzdHJpbmcgPSBDRE5fV0FTTV9NT0RVTEVTX1VSTCArIFwiYXJ1Y28tbWV0YS1tYXJrZXItdHJhY2tlci5qc1wiO1xyXG5leHBvcnQgY29uc3QgSU1BR0VfVEVNUExBVEVfVFJBQ0tFUl9VUkw6IHN0cmluZyA9IENETl9XQVNNX01PRFVMRVNfVVJMICsgXCJpbWFnZS10ZW1wbGF0ZS10cmFja2VyLmpzXCI7XHJcbiIsImV4cG9ydCBjbGFzcyBEZWRpY2F0ZWRXb3JrZXIge1xuXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlRnJvbVNvdXJjZXMoLi4uc291cmNlczogYW55W10pOiBXb3JrZXIge1xuICAgICAgICBsZXQgd29ya2VyQ29kZTogc3RyaW5nID0gXCJcIjtcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgc291cmNlcy5sZW5ndGggLSAxOyBpZHgrKykge1xuICAgICAgICAgICAgd29ya2VyQ29kZSArPSBzb3VyY2VzW2lkeF0udG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICB3b3JrZXJDb2RlICs9IFwiKFwiICsgc291cmNlc1tzb3VyY2VzLmxlbmd0aCAtIDFdLnRvU3RyaW5nKCkgKyBcIikoKTtcIjtcbiAgICAgICAgcmV0dXJuIG5ldyBXb3JrZXIod2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW3dvcmtlckNvZGVdKSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlRnJvbUxvY2F0aW9uKGpzVXJsOiBzdHJpbmcsIG9uSW5pdGlhbGl6ZWQ6ICgpID0+IHZvaWQsIG9uTWVzc2FnZTogKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHZvaWQpOiBXb3JrZXIge1xuICAgICAgICBsZXQgbW9kdWxlRGVmaXRpb246IHN0cmluZyA9IGBNb2R1bGUgPSB7XG4gICAgICAgICAgICBsb2NhdGVGaWxlOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcXFwiYCArIGpzVXJsLnJlcGxhY2UoLy5qcyQvLCBcIi53YXNtXCIpICsgYFxcXCI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25SdW50aW1lSW5pdGlhbGl6ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAoYCArIG9uSW5pdGlhbGl6ZWQudG9TdHJpbmcoKSArIGApKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07YDtcbiAgICAgICAgbGV0IG1lc3NhZ2VIYW5kbGVyOiBzdHJpbmcgPSBcInRoaXMub25tZXNzYWdlID0gXCIgKyBvbk1lc3NhZ2UudG9TdHJpbmcoKSArIFwiO1wiO1xuICAgICAgICBsZXQgaW1wb3J0SmF2YXNjcmlwdDogc3RyaW5nID0gXCJmdW5jdGlvbiBpbXBvcnRKYXZhc2NyaXB0KCkgeyBpbXBvcnRTY3JpcHRzKFxcXCJcIiArIGpzVXJsICsgXCJcXFwiKTsgfVwiO1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGcm9tU291cmNlcyhtb2R1bGVEZWZpdGlvbiwgbWVzc2FnZUhhbmRsZXIsIGltcG9ydEphdmFzY3JpcHQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgdW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyKGV2ZW50OiBNZXNzYWdlRXZlbnQpOiB2b2lkIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJVbmV4cGVjdGVkIG1lc3NhZ2UgZnJvbSBXZWJXb3JrZXI6IFwiICsgZXZlbnQpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSBcImJhYnlsb25qc1wiXG5cbmV4cG9ydCBjbGFzcyBGaWx0ZXJlZFZlY3RvcjMgZXh0ZW5kcyBWZWN0b3IzIHtcbiAgICBwcml2YXRlIF9pZHg6IG51bWJlcjtcbiAgICBwcml2YXRlIF9zYW1wbGVzOiBWZWN0b3IzW107XG4gICAgcHJpdmF0ZSBfc2FtcGxlU3F1YXJlZERpc3RhbmNlczogbnVtYmVyW107XG4gICAgcHJpdmF0ZSBfc2FtcGxlQXZlcmFnZTogVmVjdG9yMztcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCBzYW1wbGVDb3VudDogbnVtYmVyID0gMSkge1xuICAgICAgICBzdXBlcih4LCB5LCB6KTtcblxuICAgICAgICB0aGlzLl9pZHggPSAwO1xuICAgICAgICB0aGlzLl9zYW1wbGVzID0gW107XG4gICAgICAgIHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgc2FtcGxlQ291bnQ7ICsraWR4KSB7XG4gICAgICAgICAgICB0aGlzLl9zYW1wbGVzLnB1c2gobmV3IFZlY3RvcjMoeCwgeSwgeikpO1xuICAgICAgICAgICAgdGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlcy5wdXNoKDAuMCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlID0gbmV3IFZlY3RvcjMoeCwgeSwgeik7XG4gICAgfVxuXG4gICAgcHVibGljIGFkZFNhbXBsZShzYW1wbGU6IFZlY3RvcjMpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fc2FtcGxlQXZlcmFnZS5zY2FsZUluUGxhY2UodGhpcy5fc2FtcGxlcy5sZW5ndGgpO1xuICAgICAgICB0aGlzLl9zYW1wbGVBdmVyYWdlLnN1YnRyYWN0SW5QbGFjZSh0aGlzLl9zYW1wbGVzW3RoaXMuX2lkeF0pO1xuICAgICAgICB0aGlzLl9zYW1wbGVzW3RoaXMuX2lkeF0uY29weUZyb20oc2FtcGxlKTtcbiAgICAgICAgdGhpcy5fc2FtcGxlQXZlcmFnZS5hZGRJblBsYWNlKHRoaXMuX3NhbXBsZXNbdGhpcy5faWR4XSk7XG4gICAgICAgIHRoaXMuX3NhbXBsZUF2ZXJhZ2Uuc2NhbGVJblBsYWNlKDEuMCAvIHRoaXMuX3NhbXBsZXMubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5faWR4ID0gKHRoaXMuX2lkeCArIDEpICUgdGhpcy5fc2FtcGxlcy5sZW5ndGg7XG5cbiAgICAgICAgbGV0IGF2Z1NxdWFyZWREaXN0YW5jZSA9IDAuMDtcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdGhpcy5fc2FtcGxlcy5sZW5ndGg7ICsraWR4KSB7XG4gICAgICAgICAgICB0aGlzLl9zYW1wbGVTcXVhcmVkRGlzdGFuY2VzW2lkeF0gPSBWZWN0b3IzLkRpc3RhbmNlU3F1YXJlZCh0aGlzLl9zYW1wbGVBdmVyYWdlLCB0aGlzLl9zYW1wbGVzW2lkeF0pO1xuICAgICAgICAgICAgYXZnU3F1YXJlZERpc3RhbmNlICs9IHRoaXMuX3NhbXBsZVNxdWFyZWREaXN0YW5jZXNbaWR4XTtcbiAgICAgICAgfVxuICAgICAgICBhdmdTcXVhcmVkRGlzdGFuY2UgLz0gdGhpcy5fc2FtcGxlcy5sZW5ndGg7XG5cbiAgICAgICAgbGV0IG51bUluY2x1ZGVkU2FtcGxlcyA9IDA7XG4gICAgICAgIHRoaXMuc2V0KDAuMCwgMC4wLCAwLjApO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPD0gdGhpcy5fc2FtcGxlcy5sZW5ndGg7ICsraWR4KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2FtcGxlU3F1YXJlZERpc3RhbmNlc1tpZHhdIDw9IGF2Z1NxdWFyZWREaXN0YW5jZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkSW5QbGFjZSh0aGlzLl9zYW1wbGVzW2lkeF0pO1xuICAgICAgICAgICAgICAgIG51bUluY2x1ZGVkU2FtcGxlcyArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2NhbGVJblBsYWNlKDEuMCAvIG51bUluY2x1ZGVkU2FtcGxlcyk7XG4gICAgfVxufSIsImltcG9ydCB7IE9ic2VydmFibGUsIFF1YXRlcm5pb24sIFNjZW5lLCBUcmFuc2Zvcm1Ob2RlLCBWZWN0b3IzIH0gZnJvbSBcImJhYnlsb25qc1wiXHJcblxyXG5leHBvcnQgY2xhc3MgVHJhY2tlZE5vZGUgZXh0ZW5kcyBUcmFuc2Zvcm1Ob2RlIHtcclxuICAgIHByaXZhdGUgX2lzVHJhY2tpbmc6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9ub3RUcmFja2VkRnJhbWVzQ291bnQ6IG51bWJlcjsgLy8gVE9ETzogUmVtb3ZlIHRoaXMgZmVhdHVyZSwgd2hpY2ggb25seSBleGlzdHMgYXMgYSBzdG9wZ2FwLlxyXG5cclxuICAgIHB1YmxpYyBvblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFRyYWNrZWROb2RlPjtcclxuICAgIHB1YmxpYyBvblRyYWNraW5nTG9zdE9ic2VydmFibGU6IE9ic2VydmFibGU8VHJhY2tlZE5vZGU+O1xyXG4gICAgcHVibGljIGRpc2FibGVXaGVuTm90VHJhY2tlZDogYm9vbGVhbjtcclxuXHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBzY2VuZT86IFNjZW5lIHwgbnVsbCB8IHVuZGVmaW5lZCwgZGlzYWJsZVdoZW5Ob3RUcmFja2VkOiBib29sZWFuID0gdHJ1ZSkge1xyXG4gICAgICAgIHN1cGVyKG5hbWUsIHNjZW5lLCB0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5faXNUcmFja2luZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZVdoZW5Ob3RUcmFja2VkID0gZGlzYWJsZVdoZW5Ob3RUcmFja2VkO1xyXG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVXaGVuTm90VHJhY2tlZCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEVuYWJsZWQoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50ID0gMTA7XHJcblxyXG4gICAgICAgIHRoaXMub25UcmFja2luZ0FjcXVpcmVkT2JzZXJ2YWJsZSA9IG5ldyBPYnNlcnZhYmxlKG9ic2VydmVyID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2lzVHJhY2tpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub25UcmFja2luZ0FjcXVpcmVkT2JzZXJ2YWJsZS5ub3RpZnlPYnNlcnZlcihvYnNlcnZlciwgdGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLm9uVHJhY2tpbmdMb3N0T2JzZXJ2YWJsZSA9IG5ldyBPYnNlcnZhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMucm90YXRpb25RdWF0ZXJuaW9uID0gUXVhdGVybmlvbi5JZGVudGl0eSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpc1RyYWNraW5nKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pc1RyYWNraW5nO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRUcmFja2luZyhwb3NpdGlvbjogVmVjdG9yMywgcm90YXRpb246IFF1YXRlcm5pb24sIGlzVHJhY2tpbmc6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnBvc2l0aW9uLmNvcHlGcm9tKHBvc2l0aW9uKTtcclxuICAgICAgICB0aGlzLnJvdGF0aW9uUXVhdGVybmlvbiA/IHRoaXMucm90YXRpb25RdWF0ZXJuaW9uLmNvcHlGcm9tKHJvdGF0aW9uKSA6IHRoaXMucm90YXRpb25RdWF0ZXJuaW9uID0gcm90YXRpb24uY2xvbmUoKTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogUmVtb3ZlIHRoaXMgZmVhdHVyZSwgd2hpY2ggb25seSBleGlzdHMgYXMgYSBzdG9wZ2FwLlxyXG4gICAgICAgIGlmIChpc1RyYWNraW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX25vdFRyYWNrZWRGcmFtZXNDb3VudCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9ub3RUcmFja2VkRnJhbWVzQ291bnQgKz0gMTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX25vdFRyYWNrZWRGcmFtZXNDb3VudCA8IDUpIHtcclxuICAgICAgICAgICAgICAgIGlzVHJhY2tpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX2lzVHJhY2tpbmcgJiYgaXNUcmFja2luZykge1xyXG4gICAgICAgICAgICB0aGlzLm9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGUubm90aWZ5T2JzZXJ2ZXJzKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLl9pc1RyYWNraW5nICYmICFpc1RyYWNraW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25UcmFja2luZ0xvc3RPYnNlcnZhYmxlLm5vdGlmeU9ic2VydmVycyh0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5faXNUcmFja2luZyA9IGlzVHJhY2tpbmc7XHJcbiAgICAgICAgdGhpcy5zZXRFbmFibGVkKCF0aGlzLmRpc2FibGVXaGVuTm90VHJhY2tlZCB8fCB0aGlzLl9pc1RyYWNraW5nKTtcclxuICAgIH1cclxufVxyXG5cclxuIl19
