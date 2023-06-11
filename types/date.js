import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { ValidatorField, formateDate, isNullish, isAsyncFunction, validators } from "../utils.js";

export class DateField extends ValidatorField {
    static defaultIsRequired = false;

    static before(valueIdentifier, date, message = undefined) {
        return new DateField(valueIdentifier).max(date, message);
    }

    static after(valueIdentifier, date, message = undefined) {
        return new DateField(valueIdentifier).min(date, message);
    }

    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.date, isRequired: DateField.defaultIsRequired});
        this._dateRange = [null, null];
        this._setErrorMessageRequiredValue();
        this._setErrorMessageInvalidType();
        this._setErrorMessageRangeMin();
        this._setErrorMessageRangeMax();
        this._setErrorMessageFailedUserDefinedTest();
    }

    _setErrorMessageRequiredValue(message) {
        this._errorMessageRequiredValue = message !== undefined ? message : `${this._valueIdentifier} is required`;
    }

    _setErrorMessageInvalidType(message) {
        this._errorMessageInvalidType = message !== undefined ? message : `invalid value, expected a ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.date]}`;
    }

    _setErrorMessageRangeMax(message) {
        if(this._dateRange[0] === null) {
            return;
        }
        this._errorMessageRangeMin = message !== undefined ? message : `${this._valueIdentifier} must not be a date before ${formateDate(this._dateRange[0])}`;
    }

    _setErrorMessageRangeMin(message) {
        if(this._dateRange[0] === null) {
            return;
        }
        this._errorMessageRangeMax = message !== undefined ? message : `${this._valueIdentifier} must not be a date after ${formateDate(this._dateRange[1])}`;
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
        this._dateRange[0] = [new Date(rangeMin)];
        this._setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax, message = undefined) {
        this._dateRange[1] = [new Date(rangeMax)];
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
        if(!validators[DATA_TYPE.date](value)){
            return this._errorMessageInvalidType;
        }
        value = new Date(value);
        if(this._dateRange[0] !== null && value < this._dateRange[0]) {
            return this._errorMessageRangeMin;
        }
        if(this._dateRange[1] !== null && value > this._dateRange[1]) {
            return this._errorMessageRangeMax;
        }
        if(!this._assertUserDefinedTests(value)) {
            return this._errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
