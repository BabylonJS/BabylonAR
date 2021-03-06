import { Nullable, Observable, VideoTexture, Vector2 } from "babylonjs"

import { DedicatedWorker } from "../shared/dedicatedWorker"
import { IMAGE_TEMPLATE_TRACKER_URL } from "../shared/constants"

declare var Module: any;
declare function postMessage(data: any): void;

export class ImageTemplateTracker {
    private _worker: Worker;

    private _tracking: boolean;
    private _trackingLoop: Promise<void>;
    private _videoTexture: VideoTexture;

    public onTrackingUpdatedObservable: Observable<Nullable<Vector2>>;

    private constructor(videoTexture: VideoTexture) {
        this._videoTexture = videoTexture;
        this.onTrackingUpdatedObservable = new Observable<Nullable<Vector2>>();
    }

    private static onInitialized() {
        postMessage({ initialized: true });
    }

    private static onMessage(event: MessageEvent): void {
        const args = event.data;

        if (args.initialize) {
            // Initialize the image data buffer.
            let buf = Module._malloc(args.imageData.length * args.imageData.BYTES_PER_ELEMENT);
            Module.HEAP8.set(args.imageData, buf);

            // Process the image.
            Module._initialize(args.width, args.height, buf, args.x, args.y);

            // Clean up.
            Module._free(buf);

            // Post results back to the main thread.
            postMessage({
                initialized: true
            });
        }
        else if (args.uninitialize) {
            Module._uninitialize();
            postMessage({ uninitialized: true });
        }
        else if (args.track) {
            // Initialize the image data buffer.
            let buf = Module._malloc(args.imageData.length * args.imageData.BYTES_PER_ELEMENT);
            Module.HEAP8.set(args.imageData, buf);

            // Register the callback handler.
            let tracked: boolean = false;
            let trackedX: number = -1;
            let trackedY: number = -1;
            Module._update_template_position = (x: number, y: number) => {
                tracked = true;
                trackedX = x;
                trackedY = y;
            }

            // Process the image.
            Module._track_template_in_image(args.width, args.height, buf);

            // Clean up.
            Module._update_template_position = () => {};
            Module._free(buf);

            // Post results back to the main thread.
            postMessage({
                tracked: tracked,
                x: trackedX,
                y: trackedY
            });
        }
    }

    public static CreateAsync(videoTexture: VideoTexture): Promise<ImageTemplateTracker> {
        return new Promise<ImageTemplateTracker>((resolve: (tracker: ImageTemplateTracker) => void) => {
            let tracker = new ImageTemplateTracker(videoTexture);
            tracker._worker = DedicatedWorker.createFromLocation(
                IMAGE_TEMPLATE_TRACKER_URL,
                ImageTemplateTracker.onInitialized,
                ImageTemplateTracker.onMessage);
            tracker._worker.onmessage = (event: MessageEvent) => {
                tracker._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
                resolve(tracker);
            };
        });
    }

    public startTracking(x: number, y: number): void {
        this._tracking = true;
        this._trackingLoop = new Promise<void>(async (resolve: () => void) => {
            this._worker.onmessage = () => {
                var trackedPosition: Vector2 = Vector2.Zero();

                var loopFunction = async (data: { tracked: boolean, x: number, y: number }) => {
                    if (data.tracked) {
                        trackedPosition.set(data.x, data.y);
                        this.onTrackingUpdatedObservable.notifyObservers(trackedPosition);
                    } else {
                        this.onTrackingUpdatedObservable.notifyObservers(null);
                    }

                    if (this._tracking) {
                        this._worker.postMessage({
                            track: true,
                            width: this._videoTexture.getSize().width,
                            height: this._videoTexture.getSize().height,
                            imageData: await this._videoTexture.readPixels()
                        });
                    } else {
                        this._worker.onmessage = () => {
                            this._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
                            resolve();
                        }

                        this._worker.postMessage({
                            uninitialize: true
                        });
                    }
                };

                this._worker.onmessage = (result) => {
                    loopFunction(result.data);
                };
                loopFunction({ tracked: false, x: -1, y: -1 });
            };

            this._worker.postMessage({
                initialize: true,
                x: x,
                y: y,
                width: this._videoTexture.getSize().width,
                height: this._videoTexture.getSize().height,
                imageData: await this._videoTexture.readPixels()
            });
        });
    }

    public stopTrackingAsync(): Promise<void> {
        this._tracking = false;
        return this._trackingLoop;
    }
}
