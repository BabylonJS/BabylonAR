import { DedicatedWorker } from "../shared/dedicatedWorker"

declare function postMessage(data: any): void;

export class ExampleWorker {
    private static readonly MODULE_URL: string = "https://syntheticmagus.github.io/prototyping/babylonar/wasm/webpiled-aruco-ar.js";

    private _worker: Worker;

    private constructor() {}

    private static onInitialized(): void {
        postMessage({
            message: "Got a module!"
        });
    }

    private static onMessage(event: MessageEvent): void {
        let data = event.data;
        data.wentToWorker = true;
        postMessage(data);
    }

    public static createAsync(): Promise<ExampleWorker> {
        return new Promise<ExampleWorker>((resolve: (worker: ExampleWorker) => void) => {
            let exampleWorker = new ExampleWorker();
            exampleWorker._worker = DedicatedWorker.createFromLocation(
                ExampleWorker.MODULE_URL,
                ExampleWorker.onInitialized,
                ExampleWorker.onMessage);
            exampleWorker._worker.onmessage = (event: MessageEvent) => {
                exampleWorker._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
                resolve(exampleWorker);
            };
        });
    }

    public sendMessageAsync(data: any): Promise<any> {
        let promise = new Promise<any>((resolve: (value: any) => void) => {
            this._worker.onmessage = (event: MessageEvent) => {
                resolve(event.data);
                this._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
            };
        });

        this._worker.postMessage(data);

        return promise;
    }
}