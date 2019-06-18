import { Vector3 } from "babylonjs"

export class FilteredVector3 extends Vector3 {
    private _idx: number;
    private _samples: Vector3[];
    private _sampleSquaredDistances: number[];
    private _sampleAverage: Vector3;

    public constructor(x: number, y: number, z: number, sampleCount: number = 1) {
        super(x, y, z);

        this._idx = 0;
        this._samples = [];
        this._sampleSquaredDistances = [];
        for (let idx = 0; idx < sampleCount; ++idx) {
            this._samples.push(new Vector3(x, y, z));
            this._sampleSquaredDistances.push(0.0);
        }

        this._sampleAverage = new Vector3(x, y, z);
    }

    public addSample(sample: Vector3): void {
        this._sampleAverage.scaleInPlace(this._samples.length);
        this._sampleAverage.subtractInPlace(this._samples[this._idx]);
        this._samples[this._idx].copyFrom(sample);
        this._sampleAverage.addInPlace(this._samples[this._idx]);
        this._sampleAverage.scaleInPlace(1.0 / this._samples.length);
        this._idx = (this._idx + 1) % this._samples.length;

        let avgSquaredDistance = 0.0;
        for (let idx = 0; idx < this._samples.length; ++idx) {
            this._sampleSquaredDistances[idx] = Vector3.DistanceSquared(this._sampleAverage, this._samples[idx]);
            avgSquaredDistance += this._sampleSquaredDistances[idx];
        }
        avgSquaredDistance /= this._samples.length;

        let numIncludedSamples = 0;
        this.set(0.0, 0.0, 0.0);
        for (let idx = 0; idx <= this._samples.length; ++idx) {
            if (this._sampleSquaredDistances[idx] <= avgSquaredDistance) {
                this.addInPlace(this._samples[idx]);
                numIncludedSamples += 1;
            }
        }
        this.scaleInPlace(1.0 / numIncludedSamples);
    }
}