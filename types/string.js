import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { ValidatorField, isNullish, isAsyncFunction, patternDescriptors, patterns, validators } from "../utils.js";

export class StringField extends ValidatorField {
    static defaultIsRequired = false;
    static defaultMinLength = 0;
    static defaultMaxLength = Infinity;
    static defaultPattern = null;

    static email(valueIdentifier, message = undefined) {
        return new StringField(valueIdentifier).match(patterns[patternDescriptors.email], message);
    }

    static alphanum(valueIdentifier, message = undefined) {
        return new StringField(valueIdentifier).match(patterns[patternDescriptors.alphanumeric], message);
    }

    constructor(valueIdentifier){
        super({valueIdentifier, type: DATA_TYPE.string, isRequired: StringField.defaultIsRequired});
        this.lengthRange = [StringField.defaultMinLength, StringField.defaultMaxLength];
        this.pattern = StringField.defaultPattern;
        this.setErrorMessageValueRequired();
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageInvalidPattern();
        this.setErrorMessageFailedUserDefinedTest();
    }

    setErrorMessageValueRequired(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `invalid value, expected ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.string]}`;
    }

    setErrorMessageRangeMin(message) {
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must have at least ${this.lengthRange[0]} characters`;
    }

    setErrorMessageRangeMax(message) {
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must not have more than ${this.lengthRange[1]} characters`;
    }

    setErrorMessageInvalidPattern(message) {
        this.errorMessageInvalidPattern = message !== undefined ? message : `invalid ${this.valueIdentifier}`;
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
        this.setErrorMessageValueRequired(message);
        return this;
    }

    min(rangeMin, message = undefined) {
        this.lengthRange[0] = rangeMin;
        this.setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax, message = undefined) {
        this.lengthRange[1] = rangeMax;
        this.setErrorMessageRangeMax(message);
        return this;
    }

    match(pattern, message = undefined) {
        this.pattern = pattern;
        this.setErrorMessageInvalidPattern(message);
        return this;
    }

    validate(value) {
        if(isNullish(value)) {
            if(this.isRequired) {
                return this.errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.string](value)) {
            return this.errorMessageInvalidType;
        }
        if(value.length < this.lengthRange[0]) {
            return this.errorMessageRangeMin;
        }
        if(value.length > this.lengthRange[1]) {
            return this.errorMessageRangeMax;
        }
        if(this.pattern && !this.pattern.test(value)) {
            return this.errorMessageInvalidPattern;
        }
        if(!this.assertUserDefinedTests(value)) {
            return this.errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
