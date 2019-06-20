import { DedicatedWorker } from "../shared/dedicatedWorker"
import { EXAMPLE_MODULE_URL } from "../shared/constants"

declare function postMessage(data: any): void;

export class ExampleWorker {
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
                EXAMPLE_MODULE_URL,
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