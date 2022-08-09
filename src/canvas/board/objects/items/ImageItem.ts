import type { ResizeObjectEvent } from "@canvas/board/controllers/objects/ResizeObjectController";
import { worldSpaceResize } from "@canvas/board/controllers/objects/ResizeObjectController";
import { AnchorPoint } from "@canvas/board/objects/foundation/PositionAnchor";
import { BoardItem } from "@canvas/board/objects/items/BoardItem";
import { BoundingBox, Vector2 } from "@canvas/primitives/space";
import type { Optional } from "@canvas/primitives/types";
import type { RenderContext } from "@canvas/render/RenderContext";
import { Binding } from "@config/bindings";
import { imageMissingColor } from "@config/draw";

interface ImageVariantDefinition {
    width: number;
    height: number;
    url: string;
}

export class ImageVariant {
    readonly size: Vector2;
    readonly scale: number;

    readonly url: string;

    private _image: Optional<HTMLImageElement>;
    private _pendingPromise: Optional<Promise<void>>;

    constructor(
        definition: ImageVariantDefinition,
        original: ImageVariantDefinition = definition,
    ) {
        this.url = definition.url;
        this.size = new Vector2(definition.width, definition.height);
        this.scale = definition.width / original.width;
    }

    public get image(): Optional<HTMLImageElement> {
        return this._image;
    }

    public load(): Promise<void> {
        if (this._pendingPromise === undefined) {
            this._pendingPromise = new Promise<void>((resolve, reject) => {
                if (this._image !== undefined) {
                    return resolve();
                }

                const image = new Image();
                image.onload = () => {
                    this._image = image;
                    this._pendingPromise = undefined;
                    resolve();
                };
                image.onerror = e => {
                    this._pendingPromise = undefined;
                    reject(e);
                };
                image.src = this.url;
            });
        }

        return this._pendingPromise;
    }

    public unload(): void {
        this._image = undefined;
    }
}

export class ImageSet {
    readonly original: ImageVariant;
    readonly variants: ImageVariant[];

    private bestLoaded: Optional<ImageVariant>;

    constructor(
        original: ImageVariantDefinition,
        thumbnails: ImageVariantDefinition[] = [],
    ) {
        this.original = new ImageVariant(original);

        const variants = [original, ...thumbnails].map(
            def => new ImageVariant(def, original),
        );
        this.variants = variants.sort((a, b) => a.scale - b.scale);
    }

    public load(
        scale: number,
    ): [Optional<ImageVariant>, Optional<Promise<void>>] {
        let promise: Optional<Promise<void>> = undefined;

        const variant = this.get(scale);

        if (
            this.bestLoaded === undefined ||
            variant.scale > this.bestLoaded.scale
        ) {
            // TODO: debounce to not load intermediates during zooming
            promise = this.loadVariant(variant);
        }

        const current = variant.image === undefined ? this.bestLoaded : variant;

        return [current, promise];
    }

    private loadVariant(variant: ImageVariant): Promise<void> {
        return variant
            .load()
            .then(() => {
                if (
                    this.bestLoaded === undefined ||
                    variant.scale > this.bestLoaded.scale
                ) {
                    this.bestLoaded?.unload();
                    this.bestLoaded = variant;
                }
            })
            .catch(e => {
                console.error(e);

                if (this.bestLoaded === undefined) {
                    // Error loading image
                    // Still mark this as best loaded to
                    // not trigger reload of missing image

                    this.bestLoaded = variant;
                }
            });
    }

    private get(scale: number): ImageVariant {
        for (const variant of this.variants) {
            if (variant.scale >= scale) {
                return variant;
            }
        }

        return this.original;
    }
}

export class ImageItem extends BoardItem {
    readonly isImageItem = true;

    constructor(
        readonly imageSet: ImageSet,
        position: Vector2,
        radians = 0,
        isFixed = false,
        // Size of cropped and scaled image
        size: Vector2 = imageSet.original.size,
        // Crop offset (top-left) of original image
        private _crop: Vector2 = Vector2.origin,
        // Scale (of uncropped image) relative to original image
        private _scale = 1,
    ) {
        super(position, size, radians, isFixed);
    }

    public get crop(): Vector2 {
        return this._crop;
    }

    public get scale(): number {
        return this._scale;
    }

    public draw(renderCtx: RenderContext): void {
        const viewport = renderCtx.viewport;
        const zoomLevel = viewport.zoomLevel;
        const [imageVariant, onLoad] = this.imageSet.load(
            zoomLevel * this._scale,
        );

        if (onLoad !== undefined) {
            void onLoad.then(() => {
                this.board?.markDirtyObject(this);
            });
        }

        const position = this.positionInViewport(viewport);
        const size = this.sizeInViewport(viewport);

        if (imageVariant?.image === undefined) {
            renderCtx.ctx.fillStyle = imageMissingColor;
            renderCtx.ctx.fillRect(position.x, position.y, size.x, size.y);
        } else {
            const sourcePos = this._crop.scale(imageVariant.scale);
            const sourceSize = this.size.scale(
                imageVariant.scale / this._scale,
            );

            renderCtx.ctx.drawImage(
                imageVariant.image,
                sourcePos.x,
                sourcePos.y,
                sourceSize.x,
                sourceSize.y,
                position.x,
                position.y,
                size.x,
                size.y,
            );
        }
    }

    protected onResize(e: ResizeObjectEvent): void {
        if (this.board === undefined) {
            return;
        }

        const worldSize = this.board.viewport.toWorldSize(e.size);
        const positiveSize = new Vector2(
            Math.max(1, worldSize.x),
            Math.max(1, worldSize.y),
        );

        if (Binding.ResizeCrop.modifiers(e)) {
            const maxSize = this.imageSet.original.size.scale(this._scale);
            const scaledCropPosition = this._crop.scale(this._scale);

            const newSize = cropSize(
                positiveSize,
                scaledCropPosition,
                this.size,
                e.fixture,
                maxSize,
            );

            const [newScaledCropPosition] = worldSpaceResize(
                newSize,
                e.fixture,
                new BoundingBox(scaledCropPosition, this.size),
                0,
            );

            this._crop = newScaledCropPosition.scale(1.0 / this._scale);

            [this.position, this.size] = worldSpaceResize(
                newSize,
                e.fixture,
                new BoundingBox(this.position, this.size),
                this.radians,
            );
        } else {
            const cropScale =
                Math.max(positiveSize.euclideanNorm, 1) /
                this.size.euclideanNorm;
            const newSize = this.size.scale(cropScale);

            this._scale *= cropScale;

            [this.position, this.size] = worldSpaceResize(
                newSize,
                e.fixture,
                new BoundingBox(this.position, this.size),
                this.radians,
            );
        }
    }
}

export function cropSize(
    attemptedSize: Vector2,
    cropPosition: Vector2,
    size: Vector2,
    fixture: AnchorPoint,
    maxSize: Vector2,
): Vector2 {
    let x: number, y: number;

    // X axis
    switch (fixture) {
        case AnchorPoint.TopLeft:
        case AnchorPoint.BottomLeft:
            x = Math.min(maxSize.x - cropPosition.x, attemptedSize.x);
            break;
        case AnchorPoint.TopRight:
        case AnchorPoint.BottomRight:
            x = Math.min(cropPosition.x + size.x, attemptedSize.x);
    }

    // Y axis
    switch (fixture) {
        case AnchorPoint.TopLeft:
        case AnchorPoint.TopRight:
            y = Math.min(maxSize.y - cropPosition.y, attemptedSize.y);
            break;
        case AnchorPoint.BottomRight:
        case AnchorPoint.BottomLeft:
            y = Math.min(cropPosition.y + size.y, attemptedSize.y);
    }

    return new Vector2(x, y);
}
