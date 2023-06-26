import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME } from "../constants.js";
import { BaseField, validators, isNullish } from "../utils.js";

export class BooleanField extends BaseField {
    static defaultIsRequired = true;

    constructor(valueIdentifier, isRequired = BooleanField.defaultIsRequired) {
        super({valueIdentifier, type: DATA_TYPE.null, isRequired});
        this.setErrorMessageInvalidType();
        this.setErrorMessageRequiredValue();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `${this.valueIdentifier} must be ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.boolean]}`;
    }

    requiredValueMessage(message) {
        this.setErrorMessageRequiredValue(message);
        return this;
    }

    invalidTypeMessage(message) {
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
