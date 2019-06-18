(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BabylonAR = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dedicatedWorker_1 = require("../shared/dedicatedWorker");
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
            exampleWorker._worker = dedicatedWorker_1.DedicatedWorker.createFromLocation(ExampleWorker.MODULE_URL, ExampleWorker.onInitialized, ExampleWorker.onMessage);
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
    ExampleWorker.MODULE_URL = "https://syntheticmagus.github.io/webpiled-aruco-ar/v0.02/webpiled-aruco-ar/webpiled-aruco-ar.js";
    return ExampleWorker;
}());
exports.ExampleWorker = ExampleWorker;

},{"../shared/dedicatedWorker":2}],2:[function(require,module,exports){
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZXhhbXBsZVdvcmtlci9leGFtcGxlV29ya2VyLnRzIiwic3JjL3RzL3NoYXJlZC9kZWRpY2F0ZWRXb3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLDZEQUEyRDtBQUkzRDtJQUtJO0lBQXVCLENBQUM7SUFFVCwyQkFBYSxHQUE1QjtRQUNJLFdBQVcsQ0FBQztZQUNSLE9BQU8sRUFBRSxlQUFlO1NBQzNCLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFYyx1QkFBUyxHQUF4QixVQUF5QixLQUFtQjtRQUN4QyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRWEseUJBQVcsR0FBekI7UUFDSSxPQUFPLElBQUksT0FBTyxDQUFnQixVQUFDLE9BQXdDO1lBQ3ZFLElBQUksYUFBYSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7WUFDeEMsYUFBYSxDQUFDLE9BQU8sR0FBRyxpQ0FBZSxDQUFDLGtCQUFrQixDQUN0RCxhQUFhLENBQUMsVUFBVSxFQUN4QixhQUFhLENBQUMsYUFBYSxFQUMzQixhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0IsYUFBYSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsVUFBQyxLQUFtQjtnQkFDbEQsYUFBYSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsaUNBQWUsQ0FBQyx3QkFBd0IsQ0FBQztnQkFDM0UsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLHdDQUFnQixHQUF2QixVQUF3QixJQUFTO1FBQWpDLGlCQVdDO1FBVkcsSUFBSSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQU0sVUFBQyxPQUE2QjtZQUN6RCxLQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxVQUFDLEtBQW1CO2dCQUN6QyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwQixLQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxpQ0FBZSxDQUFDLHdCQUF3QixDQUFDO1lBQ3RFLENBQUMsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFL0IsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQTNDdUIsd0JBQVUsR0FBVyxpR0FBaUcsQ0FBQztJQTRDbkosb0JBQUM7Q0E3Q0QsQUE2Q0MsSUFBQTtBQTdDWSxzQ0FBYTs7Ozs7QUNKMUI7SUFBQTtJQTRCQSxDQUFDO0lBMUJrQixpQ0FBaUIsR0FBaEM7UUFBaUMsaUJBQWlCO2FBQWpCLFVBQWlCLEVBQWpCLHFCQUFpQixFQUFqQixJQUFpQjtZQUFqQiw0QkFBaUI7O1FBQzlDLElBQUksVUFBVSxHQUFXLEVBQUUsQ0FBQztRQUM1QixLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDL0MsVUFBVSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUN6QztRQUNELFVBQVUsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsTUFBTSxDQUFDO1FBQ3BFLE9BQU8sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBRWEsa0NBQWtCLEdBQWhDLFVBQWlDLEtBQWEsRUFBRSxhQUF5QixFQUFFLFNBQXdDO1FBQy9HLElBQUksY0FBYyxHQUFXLGtGQUVYLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcseUZBRzVDLEdBQUcsYUFBYSxDQUFDLFFBQVEsRUFBRSxHQUFHLGlDQUVyQyxDQUFDO1FBQ0osSUFBSSxjQUFjLEdBQVcsbUJBQW1CLEdBQUcsU0FBUyxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQztRQUM5RSxJQUFJLGdCQUFnQixHQUFXLGdEQUFnRCxHQUFHLEtBQUssR0FBRyxRQUFRLENBQUM7UUFDbkcsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFYSx3Q0FBd0IsR0FBdEMsVUFBdUMsS0FBbUI7UUFDdEQsTUFBTSxLQUFLLENBQUMscUNBQXFDLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUNMLHNCQUFDO0FBQUQsQ0E1QkEsQUE0QkMsSUFBQTtBQTVCWSwwQ0FBZSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCB7IERlZGljYXRlZFdvcmtlciB9IGZyb20gXCIuLi9zaGFyZWQvZGVkaWNhdGVkV29ya2VyXCJcblxuZGVjbGFyZSBmdW5jdGlvbiBwb3N0TWVzc2FnZShkYXRhOiBhbnkpOiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgRXhhbXBsZVdvcmtlciB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgTU9EVUxFX1VSTDogc3RyaW5nID0gXCJodHRwczovL3N5bnRoZXRpY21hZ3VzLmdpdGh1Yi5pby93ZWJwaWxlZC1hcnVjby1hci92MC4wMi93ZWJwaWxlZC1hcnVjby1hci93ZWJwaWxlZC1hcnVjby1hci5qc1wiO1xuXG4gICAgcHJpdmF0ZSBfd29ya2VyOiBXb3JrZXI7XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cblxuICAgIHByaXZhdGUgc3RhdGljIG9uSW5pdGlhbGl6ZWQoKTogdm9pZCB7XG4gICAgICAgIHBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiR290IGEgbW9kdWxlIVwiXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIG9uTWVzc2FnZShldmVudDogTWVzc2FnZUV2ZW50KTogdm9pZCB7XG4gICAgICAgIGxldCBkYXRhID0gZXZlbnQuZGF0YTtcbiAgICAgICAgZGF0YS53ZW50VG9Xb3JrZXIgPSB0cnVlO1xuICAgICAgICBwb3N0TWVzc2FnZShkYXRhKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZUFzeW5jKCk6IFByb21pc2U8RXhhbXBsZVdvcmtlcj4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8RXhhbXBsZVdvcmtlcj4oKHJlc29sdmU6ICh3b3JrZXI6IEV4YW1wbGVXb3JrZXIpID0+IHZvaWQpID0+IHtcbiAgICAgICAgICAgIGxldCBleGFtcGxlV29ya2VyID0gbmV3IEV4YW1wbGVXb3JrZXIoKTtcbiAgICAgICAgICAgIGV4YW1wbGVXb3JrZXIuX3dvcmtlciA9IERlZGljYXRlZFdvcmtlci5jcmVhdGVGcm9tTG9jYXRpb24oXG4gICAgICAgICAgICAgICAgRXhhbXBsZVdvcmtlci5NT0RVTEVfVVJMLFxuICAgICAgICAgICAgICAgIEV4YW1wbGVXb3JrZXIub25Jbml0aWFsaXplZCxcbiAgICAgICAgICAgICAgICBFeGFtcGxlV29ya2VyLm9uTWVzc2FnZSk7XG4gICAgICAgICAgICBleGFtcGxlV29ya2VyLl93b3JrZXIub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBleGFtcGxlV29ya2VyLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGV4YW1wbGVXb3JrZXIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNlbmRNZXNzYWdlQXN5bmMoZGF0YTogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlOiAodmFsdWU6IGFueSkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd29ya2VyLm9ubWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShldmVudC5kYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JrZXIub25tZXNzYWdlID0gRGVkaWNhdGVkV29ya2VyLnVuZXhwZWN0ZWRNZXNzYWdlSGFuZGxlcjtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3dvcmtlci5wb3N0TWVzc2FnZShkYXRhKTtcblxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG59IiwiZXhwb3J0IGNsYXNzIERlZGljYXRlZFdvcmtlciB7XG5cbiAgICBwcml2YXRlIHN0YXRpYyBjcmVhdGVGcm9tU291cmNlcyguLi5zb3VyY2VzOiBhbnlbXSk6IFdvcmtlciB7XG4gICAgICAgIGxldCB3b3JrZXJDb2RlOiBzdHJpbmcgPSBcIlwiO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzb3VyY2VzLmxlbmd0aCAtIDE7IGlkeCsrKSB7XG4gICAgICAgICAgICB3b3JrZXJDb2RlICs9IHNvdXJjZXNbaWR4XS50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHdvcmtlckNvZGUgKz0gXCIoXCIgKyBzb3VyY2VzW3NvdXJjZXMubGVuZ3RoIC0gMV0udG9TdHJpbmcoKSArIFwiKSgpO1wiO1xuICAgICAgICByZXR1cm4gbmV3IFdvcmtlcih3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbd29ya2VyQ29kZV0pKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVGcm9tTG9jYXRpb24oanNVcmw6IHN0cmluZywgb25Jbml0aWFsaXplZDogKCkgPT4gdm9pZCwgb25NZXNzYWdlOiAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4gdm9pZCk6IFdvcmtlciB7XG4gICAgICAgIGxldCBtb2R1bGVEZWZpdGlvbjogc3RyaW5nID0gYE1vZHVsZSA9IHtcbiAgICAgICAgICAgIGxvY2F0ZUZpbGU6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFxcXCJgICsganNVcmwucmVwbGFjZSgvLmpzJC8sIFwiLndhc21cIikgKyBgXFxcIjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJ1bnRpbWVJbml0aWFsaXplZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIChgICsgb25Jbml0aWFsaXplZC50b1N0cmluZygpICsgYCkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtgO1xuICAgICAgICBsZXQgbWVzc2FnZUhhbmRsZXI6IHN0cmluZyA9IFwidGhpcy5vbm1lc3NhZ2UgPSBcIiArIG9uTWVzc2FnZS50b1N0cmluZygpICsgXCI7XCI7XG4gICAgICAgIGxldCBpbXBvcnRKYXZhc2NyaXB0OiBzdHJpbmcgPSBcImZ1bmN0aW9uIGltcG9ydEphdmFzY3JpcHQoKSB7IGltcG9ydFNjcmlwdHMoXFxcIlwiICsganNVcmwgKyBcIlxcXCIpOyB9XCI7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZyb21Tb3VyY2VzKG1vZHVsZURlZml0aW9uLCBtZXNzYWdlSGFuZGxlciwgaW1wb3J0SmF2YXNjcmlwdCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyB1bmV4cGVjdGVkTWVzc2FnZUhhbmRsZXIoZXZlbnQ6IE1lc3NhZ2VFdmVudCk6IHZvaWQge1xuICAgICAgICB0aHJvdyBFcnJvcihcIlVuZXhwZWN0ZWQgbWVzc2FnZSBmcm9tIFdlYldvcmtlcjogXCIgKyBldmVudCk7XG4gICAgfVxufSJdfQ==
