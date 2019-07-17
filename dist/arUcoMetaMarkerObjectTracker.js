(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BabylonAR = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var babylonjs_1 = (typeof window !== "undefined" ? window['BABYLON'] : typeof global !== "undefined" ? global['BABYLON'] : null);
var arUcoMetaMarkerTracker_1 = require("./arUcoMetaMarkerTracker");
var trackedNode_1 = require("../shared/trackedNode");
var ArUcoMetaMarkerObjectTracker = /** @class */ (function () {
    function ArUcoMetaMarkerObjectTracker(scene) {
        this._runTrackingObserver = null;
        this._scene = scene;
    }
    ArUcoMetaMarkerObjectTracker.prototype.addTrackableObjectAsync = function (upperLeftId, upperRightId, lowerLeftId, lowerRightId, widthInMarkerSides) {
        return __awaiter(this, void 0, void 0, function () {
            var marker, node;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._tracker.addMarker(upperLeftId, upperRightId, lowerLeftId, lowerRightId, widthInMarkerSides)];
                    case 1:
                        marker = _a.sent();
                        node = new trackedNode_1.TrackedNode(upperLeftId + " " + upperRightId + " " + lowerLeftId + " " + lowerRightId, this._scene, true);
                        node.rotationQuaternion = babylonjs_1.Quaternion.Identity();
                        this._trackedNodes[marker.id] = node;
                        return [2 /*return*/, node];
                }
            });
        });
    };
    ArUcoMetaMarkerObjectTracker.prototype.setCalibrationAsync = function (videoTexture, scalar) {
        if (scalar === void 0) { scalar = 1; }
        return this._tracker.setCalibrationAsync(Math.round(scalar * videoTexture.getSize().width), Math.round(scalar * videoTexture.getSize().height));
    };
    ArUcoMetaMarkerObjectTracker.prototype.startTracking = function () {
        var _this = this;
        var running = false;
        this._runTrackingObserver = this._scene.onAfterRenderObservable.add(function () {
            if (!running) {
                running = true;
                _this._tracker.updateAsync().then(function () {
                    for (var id in _this._trackedNodes) {
                        var marker = _this._tracker.markers[id];
                        var node = _this._trackedNodes[id];
                        node.position.copyFrom(marker.position);
                        node.rotationQuaternion.copyFrom(marker.rotation);
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
        return __awaiter(this, void 0, void 0, function () {
            var objectTracker, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        objectTracker = new ArUcoMetaMarkerObjectTracker(scene);
                        _a = objectTracker;
                        return [4 /*yield*/, arUcoMetaMarkerTracker_1.ArUcoMetaMarkerTracker.createAsync(videoTexture)];
                    case 1:
                        _a._tracker = _b.sent();
                        return [4 /*yield*/, objectTracker.setCalibrationAsync(videoTexture)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, objectTracker];
                }
            });
        });
    };
    return ArUcoMetaMarkerObjectTracker;
}());
exports.ArUcoMetaMarkerObjectTracker = ArUcoMetaMarkerObjectTracker;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../shared/trackedNode":5,"./arUcoMetaMarkerTracker":2}],2:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = (typeof window !== "undefined" ? window['BABYLON'] : typeof global !== "undefined" ? global['BABYLON'] : null);
var dedicatedWorker_1 = require("../shared/dedicatedWorker");
var constants_1 = require("../shared/constants");
var ArUcoMetaMarker = /** @class */ (function () {
    function ArUcoMetaMarker(id) {
        this.id = id;
        this.confidence = 0.0;
        this.position = babylonjs_1.Vector3.Zero();
        this.rotation = babylonjs_1.Quaternion.Identity();
    }
    return ArUcoMetaMarker;
}());
exports.ArUcoMetaMarker = ArUcoMetaMarker;
var ArUcoMetaMarkerTracker = /** @class */ (function () {
    function ArUcoMetaMarkerTracker(videoTexture) {
        this._videoTexture = videoTexture;
    }
    ArUcoMetaMarkerTracker.onInitialized = function () {
        Module._reset();
        postMessage({ initialized: true });
    };
    ArUcoMetaMarkerTracker.onMessage = function (event) {
        var args = event.data;
        if (args.reset) {
            Module._reset();
            postMessage({ reset: true });
        }
        else if (args.calibrate) {
            Module._set_calibration_from_frame_size(args.width, args.height);
            postMessage({ calibrated: true });
        }
        else if (args.addMarker) {
            var id = Module._add_marker(args.ul, args.ur, args.ll, args.lr, args.width);
            postMessage({ added: true, id: id });
        }
        else if (args.track) {
            // Initialize the image data buffer.
            var buf = Module._malloc(args.imageData.length * args.imageData.BYTES_PER_ELEMENT);
            Module.HEAP8.set(args.imageData, buf);
            // Register the callback handler.
            var markers_1 = [];
            Module._update_marker_tracking = function (id, confidence, px, py, pz, rx, ry, rz, rw) {
                markers_1.concat([id, confidence, px, py, pz, rx, ry, rz, rw]);
            };
            // Process the image.
            Module._process_image(args.width, args.height, buf);
            // Clean up.
            Module._update_marker_tracking = function () { };
            Module._free(buf);
            // Post results back to the main thread.
            postMessage({
                markers: markers_1
            });
        }
    };
    ArUcoMetaMarkerTracker.createAsync = function (videoTexture) {
        return new Promise(function (resolve) {
            var tracker = new ArUcoMetaMarkerTracker(videoTexture);
            tracker._worker = dedicatedWorker_1.DedicatedWorker.createFromLocation(constants_1.ARUCO_META_MARKER_TRACKER_URL, ArUcoMetaMarkerTracker.onInitialized, ArUcoMetaMarkerTracker.onMessage);
            tracker._worker.onmessage = function (event) {
                tracker._worker.onmessage = dedicatedWorker_1.DedicatedWorker.unexpectedMessageHandler;
                resolve(tracker);
            };
        });
    };
    ArUcoMetaMarkerTracker.prototype.setCalibrationAsync = function (width, height) {
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
    ArUcoMetaMarkerTracker.prototype.addMarker = function (upperLeftId, upperRightId, lowerLeftId, lowerRightId, metaMarkerWidth) {
        var _this = this;
        var promise = new Promise(function (resolve, reject) {
            _this._worker.onmessage = function (result) {
                _this._worker.onmessage = dedicatedWorker_1.DedicatedWorker.unexpectedMessageHandler;
                if (result.data.added) {
                    var id = result.data.id;
                    _this.markers[id] = new ArUcoMetaMarker(id);
                    resolve(_this.markers[id]);
                }
                else {
                    reject(result.data);
                }
            };
        });
        this._worker.postMessage({
            addMarker: true,
            ul: upperLeftId,
            ur: upperRightId,
            ll: lowerLeftId,
            lr: lowerRightId,
            width: metaMarkerWidth
        });
        return promise;
    };
    ArUcoMetaMarkerTracker.prototype.updateAsync = function () {
        var _this = this;
        var promise = new Promise(function (resolve, reject) {
            _this._worker.onmessage = function (result) {
                _this._worker.onmessage = dedicatedWorker_1.DedicatedWorker.unexpectedMessageHandler;
                if (result.data.markers) {
                    var markers = result.data.markers;
                    for (var idx = 0; idx < markers.length; idx += 9) {
                        var marker = _this.markers[markers[idx]];
                        marker.confidence = markers[idx + 1];
                        marker.position.set(markers[idx + 2], markers[idx + 3], markers[idx + 4]);
                        marker.rotation.set(markers[idx + 5], markers[idx + 6], markers[idx + 7], markers[idx + 8]);
                    }
                    resolve();
                }
                else {
                    reject(result.data);
                }
            };
        });
        this._worker.postMessage({
            track: true,
            width: this._videoTexture.getSize().width,
            height: this._videoTexture.getSize().height,
            imageData: this._videoTexture.readPixels()
        });
        return promise;
    };
    return ArUcoMetaMarkerTracker;
}());
exports.ArUcoMetaMarkerTracker = ArUcoMetaMarkerTracker;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../shared/constants":3,"../shared/dedicatedWorker":4}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//const CDN_URL: string = "https://ar.babylonjs.com/";
var CDN_URL = "http://localhost:8080/";
var CDN_WASM_MODULES_URL = CDN_URL + "wasm/";
exports.EXAMPLE_MODULE_URL = CDN_WASM_MODULES_URL + "webpiled-aruco-ar.js";
exports.ARUCO_META_MARKER_TRACKER_URL = CDN_WASM_MODULES_URL + "aruco-meta-marker-tracker.js";

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvYXJVY29NZXRhTWFya2VyT2JqZWN0VHJhY2tlci9hclVjb01ldGFNYXJrZXJPYmplY3RUcmFja2VyLnRzIiwic3JjL3RzL2FyVWNvTWV0YU1hcmtlck9iamVjdFRyYWNrZXIvYXJVY29NZXRhTWFya2VyVHJhY2tlci50cyIsInNyYy90cy9zaGFyZWQvY29uc3RhbnRzLnRzIiwic3JjL3RzL3NoYXJlZC9kZWRpY2F0ZWRXb3JrZXIudHMiLCJzcmMvdHMvc2hhcmVkL3RyYWNrZWROb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQSx1Q0FBa0g7QUFFbEgsbUVBQWlFO0FBQ2pFLHFEQUFtRDtBQUVuRDtJQU1JLHNDQUFtQixLQUFZO1FBSnZCLHlCQUFvQixHQUE4QixJQUFJLENBQUM7UUFLM0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDeEIsQ0FBQztJQUVZLDhEQUF1QixHQUFwQyxVQUFxQyxXQUFtQixFQUFFLFlBQW9CLEVBQUUsV0FBbUIsRUFBRSxZQUFvQixFQUFFLGtCQUEwQjs7Ozs7NEJBQ2xJLHFCQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxFQUFBOzt3QkFBaEgsTUFBTSxHQUFHLFNBQXVHO3dCQUVoSCxJQUFJLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFdBQVcsR0FBRyxHQUFHLEdBQUcsWUFBWSxHQUFHLEdBQUcsR0FBRyxXQUFXLEdBQUcsR0FBRyxHQUFHLFlBQVksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUMzSCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsc0JBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFFaEQs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QUNMLGtCQUFDO0FBQUQsQ0F6REEsQUF5REMsQ0F6RGdDLHlCQUFhLEdBeUQ3QztBQXpEWSxrQ0FBVyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCB7IE51bGxhYmxlLCBPYnNlcnZlciwgUXVhdGVybmlvbiwgU2NlbmUsIFN0cmluZ0RpY3Rpb25hcnksIFZlY3RvcjMsIFZpZGVvVGV4dHVyZSwgVG9vbHMgfSBmcm9tIFwiYmFieWxvbmpzXCI7XHJcblxyXG5pbXBvcnQgeyBBclVjb01ldGFNYXJrZXJUcmFja2VyIH0gZnJvbSBcIi4vYXJVY29NZXRhTWFya2VyVHJhY2tlclwiXHJcbmltcG9ydCB7IFRyYWNrZWROb2RlIH0gZnJvbSBcIi4uL3NoYXJlZC90cmFja2VkTm9kZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgQXJVY29NZXRhTWFya2VyT2JqZWN0VHJhY2tlciB7XHJcbiAgICBwcml2YXRlIF9zY2VuZTogU2NlbmU7XHJcbiAgICBwcml2YXRlIF9ydW5UcmFja2luZ09ic2VydmVyOiBOdWxsYWJsZTxPYnNlcnZlcjxTY2VuZT4+ID0gbnVsbDtcclxuICAgIHByaXZhdGUgX3RyYWNrZXI6IEFyVWNvTWV0YU1hcmtlclRyYWNrZXI7XHJcbiAgICBwcml2YXRlIF90cmFja2VkTm9kZXM6IHsgW2lkOiBudW1iZXJdOiBUcmFja2VkTm9kZSB9O1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihzY2VuZTogU2NlbmUpIHtcclxuICAgICAgICB0aGlzLl9zY2VuZSA9IHNjZW5lO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhc3luYyBhZGRUcmFja2FibGVPYmplY3RBc3luYyh1cHBlckxlZnRJZDogbnVtYmVyLCB1cHBlclJpZ2h0SWQ6IG51bWJlciwgbG93ZXJMZWZ0SWQ6IG51bWJlciwgbG93ZXJSaWdodElkOiBudW1iZXIsIHdpZHRoSW5NYXJrZXJTaWRlczogbnVtYmVyKTogUHJvbWlzZTxUcmFja2VkTm9kZT4ge1xyXG4gICAgICAgIGNvbnN0IG1hcmtlciA9IGF3YWl0IHRoaXMuX3RyYWNrZXIuYWRkTWFya2VyKHVwcGVyTGVmdElkLCB1cHBlclJpZ2h0SWQsIGxvd2VyTGVmdElkLCBsb3dlclJpZ2h0SWQsIHdpZHRoSW5NYXJrZXJTaWRlcyk7XHJcblxyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgVHJhY2tlZE5vZGUodXBwZXJMZWZ0SWQgKyBcIiBcIiArIHVwcGVyUmlnaHRJZCArIFwiIFwiICsgbG93ZXJMZWZ0SWQgKyBcIiBcIiArIGxvd2VyUmlnaHRJZCwgdGhpcy5fc2NlbmUsIHRydWUpO1xyXG4gICAgICAgIG5vZGUucm90YXRpb25RdWF0ZXJuaW9uID0gUXVhdGVybmlvbi5JZGVudGl0eSgpO1xyXG5cclxuICAgICAgICB0aGlzLl90cmFja2VkTm9kZXNbbWFya2VyLmlkXSA9IG5vZGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldENhbGlicmF0aW9uQXN5bmModmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmUsIHNjYWxhciA9IDEpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdHJhY2tlci5zZXRDYWxpYnJhdGlvbkFzeW5jKFxyXG4gICAgICAgICAgICBNYXRoLnJvdW5kKHNjYWxhciAqIHZpZGVvVGV4dHVyZS5nZXRTaXplKCkud2lkdGgpLCBcclxuICAgICAgICAgICAgTWF0aC5yb3VuZChzY2FsYXIgKiB2aWRlb1RleHR1cmUuZ2V0U2l6ZSgpLmhlaWdodCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGFydFRyYWNraW5nKCk6IHZvaWQge1xyXG4gICAgICAgIGxldCBydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fcnVuVHJhY2tpbmdPYnNlcnZlciA9IHRoaXMuX3NjZW5lLm9uQWZ0ZXJSZW5kZXJPYnNlcnZhYmxlLmFkZCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcnVubmluZykge1xyXG4gICAgICAgICAgICAgICAgcnVubmluZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fdHJhY2tlci51cGRhdGVBc3luYygpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGlkIGluIHRoaXMuX3RyYWNrZWROb2Rlcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXJrZXIgPSB0aGlzLl90cmFja2VyLm1hcmtlcnNbaWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fdHJhY2tlZE5vZGVzW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5wb3NpdGlvbi5jb3B5RnJvbShtYXJrZXIucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJvdGF0aW9uUXVhdGVybmlvbi5jb3B5RnJvbShtYXJrZXIucm90YXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdG9wVHJhY2tpbmcoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fc2NlbmUub25BZnRlclJlbmRlck9ic2VydmFibGUucmVtb3ZlKHRoaXMuX3J1blRyYWNraW5nT2JzZXJ2ZXIpO1xyXG4gICAgICAgIHRoaXMuX3J1blRyYWNraW5nT2JzZXJ2ZXIgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgY3JlYXRlQXN5bmModmlkZW9UZXh0dXJlOiBWaWRlb1RleHR1cmUsIHNjZW5lOiBTY2VuZSk6IFByb21pc2U8QXJVY29NZXRhTWFya2VyT2JqZWN0VHJhY2tlcj4ge1xyXG4gICAgICAgIGxldCBvYmplY3RUcmFja2VyID0gbmV3IEFyVWNvTWV0YU1hcmtlck9iamVjdFRyYWNrZXIoc2NlbmUpO1xyXG4gICAgICAgIG9iamVjdFRyYWNrZXIuX3RyYWNrZXIgPSBhd2FpdCBBclVjb01ldGFNYXJrZXJUcmFja2VyLmNyZWF0ZUFzeW5jKHZpZGVvVGV4dHVyZSk7XHJcbiAgICAgICAgYXdhaXQgb2JqZWN0VHJhY2tlci5zZXRDYWxpYnJhdGlvbkFzeW5jKHZpZGVvVGV4dHVyZSk7XHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFRyYWNrZXI7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBRdWF0ZXJuaW9uLCBWZWN0b3IzLCBWaWRlb1RleHR1cmUgfSBmcm9tIFwiYmFieWxvbmpzXCJcclxuXHJcbmltcG9ydCB7IERlZGljYXRlZFdvcmtlciB9IGZyb20gXCIuLi9zaGFyZWQvZGVkaWNhdGVkV29ya2VyXCJcclxuaW1wb3J0IHsgQVJVQ09fTUVUQV9NQVJLRVJfVFJBQ0tFUl9VUkwgfSBmcm9tIFwiLi4vc2hhcmVkL2NvbnN0YW50c1wiXHJcblxyXG5kZWNsYXJlIHZhciBNb2R1bGU6IGFueTtcclxuZGVjbGFyZSBmdW5jdGlvbiBwb3N0TWVzc2FnZShkYXRhOiBhbnkpOiB2b2lkO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFyVWNvTWV0YU1hcmtlciB7XHJcbiAgICBwdWJsaWMgaWQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyBjb25maWRlbmNlOiBudW1iZXI7XHJcbiAgICBwdWJsaWMgcG9zaXRpb246IFZlY3RvcjM7XHJcbiAgICBwdWJsaWMgcm90YXRpb246IFF1YXRlcm5pb247XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKGlkOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICAgICAgdGhpcy5jb25maWRlbmNlID0gMC4wO1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBWZWN0b3IzLlplcm8oKTtcclxuICAgICAgICB0aGlzLnJvdGF0aW9uID0gUXVhdGVybmlvbi5JZGVudGl0eSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQXJVY29NZXRhTWFya2VyVHJhY2tlciB7XHJcbiAgICBwcml2YXRlIF93b3JrZXI6IFdvcmtlcjtcclxuICAgIHByaXZhdGUgX3ZpZGVvVGV4dHVyZTogVmlkZW9UZXh0dXJlO1xyXG5cclxuICAgIHB1YmxpYyBtYXJrZXJzOiB7IFtpZDogbnVtYmVyXTogQXJVY29NZXRhTWFya2VyIH07XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcih2aWRlb1RleHR1cmU6IFZpZGVvVGV4dHVyZSkge1xyXG4gICAgICAgIHRoaXMuX3ZpZGVvVGV4dHVyZSA9IHZpZGVvVGV4dHVyZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBvbkluaXRpYWxpemVkKCkge1xyXG4gICAgICAgIE1vZHVsZS5fcmVzZXQoKTtcclxuICAgICAgICBwb3N0TWVzc2FnZSh7IGluaXRpYWxpemVkOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIG9uTWVzc2FnZShldmVudDogTWVzc2FnZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgYXJncyA9IGV2ZW50LmRhdGE7XHJcblxyXG4gICAgICAgIGlmIChhcmdzLnJlc2V0KSB7XHJcbiAgICAgICAgICAgIE1vZHVsZS5fcmVzZXQoKTtcclxuICAgICAgICAgICAgcG9zdE1lc3NhZ2UoeyByZXNldDogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoYXJncy5jYWxpYnJhdGUpIHtcclxuICAgICAgICAgICAgTW9kdWxlLl9zZXRfY2FsaWJyYXRpb25fZnJvbV9mcmFtZV9zaXplKGFyZ3Mud2lkdGgsIGFyZ3MuaGVpZ2h0KTtcclxuICAgICAgICAgICAgcG9zdE1lc3NhZ2UoeyBjYWxpYnJhdGVkOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChhcmdzLmFkZE1hcmtlcikge1xyXG4gICAgICAgICAgICBjb25zdCBpZCA9IE1vZHVsZS5fYWRkX21hcmtlcihhcmdzLnVsLCBhcmdzLnVyLCBhcmdzLmxsLCBhcmdzLmxyLCBhcmdzLndpZHRoKTtcclxuICAgICAgICAgICAgcG9zdE1lc3NhZ2UoeyBhZGRlZDogdHJ1ZSwgaWQ6IGlkIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChhcmdzLnRyYWNrKSB7XHJcbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIGltYWdlIGRhdGEgYnVmZmVyLlxyXG4gICAgICAgICAgICBsZXQgYnVmID0gTW9kdWxlLl9tYWxsb2MoYXJncy5pbWFnZURhdGEubGVuZ3RoICogYXJncy5pbWFnZURhdGEuQllURVNfUEVSX0VMRU1FTlQpO1xyXG4gICAgICAgICAgICBNb2R1bGUuSEVBUDguc2V0KGFyZ3MuaW1hZ2VEYXRhLCBidWYpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVnaXN0ZXIgdGhlIGNhbGxiYWNrIGhhbmRsZXIuXHJcbiAgICAgICAgICAgIGxldCBtYXJrZXJzOiBudW1iZXJbXSA9IFtdO1xyXG4gICAgICAgICAgICBNb2R1bGUuX3VwZGF0ZV9tYXJrZXJfdHJhY2tpbmcgPSAoXHJcbiAgICAgICAgICAgICAgICBpZDogbnVtYmVyLCBcclxuICAgICAgICAgICAgICAgIGNvbmZpZGVuY2U6IG51bWJlciwgXHJcbiAgICAgICAgICAgICAgICBweDogbnVtYmVyLCBcclxuICAgICAgICAgICAgICAgIHB5OiBudW1iZXIsIFxyXG4gICAgICAgICAgICAgICAgcHo6IG51bWJlciwgXHJcbiAgICAgICAgICAgICAgICByeDogbnVtYmVyLCBcclxuICAgICAgICAgICAgICAgIHJ5OiBudW1iZXIsIFxyXG4gICAgICAgICAgICAgICAgcno6IG51bWJlciwgXHJcbiAgICAgICAgICAgICAgICBydzogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIG1hcmtlcnMuY29uY2F0KFsgaWQsIGNvbmZpZGVuY2UsIHB4LCBweSwgcHosIHJ4LCByeSwgcnosIHJ3IF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBQcm9jZXNzIHRoZSBpbWFnZS5cclxuICAgICAgICAgICAgTW9kdWxlLl9wcm9jZXNzX2ltYWdlKGFyZ3Mud2lkdGgsIGFyZ3MuaGVpZ2h0LCBidWYpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2xlYW4gdXAuXHJcbiAgICAgICAgICAgIE1vZHVsZS5fdXBkYXRlX21hcmtlcl90cmFja2luZyA9ICgpID0+IHt9O1xyXG4gICAgICAgICAgICBNb2R1bGUuX2ZyZWUoYnVmKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFBvc3QgcmVzdWx0cyBiYWNrIHRvIHRoZSBtYWluIHRocmVhZC5cclxuICAgICAgICAgICAgcG9zdE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICAgICAgbWFya2VyczogbWFya2Vyc1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVBc3luYyh2aWRlb1RleHR1cmU6IFZpZGVvVGV4dHVyZSk6IFByb21pc2U8QXJVY29NZXRhTWFya2VyVHJhY2tlcj4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxBclVjb01ldGFNYXJrZXJUcmFja2VyPigocmVzb2x2ZTogKHRyYWNrZXI6IEFyVWNvTWV0YU1hcmtlclRyYWNrZXIpID0+IHZvaWQpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRyYWNrZXIgPSBuZXcgQXJVY29NZXRhTWFya2VyVHJhY2tlcih2aWRlb1RleHR1cmUpO1xyXG4gICAgICAgICAgICB0cmFja2VyLl93b3JrZXIgPSBEZWRpY2F0ZWRXb3JrZXIuY3JlYXRlRnJvbUxvY2F0aW9uKFxyXG4gICAgICAgICAgICAgICAgQVJVQ09fTUVUQV9NQVJLRVJfVFJBQ0tFUl9VUkwsXHJcbiAgICAgICAgICAgICAgICBBclVjb01ldGFNYXJrZXJUcmFja2VyLm9uSW5pdGlhbGl6ZWQsXHJcbiAgICAgICAgICAgICAgICBBclVjb01ldGFNYXJrZXJUcmFja2VyLm9uTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHRyYWNrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdHJhY2tlci5fd29ya2VyLm9ubWVzc2FnZSA9IERlZGljYXRlZFdvcmtlci51bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXI7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRyYWNrZXIpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRDYWxpYnJhdGlvbkFzeW5jKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IChyZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YS5jYWxpYnJhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3VsdC5kYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLl93b3JrZXIucG9zdE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICBjYWxpYnJhdGU6IHRydWUsXHJcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZE1hcmtlcih1cHBlckxlZnRJZDogbnVtYmVyLCB1cHBlclJpZ2h0SWQ6IG51bWJlciwgbG93ZXJMZWZ0SWQ6IG51bWJlciwgbG93ZXJSaWdodElkOiBudW1iZXIsIG1ldGFNYXJrZXJXaWR0aDogbnVtYmVyKTogUHJvbWlzZTxBclVjb01ldGFNYXJrZXI+IHtcclxuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8QXJVY29NZXRhTWFya2VyPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSAocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhLmFkZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaWQgPSByZXN1bHQuZGF0YS5pZDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcmtlcnNbaWRdID0gbmV3IEFyVWNvTWV0YU1hcmtlcihpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLm1hcmtlcnNbaWRdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXN1bHQuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3dvcmtlci5wb3N0TWVzc2FnZSh7XHJcbiAgICAgICAgICAgIGFkZE1hcmtlcjogdHJ1ZSxcclxuICAgICAgICAgICAgdWw6IHVwcGVyTGVmdElkLFxyXG4gICAgICAgICAgICB1cjogdXBwZXJSaWdodElkLFxyXG4gICAgICAgICAgICBsbDogbG93ZXJMZWZ0SWQsXHJcbiAgICAgICAgICAgIGxyOiBsb3dlclJpZ2h0SWQsXHJcbiAgICAgICAgICAgIHdpZHRoOiBtZXRhTWFya2VyV2lkdGhcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZUFzeW5jKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSAocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhLm1hcmtlcnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXJrZXJzOiBudW1iZXJbXSA9IHJlc3VsdC5kYXRhLm1hcmtlcnM7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgbWFya2Vycy5sZW5ndGg7IGlkeCArPSA5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXJrZXIgPSB0aGlzLm1hcmtlcnNbbWFya2Vyc1tpZHhdXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmNvbmZpZGVuY2UgPSBtYXJrZXJzW2lkeCArIDFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIucG9zaXRpb24uc2V0KG1hcmtlcnNbaWR4ICsgMl0sIG1hcmtlcnNbaWR4ICsgM10sIG1hcmtlcnNbaWR4ICsgNF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIucm90YXRpb24uc2V0KG1hcmtlcnNbaWR4ICsgNV0sIG1hcmtlcnNbaWR4ICsgNl0sIG1hcmtlcnNbaWR4ICsgN10sIG1hcmtlcnNbaWR4ICsgOF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3VsdC5kYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5fd29ya2VyLnBvc3RNZXNzYWdlKHtcclxuICAgICAgICAgICAgdHJhY2s6IHRydWUsXHJcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLl92aWRlb1RleHR1cmUuZ2V0U2l6ZSgpLndpZHRoLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuX3ZpZGVvVGV4dHVyZS5nZXRTaXplKCkuaGVpZ2h0LFxyXG4gICAgICAgICAgICBpbWFnZURhdGE6IHRoaXMuX3ZpZGVvVGV4dHVyZS5yZWFkUGl4ZWxzKClcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9XHJcbn0iLCIvL2NvbnN0IENETl9VUkw6IHN0cmluZyA9IFwiaHR0cHM6Ly9hci5iYWJ5bG9uanMuY29tL1wiO1xyXG5jb25zdCBDRE5fVVJMOiBzdHJpbmcgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9cIjtcclxuY29uc3QgQ0ROX1dBU01fTU9EVUxFU19VUkw6IHN0cmluZyA9IENETl9VUkwgKyBcIndhc20vXCI7XHJcblxyXG5leHBvcnQgY29uc3QgRVhBTVBMRV9NT0RVTEVfVVJMOiBzdHJpbmcgPSBDRE5fV0FTTV9NT0RVTEVTX1VSTCArIFwid2VicGlsZWQtYXJ1Y28tYXIuanNcIjtcclxuZXhwb3J0IGNvbnN0IEFSVUNPX01FVEFfTUFSS0VSX1RSQUNLRVJfVVJMOiBzdHJpbmcgPSBDRE5fV0FTTV9NT0RVTEVTX1VSTCArIFwiYXJ1Y28tbWV0YS1tYXJrZXItdHJhY2tlci5qc1wiO1xyXG4iLCJleHBvcnQgY2xhc3MgRGVkaWNhdGVkV29ya2VyIHtcclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBjcmVhdGVGcm9tU291cmNlcyguLi5zb3VyY2VzOiBhbnlbXSk6IFdvcmtlciB7XHJcbiAgICAgICAgbGV0IHdvcmtlckNvZGU6IHN0cmluZyA9IFwiXCI7XHJcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgc291cmNlcy5sZW5ndGggLSAxOyBpZHgrKykge1xyXG4gICAgICAgICAgICB3b3JrZXJDb2RlICs9IHNvdXJjZXNbaWR4XS50b1N0cmluZygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3b3JrZXJDb2RlICs9IFwiKFwiICsgc291cmNlc1tzb3VyY2VzLmxlbmd0aCAtIDFdLnRvU3RyaW5nKCkgKyBcIikoKTtcIjtcclxuICAgICAgICByZXR1cm4gbmV3IFdvcmtlcih3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbd29ya2VyQ29kZV0pKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVGcm9tTG9jYXRpb24oanNVcmw6IHN0cmluZywgb25Jbml0aWFsaXplZDogKCkgPT4gdm9pZCwgb25NZXNzYWdlOiAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4gdm9pZCk6IFdvcmtlciB7XHJcbiAgICAgICAgbGV0IG1vZHVsZURlZml0aW9uOiBzdHJpbmcgPSBgTW9kdWxlID0ge1xyXG4gICAgICAgICAgICBsb2NhdGVGaWxlOiBmdW5jdGlvbiAocGF0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFxcXCJgICsganNVcmwucmVwbGFjZSgvLmpzJC8sIFwiLndhc21cIikgKyBgXFxcIjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25SdW50aW1lSW5pdGlhbGl6ZWQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIChgICsgb25Jbml0aWFsaXplZC50b1N0cmluZygpICsgYCkoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07YDtcclxuICAgICAgICBsZXQgbWVzc2FnZUhhbmRsZXI6IHN0cmluZyA9IFwidGhpcy5vbm1lc3NhZ2UgPSBcIiArIG9uTWVzc2FnZS50b1N0cmluZygpICsgXCI7XCI7XHJcbiAgICAgICAgbGV0IGltcG9ydEphdmFzY3JpcHQ6IHN0cmluZyA9IFwiZnVuY3Rpb24gaW1wb3J0SmF2YXNjcmlwdCgpIHsgaW1wb3J0U2NyaXB0cyhcXFwiXCIgKyBqc1VybCArIFwiXFxcIik7IH1cIjtcclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGcm9tU291cmNlcyhtb2R1bGVEZWZpdGlvbiwgbWVzc2FnZUhhbmRsZXIsIGltcG9ydEphdmFzY3JpcHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgdW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyKGV2ZW50OiBNZXNzYWdlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICB0aHJvdyBFcnJvcihcIlVuZXhwZWN0ZWQgbWVzc2FnZSBmcm9tIFdlYldvcmtlcjogXCIgKyBldmVudCk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBPYnNlcnZhYmxlLCBRdWF0ZXJuaW9uLCBTY2VuZSwgVHJhbnNmb3JtTm9kZSwgVmVjdG9yMyB9IGZyb20gXCJiYWJ5bG9uanNcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFRyYWNrZWROb2RlIGV4dGVuZHMgVHJhbnNmb3JtTm9kZSB7XHJcbiAgICBwcml2YXRlIF9pc1RyYWNraW5nOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfbm90VHJhY2tlZEZyYW1lc0NvdW50OiBudW1iZXI7IC8vIFRPRE86IFJlbW92ZSB0aGlzIGZlYXR1cmUsIHdoaWNoIG9ubHkgZXhpc3RzIGFzIGEgc3RvcGdhcC5cclxuXHJcbiAgICBwdWJsaWMgb25UcmFja2luZ0FjcXVpcmVkT2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUcmFja2VkTm9kZT47XHJcbiAgICBwdWJsaWMgb25UcmFja2luZ0xvc3RPYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFRyYWNrZWROb2RlPjtcclxuICAgIHB1YmxpYyBkaXNhYmxlV2hlbk5vdFRyYWNrZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2NlbmU/OiBTY2VuZSB8IG51bGwgfCB1bmRlZmluZWQsIGRpc2FibGVXaGVuTm90VHJhY2tlZDogYm9vbGVhbiA9IHRydWUpIHtcclxuICAgICAgICBzdXBlcihuYW1lLCBzY2VuZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2lzVHJhY2tpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRpc2FibGVXaGVuTm90VHJhY2tlZCA9IGRpc2FibGVXaGVuTm90VHJhY2tlZDtcclxuICAgICAgICBpZiAodGhpcy5kaXNhYmxlV2hlbk5vdFRyYWNrZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRFbmFibGVkKGZhbHNlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX25vdFRyYWNrZWRGcmFtZXNDb3VudCA9IDEwO1xyXG5cclxuICAgICAgICB0aGlzLm9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGUgPSBuZXcgT2JzZXJ2YWJsZShvYnNlcnZlciA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc1RyYWNraW5nKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uVHJhY2tpbmdBY3F1aXJlZE9ic2VydmFibGUubm90aWZ5T2JzZXJ2ZXIob2JzZXJ2ZXIsIHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5vblRyYWNraW5nTG9zdE9ic2VydmFibGUgPSBuZXcgT2JzZXJ2YWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnJvdGF0aW9uUXVhdGVybmlvbiA9IFF1YXRlcm5pb24uSWRlbnRpdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaXNUcmFja2luZygpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNUcmFja2luZztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0VHJhY2tpbmcocG9zaXRpb246IFZlY3RvcjMsIHJvdGF0aW9uOiBRdWF0ZXJuaW9uLCBpc1RyYWNraW5nOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvbi5jb3B5RnJvbShwb3NpdGlvbik7XHJcbiAgICAgICAgdGhpcy5yb3RhdGlvblF1YXRlcm5pb24gPyB0aGlzLnJvdGF0aW9uUXVhdGVybmlvbi5jb3B5RnJvbShyb3RhdGlvbikgOiB0aGlzLnJvdGF0aW9uUXVhdGVybmlvbiA9IHJvdGF0aW9uLmNsb25lKCk7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IFJlbW92ZSB0aGlzIGZlYXR1cmUsIHdoaWNoIG9ubHkgZXhpc3RzIGFzIGEgc3RvcGdhcC5cclxuICAgICAgICBpZiAoaXNUcmFja2luZykge1xyXG4gICAgICAgICAgICB0aGlzLl9ub3RUcmFja2VkRnJhbWVzQ291bnQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fbm90VHJhY2tlZEZyYW1lc0NvdW50ICs9IDE7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9ub3RUcmFja2VkRnJhbWVzQ291bnQgPCA1KSB7XHJcbiAgICAgICAgICAgICAgICBpc1RyYWNraW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9pc1RyYWNraW5nICYmIGlzVHJhY2tpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5vblRyYWNraW5nQWNxdWlyZWRPYnNlcnZhYmxlLm5vdGlmeU9ic2VydmVycyh0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5faXNUcmFja2luZyAmJiAhaXNUcmFja2luZykge1xyXG4gICAgICAgICAgICB0aGlzLm9uVHJhY2tpbmdMb3N0T2JzZXJ2YWJsZS5ub3RpZnlPYnNlcnZlcnModGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2lzVHJhY2tpbmcgPSBpc1RyYWNraW5nO1xyXG4gICAgICAgIHRoaXMuc2V0RW5hYmxlZCghdGhpcy5kaXNhYmxlV2hlbk5vdFRyYWNrZWQgfHwgdGhpcy5faXNUcmFja2luZyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==
