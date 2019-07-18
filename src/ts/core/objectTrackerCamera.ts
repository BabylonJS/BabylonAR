import { Camera, Layer, Observer, Scene, Texture, Tools, Vector3, VideoTexture } from "babylonjs"

export class ObjectTrackerCamera extends Camera {
    public videoTexture: VideoTexture;

    private _layer: Layer;
    private _beforeRenderObserver: Observer<Layer>;

    private constructor(name: string, scene: Scene) {
        super(name, Vector3.Zero(), scene);
        this._layer = new Layer(name + "_backgroundLayer", null, scene);
    }

    public static async CreateAsync(name: string, scene: Scene): Promise<ObjectTrackerCamera> {

        scene.clearColor.set(0, 0, 0, 1);

        const camera = new ObjectTrackerCamera(name, scene);
        camera.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
        camera.fov = Tools.ToRadians(40); // TODO: Magic number
        
        const constraints = {
            maxWidth: 640, // TODO: Magic number
            maxHeight: 480, // TODO: Magic number
            minWidth: 640, // TODO: Magic number
            minHeight: 480, // TODO: Magic number
            deviceId: ""
        };
        const devices = await navigator.mediaDevices.enumerateDevices();
        devices.forEach(device => {
            if (device.kind === "videoinput") {
                constraints.deviceId = device.deviceId;
            }
        });
        
        camera.videoTexture = await VideoTexture.CreateFromWebCamAsync(scene, constraints);
        camera._layer.texture = camera.videoTexture;
        camera._layer.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        camera._layer.texture.wrapV = Texture.WRAP_ADDRESSMODE;
        camera._layer.texture.vScale = -1.0;

        const texSize = camera._layer.texture.getSize();
        const texAspect: number = texSize.width / texSize.height;
        let uScale: number;
        camera._beforeRenderObserver = camera._layer.onBeforeRenderObservable.add(() => {
            uScale = scene.getEngine().getScreenAspectRatio() / texAspect;

            if (uScale < 1.0) {
                camera.viewport.x = 0.0;
                camera.viewport.width = 1.0;
    
                camera._layer.texture.uScale = uScale;
                camera._layer.texture.uOffset = (1.0 - uScale) / 2.0;
            }
            else {
                camera.viewport.width = 1.0 / uScale;
                camera.viewport.x = (1.0 - camera.viewport.width) / 2.0;
    
                camera._layer.texture.uScale = 1.0;
                camera._layer.texture.uOffset = 0.0;
            }
        });

        return camera;
    }

    public dispose(): void {
        this._layer.onBeforeRenderObservable.remove(this._beforeRenderObserver);
        this._layer.dispose();
        super.dispose();
    }
}