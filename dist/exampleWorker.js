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
exports.EXAMPLE_MODULE_URL = "https://syntheticmagus.github.io/prototyping/babylonar/wasm/webpiled-aruco-ar.js";

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZXhhbXBsZVdvcmtlci9leGFtcGxlV29ya2VyLnRzIiwic3JjL3RzL3NoYXJlZC9jb25zdGFudHMudHMiLCJzcmMvdHMvc2hhcmVkL2RlZGljYXRlZFdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsNkRBQTJEO0FBQzNELGlEQUF3RDtBQUl4RDtJQUdJO0lBQXVCLENBQUM7SUFFVCwyQkFBYSxHQUE1QjtRQUNJLFdBQVcsQ0FBQztZQUNSLE9BQU8sRUFBRSxlQUFlO1NBQzNCLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFYyx1QkFBUyxHQUF4QixVQUF5QixLQUFtQjtRQUN4QyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRWEseUJBQVcsR0FBekI7UUFDSSxPQUFPLElBQUksT0FBTyxDQUFnQixVQUFDLE9BQXdDO1lBQ3ZFLElBQUksYUFBYSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7WUFDeEMsYUFBYSxDQUFDLE9BQU8sR0FBRyxpQ0FBZSxDQUFDLGtCQUFrQixDQUN0RCw4QkFBa0IsRUFDbEIsYUFBYSxDQUFDLGFBQWEsRUFDM0IsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdCLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFVBQUMsS0FBbUI7Z0JBQ2xELGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLGlDQUFlLENBQUMsd0JBQXdCLENBQUM7Z0JBQzNFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQixDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTSx3Q0FBZ0IsR0FBdkIsVUFBd0IsSUFBUztRQUFqQyxpQkFXQztRQVZHLElBQUksT0FBTyxHQUFHLElBQUksT0FBTyxDQUFNLFVBQUMsT0FBNkI7WUFDekQsS0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsVUFBQyxLQUFtQjtnQkFDekMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsaUNBQWUsQ0FBQyx3QkFBd0IsQ0FBQztZQUN0RSxDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9CLE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFDTCxvQkFBQztBQUFELENBM0NBLEFBMkNDLElBQUE7QUEzQ1ksc0NBQWE7Ozs7O0FDTGIsUUFBQSxrQkFBa0IsR0FBVyxrRkFBa0YsQ0FBQzs7Ozs7QUNBN0g7SUFBQTtJQTRCQSxDQUFDO0lBMUJrQixpQ0FBaUIsR0FBaEM7UUFBaUMsaUJBQWlCO2FBQWpCLFVBQWlCLEVBQWpCLHFCQUFpQixFQUFqQixJQUFpQjtZQUFqQiw0QkFBaUI7O1FBQzlDLElBQUksVUFBVSxHQUFXLEVBQUUsQ0FBQztRQUM1QixLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDL0MsVUFBVSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUN6QztRQUNELFVBQVUsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsTUFBTSxDQUFDO1FBQ3BFLE9BQU8sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBRWEsa0NBQWtCLEdBQWhDLFVBQWlDLEtBQWEsRUFBRSxhQUF5QixFQUFFLFNBQXdDO1FBQy9HLElBQUksY0FBYyxHQUFXLGtGQUVYLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcseUZBRzVDLEdBQUcsYUFBYSxDQUFDLFFBQVEsRUFBRSxHQUFHLGlDQUVyQyxDQUFDO1FBQ0osSUFBSSxjQUFjLEdBQVcsbUJBQW1CLEdBQUcsU0FBUyxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQztRQUM5RSxJQUFJLGdCQUFnQixHQUFXLGdEQUFnRCxHQUFHLEtBQUssR0FBRyxRQUFRLENBQUM7UUFDbkcsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFYSx3Q0FBd0IsR0FBdEMsVUFBdUMsS0FBbUI7UUFDdEQsTUFBTSxLQUFLLENBQUMscUNBQXFDLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUNMLHNCQUFDO0FBQUQsQ0E1QkEsQUE0QkMsSUFBQTtBQTVCWSwwQ0FBZSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCB7IERlZGljYXRlZFdvcmtlciB9IGZyb20gXCIuLi9zaGFyZWQvZGVkaWNhdGVkV29ya2VyXCJcclxuaW1wb3J0IHsgRVhBTVBMRV9NT0RVTEVfVVJMIH0gZnJvbSBcIi4uL3NoYXJlZC9jb25zdGFudHNcIlxyXG5cclxuZGVjbGFyZSBmdW5jdGlvbiBwb3N0TWVzc2FnZShkYXRhOiBhbnkpOiB2b2lkO1xyXG5cclxuZXhwb3J0IGNsYXNzIEV4YW1wbGVXb3JrZXIge1xyXG4gICAgcHJpdmF0ZSBfd29ya2VyOiBXb3JrZXI7XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25Jbml0aWFsaXplZCgpOiB2b2lkIHtcclxuICAgICAgICBwb3N0TWVzc2FnZSh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiR290IGEgbW9kdWxlIVwiXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25NZXNzYWdlKGV2ZW50OiBNZXNzYWdlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBsZXQgZGF0YSA9IGV2ZW50LmRhdGE7XHJcbiAgICAgICAgZGF0YS53ZW50VG9Xb3JrZXIgPSB0cnVlO1xyXG4gICAgICAgIHBvc3RNZXNzYWdlKGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlQXN5bmMoKTogUHJvbWlzZTxFeGFtcGxlV29ya2VyPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEV4YW1wbGVXb3JrZXI+KChyZXNvbHZlOiAod29ya2VyOiBFeGFtcGxlV29ya2VyKSA9PiB2b2lkKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBleGFtcGxlV29ya2VyID0gbmV3IEV4YW1wbGVXb3JrZXIoKTtcclxuICAgICAgICAgICAgZXhhbXBsZVdvcmtlci5fd29ya2VyID0gRGVkaWNhdGVkV29ya2VyLmNyZWF0ZUZyb21Mb2NhdGlvbihcclxuICAgICAgICAgICAgICAgIEVYQU1QTEVfTU9EVUxFX1VSTCxcclxuICAgICAgICAgICAgICAgIEV4YW1wbGVXb3JrZXIub25Jbml0aWFsaXplZCxcclxuICAgICAgICAgICAgICAgIEV4YW1wbGVXb3JrZXIub25NZXNzYWdlKTtcclxuICAgICAgICAgICAgZXhhbXBsZVdvcmtlci5fd29ya2VyLm9ubWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBleGFtcGxlV29ya2VyLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZXhhbXBsZVdvcmtlcik7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNlbmRNZXNzYWdlQXN5bmMoZGF0YTogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmU6ICh2YWx1ZTogYW55KSA9PiB2b2lkKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShldmVudC5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbm1lc3NhZ2UgPSBEZWRpY2F0ZWRXb3JrZXIudW5leHBlY3RlZE1lc3NhZ2VIYW5kbGVyO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLl93b3JrZXIucG9zdE1lc3NhZ2UoZGF0YSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfVxyXG59IiwiZXhwb3J0IGNvbnN0IEVYQU1QTEVfTU9EVUxFX1VSTDogc3RyaW5nID0gXCJodHRwczovL3N5bnRoZXRpY21hZ3VzLmdpdGh1Yi5pby9wcm90b3R5cGluZy9iYWJ5bG9uYXIvd2FzbS93ZWJwaWxlZC1hcnVjby1hci5qc1wiOyIsImV4cG9ydCBjbGFzcyBEZWRpY2F0ZWRXb3JrZXIge1xyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIGNyZWF0ZUZyb21Tb3VyY2VzKC4uLnNvdXJjZXM6IGFueVtdKTogV29ya2VyIHtcclxuICAgICAgICBsZXQgd29ya2VyQ29kZTogc3RyaW5nID0gXCJcIjtcclxuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzb3VyY2VzLmxlbmd0aCAtIDE7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHdvcmtlckNvZGUgKz0gc291cmNlc1tpZHhdLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdvcmtlckNvZGUgKz0gXCIoXCIgKyBzb3VyY2VzW3NvdXJjZXMubGVuZ3RoIC0gMV0udG9TdHJpbmcoKSArIFwiKSgpO1wiO1xyXG4gICAgICAgIHJldHVybiBuZXcgV29ya2VyKHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFt3b3JrZXJDb2RlXSkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZUZyb21Mb2NhdGlvbihqc1VybDogc3RyaW5nLCBvbkluaXRpYWxpemVkOiAoKSA9PiB2b2lkLCBvbk1lc3NhZ2U6IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB2b2lkKTogV29ya2VyIHtcclxuICAgICAgICBsZXQgbW9kdWxlRGVmaXRpb246IHN0cmluZyA9IGBNb2R1bGUgPSB7XHJcbiAgICAgICAgICAgIGxvY2F0ZUZpbGU6IGZ1bmN0aW9uIChwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXFxcImAgKyBqc1VybC5yZXBsYWNlKC8uanMkLywgXCIud2FzbVwiKSArIGBcXFwiO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvblJ1bnRpbWVJbml0aWFsaXplZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgKGAgKyBvbkluaXRpYWxpemVkLnRvU3RyaW5nKCkgKyBgKSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtgO1xyXG4gICAgICAgIGxldCBtZXNzYWdlSGFuZGxlcjogc3RyaW5nID0gXCJ0aGlzLm9ubWVzc2FnZSA9IFwiICsgb25NZXNzYWdlLnRvU3RyaW5nKCkgKyBcIjtcIjtcclxuICAgICAgICBsZXQgaW1wb3J0SmF2YXNjcmlwdDogc3RyaW5nID0gXCJmdW5jdGlvbiBpbXBvcnRKYXZhc2NyaXB0KCkgeyBpbXBvcnRTY3JpcHRzKFxcXCJcIiArIGpzVXJsICsgXCJcXFwiKTsgfVwiO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZyb21Tb3VyY2VzKG1vZHVsZURlZml0aW9uLCBtZXNzYWdlSGFuZGxlciwgaW1wb3J0SmF2YXNjcmlwdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyB1bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXIoZXZlbnQ6IE1lc3NhZ2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiVW5leHBlY3RlZCBtZXNzYWdlIGZyb20gV2ViV29ya2VyOiBcIiArIGV2ZW50KTtcclxuICAgIH1cclxufSJdfQ==
