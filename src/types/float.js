import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { BaseField, isNullish, validators } from "../utils.js";
import { throwRequired } from "../errors.js";

export class FloatField extends BaseField {
    static defaultIsRequired = true;
    static defaultMin = -Infinity;
    static defaultMax = Infinity;

    static lt(valueIdentifier, maxValue, message){
        return new FloatField(valueIdentifier).max(maxValue - 1, message);
    }

    static gt(valueIdentifier, minValue, message){
        return new FloatField(valueIdentifier).min(minValue + 1, message);
    }

    constructor(valueIdentifier, isRequired = FloatField.defaultIsRequired) {
        super({valueIdentifier, type: DATA_TYPE.float, range: [FloatField.defaultMin, FloatField.defaultMax], isRequired});
        this.setErrorMessageRequiredValue();
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageUserDefinedTest();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message: `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `Invalid value, expected a ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.float]}`;
    }

    setErrorMessageRangeMin(message) {
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must be at least ${this.range[0]}`;
    }

    setErrorMessageRangeMax(message) {
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must not be greater than ${this.range[1]}`;
    }

    setErrorMessageUserDefinedTest(message) {
        this.errorMessageUserDefinedTest = message !== undefined ? message : DEFAULT_INVALID_VALUE_MESSAGE;
    }

    invalidTypeMessage(message) {
        this.setErrorMessageInvalidType(message);
        return this;
    }

    requiredValueMessage(message) {
        this.setErrorMessageRequiredValue(message);
        return this;
    }

    min(rangeMin = throwRequired("Minimum value"), message) {
        this.range[0] = rangeMin;
        this.setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax = throwRequired("Maximum value"), message) {
        this.valueIdentifier[1] = rangeMax;
        this.setErrorMessageRangeMax(message);
        return this;
    }

    validate(value) {
        if(isNullish(value)) {
            if(this.isRequired) {
                return this.errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.float](value)) {
            return this.errorMessageInvalidType;
        }
        if(value < this.range[0]) {
            return this.errorMessageRangeMin;
        }
        if(value > this.range[1]) {
            return this.errorMessageRangeMax;
        }
        if(!this.assertUserDefinedTests(value)) {
            return this.errorMessageUserDefinedTest;
        }
        return null;
    }
}
