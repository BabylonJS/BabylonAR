(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BabylonAR = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"../shared/constants":2,"../shared/dedicatedWorker":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CDN_URL = "https://ar.babylonjs.com/";
var CDN_WASM_MODULES_URL = CDN_URL + "wasm/";
exports.EXAMPLE_MODULE_URL = CDN_WASM_MODULES_URL + "webpiled-aruco-ar.js";
exports.ARUCO_META_MARKER_TRACKER_URL = CDN_WASM_MODULES_URL + "aruco-meta-marker-tracker.js";

},{}],3:[function(require,module,exports){
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

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZXhhbXBsZVdvcmtlci9leGFtcGxlV29ya2VyLnRzIiwic3JjL3RzL3NoYXJlZC9jb25zdGFudHMudHMiLCJzcmMvdHMvc2hhcmVkL2RlZGljYXRlZFdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsNkRBQTJEO0FBQzNELGlEQUF3RDtBQUl4RDtJQUdJO0lBQXVCLENBQUM7SUFFVCwyQkFBYSxHQUE1QjtRQUNJLFdBQVcsQ0FBQztZQUNSLE9BQU8sRUFBRSxlQUFlO1NBQzNCLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFYyx1QkFBUyxHQUF4QixVQUF5QixLQUFtQjtRQUN4QyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRWEseUJBQVcsR0FBekI7UUFDSSxPQUFPLElBQUksT0FBTyxDQUFnQixVQUFDLE9BQXdDO1lBQ3ZFLElBQUksYUFBYSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7WUFDeEMsYUFBYSxDQUFDLE9BQU8sR0FBRyxpQ0FBZSxDQUFDLGtCQUFrQixDQUN0RCw4QkFBa0IsRUFDbEIsYUFBYSxDQUFDLGFBQWEsRUFDM0IsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdCLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFVBQUMsS0FBbUI7Z0JBQ2xELGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLGlDQUFlLENBQUMsd0JBQXdCLENBQUM7Z0JBQzNFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQixDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTSx3Q0FBZ0IsR0FBdkIsVUFBd0IsSUFBUztRQUFqQyxpQkFXQztRQVZHLElBQUksT0FBTyxHQUFHLElBQUksT0FBTyxDQUFNLFVBQUMsT0FBNkI7WUFDekQsS0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsVUFBQyxLQUFtQjtnQkFDekMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsaUNBQWUsQ0FBQyx3QkFBd0IsQ0FBQztZQUN0RSxDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9CLE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFDTCxvQkFBQztBQUFELENBM0NBLEFBMkNDLElBQUE7QUEzQ1ksc0NBQWE7Ozs7O0FDTDFCLElBQU0sT0FBTyxHQUFXLDJCQUEyQixDQUFDO0FBQ3BELElBQU0sb0JBQW9CLEdBQVcsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUUxQyxRQUFBLGtCQUFrQixHQUFXLG9CQUFvQixHQUFHLHNCQUFzQixDQUFDO0FBQzNFLFFBQUEsNkJBQTZCLEdBQVcsb0JBQW9CLEdBQUcsOEJBQThCLENBQUM7Ozs7O0FDSjNHO0lBQUE7SUE0QkEsQ0FBQztJQTFCa0IsaUNBQWlCLEdBQWhDO1FBQWlDLGlCQUFpQjthQUFqQixVQUFpQixFQUFqQixxQkFBaUIsRUFBakIsSUFBaUI7WUFBakIsNEJBQWlCOztRQUM5QyxJQUFJLFVBQVUsR0FBVyxFQUFFLENBQUM7UUFDNUIsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQy9DLFVBQVUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDekM7UUFDRCxVQUFVLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLE1BQU0sQ0FBQztRQUNwRSxPQUFPLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVhLGtDQUFrQixHQUFoQyxVQUFpQyxLQUFhLEVBQUUsYUFBeUIsRUFBRSxTQUF3QztRQUMvRyxJQUFJLGNBQWMsR0FBVyxrRkFFWCxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLHlGQUc1QyxHQUFHLGFBQWEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxpQ0FFckMsQ0FBQztRQUNKLElBQUksY0FBYyxHQUFXLG1CQUFtQixHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLENBQUM7UUFDOUUsSUFBSSxnQkFBZ0IsR0FBVyxnREFBZ0QsR0FBRyxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBQ25HLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRWEsd0NBQXdCLEdBQXRDLFVBQXVDLEtBQW1CO1FBQ3RELE1BQU0sS0FBSyxDQUFDLHFDQUFxQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFDTCxzQkFBQztBQUFELENBNUJBLEFBNEJDLElBQUE7QUE1QlksMENBQWUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgeyBEZWRpY2F0ZWRXb3JrZXIgfSBmcm9tIFwiLi4vc2hhcmVkL2RlZGljYXRlZFdvcmtlclwiXHJcbmltcG9ydCB7IEVYQU1QTEVfTU9EVUxFX1VSTCB9IGZyb20gXCIuLi9zaGFyZWQvY29uc3RhbnRzXCJcclxuXHJcbmRlY2xhcmUgZnVuY3Rpb24gcG9zdE1lc3NhZ2UoZGF0YTogYW55KTogdm9pZDtcclxuXHJcbmV4cG9ydCBjbGFzcyBFeGFtcGxlV29ya2VyIHtcclxuICAgIHByaXZhdGUgX3dvcmtlcjogV29ya2VyO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIG9uSW5pdGlhbGl6ZWQoKTogdm9pZCB7XHJcbiAgICAgICAgcG9zdE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIkdvdCBhIG1vZHVsZSFcIlxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIG9uTWVzc2FnZShldmVudDogTWVzc2FnZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgbGV0IGRhdGEgPSBldmVudC5kYXRhO1xyXG4gICAgICAgIGRhdGEud2VudFRvV29ya2VyID0gdHJ1ZTtcclxuICAgICAgICBwb3N0TWVzc2FnZShkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZUFzeW5jKCk6IFByb21pc2U8RXhhbXBsZVdvcmtlcj4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxFeGFtcGxlV29ya2VyPigocmVzb2x2ZTogKHdvcmtlcjogRXhhbXBsZVdvcmtlcikgPT4gdm9pZCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgZXhhbXBsZVdvcmtlciA9IG5ldyBFeGFtcGxlV29ya2VyKCk7XHJcbiAgICAgICAgICAgIGV4YW1wbGVXb3JrZXIuX3dvcmtlciA9IERlZGljYXRlZFdvcmtlci5jcmVhdGVGcm9tTG9jYXRpb24oXHJcbiAgICAgICAgICAgICAgICBFWEFNUExFX01PRFVMRV9VUkwsXHJcbiAgICAgICAgICAgICAgICBFeGFtcGxlV29ya2VyLm9uSW5pdGlhbGl6ZWQsXHJcbiAgICAgICAgICAgICAgICBFeGFtcGxlV29ya2VyLm9uTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGV4YW1wbGVXb3JrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZXhhbXBsZVdvcmtlci5fd29ya2VyLm9ubWVzc2FnZSA9IERlZGljYXRlZFdvcmtlci51bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXI7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGV4YW1wbGVXb3JrZXIpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZW5kTWVzc2FnZUFzeW5jKGRhdGE6IGFueSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlOiAodmFsdWU6IGFueSkgPT4gdm9pZCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZXZlbnQuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5fd29ya2VyLnBvc3RNZXNzYWdlKGRhdGEpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH1cclxufSIsImNvbnN0IENETl9VUkw6IHN0cmluZyA9IFwiaHR0cHM6Ly9hci5iYWJ5bG9uanMuY29tL1wiO1xyXG5jb25zdCBDRE5fV0FTTV9NT0RVTEVTX1VSTDogc3RyaW5nID0gQ0ROX1VSTCArIFwid2FzbS9cIjtcclxuXHJcbmV4cG9ydCBjb25zdCBFWEFNUExFX01PRFVMRV9VUkw6IHN0cmluZyA9IENETl9XQVNNX01PRFVMRVNfVVJMICsgXCJ3ZWJwaWxlZC1hcnVjby1hci5qc1wiO1xyXG5leHBvcnQgY29uc3QgQVJVQ09fTUVUQV9NQVJLRVJfVFJBQ0tFUl9VUkw6IHN0cmluZyA9IENETl9XQVNNX01PRFVMRVNfVVJMICsgXCJhcnVjby1tZXRhLW1hcmtlci10cmFja2VyLmpzXCI7XHJcbiIsImV4cG9ydCBjbGFzcyBEZWRpY2F0ZWRXb3JrZXIge1xyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIGNyZWF0ZUZyb21Tb3VyY2VzKC4uLnNvdXJjZXM6IGFueVtdKTogV29ya2VyIHtcclxuICAgICAgICBsZXQgd29ya2VyQ29kZTogc3RyaW5nID0gXCJcIjtcclxuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzb3VyY2VzLmxlbmd0aCAtIDE7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHdvcmtlckNvZGUgKz0gc291cmNlc1tpZHhdLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdvcmtlckNvZGUgKz0gXCIoXCIgKyBzb3VyY2VzW3NvdXJjZXMubGVuZ3RoIC0gMV0udG9TdHJpbmcoKSArIFwiKSgpO1wiO1xyXG4gICAgICAgIHJldHVybiBuZXcgV29ya2VyKHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFt3b3JrZXJDb2RlXSkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZUZyb21Mb2NhdGlvbihqc1VybDogc3RyaW5nLCBvbkluaXRpYWxpemVkOiAoKSA9PiB2b2lkLCBvbk1lc3NhZ2U6IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB2b2lkKTogV29ya2VyIHtcclxuICAgICAgICBsZXQgbW9kdWxlRGVmaXRpb246IHN0cmluZyA9IGBNb2R1bGUgPSB7XHJcbiAgICAgICAgICAgIGxvY2F0ZUZpbGU6IGZ1bmN0aW9uIChwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXFxcImAgKyBqc1VybC5yZXBsYWNlKC8uanMkLywgXCIud2FzbVwiKSArIGBcXFwiO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvblJ1bnRpbWVJbml0aWFsaXplZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgKGAgKyBvbkluaXRpYWxpemVkLnRvU3RyaW5nKCkgKyBgKSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtgO1xyXG4gICAgICAgIGxldCBtZXNzYWdlSGFuZGxlcjogc3RyaW5nID0gXCJ0aGlzLm9ubWVzc2FnZSA9IFwiICsgb25NZXNzYWdlLnRvU3RyaW5nKCkgKyBcIjtcIjtcclxuICAgICAgICBsZXQgaW1wb3J0SmF2YXNjcmlwdDogc3RyaW5nID0gXCJmdW5jdGlvbiBpbXBvcnRKYXZhc2NyaXB0KCkgeyBpbXBvcnRTY3JpcHRzKFxcXCJcIiArIGpzVXJsICsgXCJcXFwiKTsgfVwiO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZyb21Tb3VyY2VzKG1vZHVsZURlZml0aW9uLCBtZXNzYWdlSGFuZGxlciwgaW1wb3J0SmF2YXNjcmlwdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyB1bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXIoZXZlbnQ6IE1lc3NhZ2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiVW5leHBlY3RlZCBtZXNzYWdlIGZyb20gV2ViV29ya2VyOiBcIiArIGV2ZW50KTtcclxuICAgIH1cclxufSJdfQ==
