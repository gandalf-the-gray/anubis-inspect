import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME } from "../constants.js";
import { ValidatorField, validators } from "../utils.js";

export class NullField extends ValidatorField {
    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.null});
        this.setErrorMessageInvalidType();
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `${this.valueIdentifier} must be ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.null]}`;
    }

    invalidTypeMessage(message = undefined) {
        this.setErrorMessageInvalidType(message);
        return this;
    }

    validate(value) {
        if(!validators[DATA_TYPE.null](value)) {
            return this.errorMessageInvalidType;
        }
        return null;
    }
}
