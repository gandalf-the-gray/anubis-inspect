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
        this.dateRange = [null, null];
        this.setErrorMessageRequiredValue();
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageFailedUserDefinedTest();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `invalid value, expected a ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.date]}`;
    }

    setErrorMessageRangeMin(message) {
        if(this.dateRange[0] === null) {
            return;
        }
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must be a date after ${formateDate(this.dateRange[0])}`;
    }

    setErrorMessageRangeMax(message) {
        if(this.dateRange[0] === null) {
            return;
        }
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must be a date before ${formateDate(this.dateRange[1])}`;
    }

    setErrorMessageFailedUserDefinedTest(message) {
        this.errorMessageFailedUserDefinedTest = message !== undefined ? message : DEFAULT_INVALID_VALUE_MESSAGE;
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
        this.dateRange[0] = new Date(rangeMin);
        this.setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax, message = undefined) {
        this.dateRange[1] = new Date(rangeMax);
        this.setErrorMessageRangeMax(message);
        return this;
    }

    validate(value) {
        if(isNullish(value)){
            if(this.isRequired) {
                return this.errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.date](value)){
            return this.errorMessageInvalidType;
        }
        value = new Date(value);
        if(this.dateRange[0] !== null && value < this.dateRange[0]) {
            return this.errorMessageRangeMin;
        }
        if(this.dateRange[1] !== null && value > this.dateRange[1]) {
            return this.errorMessageRangeMax;
        }
        if(!this.assertUserDefinedTests(value)) {
            return this.errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
