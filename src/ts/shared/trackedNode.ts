import { Observable, Quaternion, Scene, TransformNode, Vector3 } from "babylonjs"

export class TrackedNode extends TransformNode {
    private _isTracking: boolean;
    private _notTrackedFramesCount: number; // TODO: Remove this feature, which only exists as a stopgap.

    public onTrackingAcquiredObservable: Observable<TrackedNode>;
    public onTrackingLostObservable: Observable<TrackedNode>;
    public disableWhenNotTracked: boolean;

    public constructor(name: string, scene?: Scene | null | undefined, disableWhenNotTracked: boolean = true) {
        super(name, scene, true);

        this._isTracking = false;
        this.disableWhenNotTracked = disableWhenNotTracked;
        if (this.disableWhenNotTracked) {
            this.setEnabled(false);
        }

        this._notTrackedFramesCount = 10;

        this.onTrackingAcquiredObservable = new Observable(observer => {
            if (this._isTracking) {
                this.onTrackingAcquiredObservable.notifyObserver(observer, this);
            }
        });
        this.onTrackingLostObservable = new Observable();

        this.rotationQuaternion = Quaternion.Identity();
    }

    public isTracking(): boolean {
        return this._isTracking;
    }

    public setTracking(position: Vector3, rotation: Quaternion, isTracking: boolean): void {
        this.position.copyFrom(position);
        this.rotationQuaternion ? this.rotationQuaternion.copyFrom(rotation) : this.rotationQuaternion = rotation.clone();

        // TODO: Remove this feature, which only exists as a stopgap.
        if (isTracking) {
            this._notTrackedFramesCount = 0;
        }
        else {
            this._notTrackedFramesCount += 1;
            if (this._notTrackedFramesCount < 5) {
                isTracking = true;
            }
        }

        if (!this._isTracking && isTracking) {
            this.onTrackingAcquiredObservable.notifyObservers(this);
        }
        else if (this._isTracking && !isTracking) {
            this.onTrackingLostObservable.notifyObservers(this);
        }
        this._isTracking = isTracking;
        this.setEnabled(!this.disableWhenNotTracked || this._isTracking);
    }
}

