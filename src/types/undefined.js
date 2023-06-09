import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME } from "../constants.js";
import { BaseField, validators } from "../utils.js";

export class UndefinedField extends BaseField {
    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.undefined});
        this.setErrorMessageInvalidType();
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `${this.valueIdentifier} must be ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.undefined]}`;
    }

    invalidTypeMessage(message) {
        this.setErrorMessageInvalidType(message);
        return this;
    }

    validate(value) {
        if(!validators[DATA_TYPE.undefined](value)) {
            return this.errorMessageInvalidType;
        }
        return null;
    }
}
