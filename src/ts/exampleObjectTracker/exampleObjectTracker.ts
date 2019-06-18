import { Nullable, Observer, Quaternion, Scene, StringDictionary, Vector3, VideoTexture } from "babylonjs";

import { ExampleMarkerTracker } from "./exampleMarkerTracker"
import { FilteredVector3 } from "../shared/filteredVector3"
import { TrackedNode } from "../shared/trackedNode"

export class ArUcoMetaMarkerObjectTracker {
    private _scene: Scene;
    private _videoTexture: VideoTexture;
    private _runTrackingObserver: Nullable<Observer<Scene>> = null;
    private _tracker: ExampleMarkerTracker;
    private _trackableObjects: StringDictionary<TrackedNode> = new StringDictionary<TrackedNode>();

    private __posEstimate: Vector3 = Vector3.Zero();
    private __posEstimateCount: number = 0;
    private __rightEstimate: Vector3 = Vector3.Zero();
    private __rightEstimateCount: number = 0;
    private __forwardEstimate: Vector3 = Vector3.Zero();
    private __forwardEstimateCount: number = 0;
    private __scratchVec: Vector3 = Vector3.Zero();
    private __filteredPos: FilteredVector3 = new FilteredVector3(0.0, 0.0, 0.0);
    private __filteredRight: FilteredVector3 = new FilteredVector3(0.0, 0.0, 0.0);
    private __filteredForward: FilteredVector3 = new FilteredVector3(0.0, 0.0, 0.0);
    private __targetPosition: Vector3 = Vector3.Zero();
    private __targetRotation: Quaternion = Quaternion.Identity();
    private __ulId: number = -1;
    private __urId: number = -1;
    private __llId: number = -1;
    private __lrId: number = -1;

    constructor(videoTexture: VideoTexture, scene: Scene) {
        this._scene = scene;
        this._videoTexture = videoTexture;
    }

    addTrackableObject(ul: number, ur: number, ll: number, lr: number) {
        const descriptor = [ul, ur, ll, lr].toString();
        this._trackableObjects.add(descriptor, new TrackedNode(descriptor.toString(), this._scene));
        return this._trackableObjects.get(descriptor);
    }

    processResults(results: any) {
        // TODO: THIS IS HACKED CODE

        this._trackableObjects.forEach((descriptor: string, trackedObject: TrackedNode) => {
            var nums = descriptor.split(',');
            this.__ulId = parseInt(nums[0]);
            this.__urId = parseInt(nums[1]);
            this.__llId = parseInt(nums[2]);
            this.__lrId = parseInt(nums[3]);

            this.__posEstimate.set(0.0, 0.0, 0.0);
            this.__posEstimateCount = 0.0;
            this.__rightEstimate.set(0.0, 0.0, 0.0);
            this.__rightEstimateCount = 0.0;
            this.__forwardEstimate.set(0.0, 0.0, 0.0);
            this.__forwardEstimateCount = 0.0;

            if (results[this.__llId]) {
                if (results[this.__urId]) {
                    this.__scratchVec.set(0.0, 0.0, 0.0);
                    this.__scratchVec.addInPlace(results[this.__llId].position);
                    this.__scratchVec.addInPlace(results[this.__urId].position);
                    this.__scratchVec.scaleInPlace(0.5);
                    
                    this.__posEstimate.addInPlace(this.__scratchVec);
                    this.__posEstimateCount += 1.0;
                }

                if (results[this.__lrId]) {
                    this.__scratchVec.set(0.0, 0.0, 0.0);
                    this.__scratchVec.addInPlace(results[this.__lrId].position);
                    this.__scratchVec.subtractInPlace(results[this.__llId].position);
                    this.__scratchVec.normalize();
                    
                    this.__rightEstimate.addInPlace(this.__scratchVec);
                    this.__rightEstimateCount += 1.0;
                }
                
                if (results[this.__ulId]) {
                    this.__scratchVec.set(0.0, 0.0, 0.0);
                    this.__scratchVec.addInPlace(results[this.__ulId].position);
                    this.__scratchVec.subtractInPlace(results[this.__llId].position);
                    this.__scratchVec.normalize();
                    
                    this.__forwardEstimate.addInPlace(this.__scratchVec);
                    this.__forwardEstimateCount += 1.0;
                }
            }

            if (results[this.__urId]) {
                if (results[this.__lrId]) {
                    this.__scratchVec.set(0.0, 0.0, 0.0);
                    this.__scratchVec.addInPlace(results[this.__urId].position);
                    this.__scratchVec.subtractInPlace(results[this.__lrId].position);
                    this.__scratchVec.normalize();
                    
                    this.__forwardEstimate.addInPlace(this.__scratchVec);
                    this.__forwardEstimateCount += 1.0;
                }
                
                if (results[this.__ulId]) {
                    this.__scratchVec.set(0.0, 0.0, 0.0);
                    this.__scratchVec.addInPlace(results[this.__urId].position);
                    this.__scratchVec.subtractInPlace(results[this.__ulId].position);
                    this.__scratchVec.normalize();
                    
                    this.__rightEstimate.addInPlace(this.__scratchVec);
                    this.__rightEstimateCount += 1.0;
                }
            }

            if (results[this.__lrId] && results[this.__ulId]) {
                this.__scratchVec.set(0.0, 0.0, 0.0);
                this.__scratchVec.addInPlace(results[this.__lrId].position);
                this.__scratchVec.addInPlace(results[this.__ulId].position);
                this.__scratchVec.scaleInPlace(0.5);
                
                this.__posEstimate.addInPlace(this.__scratchVec);
                this.__posEstimateCount += 1.0;
            }

            if (this.__posEstimateCount * this.__rightEstimateCount * this.__forwardEstimateCount > 0) {
                this.__posEstimate.scaleInPlace(1.0 / this.__posEstimateCount);
                this.__rightEstimate.scaleInPlace(1.0 / this.__rightEstimateCount);
                this.__forwardEstimate.scaleInPlace(1.0 / this.__forwardEstimateCount);

                this.__filteredPos.addSample(this.__posEstimate);
                this.__filteredRight.addSample(this.__rightEstimate);
                this.__filteredForward.addSample(this.__forwardEstimate);

                this.__targetPosition.copyFrom(this.__filteredPos);
                Quaternion.RotationQuaternionFromAxisToRef(
                    this.__filteredRight, 
                    Vector3.Cross(this.__filteredForward, this.__filteredRight), 
                    this.__filteredForward,
                    this.__targetRotation);

                trackedObject.setTracking(
                    this.__targetPosition, 
                    this.__targetRotation, 
                    true);
            }
            else {
                trackedObject.setTracking(
                    this.__targetPosition, 
                    this.__targetRotation, 
                    true);
            }
        });
    }

    setCalibrationAsync(scalar = 1) {
        return this._tracker.setCalibrationAsync(
            Math.round(scalar * this._videoTexture.getSize().width), 
            Math.round(scalar * this._videoTexture.getSize().height));
    }

    static getQuaternionFromRodrigues(x: number, y: number, z: number) {
        var rot = new Vector3(-x, y, -z);
        var theta = rot.length();
        rot.scaleInPlace(1.0 / theta);
        if (theta !== 0.0) {
            return Quaternion.RotationAxis(rot, theta);
        }
        else {
            return null;
        }
    };

    startTracking() {
        var running = false;
        this._runTrackingObserver = this._scene.onAfterRenderObservable.add(() => {
            if (!running) {
                running = true;

                this._tracker.findMarkersInImageAsync(this._videoTexture).then(markers => {
                    if (markers) {
                        var results: any = {};

                        markers.forEach(marker => {
                            results[marker.id] = {
                                position: new Vector3(marker.tx, -marker.ty, marker.tz),
                                rotation: ArUcoMetaMarkerObjectTracker.getQuaternionFromRodrigues(marker.rx, marker.ry, marker.rz)
                            }
                        });

                        this.processResults(results);
                    }

                    running = false;
                });
            }
        });
    }

    stopTracking() {
        this._scene.onAfterRenderObservable.remove(this._runTrackingObserver);
        this._runTrackingObserver = null;
    }

    static createAsync(videoTexture: VideoTexture, scene: Scene) {
        var objectTracker = new ArUcoMetaMarkerObjectTracker(videoTexture, scene);
        return ExampleMarkerTracker.createAsync().then(tracker => {
            objectTracker._tracker = tracker;
            return objectTracker.setCalibrationAsync();
        }).then(() => {
            return objectTracker;
        });
    }
}