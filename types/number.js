import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { ValidatorField, isNullish, isAsyncFunction, validators } from "../utils.js";

export class NumberField extends ValidatorField {
    static defaultIsRequired = false;
    static defaultMin = -Infinity;
    static defaultMax = Infinity;

    static lt(valueIdentifier, maxValue, message = undefined){
        return new NumberField(valueIdentifier).max(maxValue - 1, message);
    }

    static gt(valueIdentifier, minValue, message = undefined){
        return new NumberField(valueIdentifier).min(minValue + 1, message);
    }

    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.number, isRequired: NumberField.defaultIsRequired});
        this._valueRange = [NumberField.defaultMin, NumberField.defaultMax];
        this._setErrorMessageRequiredValue();
        this._setErrorMessageInvalidType();
        this._setErrorMessageRangeMin();
        this._setErrorMessageRangeMax();
        this._setErrorMessageFailedUserDefinedTest();
    }

    _setErrorMessageRequiredValue(message) {
        this._errorMessageRequiredValue = message !== undefined ? message: `${this._valueIdentifier} is required`;
    }

    _setErrorMessageInvalidType(message) {
        this._errorMessageInvalidType = message !== undefined ? message : `invalid value, expected a ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.number]}`;
    }

    _setErrorMessageRangeMin(message) {
        this._errorMessageRangeMin = message !== undefined ? message : `${this._valueIdentifier} must be at least ${this._valueRange[0]}`;
    }

    _setErrorMessageRangeMax(message) {
        this._errorMessageRangeMax = message !== undefined ? message : `${this._valueIdentifier} must not be greater than ${this._valueRange[1]}`;
    }

    _setErrorMessageFailedUserDefinedTest(message) {
        this._errorMessageFailedUserDefinedTest = message !== undefined ? message : DEFAULT_INVALID_VALUE_MESSAGE;
    }

    _assertUserDefinedTests(value) {
        for(const [test, message] of this.userDefinedTests.sync) {
            if(!test(value)) {
                this._setErrorMessageFailedUserDefinedTest(message);
                return false;
            }
        }
        return true;
    }

    invalidTypeMessage(message = undefined) {
        this._setErrorMessageInvalidType(message);
        return this;
    }

    required(message = undefined) {
        this._isRequired = true;
        this._setErrorMessageRequiredValue(message);
        return this;
    }

    min(rangeMin, message = undefined) {
        this._valueRange[0] = rangeMin;
        this._setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax, message = undefined) {
        this._valueRange[1] = rangeMax;
        this._setErrorMessageRangeMax(message);
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
        if(isNullish(value)){
            if(this._isRequired) {
                return this._errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.number](value)){
            return this._errorMessageInvalidType;
        }
        if(value < this._valueRange[0]){
            return this._errorMessageRangeMin;
        }
        if(value > this._valueRange[1]) {
            return this._errorMessageRangeMax;
        }
        if(!this._assertUserDefinedTests(value)) {
            return this._errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
