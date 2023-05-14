import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME } from "../constants.js";
import { ValidatorField, isNullish, patternDescriptors, patterns, validators } from "../utils.js";

export class StringField extends ValidatorField {
    static defaultIsRequired = false;
    static defaultMinLength = 0;
    static defaultMaxLength = Infinity;
    static defaultPattern = null;
    static defaultUserDefinedTests = [];

    static email(valueIdentifier, message = undefined) {
        return new StringField(valueIdentifier).match(patterns[patternDescriptors.email], message);
    }

    static alphanum(valueIdentifier, message = undefined) {
        return new StringField(valueIdentifier).match(patterns[patternDescriptors.alphanumeric], message);
    }

    constructor(valueIdentifier){
        super({valueIdentifier, type: DATA_TYPE.string, isRequired: StringField.defaultIsRequired, userDefinedTests: StringField.defaultUserDefinedTests});
        this._lengthRange = [StringField.defaultMinLength, StringField.defaultMaxLength];
        this._pattern = StringField.defaultPattern;
        this._setErrorMessageValueRequired();
        this._setErrorMessageInvalidType();
        this._setErrorMessageRangeMin();
        this._setErrorMessageRangeMax();
        this._setErrorMessageInvalidPattern();
        this._setErrorMessageFailedUserDefinedTest();
    }

    _setErrorMessageValueRequired(message) {
        this._errorMessageRequiredValue = message !== undefined ? message : `${this._valueIdentifier} is required`;
    }

    _setErrorMessageInvalidType(message) {
        this._errorMessageInvalidType = message !== undefined ? message : `invalid value, ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.string]} expected`;
    }

    _setErrorMessageRangeMin(message) {
        this._errorMessageRangeMin = message !== undefined ? message : `${this._valueIdentifier} must not have less than ${this._lengthRange[0]} characters`;
    }

    _setErrorMessageRangeMax(message) {
        this._errorMessageRangeMax = message !== undefined ? message : `${this._valueIdentifier} must not have more than ${this._lengthRange[1]} characters`;
    }

    _setErrorMessageInvalidPattern(message) {
        this._errorMessageInvalidPattern = message !== undefined ? message : `invalid ${this._valueIdentifier}`;
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
        this._setErrorMessageValueRequired(message);
        return this;
    }

    min(rangeMin, message = undefined) {
        this._lengthRange[0] = rangeMin;
        this._setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax, message = undefined) {
        this._lengthRange[1] = rangeMax;
        this._setErrorMessageRangeMax(message);
        return this;
    }

    match(pattern, message = undefined) {
        this._pattern = pattern;
        this._setErrorMessageInvalidPattern(message);
        return this;
    }

    test(testFun, message = undefined) {
        this._userDefinedTests.push([testFun, message]);
        return this;
    }

    validate(value) {
        if(isNullish(value)) {
            if(this._isRequired) {
                return this._errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.string](value)) {
            return this._errorMessageInvalidType;
        }
        if(value.length < this._lengthRange[0]) {
            return this._errorMessageRangeMin;
        }
        if(value.length > this._lengthRange[1]) {
            return this._errorMessageRangeMax;
        }
        if(this._pattern && !this._pattern.test(value)) {
            return this._errorMessageInvalidPattern;
        }
        if(this._userDefinedTests.length > 0 && !this._assertUserDefinedTests(value)) {
            return this._errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
