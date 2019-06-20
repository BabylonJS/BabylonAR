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
var CDN_URL = "https://babylonjs.github.io/BabylonAR/";
var CDN_WASM_MODULES_URL = CDN_URL + "wasm/";
exports.EXAMPLE_MODULE_URL = CDN_WASM_MODULES_URL + "webpiled-aruco-ar.js";

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZXhhbXBsZVdvcmtlci9leGFtcGxlV29ya2VyLnRzIiwic3JjL3RzL3NoYXJlZC9jb25zdGFudHMudHMiLCJzcmMvdHMvc2hhcmVkL2RlZGljYXRlZFdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsNkRBQTJEO0FBQzNELGlEQUF3RDtBQUl4RDtJQUdJO0lBQXVCLENBQUM7SUFFVCwyQkFBYSxHQUE1QjtRQUNJLFdBQVcsQ0FBQztZQUNSLE9BQU8sRUFBRSxlQUFlO1NBQzNCLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFYyx1QkFBUyxHQUF4QixVQUF5QixLQUFtQjtRQUN4QyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRWEseUJBQVcsR0FBekI7UUFDSSxPQUFPLElBQUksT0FBTyxDQUFnQixVQUFDLE9BQXdDO1lBQ3ZFLElBQUksYUFBYSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7WUFDeEMsYUFBYSxDQUFDLE9BQU8sR0FBRyxpQ0FBZSxDQUFDLGtCQUFrQixDQUN0RCw4QkFBa0IsRUFDbEIsYUFBYSxDQUFDLGFBQWEsRUFDM0IsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdCLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFVBQUMsS0FBbUI7Z0JBQ2xELGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLGlDQUFlLENBQUMsd0JBQXdCLENBQUM7Z0JBQzNFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQixDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTSx3Q0FBZ0IsR0FBdkIsVUFBd0IsSUFBUztRQUFqQyxpQkFXQztRQVZHLElBQUksT0FBTyxHQUFHLElBQUksT0FBTyxDQUFNLFVBQUMsT0FBNkI7WUFDekQsS0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsVUFBQyxLQUFtQjtnQkFDekMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsaUNBQWUsQ0FBQyx3QkFBd0IsQ0FBQztZQUN0RSxDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9CLE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFDTCxvQkFBQztBQUFELENBM0NBLEFBMkNDLElBQUE7QUEzQ1ksc0NBQWE7Ozs7O0FDTDFCLElBQU0sT0FBTyxHQUFXLHdDQUF3QyxDQUFDO0FBQ2pFLElBQU0sb0JBQW9CLEdBQVcsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUUxQyxRQUFBLGtCQUFrQixHQUFXLG9CQUFvQixHQUFHLHNCQUFzQixDQUFDOzs7OztBQ0h4RjtJQUFBO0lBNEJBLENBQUM7SUExQmtCLGlDQUFpQixHQUFoQztRQUFpQyxpQkFBaUI7YUFBakIsVUFBaUIsRUFBakIscUJBQWlCLEVBQWpCLElBQWlCO1lBQWpCLDRCQUFpQjs7UUFDOUMsSUFBSSxVQUFVLEdBQVcsRUFBRSxDQUFDO1FBQzVCLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUMvQyxVQUFVLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ3pDO1FBQ0QsVUFBVSxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUM7UUFDcEUsT0FBTyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFYSxrQ0FBa0IsR0FBaEMsVUFBaUMsS0FBYSxFQUFFLGFBQXlCLEVBQUUsU0FBd0M7UUFDL0csSUFBSSxjQUFjLEdBQVcsa0ZBRVgsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyx5RkFHNUMsR0FBRyxhQUFhLENBQUMsUUFBUSxFQUFFLEdBQUcsaUNBRXJDLENBQUM7UUFDSixJQUFJLGNBQWMsR0FBVyxtQkFBbUIsR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDO1FBQzlFLElBQUksZ0JBQWdCLEdBQVcsZ0RBQWdELEdBQUcsS0FBSyxHQUFHLFFBQVEsQ0FBQztRQUNuRyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFDcEYsQ0FBQztJQUVhLHdDQUF3QixHQUF0QyxVQUF1QyxLQUFtQjtRQUN0RCxNQUFNLEtBQUssQ0FBQyxxQ0FBcUMsR0FBRyxLQUFLLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBQ0wsc0JBQUM7QUFBRCxDQTVCQSxBQTRCQyxJQUFBO0FBNUJZLDBDQUFlIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHsgRGVkaWNhdGVkV29ya2VyIH0gZnJvbSBcIi4uL3NoYXJlZC9kZWRpY2F0ZWRXb3JrZXJcIlxuaW1wb3J0IHsgRVhBTVBMRV9NT0RVTEVfVVJMIH0gZnJvbSBcIi4uL3NoYXJlZC9jb25zdGFudHNcIlxuXG5kZWNsYXJlIGZ1bmN0aW9uIHBvc3RNZXNzYWdlKGRhdGE6IGFueSk6IHZvaWQ7XG5cbmV4cG9ydCBjbGFzcyBFeGFtcGxlV29ya2VyIHtcbiAgICBwcml2YXRlIF93b3JrZXI6IFdvcmtlcjtcblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25Jbml0aWFsaXplZCgpOiB2b2lkIHtcbiAgICAgICAgcG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgbWVzc2FnZTogXCJHb3QgYSBtb2R1bGUhXCJcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25NZXNzYWdlKGV2ZW50OiBNZXNzYWdlRXZlbnQpOiB2b2lkIHtcbiAgICAgICAgbGV0IGRhdGEgPSBldmVudC5kYXRhO1xuICAgICAgICBkYXRhLndlbnRUb1dvcmtlciA9IHRydWU7XG4gICAgICAgIHBvc3RNZXNzYWdlKGRhdGEpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlQXN5bmMoKTogUHJvbWlzZTxFeGFtcGxlV29ya2VyPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxFeGFtcGxlV29ya2VyPigocmVzb2x2ZTogKHdvcmtlcjogRXhhbXBsZVdvcmtlcikgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGV4YW1wbGVXb3JrZXIgPSBuZXcgRXhhbXBsZVdvcmtlcigpO1xuICAgICAgICAgICAgZXhhbXBsZVdvcmtlci5fd29ya2VyID0gRGVkaWNhdGVkV29ya2VyLmNyZWF0ZUZyb21Mb2NhdGlvbihcbiAgICAgICAgICAgICAgICBFWEFNUExFX01PRFVMRV9VUkwsXG4gICAgICAgICAgICAgICAgRXhhbXBsZVdvcmtlci5vbkluaXRpYWxpemVkLFxuICAgICAgICAgICAgICAgIEV4YW1wbGVXb3JrZXIub25NZXNzYWdlKTtcbiAgICAgICAgICAgIGV4YW1wbGVXb3JrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGV4YW1wbGVXb3JrZXIuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZXhhbXBsZVdvcmtlcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2VuZE1lc3NhZ2VBc3luYyhkYXRhOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmU6ICh2YWx1ZTogYW55KSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGV2ZW50LmRhdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fd29ya2VyLnBvc3RNZXNzYWdlKGRhdGEpO1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbn0iLCJjb25zdCBDRE5fVVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vYmFieWxvbmpzLmdpdGh1Yi5pby9CYWJ5bG9uQVIvXCI7XG5jb25zdCBDRE5fV0FTTV9NT0RVTEVTX1VSTDogc3RyaW5nID0gQ0ROX1VSTCArIFwid2FzbS9cIjtcblxuZXhwb3J0IGNvbnN0IEVYQU1QTEVfTU9EVUxFX1VSTDogc3RyaW5nID0gQ0ROX1dBU01fTU9EVUxFU19VUkwgKyBcIndlYnBpbGVkLWFydWNvLWFyLmpzXCI7XG4iLCJleHBvcnQgY2xhc3MgRGVkaWNhdGVkV29ya2VyIHtcblxuICAgIHByaXZhdGUgc3RhdGljIGNyZWF0ZUZyb21Tb3VyY2VzKC4uLnNvdXJjZXM6IGFueVtdKTogV29ya2VyIHtcbiAgICAgICAgbGV0IHdvcmtlckNvZGU6IHN0cmluZyA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHNvdXJjZXMubGVuZ3RoIC0gMTsgaWR4KyspIHtcbiAgICAgICAgICAgIHdvcmtlckNvZGUgKz0gc291cmNlc1tpZHhdLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgd29ya2VyQ29kZSArPSBcIihcIiArIHNvdXJjZXNbc291cmNlcy5sZW5ndGggLSAxXS50b1N0cmluZygpICsgXCIpKCk7XCI7XG4gICAgICAgIHJldHVybiBuZXcgV29ya2VyKHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFt3b3JrZXJDb2RlXSkpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZUZyb21Mb2NhdGlvbihqc1VybDogc3RyaW5nLCBvbkluaXRpYWxpemVkOiAoKSA9PiB2b2lkLCBvbk1lc3NhZ2U6IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB2b2lkKTogV29ya2VyIHtcbiAgICAgICAgbGV0IG1vZHVsZURlZml0aW9uOiBzdHJpbmcgPSBgTW9kdWxlID0ge1xuICAgICAgICAgICAgbG9jYXRlRmlsZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXFxcImAgKyBqc1VybC5yZXBsYWNlKC8uanMkLywgXCIud2FzbVwiKSArIGBcXFwiO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uUnVudGltZUluaXRpYWxpemVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgKGAgKyBvbkluaXRpYWxpemVkLnRvU3RyaW5nKCkgKyBgKSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O2A7XG4gICAgICAgIGxldCBtZXNzYWdlSGFuZGxlcjogc3RyaW5nID0gXCJ0aGlzLm9ubWVzc2FnZSA9IFwiICsgb25NZXNzYWdlLnRvU3RyaW5nKCkgKyBcIjtcIjtcbiAgICAgICAgbGV0IGltcG9ydEphdmFzY3JpcHQ6IHN0cmluZyA9IFwiZnVuY3Rpb24gaW1wb3J0SmF2YXNjcmlwdCgpIHsgaW1wb3J0U2NyaXB0cyhcXFwiXCIgKyBqc1VybCArIFwiXFxcIik7IH1cIjtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRnJvbVNvdXJjZXMobW9kdWxlRGVmaXRpb24sIG1lc3NhZ2VIYW5kbGVyLCBpbXBvcnRKYXZhc2NyaXB0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIHVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcihldmVudDogTWVzc2FnZUV2ZW50KTogdm9pZCB7XG4gICAgICAgIHRocm93IEVycm9yKFwiVW5leHBlY3RlZCBtZXNzYWdlIGZyb20gV2ViV29ya2VyOiBcIiArIGV2ZW50KTtcbiAgICB9XG59Il19
