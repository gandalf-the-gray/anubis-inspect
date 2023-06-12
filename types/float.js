import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { ValidatorField, isNullish, isAsyncFunction, validators } from "../utils.js";

export class FloatField extends ValidatorField {
    static defaultIsRequired = false;
    static defaultMin = -Infinity;
    static defaultMax = Infinity;

    static lt(valueIdentifier, maxValue, message = undefined){
        return new FloatField(valueIdentifier).max(maxValue - 1, message);
    }

    static gt(valueIdentifier, minValue, message = undefined){
        return new FloatField(valueIdentifier).min(minValue + 1, message);
    }

    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.float, isRequired: FloatField.defaultIsRequired});
        this.valueRange = [FloatField.defaultMin, FloatField.defaultMax];
        this.setErrorMessageRequiredValue();
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageFailedUserDefinedTest();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message: `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `invalid value, expected a ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.float]}`;
    }

    setErrorMessageRangeMin(message) {
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must be at least ${this.valueRange[0]}`;
    }

    setErrorMessageRangeMax(message) {
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must not be greater than ${this.valueRange[1]}`;
    }

    setErrorMessageFailedUserDefinedTest(message) {
        this.errorMessageFailedUserDefinedTest = message !== undefined ? message : DEFAULT_INVALID_VALUE_MESSAGE;
    }

    assertUserDefinedTests(value) {
        for(const [test, message] of this.userDefinedTests.sync) {
            if(!test(value)) {
                this.setErrorMessageFailedUserDefinedTest(message);
                return false;
            }
        }
        return true;
    }

    invalidTypeMessage(message = undefined) {
        this.setErrorMessageInvalidType(message);
        return this;
    }

    required(message = undefined) {
        this.isRequired = true;
        this.setErrorMessageRequiredValue(message);
        return this;
    }

    min(rangeMin, message = undefined) {
        this.valueRange[0] = rangeMin;
        this.setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax, message = undefined) {
        this.valueIdentifier[1] = rangeMax;
        this.setErrorMessageRangeMax(message);
        return this;
    }

    test(testFun, message = undefined) {
        if(isAsyncFunction(testFun)) {
            this.userDefinedTests.async.push([testFun, message]);
        } else {
            this.userDefinedTests.sync.push([testFun, message]);
        }
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
        if(value < this.valueRange[0]) {
            return this.errorMessageRangeMin;
        }
        if(value > this.valueRange[1]) {
            return this.errorMessageRangeMax;
        }
        if(!this.assertUserDefinedTests(value)) {
            return this.errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
