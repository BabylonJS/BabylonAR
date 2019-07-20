import { Nullable, Observer, Quaternion, Scene, StringDictionary, Vector3, VideoTexture, Tools } from "babylonjs";

import { ArUcoMetaMarkerTracker } from "./arUcoMetaMarkerTracker"
import { TrackedNode } from "../shared/trackedNode"

export class ArUcoMetaMarkerObjectTracker {
    private _scene: Scene;
    private _runTrackingObserver: Nullable<Observer<Scene>> = null;
    private _tracker: ArUcoMetaMarkerTracker;
    private _trackedNodes: { [id: number]: TrackedNode } = {};

    public constructor(scene: Scene) {
        this._scene = scene;
    }

    public async addTrackableObjectAsync(upperLeftId: number, upperRightId: number, lowerLeftId: number, lowerRightId: number, widthInMarkerSides: number): Promise<TrackedNode> {
        const marker = await this._tracker.addMarker(upperLeftId, upperRightId, lowerLeftId, lowerRightId, widthInMarkerSides);

        const node = new TrackedNode(upperLeftId + "_" + upperRightId + "_" + lowerLeftId + "_" + lowerRightId, this._scene, true);
        node.rotationQuaternion = Quaternion.Identity();

        this._trackedNodes[marker.id] = node;
        
        return node;
    }

    public startTracking(): void {
        let running = false;
        this._runTrackingObserver = this._scene.onAfterRenderObservable.add(() => {
            if (!running) {
                running = true;

                this._tracker.updateAsync().then(() => {
                    for (let id in this._trackedNodes) {
                        const marker = this._tracker.markers[id];
                        const node = this._trackedNodes[id];
                        node.setTracking(marker.position, marker.rotation, marker.confidence > 0.98);
                    }
                    running = false;
                });
            }
        });
    }

    public stopTracking(): void {
        this._scene.onAfterRenderObservable.remove(this._runTrackingObserver);
        this._runTrackingObserver = null;
    }

    public static async CreateAsync(videoTexture: VideoTexture, scene: Scene, videoScale: number = 1.0): Promise<ArUcoMetaMarkerObjectTracker> {
        let objectTracker = new ArUcoMetaMarkerObjectTracker(scene);
        objectTracker._tracker = await ArUcoMetaMarkerTracker.CreateAsync(videoTexture);
        await objectTracker.setCalibrationAsync(videoTexture, videoScale);
        return objectTracker;
    }
    
    private setCalibrationAsync(videoTexture: VideoTexture, scalar: number) {
        return this._tracker.setCalibrationAsync(
            Math.round(scalar * videoTexture.getSize().width), 
            Math.round(scalar * videoTexture.getSize().height));
    }
}