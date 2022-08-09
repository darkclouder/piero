import "@ext/Array";

import { expect } from "chai";

describe("Array", () => {
    it("should reverse an array with the reversed iterator", () => {
        const arr: Array<number> = [3, 5, 7, 9];
        const result = [];

        for (const item of arr.reversed()) {
            result.push(item);
        }

        expect(result).to.eql([9, 7, 5, 3]);
    });

    it("should return the min value", () => {
        const arr: Array<[string, number]> = [
            ["Hi", 7],
            ["World", 3],
            ["!", 4],
            ["Late", 3],
        ];
        const result = arr.min((a, b) => a[1] - b[1]);

        expect(result).to.eql(["World", 3]);
    });
});
