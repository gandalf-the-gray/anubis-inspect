import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { BaseField, isNullish, patternDescriptors, patterns, validators } from "../utils.js";

export class StringField extends BaseField {
    static defaultIsRequired = true;
    static defaultMinLength = 0;
    static defaultMaxLength = Infinity;
    static defaultPattern = null;

    static email(valueIdentifier, message) {
        return new StringField(valueIdentifier).match(patterns[patternDescriptors.email], message);
    }

    static alphanum(valueIdentifier, message) {
        return new StringField(valueIdentifier).match(patterns[patternDescriptors.alphanumeric], message);
    }

    constructor(valueIdentifier, isRequired = StringField.defaultIsRequired){
        super({valueIdentifier, type: DATA_TYPE.string, range: [StringField.defaultMinLength, StringField.defaultMaxLength], isRequired});
        this.pattern = StringField.defaultPattern;
        this.setErrorMessageValueRequired();
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageInvalidPattern();
        this.setErrorMessageUserDefinedTest();
    }

    setErrorMessageValueRequired(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `Invalid value, expected ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.string]}`;
    }

    setErrorMessageRangeMin(message) {
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must have at least ${this.range[0]} characters`;
    }

    setErrorMessageRangeMax(message) {
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must not have more than ${this.range[1]} characters`;
    }

    setErrorMessageInvalidPattern(message) {
        this.errorMessageInvalidPattern = message !== undefined ? message : `Invalid ${this.valueIdentifier}`;
    }

    setErrorMessageUserDefinedTest(message) {
        this.errorMessageUserDefinedTest = message !== undefined ? message : DEFAULT_INVALID_VALUE_MESSAGE;
    }

    invalidTypeMessage(message) {
        this.setErrorMessageInvalidType(message);
        return this;
    }

    requiredValueMessage(message) {
        this.setErrorMessageValueRequired(message);
        return this;
    }

    match(pattern = throwRequired("Expression"), message) {
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
        if(value.length < this.range[0]) {
            return this.errorMessageRangeMin;
        }
        if(value.length > this.range[1]) {
            return this.errorMessageRangeMax;
        }
        if(this.pattern && !this.pattern.test(value)) {
            return this.errorMessageInvalidPattern;
        }
        if(!this.assertUserDefinedTests(value)) {
            return this.errorMessageUserDefinedTest;
        }
        return null;
    }
}
