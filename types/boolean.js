import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME } from "../constants.js";
import { ValidatorField, validators, isNullish } from "../utils.js";

export class BooleanField extends ValidatorField {
    static defaultIsRequired = false;

    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.null, isRequired: BooleanField.defaultIsRequired});
        this.setErrorMessageInvalidType();
        this.setErrorMessageRequiredValue();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `${this.valueIdentifier} must be ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.boolean]}`;
    }

    required(message) {
        this.isRequired = true;
        this.setErrorMessageRequiredValue(message);
        return this;
    }

    invalidTypeMessage(message = undefined) {
        this.setErrorMessageInvalidType(message);
        return this;
    }

    validate(value) {
        if(isNullish(value)){
            if(this.isRequired) {
                return this.errorMessageRequiredValue;
            }
            return null;
        }

        if(!validators[DATA_TYPE.null](value)) {
            return this.errorMessageInvalidType;
        }
        return null;
    }
}
