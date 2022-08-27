import type { Optional } from "canvas/primitives/types";

type Func = (...args: unknown[]) => unknown;
type Timeout = ReturnType<typeof setTimeout>;

export function debounce<F extends Func>(
    func: F,
    debounceMs: number,
    immediate = false,
): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
    let timeout: Optional<Timeout>;

    return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const context = this;

        const deferred = () => {
            timeout = undefined;

            if (!immediate) {
                func.apply(context, args);
            }
        };

        const shouldCallNow = immediate && timeout === undefined;

        if (timeout !== undefined) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(deferred, debounceMs);

        if (shouldCallNow) {
            func.apply(context, args);
        }
    };
}
