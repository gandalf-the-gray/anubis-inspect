import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME } from "../constants.js";
import { ValidatorField, validators } from "../utils.js";

export class UndefinedField extends ValidatorField {
    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.undefined});
        this._setErrorMessageInvalidType();
    }

    _setErrorMessageInvalidType(message) {
        this._errorMessageInvalidType = message !== undefined ? message : `${this._valueIdentifier} must be ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.undefined]}`;
    }

    invalidTypeMessage(message = undefined) {
        this._setErrorMessageInvalidType(message);
        return this;
    }

    validate(value) {
        if(!validators[DATA_TYPE.undefined](value)) {
            return this._errorMessageInvalidType;
        }
        return null;
    }
}
