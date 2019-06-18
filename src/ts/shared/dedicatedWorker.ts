export class DedicatedWorker {

    private static createFromSources(...sources: any[]): Worker {
        let workerCode: string = "";
        for (let idx = 0; idx < sources.length - 1; idx++) {
            workerCode += sources[idx].toString();
        }
        workerCode += "(" + sources[sources.length - 1].toString() + ")();";
        return new Worker(window.URL.createObjectURL(new Blob([workerCode])));
    }

    public static createFromLocation(jsUrl: string, onInitialized: () => void, onMessage: (event: MessageEvent) => void): Worker {
        let moduleDefition: string = `Module = {
            locateFile: function (path) {
                return \"` + jsUrl.replace(/.js$/, ".wasm") + `\";
            },
            onRuntimeInitialized: function () {
                (` + onInitialized.toString() + `)();
            }
        };`;
        let messageHandler: string = "this.onmessage = " + onMessage.toString() + ";";
        let importJavascript: string = "function importJavascript() { importScripts(\"" + jsUrl + "\"); }";
        return this.createFromSources(moduleDefition, messageHandler, importJavascript);
    }

    public static unexpectedMessageHandler(event: MessageEvent): void {
        throw Error("Unexpected message from WebWorker: " + event);
    }
}