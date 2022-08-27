import { BoardController } from "canvas/board/controllers/BoardController";
import type { GeometricObject } from "canvas/board/objects/GeometricObject";
import { EventBase, EventHandler } from "canvas/primitives/events";
import { Vector2 } from "canvas/primitives/space";
import { LayeredRenderer } from "canvas/render/LayeredRenderer";
import type { Viewport, ViewportHolder } from "canvas/render/Viewport";
import { TopLeftClippedViewport } from "canvas/render/Viewport";

export class ChangeViewportEvent extends EventBase<Board> {
    constructor(
        readonly newViewport: Viewport,
        readonly oldViewport?: Viewport,
        eventStack?: Board[],
    ) {
        super(eventStack);
    }
}

export class SpawnEvent extends EventBase<GeometricObject> {}

export class DespawnEvent extends SpawnEvent {}

export class DirtyObjectEvent extends EventBase<GeometricObject> {}

export interface BoardConfigPartial {
    enableGuidelineSnap?: boolean;
    viewportClipOffset?: Vector2;
    viewOnlyMode?: boolean;
}

export class BoardConfig {
    constructor(
        readonly enableGuidelineSnap = true,
        readonly viewportClipOffset = new Vector2(-50, 0),
        readonly viewOnlyMode = false,
    ) {}

    public copy(overrides: BoardConfigPartial): BoardConfig {
        return new BoardConfig(
            overrides.enableGuidelineSnap || this.enableGuidelineSnap,
            overrides.viewportClipOffset || this.viewportClipOffset,
            overrides.viewOnlyMode || this.viewOnlyMode,
        );
    }
}

export class Board implements ViewportHolder {
    readonly controller: BoardController;
    readonly onChangeViewport = new EventHandler<ChangeViewportEvent>();
    readonly onSpawn = new EventHandler<SpawnEvent>();
    readonly onDespawn = new EventHandler<DespawnEvent>();
    readonly onDirty = new EventHandler<DirtyObjectEvent>();

    private renderer: LayeredRenderer;
    private _viewport;

    constructor(
        readonly window: Window,
        readonly boardElement: HTMLElement,
        readonly config: BoardConfig = new BoardConfig(),
    ) {
        this._viewport = new TopLeftClippedViewport(
            this.config.viewportClipOffset,
        );

        this.renderer = new LayeredRenderer(window, boardElement, this);
        this.controller = new BoardController(this);
    }

    public run(): void {
        this.controller.activate();

        this.onChangeViewport.listen(this, () => {
            this.renderer.requestFullRender();
        });
    }

    public requestFullRender(): void {
        this.renderer.requestFullRender();
    }

    /**
     * Add an object at a certain position.
     * With `z == undefined`, object will be put on top of all existing objects.
     * Z indices are consecutive starting from 0, two objects must not have
     * the same z index.
     */
    public addObjects(objects: GeometricObject[], zIndex?: number): void {
        this.renderer.addObjects(objects, zIndex);
        this.notifySpawn(objects);
    }

    public addObjectsAbove(
        objects: GeometricObject[],
        lastBelow: GeometricObject,
    ): void {
        this.renderer.addObjectsAbove(objects, lastBelow);
        this.notifySpawn(objects);
    }

    public addObjectsBelow(
        objects: GeometricObject[],
        firstOnTop: GeometricObject,
    ): void {
        this.renderer.addObjectsBelow(objects, firstOnTop);
        this.notifySpawn(objects);
    }

    public removeObjects(objects: GeometricObject[]): void {
        this.renderer.removeObjects(objects);
        objects.forEach(object => {
            object.onDespawn(this);
            this.onDespawn.dispatch(new SpawnEvent([object]));
        });
    }

    public reorderManyAbove(
        sortedObjects: GeometricObject[],
        lastBelow: GeometricObject,
    ): void {
        this.renderer.reorderManyAbove(sortedObjects, lastBelow);
        this.markDirtyObjects(sortedObjects);
    }

    public get objects(): GeometricObject[] {
        return <GeometricObject[]>this.renderer.objects;
    }

    public get viewport(): Viewport {
        return this._viewport;
    }

    public set viewport(newViewport: Viewport) {
        if (this._viewport == newViewport) {
            return;
        }

        const oldViewport = this._viewport;

        this._viewport = this._viewport.modified(
            newViewport.size,
            newViewport.zoomLevel,
            newViewport.origin,
        );
        this.onChangeViewport.dispatch(
            new ChangeViewportEvent(newViewport, oldViewport, [this]),
        );
    }

    public markDirtyObject(object: GeometricObject): void {
        this.markDirtyObjects([object]);
    }

    public markDirtyObjects(objects: GeometricObject[]): void {
        this.renderer.markDirtyObjects(objects);

        for (const object of objects) {
            this.onDirty.dispatch(new DirtyObjectEvent([object]));
        }
    }

    private notifySpawn(objects: GeometricObject[]): void {
        objects.forEach(object => {
            object.onSpawn(this);
            this.onSpawn.dispatch(new SpawnEvent([object]));
        });
    }
}
