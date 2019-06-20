import { VideoTexture } from "babylonjs"

import { DedicatedWorker } from "../shared/dedicatedWorker"
import { EXAMPLE_MODULE_URL } from "../shared/constants"

declare var Module: any;
declare function postMessage(data: any): void;

export class ExampleMarkerTracker {
    private _worker: Worker;

    private constructor() {}

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
        else if (args.track) {
            let buf = Module._malloc(args.imageData.length * args.imageData.BYTES_PER_ELEMENT);
            Module.HEAP8.set(args.imageData, buf);
            let numMarkers = Module._process_image(args.width, args.height, buf, 1);
            Module._free(buf);

            let markers: any[] = [];
            let offset: number = 0;
            let id: number = 0;
            let tx: number = 0.0;
            let ty: number = 0.0;
            let tz: number = 0.0;
            let rx: number = 0.0;
            let ry: number = 0.0;
            let rz: number = 0.0;
            for (let markerIdx = 0; markerIdx < numMarkers; markerIdx++) {
                let ptr = Module._get_tracked_marker(markerIdx);

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
    }

    public static createAsync(): Promise<ExampleMarkerTracker> {
        return new Promise<ExampleMarkerTracker>((resolve: (tracker: ExampleMarkerTracker) => void) => {
            let tracker = new ExampleMarkerTracker();
            tracker._worker = DedicatedWorker.createFromLocation(
                EXAMPLE_MODULE_URL,
                ExampleMarkerTracker.onInitialized,
                ExampleMarkerTracker.onMessage);
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

    public findMarkersInImageAsync(videoTexture: VideoTexture): Promise<any[]> {
        const promise = new Promise<any[]>((resolve, reject) => {
            this._worker.onmessage = (result) => {
                this._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
                
                if (result.data.markers) {
                    resolve(result.data.markers);
                }
                else {
                    reject(result.data);
                }
            };
        });

        this._worker.postMessage({
            track: true,
            width: videoTexture.getSize().width,
            height: videoTexture.getSize().height,
            imageData: videoTexture.readPixels()
        });

        return promise;
    }
}