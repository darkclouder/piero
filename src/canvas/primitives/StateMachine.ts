import { EventBase, EventHandler } from "@canvas/primitives/events";

export class StateMachineTransitionEvent<T> extends EventBase<T> {
    constructor(mode: T) {
        super([mode]);
    }
}

export class StateMachine<T> {
    readonly onEnter = new EventHandler<StateMachineTransitionEvent<T>>();
    readonly onExit = new EventHandler<StateMachineTransitionEvent<T>>();

    constructor(private _state: T) {}

    public get state(): T {
        return this._state;
    }

    public set state(state: T) {
        this.onExit.dispatch(new StateMachineTransitionEvent<T>(this._state));
        this._state = state;
        this.onEnter.dispatch(new StateMachineTransitionEvent<T>(this._state));
    }
}
