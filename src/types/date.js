import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE, INVALID_DATE_MESSAGE } from "../constants.js";
import { BaseField, formateDate, isNullish, validators } from "../utils.js";
import { throwRequired } from "../errors.js";

export class DateField extends BaseField {
    static defaultIsRequired = true;

    static before(valueIdentifier, date, message) {
        return new DateField(valueIdentifier).max(date, message);
    }

    static after(valueIdentifier, date, message) {
        return new DateField(valueIdentifier).min(date, message);
    }

    constructor(valueIdentifier, isRequired = DateField.defaultIsRequired) {
        super({valueIdentifier, type: DATA_TYPE.date, range: [null, null], isRequired});
        this.setErrorMessageRequiredValue();
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageUserDefinedTest();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `Invalid value, expected a ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.date]}`;
    }

    setErrorMessageRangeMin(message) {
        if(this.range[0] === null) {
            return;
        }
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must be a date after ${formateDate(this.range[0])}`;
    }

    setErrorMessageRangeMax(message) {
        if(this.range[0] === null) {
            return;
        }
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must be a date before ${formateDate(this.range[1])}`;
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
    
    // Other values use the min, max methods from BaseField
    // DateField has to have these methods because it converts the values into dates
    min(rangeMin = throwRequired("Minimum value"), message) {
        rangeMin = new Date(rangeMin);
        if(rangeMin.toString() === INVALID_DATE_MESSAGE) {
            throw Error("Invalid minimum date");
        }
        this.range[0] = rangeMin;
        this.setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax = throwRequired("Maximum value"), message) {
        rangeMax = new Date(rangeMax);
        if(rangeMax.toString() === INVALID_DATE_MESSAGE) {
            throw Error("Invalid maximum date");
        }
        this.range[1] = rangeMax;
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
        if(this.range[0] !== null && value < this.range[0]) {
            return this.errorMessageRangeMin;
        }
        if(this.range[1] !== null && value > this.range[1]) {
            return this.errorMessageRangeMax;
        }
        if(!this.assertUserDefinedTests(value)) {
            return this.errorMessageUserDefinedTest;
        }
        return null;
    }
}
