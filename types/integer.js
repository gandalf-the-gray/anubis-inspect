import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME } from "../constants.js";
import { ValidatorField, isNullish, validators } from "../utils.js";

export class IntegerField extends ValidatorField {
    static defaultIsRequired = false;
    static defaultMin = -Infinity;
    static defaultMax = Infinity;

    static lt(valueIdentifier, maxValue, message = undefined){
        return new IntegerField(valueIdentifier).ma(maxValue - 1, message);
    }

    static gt(valueIdentifier, minValue, message = undefined){
        return new IntegerField(valueIdentifier).min(minValue + 1, message);
    }

    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.integer, isRequired: IntegerField.defaultIsRequired});
        this._valueRange = [IntegerField.defaultMin, IntegerField.defaultMax];
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
        this._errorMessageInvalidType = message !== undefined ? message : `invalid value, ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.integer]} expected`;
    }

    _setErrorMessageRangeMin(message) {
        this._errorMessageRangeMin = message !== undefined ? message : `${this._valueIdentifier} must be at least ${this._valueRange[0]}`;
    }

    _setErrorMessageRangeMax(message) {
        this._errorMessageRangeMax = message !== undefined ? message : `${this._valueIdentifier} must not be greater than ${this._valueRange[1]}`;
    }

    _setErrorMessageFailedUserDefinedTest(message) {
        this._errorMessageFailedUserDefinedTest = message !== undefined ? message : "invalid value";
    }

    _assertUserDefinedTests(value) {
        for(const [test, message] of this._userDefinedTests) {
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
        this._userDefinedTests.push([testFun, message]);
        return this;
    }

    validate(value) {
        if(isNullish(value)){
            if(this._isRequired) {
                return this._errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.integer](value)){
            return this._errorMessageInvalidType;
        }
        if(value < this._valueRange[0]) {
            return this._errorMessageRangeMin;
        }
        if(value > this._valueRange[1]) {
            return this._errorMessageRangeMax;
        }
        if(this._userDefinedTests.length > 0 && !this._assertUserDefinedTests(value)) {
            return this._errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
