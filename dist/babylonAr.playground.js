var externalDefine = window.define;var externalRequire = window.require;window.define = undefined;window.require = undefined;
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).BabylonAR=e()}}(function(){return function o(i,s,c){function d(t,e){if(!s[t]){if(!i[t]){var r="function"==typeof require&&require;if(!e&&r)return r(t,!0);if(u)return u(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var a=s[t]={exports:{}};i[t][0].call(a.exports,function(e){return d(i[t][1][e]||e)},a,a.exports,o,i,s,c)}return s[t].exports}for(var u="function"==typeof require&&require,e=0;e<c.length;e++)d(c[e]);return d}({1:[function(n,e,a){(function(e){"use strict";var t=this&&this.__awaiter||function(e,i,s,c){return new(s=s||Promise)(function(r,t){function n(e){try{o(c.next(e))}catch(e){t(e)}}function a(e){try{o(c.throw(e))}catch(e){t(e)}}function o(e){var t;e.done?r(e.value):((t=e.value)instanceof s?t:new s(function(e){e(t)})).then(n,a)}o((c=c.apply(e,i||[])).next())})},c=this&&this.__generator||function(r,n){var a,o,i,e,s={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return e={next:t(0),throw:t(1),return:t(2)},"function"==typeof Symbol&&(e[Symbol.iterator]=function(){return this}),e;function t(t){return function(e){return function(t){if(a)throw new TypeError("Generator is already executing.");for(;s;)try{if(a=1,o&&(i=2&t[0]?o.return:t[0]?o.throw||((i=o.return)&&i.call(o),0):o.next)&&!(i=i.call(o,t[1])).done)return i;switch(o=0,i&&(t=[2&t[0],i.value]),t[0]){case 0:case 1:i=t;break;case 4:return s.label++,{value:t[1],done:!1};case 5:s.label++,o=t[1],t=[0];continue;case 7:t=s.ops.pop(),s.trys.pop();continue;default:if(!(i=0<(i=s.trys).length&&i[i.length-1])&&(6===t[0]||2===t[0])){s=0;continue}if(3===t[0]&&(!i||t[1]>i[0]&&t[1]<i[3])){s.label=t[1];break}if(6===t[0]&&s.label<i[1]){s.label=i[1],i=t;break}if(i&&s.label<i[2]){s.label=i[2],s.ops.push(t);break}i[2]&&s.ops.pop(),s.trys.pop();continue}t=n.call(r,s)}catch(e){t=[6,e],o=0}finally{a=i=0}if(5&t[0])throw t[1];return{value:t[0]?t[1]:void 0,done:!0}}([t,e])}}};Object.defineProperty(a,"__esModule",{value:!0});var d="undefined"!=typeof window?window.BABYLON:void 0!==e?e.BABYLON:null,i=n("./arUcoMetaMarkerTracker"),u=n("../shared/trackedNode"),r=(s.prototype.addTrackableObjectAsync=function(n,a,o,i,s){return t(this,void 0,void 0,function(){var t,r;return c(this,function(e){switch(e.label){case 0:return[4,this._tracker.addMarker(n,a,o,i,s)];case 1:return t=e.sent(),(r=new u.TrackedNode(n+"_"+a+"_"+o+"_"+i,this._scene,!0)).rotationQuaternion=d.Quaternion.Identity(),[2,this._trackedNodes[t.id]=r]}})})},s.prototype.startTracking=function(){var r=this,n=!1;this._runTrackingObserver=this._scene.onAfterRenderObservable.add(function(){n||(n=!0,r._tracker.updateAsync().then(function(){for(var e in r._trackedNodes){var t=r._tracker.markers[e];r._trackedNodes[e].setTracking(t.position,t.rotation,.98<t.confidence)}n=!1}))})},s.prototype.stopTracking=function(){this._scene.onAfterRenderObservable.remove(this._runTrackingObserver),this._runTrackingObserver=null},s.CreateAsync=function(n,a,o){return void 0===o&&(o=1),t(this,void 0,void 0,function(){var t,r;return c(this,function(e){switch(e.label){case 0:return t=new s(a),r=t,[4,i.ArUcoMetaMarkerTracker.CreateAsync(n)];case 1:return r._tracker=e.sent(),[4,t.setCalibrationAsync(n,o)];case 2:return e.sent(),[2,t]}})})},s.prototype.setCalibrationAsync=function(e,t){return this._tracker.setCalibrationAsync(Math.round(t*e.getSize().width),Math.round(t*e.getSize().height))},s);function s(e){this._runTrackingObserver=null,this._trackedNodes={},this._scene=e}a.ArUcoMetaMarkerObjectTracker=r}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"../shared/trackedNode":13,"./arUcoMetaMarkerTracker":2}],2:[function(o,e,i){(function(e){"use strict";Object.defineProperty(i,"__esModule",{value:!0});var t="undefined"!=typeof window?window.BABYLON:void 0!==e?e.BABYLON:null,s=o("../shared/dedicatedWorker"),n=o("../shared/constants"),c=function(e){this.id=e,this.confidence=0,this.position=t.Vector3.Zero(),this.rotation=t.Quaternion.Identity()};i.ArUcoMetaMarker=c;var r=(a.onInitialized=function(){Module._reset(),postMessage({initialized:!0})},a.onMessage=function(e){var t=e.data;if(t.reset)Module._reset(),postMessage({reset:!0});else if(t.calibrate)Module._set_calibration_from_frame_size(t.width,t.height),postMessage({calibrated:!0});else if(t.addMarker){var r=Module._add_marker(t.ul,t.ur,t.ll,t.lr,t.width);postMessage({added:!0,id:r})}else if(t.track){var n=Module._malloc(t.imageData.length*t.imageData.BYTES_PER_ELEMENT);Module.HEAP8.set(t.imageData,n);var d=[];Module._update_marker_tracking=function(e,t,r,n,a,o,i,s,c){d=d.concat([e,t,r,n,a,o,i,s,c])},Module._process_image(t.width,t.height,n),Module._update_marker_tracking=function(){},Module._free(n),postMessage({markers:d})}},a.CreateAsync=function(e){return new Promise(function(t){var r=new a(e);r._worker=s.DedicatedWorker.createFromLocation(n.ARUCO_META_MARKER_TRACKER_URL,a.onInitialized,a.onMessage),r._worker.onmessage=function(e){r._worker.onmessage=s.DedicatedWorker.unexpectedMessageHandler,t(r)}})},a.prototype.setCalibrationAsync=function(e,t){var n=this,r=new Promise(function(t,r){n._worker.onmessage=function(e){n._worker.onmessage=s.DedicatedWorker.unexpectedMessageHandler,e.data.calibrated?t():r(e.data)}});return this._worker.postMessage({calibrate:!0,width:e,height:t}),r},a.prototype.addMarker=function(e,t,r,n,a){var o=this,i=new Promise(function(r,n){o._worker.onmessage=function(e){if(o._worker.onmessage=s.DedicatedWorker.unexpectedMessageHandler,e.data.added){var t=e.data.id;o.markers[t]=new c(t),r(o.markers[t])}else n(e.data)}});return this._worker.postMessage({addMarker:!0,ul:e,ur:t,ll:r,lr:n,width:a}),i},a.prototype.updateAsync=function(){var i=this,e=new Promise(function(a,o){i._worker.onmessage=function(e){if(i._worker.onmessage=s.DedicatedWorker.unexpectedMessageHandler,e.data.markers){for(var t=e.data.markers,r=0;r<t.length;r+=9){var n=i.markers[t[r]];n.confidence=t[r+1],n.position.set(t[r+2],t[r+3],t[r+4]),n.rotation.set(t[r+5],t[r+6],t[r+7],t[r+8])}a()}else o(e.data)}});return this._worker.postMessage({track:!0,width:this._videoTexture.getSize().width,height:this._videoTexture.getSize().height,imageData:this._videoTexture.readPixels()}),e},a);function a(e){this.markers={},this._videoTexture=e}i.ArUcoMetaMarkerTracker=r}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"../shared/constants":10,"../shared/dedicatedWorker":11}],3:[function(e,t,r){"use strict";function n(e){for(var t in e)r.hasOwnProperty(t)||(r[t]=e[t])}Object.defineProperty(r,"__esModule",{value:!0}),n(e("./arUcoMetaMarkerObjectTracker/arUcoMetaMarkerObjectTracker")),n(e("./core/index")),n(e("./exampleWorker/exampleWorker")),n(e("./exampleObjectTracker/exampleObjectTracker")),n(e("./imageTemplateTracker/imageTemplateTracker"))},{"./arUcoMetaMarkerObjectTracker/arUcoMetaMarkerObjectTracker":1,"./core/index":4,"./exampleObjectTracker/exampleObjectTracker":7,"./exampleWorker/exampleWorker":8,"./imageTemplateTracker/imageTemplateTracker":9}],4:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),function(e){for(var t in e)r.hasOwnProperty(t)||(r[t]=e[t])}(e("./objectTrackerCamera"))},{"./objectTrackerCamera":5}],5:[function(e,t,i){(function(e){"use strict";var n,t=this&&this.__extends||(n=function(e,t){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])})(e,t)},function(e,t){function r(){this.constructor=e}n(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)}),r=this&&this.__awaiter||function(e,i,s,c){return new(s=s||Promise)(function(r,t){function n(e){try{o(c.next(e))}catch(e){t(e)}}function a(e){try{o(c.throw(e))}catch(e){t(e)}}function o(e){var t;e.done?r(e.value):((t=e.value)instanceof s?t:new s(function(e){e(t)})).then(n,a)}o((c=c.apply(e,i||[])).next())})},d=this&&this.__generator||function(r,n){var a,o,i,e,s={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return e={next:t(0),throw:t(1),return:t(2)},"function"==typeof Symbol&&(e[Symbol.iterator]=function(){return this}),e;function t(t){return function(e){return function(t){if(a)throw new TypeError("Generator is already executing.");for(;s;)try{if(a=1,o&&(i=2&t[0]?o.return:t[0]?o.throw||((i=o.return)&&i.call(o),0):o.next)&&!(i=i.call(o,t[1])).done)return i;switch(o=0,i&&(t=[2&t[0],i.value]),t[0]){case 0:case 1:i=t;break;case 4:return s.label++,{value:t[1],done:!1};case 5:s.label++,o=t[1],t=[0];continue;case 7:t=s.ops.pop(),s.trys.pop();continue;default:if(!(i=0<(i=s.trys).length&&i[i.length-1])&&(6===t[0]||2===t[0])){s=0;continue}if(3===t[0]&&(!i||t[1]>i[0]&&t[1]<i[3])){s.label=t[1];break}if(6===t[0]&&s.label<i[1]){s.label=i[1],i=t;break}if(i&&s.label<i[2]){s.label=i[2],s.ops.push(t);break}i[2]&&s.ops.pop(),s.trys.pop();continue}t=n.call(r,s)}catch(e){t=[6,e],o=0}finally{a=i=0}if(5&t[0])throw t[1];return{value:t[0]?t[1]:void 0,done:!0}}([t,e])}}};Object.defineProperty(i,"__esModule",{value:!0});var a,u="undefined"!=typeof window?window.BABYLON:void 0!==e?e.BABYLON:null,o=(a=u.Camera,t(l,a),l.CreateAsync=function(s,c){return r(this,void 0,void 0,function(){var t,r,n,a,o,i;return d(this,function(e){switch(e.label){case 0:return c.clearColor.set(0,0,0,1),(t=new l(s,c)).fovMode=u.Camera.FOVMODE_VERTICAL_FIXED,t.fov=u.Tools.ToRadians(40),r={maxWidth:640,maxHeight:480,minWidth:640,minHeight:480,deviceId:""},[4,navigator.mediaDevices.enumerateDevices()];case 1:return e.sent().forEach(function(e){"videoinput"===e.kind&&(r.deviceId=e.deviceId)}),n=t,[4,u.VideoTexture.CreateFromWebCamAsync(c,r)];case 2:return n.videoTexture=e.sent(),t._layer.texture=t.videoTexture,t._layer.texture.wrapU=u.Texture.CLAMP_ADDRESSMODE,t._layer.texture.wrapV=u.Texture.WRAP_ADDRESSMODE,t._layer.texture.vScale=-1,a=t._layer.texture.getSize(),o=a.width/a.height,t._beforeRenderObserver=t._layer.onBeforeRenderObservable.add(function(){(i=c.getEngine().getScreenAspectRatio()/o)<1?(t.viewport.x=0,t.viewport.width=1,t._layer.texture.uScale=i,t._layer.texture.uOffset=(1-i)/2):(t.viewport.width=1/i,t.viewport.x=(1-t.viewport.width)/2,t._layer.texture.uScale=1,t._layer.texture.uOffset=0)}),[2,t]}})})},l.prototype.dispose=function(){this._layer.onBeforeRenderObservable.remove(this._beforeRenderObserver),this._layer.dispose(),a.prototype.dispose.call(this)},l);function l(e,t){var r=a.call(this,e,u.Vector3.Zero(),t)||this;return r._layer=new u.Layer(e+"_backgroundLayer",null,t),r}i.ObjectTrackerCamera=o}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],6:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var a=e("../shared/dedicatedWorker"),n=e("../shared/constants"),o=(i.onInitialized=function(){Module._reset(),postMessage({initialized:!0})},i.onMessage=function(e){var t=e.data;if(t.reset)Module._reset(),postMessage({reset:!0});else if(t.calibrate)Module._set_calibration_from_frame_size(t.width,t.height),postMessage({calibrated:!0});else if(t.track){var r=Module._malloc(t.imageData.length*t.imageData.BYTES_PER_ELEMENT);Module.HEAP8.set(t.imageData,r);var n=Module._process_image(t.width,t.height,r,1);Module._free(r);for(var a=[],o=0,i=0,s=0,c=0,d=0,u=0,l=0,_=0,f=0;f<n;f++){var h=Module._get_tracked_marker(f);o=0,i=Module.getValue(h+o,"i32"),o+=12,s=Module.getValue(h+o,"double"),o+=8,c=Module.getValue(h+o,"double"),o+=8,d=Module.getValue(h+o,"double"),o+=8,u=Module.getValue(h+o,"double"),o+=8,l=Module.getValue(h+o,"double"),o+=8,_=Module.getValue(h+o,"double"),a.push({id:i,tx:s,ty:c,tz:d,rx:u,ry:l,rz:_})}postMessage({markers:a})}},i.CreateAsync=function(){return new Promise(function(t){var r=new i;r._worker=a.DedicatedWorker.createFromLocation(n.EXAMPLE_MODULE_URL,i.onInitialized,i.onMessage),r._worker.onmessage=function(e){r._worker.onmessage=a.DedicatedWorker.unexpectedMessageHandler,t(r)}})},i.prototype.setCalibrationAsync=function(e,t){var n=this,r=new Promise(function(t,r){n._worker.onmessage=function(e){n._worker.onmessage=a.DedicatedWorker.unexpectedMessageHandler,e.data.calibrated?t():r(e.data)}});return this._worker.postMessage({calibrate:!0,width:e,height:t}),r},i.prototype.findMarkersInImageAsync=function(e){var n=this,t=new Promise(function(t,r){n._worker.onmessage=function(e){n._worker.onmessage=a.DedicatedWorker.unexpectedMessageHandler,e.data.markers?t(e.data.markers):r(e.data)}});return this._worker.postMessage({track:!0,width:e.getSize().width,height:e.getSize().height,imageData:e.readPixels()}),t},i);function i(){}r.ExampleMarkerTracker=o},{"../shared/constants":10,"../shared/dedicatedWorker":11}],7:[function(s,e,c){(function(e){"use strict";Object.defineProperty(c,"__esModule",{value:!0});var o="undefined"!=typeof window?window.BABYLON:void 0!==e?e.BABYLON:null,n=s("./exampleMarkerTracker"),r=s("../shared/filteredVector3"),i=s("../shared/trackedNode"),t=(a.prototype.addTrackableObject=function(e,t,r,n){var a=[e,t,r,n].toString();return this._trackableObjects.add(a,new i.TrackedNode(a.toString(),this._scene)),this._trackableObjects.get(a)},a.prototype.processResults=function(n){var a=this;this._trackableObjects.forEach(function(e,t){var r=e.split(",");a.__ulId=parseInt(r[0]),a.__urId=parseInt(r[1]),a.__llId=parseInt(r[2]),a.__lrId=parseInt(r[3]),a.__posEstimate.set(0,0,0),a.__posEstimateCount=0,a.__rightEstimate.set(0,0,0),a.__rightEstimateCount=0,a.__forwardEstimate.set(0,0,0),a.__forwardEstimateCount=0,n[a.__llId]&&(n[a.__urId]&&(a.__scratchVec.set(0,0,0),a.__scratchVec.addInPlace(n[a.__llId].position),a.__scratchVec.addInPlace(n[a.__urId].position),a.__scratchVec.scaleInPlace(.5),a.__posEstimate.addInPlace(a.__scratchVec),a.__posEstimateCount+=1),n[a.__lrId]&&(a.__scratchVec.set(0,0,0),a.__scratchVec.addInPlace(n[a.__lrId].position),a.__scratchVec.subtractInPlace(n[a.__llId].position),a.__scratchVec.normalize(),a.__rightEstimate.addInPlace(a.__scratchVec),a.__rightEstimateCount+=1),n[a.__ulId]&&(a.__scratchVec.set(0,0,0),a.__scratchVec.addInPlace(n[a.__ulId].position),a.__scratchVec.subtractInPlace(n[a.__llId].position),a.__scratchVec.normalize(),a.__forwardEstimate.addInPlace(a.__scratchVec),a.__forwardEstimateCount+=1)),n[a.__urId]&&(n[a.__lrId]&&(a.__scratchVec.set(0,0,0),a.__scratchVec.addInPlace(n[a.__urId].position),a.__scratchVec.subtractInPlace(n[a.__lrId].position),a.__scratchVec.normalize(),a.__forwardEstimate.addInPlace(a.__scratchVec),a.__forwardEstimateCount+=1),n[a.__ulId]&&(a.__scratchVec.set(0,0,0),a.__scratchVec.addInPlace(n[a.__urId].position),a.__scratchVec.subtractInPlace(n[a.__ulId].position),a.__scratchVec.normalize(),a.__rightEstimate.addInPlace(a.__scratchVec),a.__rightEstimateCount+=1)),n[a.__lrId]&&n[a.__ulId]&&(a.__scratchVec.set(0,0,0),a.__scratchVec.addInPlace(n[a.__lrId].position),a.__scratchVec.addInPlace(n[a.__ulId].position),a.__scratchVec.scaleInPlace(.5),a.__posEstimate.addInPlace(a.__scratchVec),a.__posEstimateCount+=1),0<a.__posEstimateCount*a.__rightEstimateCount*a.__forwardEstimateCount?(a.__posEstimate.scaleInPlace(1/a.__posEstimateCount),a.__rightEstimate.scaleInPlace(1/a.__rightEstimateCount),a.__forwardEstimate.scaleInPlace(1/a.__forwardEstimateCount),a.__filteredPos.addSample(a.__posEstimate),a.__filteredRight.addSample(a.__rightEstimate),a.__filteredForward.addSample(a.__forwardEstimate),a.__targetPosition.copyFrom(a.__filteredPos),o.Quaternion.RotationQuaternionFromAxisToRef(a.__filteredRight,o.Vector3.Cross(a.__filteredForward,a.__filteredRight),a.__filteredForward,a.__targetRotation),t.setTracking(a.__targetPosition,a.__targetRotation,!0)):t.setTracking(a.__targetPosition,a.__targetRotation,!1)})},a.prototype.setCalibrationAsync=function(e){return void 0===e&&(e=1),this._tracker.setCalibrationAsync(Math.round(e*this._videoTexture.getSize().width),Math.round(e*this._videoTexture.getSize().height))},a.getQuaternionFromRodrigues=function(e,t,r){var n=new o.Vector3(-e,t,-r),a=n.length();return n.scaleInPlace(1/a),0!==a?o.Quaternion.RotationAxis(n,a):null},a.prototype.startTracking=function(){var r=this,n=!1;this._runTrackingObserver=this._scene.onAfterRenderObservable.add(function(){n||(n=!0,r._tracker.findMarkersInImageAsync(r._videoTexture).then(function(e){if(e){var t={};e.forEach(function(e){t[e.id]={position:new o.Vector3(e.tx,-e.ty,e.tz),rotation:a.getQuaternionFromRodrigues(e.rx,e.ry,e.rz)}}),r.processResults(t)}n=!1}))})},a.prototype.stopTracking=function(){this._scene.onAfterRenderObservable.remove(this._runTrackingObserver),this._runTrackingObserver=null},a.CreateAsync=function(e,t){var r=new a(e,t);return n.ExampleMarkerTracker.CreateAsync().then(function(e){return r._tracker=e,r.setCalibrationAsync()}).then(function(){return r})},a);function a(e,t){this._runTrackingObserver=null,this._trackableObjects=new o.StringDictionary,this.__posEstimate=o.Vector3.Zero(),this.__posEstimateCount=0,this.__rightEstimate=o.Vector3.Zero(),this.__rightEstimateCount=0,this.__forwardEstimate=o.Vector3.Zero(),this.__forwardEstimateCount=0,this.__scratchVec=o.Vector3.Zero(),this.__filteredPos=new r.FilteredVector3(0,0,0),this.__filteredRight=new r.FilteredVector3(0,0,0),this.__filteredForward=new r.FilteredVector3(0,0,0),this.__targetPosition=o.Vector3.Zero(),this.__targetRotation=o.Quaternion.Identity(),this.__ulId=-1,this.__urId=-1,this.__llId=-1,this.__lrId=-1,this._scene=t,this._videoTexture=e}c.ExampleObjectTracker=t}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"../shared/filteredVector3":12,"../shared/trackedNode":13,"./exampleMarkerTracker":6}],8:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n=e("../shared/dedicatedWorker"),a=e("../shared/constants"),o=(i.onInitialized=function(){postMessage({message:"Got a module!"})},i.onMessage=function(e){var t=e.data;t.wentToWorker=!0,postMessage(t)},i.CreateAsync=function(){return new Promise(function(t){var r=new i;r._worker=n.DedicatedWorker.createFromLocation(a.EXAMPLE_MODULE_URL,i.onInitialized,i.onMessage),r._worker.onmessage=function(e){r._worker.onmessage=n.DedicatedWorker.unexpectedMessageHandler,t(r)}})},i.prototype.sendMessageAsync=function(e){var r=this,t=new Promise(function(t){r._worker.onmessage=function(e){t(e.data),r._worker.onmessage=n.DedicatedWorker.unexpectedMessageHandler}});return this._worker.postMessage(e),t},i);function i(){}r.ExampleWorker=o},{"../shared/constants":10,"../shared/dedicatedWorker":11}],9:[function(d,e,u){(function(e){"use strict";var n,t=this&&this.__extends||(n=function(e,t){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])})(e,t)},function(e,t){function r(){this.constructor=e}n(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)});Object.defineProperty(u,"__esModule",{value:!0});var r,o="undefined"!=typeof window?window.BABYLON:void 0!==e?e.BABYLON:null,i=d("../shared/dedicatedWorker"),a=d("../shared/constants"),s=(r=o.Observable,t(c,r),c.onInitialized=function(){postMessage({initialized:!0})},c.onMessage=function(e){var t=e.data;if(t.initialize){var r=Module._malloc(t.imageData.length*t.imageData.BYTES_PER_ELEMENT);Module.HEAP8.set(t.imageData,r),Module._initialize(t.width,t.height,r,t.x,t.y),Module._free(r),postMessage({initialized:!0})}else if(t.uninitialize)Module._uninitialize(),postMessage({uninitialized:!0});else if(t.track){r=Module._malloc(t.imageData.length*t.imageData.BYTES_PER_ELEMENT),Module.HEAP8.set(t.imageData,r);var n=!1,a=-1,o=-1;Module._update_template_position=function(e,t){n=!0,a=e,o=t},Module._track_template_in_image(t.width,t.height,r),Module._update_template_position=function(){},Module._free(r),postMessage({tracked:n,x:a,y:o})}},c.CreateAsync=function(e){return new Promise(function(t){var r=new c(e);r._worker=i.DedicatedWorker.createFromLocation(a.IMAGE_TEMPLATE_TRACKER_URL,c.onInitialized,c.onMessage),r._worker.onmessage=function(e){r._worker.onmessage=i.DedicatedWorker.unexpectedMessageHandler,t(r)}})},c.prototype.startTracking=function(e,t){var a=this;this._tracking=!0,this._trackingLoop=new Promise(function(n){a._worker.onmessage=function(){function t(e){e.tracked?(r.set(e.x,e.y),a.notifyObservers(r)):a.notifyObservers(null),a._tracking?a._worker.postMessage({track:!0,width:a._videoTexture.getSize().width,height:a._videoTexture.getSize().height,imageData:a._videoTexture.readPixels()}):(a._worker.onmessage=function(){a._worker.onmessage=i.DedicatedWorker.unexpectedMessageHandler,n()},a._worker.postMessage({uninitialize:!0}))}var r=o.Vector2.Zero();a._worker.onmessage=function(e){t(e.data)},t({tracked:!1,x:-1,y:-1})},a._worker.postMessage({initialize:!0,x:e,y:t,width:a._videoTexture.getSize().width,height:a._videoTexture.getSize().height,imageData:a._videoTexture.readPixels()})})},c.prototype.stopTrackingAsync=function(){return this._tracking=!1,this._trackingLoop},c);function c(e){var t=r.call(this)||this;return t._videoTexture=e,t}u.ImageTemplateTracker=s}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"../shared/constants":10,"../shared/dedicatedWorker":11}],10:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n="https://ar.babylonjs.com/wasm/";r.EXAMPLE_MODULE_URL=n+"webpiled-aruco-ar.js",r.ARUCO_META_MARKER_TRACKER_URL=n+"aruco-meta-marker-tracker.js",r.IMAGE_TEMPLATE_TRACKER_URL=n+"image-template-tracker.js"},{}],11:[function(e,t,r){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n=(a.createFromSources=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];for(var r="",n=0;n<e.length-1;n++)r+=e[n].toString();return r+="("+e[e.length-1].toString()+")();",new Worker(window.URL.createObjectURL(new Blob([r])))},a.createFromLocation=function(e,t,r){var n='Module = {\n            locateFile: function (path) {\n                return "'+e.replace(/.js$/,".wasm")+'";\n            },\n            onRuntimeInitialized: function () {\n                ('+t.toString()+")();\n            }\n        };",a="this.onmessage = "+r.toString()+";",o='function importJavascript() { importScripts("'+e+'"); }';return this.createFromSources(n,a,o)},a.unexpectedMessageHandler=function(e){throw Error("Unexpected message from WebWorker: "+e)},a);function a(){}r.DedicatedWorker=n},{}],12:[function(e,t,o){(function(e){"use strict";var n,t=this&&this.__extends||(n=function(e,t){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])})(e,t)},function(e,t){function r(){this.constructor=e}n(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)});Object.defineProperty(o,"__esModule",{value:!0});var i,s="undefined"!=typeof window?window.BABYLON:void 0!==e?e.BABYLON:null,r=(i=s.Vector3,t(a,i),a.prototype.addSample=function(e){this._sampleAverage.scaleInPlace(this._samples.length),this._sampleAverage.subtractInPlace(this._samples[this._idx]),this._samples[this._idx].copyFrom(e),this._sampleAverage.addInPlace(this._samples[this._idx]),this._sampleAverage.scaleInPlace(1/this._samples.length),this._idx=(this._idx+1)%this._samples.length;for(var t=0,r=0;r<this._samples.length;++r)this._sampleSquaredDistances[r]=s.Vector3.DistanceSquared(this._sampleAverage,this._samples[r]),t+=this._sampleSquaredDistances[r];t/=this._samples.length;var n=0;for(this.set(0,0,0),r=0;r<=this._samples.length;++r)this._sampleSquaredDistances[r]<=t&&(this.addInPlace(this._samples[r]),n+=1);this.scaleInPlace(1/n)},a);function a(e,t,r,n){void 0===n&&(n=1);var a=i.call(this,e,t,r)||this;a._idx=0,a._samples=[],a._sampleSquaredDistances=[];for(var o=0;o<n;++o)a._samples.push(new s.Vector3(e,t,r)),a._sampleSquaredDistances.push(0);return a._sampleAverage=new s.Vector3(e,t,r),a}o.FilteredVector3=r}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],13:[function(e,t,s){(function(e){"use strict";var n,t=this&&this.__extends||(n=function(e,t){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])})(e,t)},function(e,t){function r(){this.constructor=e}n(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)});Object.defineProperty(s,"__esModule",{value:!0});var a,o="undefined"!=typeof window?window.BABYLON:void 0!==e?e.BABYLON:null,r=(a=o.TransformNode,t(i,a),i.prototype.isTracking=function(){return this._isTracking},i.prototype.setTracking=function(e,t,r){this.position.copyFrom(e),this.rotationQuaternion?this.rotationQuaternion.copyFrom(t):this.rotationQuaternion=t.clone(),r?this._notTrackedFramesCount=0:(this._notTrackedFramesCount+=1,this._notTrackedFramesCount<5&&(r=!0)),!this._isTracking&&r?this.onTrackingAcquiredObservable.notifyObservers(this):this._isTracking&&!r&&this.onTrackingLostObservable.notifyObservers(this),this._isTracking=r,this.setEnabled(!this.disableWhenNotTracked||this._isTracking)},i);function i(e,t,r){void 0===r&&(r=!0);var n=a.call(this,e,t,!0)||this;return n._isTracking=!1,n.disableWhenNotTracked=r,n.disableWhenNotTracked&&n.setEnabled(!1),n._notTrackedFramesCount=10,n.onTrackingAcquiredObservable=new o.Observable(function(e){n._isTracking&&n.onTrackingAcquiredObservable.notifyObserver(e,n)}),n.onTrackingLostObservable=new o.Observable,n.rotationQuaternion=o.Quaternion.Identity(),n}s.TrackedNode=r}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[3])(3)});
window.define = externalDefine;window.require = externalRequire;
