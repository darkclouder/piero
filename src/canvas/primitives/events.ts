import { DebugConfig } from "config/debug";

import type { Constructor, Optional } from "./types";

export class EventBase<T> {
    private _propagationStopped = false;
    private _defaultPrevented = false;

    constructor(
        /**
         * Event stack sorted from inner to outer element
         */
        readonly eventStack?: T[],
    ) {}

    public get type(): Constructor<EventBase<T>> {
        return <Constructor<EventBase<T>>>this.constructor;
    }

    public get target(): Optional<T> {
        return getTargetOfEventStack(this.eventStack);
    }

    public stopPropagation(): void {
        this._propagationStopped = true;
    }

    public get propagationStopped(): boolean {
        return this._propagationStopped;
    }

    public preventDefault(): void {
        this._defaultPrevented = true;
    }

    public get defaultPrevented(): boolean {
        return this._defaultPrevented;
    }
}

export type EventCallback<T, E extends EventBase<T>> = (e: E) => void;

export interface Subscription {
    unsubscribe: () => void;
}

type TargetType<E extends EventBase<unknown>> = E extends EventBase<infer T>
    ? T
    : never;

export class EventHandler<E extends EventBase<T>, T = TargetType<E>> {
    private eventListeners = new Map<
        Optional<T>,
        Map<number, EventCallback<T, E>>
    >();
    private eventListenersNextId = new Map<Optional<T>, number>();

    public listen(
        target: Optional<T>,
        callback: EventCallback<T, E>,
    ): Subscription {
        if (!this.eventListenersNextId.has(target)) {
            this.eventListenersNextId.set(target, 0);
            this.eventListeners.set(
                target,
                new Map<number, EventCallback<T, E>>(),
            );
        }

        const listenId = this.eventListenersNextId.get(target);
        this.eventListenersNextId.set(target, listenId + 1);

        this.eventListeners.get(target).set(listenId, callback);

        // Return function to unlisten
        return {
            unsubscribe: () => {
                this.eventListeners.get(target).delete(listenId);
            },
        };
    }

    public dispatch(event: E): void {
        if (DebugConfig.logAllEvents) {
            console.log(event);
        }

        if (event.eventStack !== undefined) {
            for (const element of event.eventStack) {
                // Last element in stack is the outer-most element
                // Bubble from inside out (first to last)
                const listeners = this.eventListeners.get(element);
                this.dispatchToListeners(event, listeners);

                if (event.propagationStopped) {
                    return;
                }
            }
        }

        // Global event
        const listeners = this.eventListeners.get(undefined);
        this.dispatchToListeners(event, listeners);
    }

    private dispatchToListeners(
        event: Optional<E>,
        listeners: Map<number, EventCallback<T, E>>,
    ): void {
        if (!listeners) {
            return;
        }

        listeners.forEach(listener => {
            try {
                listener(event);
            } catch (exception) {
                console.error(exception);
            }
        });
    }
}

export function createDomEventListener<K extends keyof HTMLElementEventMap>(
    element: EventTarget,
    type: K | string,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
): Subscription {
    element.addEventListener(type, listener, options);

    return {
        unsubscribe: () => {
            element.removeEventListener(type, listener, options);
        },
    };
}

export function unsubscribeAll(subscriptions: Subscription[]): void {
    subscriptions.forEach(sub => {
        sub.unsubscribe();
    });
    subscriptions.length = 0;
}

export function getTargetOfEventStack<T>(
    eventStack: Optional<T[]>,
): Optional<T> {
    return eventStack === undefined || eventStack.length == 0
        ? undefined
        : eventStack[0];
}
