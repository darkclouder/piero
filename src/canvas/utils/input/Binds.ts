import type { MousePressEventBase } from "canvas/board/controllers/objects/MouseInteractionController";
import type { Optional } from "canvas/primitives/types";
import { ModifierState } from "canvas/utils/input/ModifierState";
import type { MouseButton } from "canvas/utils/input/MouseButton";

export class Bind {
    readonly modifier: ModifierState;
    readonly keyCode: Optional<string>;
    readonly mouseButtons: Optional<MouseButton>;

    constructor(config: {
        modifier?: ModifierState;
        keyCode?: string;
        mouseButtons?: MouseButton;
    }) {
        this.modifier = config.modifier || ModifierState.None;
        this.keyCode = config.keyCode || undefined;
        this.mouseButtons = config.mouseButtons || undefined;
    }

    public equals(other: Bind): boolean {
        return (
            this.modifier.equals(other.modifier) &&
            this.keyCode == other.keyCode &&
            this.mouseButtons == other.mouseButtons
        );
    }
}

export class Binds {
    readonly bindings: Bind[];

    constructor(...bindings: Bind[]) {
        this.bindings = bindings;
    }

    public keyboard(event: KeyboardEvent): boolean {
        return this.anyEquals(
            new Bind({
                modifier: ModifierState.fromDomEvent(event),
                keyCode: event.code,
            }),
        );
    }

    public mousePress(event: MousePressEventBase): boolean {
        return this.anyEquals(
            new Bind({
                modifier: event.modifiers,
                mouseButtons: event.button,
            }),
        );
    }

    public modifiers(event: { modifiers: ModifierState }): boolean {
        return this.anyModifiersEqual(event.modifiers);
    }

    private anyEquals(other: Bind): boolean {
        return this.bindings.some(b => b.equals(other));
    }

    private anyModifiersEqual(other: ModifierState): boolean {
        return this.bindings.some(b => b.modifier.equals(other));
    }
}
