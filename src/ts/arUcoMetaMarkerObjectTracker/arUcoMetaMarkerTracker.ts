import { Quaternion, Vector3, VideoTexture } from "babylonjs"

import { DedicatedWorker } from "../shared/dedicatedWorker"
import { ARUCO_META_MARKER_TRACKER_URL } from "../shared/constants"

declare var Module: any;
declare function postMessage(data: any): void;

export class ArUcoMetaMarker {
    public id: number;
    public confidence: number;
    public position: Vector3;
    public rotation: Quaternion;

    public constructor(id: number) {
        this.id = id;
        this.confidence = 0.0;
        this.position = Vector3.Zero();
        this.rotation = Quaternion.Identity();
    }
}

export class ArUcoMetaMarkerTracker {
    private _worker: Worker;
    private _videoTexture: VideoTexture;

    public markers: { [id: number]: ArUcoMetaMarker } = {};

    private constructor(videoTexture: VideoTexture) {
        this._videoTexture = videoTexture;
    }

    private static onInitialized() {
        Module._reset();
        postMessage({ initialized: true });
    }

    private static onMessage(event: MessageEvent): void {
        const args = event.data;

        if (args.reset) {
            Module._reset();
            postMessage({ reset: true });
        }
        else if (args.calibrate) {
            Module._set_calibration_from_frame_size(args.width, args.height);
            postMessage({ calibrated: true });
        }
        else if (args.addMarker) {
            const id = Module._add_marker(args.ul, args.ur, args.ll, args.lr, args.width);
            postMessage({ added: true, id: id });
        }
        else if (args.track) {
            // Initialize the image data buffer.
            let buf = Module._malloc(args.imageData.length * args.imageData.BYTES_PER_ELEMENT);
            Module.HEAP8.set(args.imageData, buf);

            // Register the callback handler.
            let markers: number[] = [];
            Module._update_marker_tracking = (
                id: number, 
                confidence: number, 
                px: number, 
                py: number, 
                pz: number, 
                rx: number, 
                ry: number, 
                rz: number, 
                rw: number) => {

                markers = markers.concat([ id, confidence, px, py, pz, rx, ry, rz, rw ]);
            }

            // Process the image.
            Module._process_image(args.width, args.height, buf);

            // Clean up.
            Module._update_marker_tracking = () => {};
            Module._free(buf);

            // Post results back to the main thread.
            postMessage({
                markers: markers
            });
        }
    }

    public static CreateAsync(videoTexture: VideoTexture): Promise<ArUcoMetaMarkerTracker> {
        return new Promise<ArUcoMetaMarkerTracker>((resolve: (tracker: ArUcoMetaMarkerTracker) => void) => {
            let tracker = new ArUcoMetaMarkerTracker(videoTexture);
            tracker._worker = DedicatedWorker.createFromLocation(
                ARUCO_META_MARKER_TRACKER_URL,
                ArUcoMetaMarkerTracker.onInitialized,
                ArUcoMetaMarkerTracker.onMessage);
            tracker._worker.onmessage = (event: MessageEvent) => {
                tracker._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
                resolve(tracker);
            };
        });
    }

    public setCalibrationAsync(width: number, height: number): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            this._worker.onmessage = (result) => {
                this._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;

                if (result.data.calibrated) {
                    resolve();
                }
                else {
                    reject(result.data);
                }
            }
        });

        this._worker.postMessage({
            calibrate: true,
            width: width,
            height: height
        });

        return promise;
    }

    public addMarker(upperLeftId: number, upperRightId: number, lowerLeftId: number, lowerRightId: number, metaMarkerWidth: number): Promise<ArUcoMetaMarker> {
        const promise = new Promise<ArUcoMetaMarker>((resolve, reject) => {
            this._worker.onmessage = (result) => {
                this._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
                
                if (result.data.added) {
                    const id = result.data.id;
                    this.markers[id] = new ArUcoMetaMarker(id);
                    resolve(this.markers[id]);
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
    }

    public updateAsync(): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            this._worker.onmessage = (result) => {
                this._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
                
                if (result.data.markers) {
                    const markers: number[] = result.data.markers;
                    for (let idx = 0; idx < markers.length; idx += 9) {
                        let marker = this.markers[markers[idx]];
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
    }
}