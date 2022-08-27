import { Bind, Binds } from "canvas/utils/input/Binds";
import { ModifierState } from "canvas/utils/input/ModifierState";
import { MouseButton } from "canvas/utils/input/MouseButton";

export class Binding {
    public static readonly WheelPan = new Binds(
        new Bind({ modifier: ModifierState.None }),
    );
    public static readonly WheelPanInverse = new Binds(
        new Bind({ modifier: ModifierState.Shift }),
    );
    public static readonly WheelZoom = new Binds(
        new Bind({ modifier: ModifierState.Ctrl }),
    );
    public static readonly ResetZoom = new Binds(
        new Bind({ modifier: ModifierState.Ctrl, keyCode: "Digit0" }),
    );
    public static readonly ZoomIn = new Binds(
        new Bind({ modifier: ModifierState.Ctrl, keyCode: "Equal" }),
    );
    public static readonly ZoomOut = new Binds(
        new Bind({ modifier: ModifierState.Ctrl, keyCode: "Minus" }),
    );
    public static readonly SingleSelect = new Binds(
        new Bind({ mouseButtons: MouseButton.Left }),
    );
    public static readonly MultiSelect = new Binds(
        new Bind({
            modifier: ModifierState.Shift,
            mouseButtons: MouseButton.Left,
        }),
    );
    public static readonly Move = new Binds(
        new Bind({ mouseButtons: MouseButton.Left }),
    );
    public static readonly RotateStep = new Binds(
        new Bind({ modifier: ModifierState.Shift }),
    );
    public static readonly ResizeCrop = new Binds(
        new Bind({ modifier: ModifierState.Shift }),
    );
    public static readonly ToggleGuidelineSnap = new Binds(
        new Bind({ modifier: ModifierState.Alt }),
    );
}
