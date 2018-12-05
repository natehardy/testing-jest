// setup
import {
    emptyReducer,
    createAllIdsReducer,
    createByIdReducer,
    createIsFetchingEntitiesReducer,
    createIsFetchingEntityReducer,
    createIsFetchingReducer,
    createErrorMessageReducer
} from "../reducers";

describe("Utility methods for creating reducers", function() {
    describe("createAllIdsReducer", function() {
        it("should return an empty Reducer if no type is passed in", () => {
            const actual = createAllIdsReducer();
            const expected = emptyReducer;
            expect(actual).to.deep.equal(expected);
        });

        it("should return a Reducer function if a string is passed in", () => {
            const actual = createAllIdsReducer({ type: "STRUCTURE" });
            expect(actual).to.be.function;
        });
    });

    describe("createByIdReducer", function() {
        it("should return an empty Reducer if no type is passed in", () => {
            const actual = createByIdReducer();
            const expected = emptyReducer;
            expect(actual).to.deep.equal(expected);
        });

        it("should return a Reducer function if a string is passed in", () => {
            const actual = createByIdReducer({ type: "STRUCTURE" });
            expect(actual).to.be.function;
        });
    });

    describe("createIsFetchingEntitiesReducer", function() {
        it("should return an empty Reducer if no type is passed in", () => {
            const actual = createIsFetchingEntitiesReducer();
            const expected = emptyReducer;
            expect(actual).to.deep.equal(expected);
        });

        it("should return a Reducer function if a string is passed in", () => {
            const actual = createIsFetchingEntitiesReducer({
                type: "STRUCTURE"
            });
            expect(actual).to.be.function;
        });
    });

    describe("createIsFetchingEntityReducer", function() {
        it("should return an empty Reducer if no type is passed in", () => {
            const actual = createIsFetchingEntityReducer();
            const expected = emptyReducer;
            expect(actual).to.deep.equal(expected);
        });

        it("should return a Reducer function if a string is passed in", () => {
            const actual = createIsFetchingEntityReducer({ type: "STRUCTURE" });
            expect(actual).to.be.function;
        });
    });

    describe("createIsFetchingReducer", function() {
        it("should return an empty Reducer if no type is passed in", () => {
            const actual = createIsFetchingReducer();
            const expected = emptyReducer;
            expect(actual).to.deep.equal(expected);
        });

        it("should return a Reducer function if a string is passed in", () => {
            const actual = createIsFetchingReducer({ type: "STRUCTURE" });
            expect(actual).to.be.function;
        });
    });

    describe("createErrorMessageReducer", function() {
        it("should return an empty Reducer if no type is passed in", () => {
            const actual = createErrorMessageReducer();
            const expected = emptyReducer;
            expect(actual).to.deep.equal(expected);
        });

        it("should return a Reducer function if a string is passed in", () => {
            const actual = createErrorMessageReducer({ type: "STRUCTURE" });
            expect(actual).to.be.function;
        });
    });
});
