import { ERROR_INTERFACE } from "./constants.js";

export class InterfaceError extends Error {
    constructor(message) {
        super(message);
        this.code = ERROR_INTERFACE;
    }
}
