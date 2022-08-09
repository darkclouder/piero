type ModifierObject = { shift?: boolean; alt?: boolean; ctrl?: boolean };

export class ModifierState {
    public static None = ModifierState.fromParams({});
    public static Shift = ModifierState.fromParams({ shift: true });
    public static Alt = ModifierState.fromParams({ alt: true });
    public static Ctrl = ModifierState.fromParams({ ctrl: true });

    constructor(
        readonly shift: boolean,
        readonly alt: boolean,
        readonly ctrl: boolean,
    ) {}

    public static fromParams(params: ModifierObject): ModifierState {
        return new ModifierState(
            params.shift || false,
            params.alt || false,
            params.ctrl || false,
        );
    }

    public static fromDomEvent(
        event: MouseEvent | KeyboardEvent,
    ): ModifierState {
        return new ModifierState(
            event.shiftKey,
            event.altKey,
            event.ctrlKey || event.metaKey,
        );
    }

    public equals(other: ModifierState): boolean {
        return (
            this.shift === other.shift &&
            this.alt === other.alt &&
            this.ctrl === other.ctrl
        );
    }
}
