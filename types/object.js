import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { ValidatorField, isNullish, isAsyncFunction, validators } from "../utils.js";

export class ObjectField extends ValidatorField {
    static defaultIsRequired = false;
    static defaultValueType = null;
    static defaultRangeMin = 0;
    static defaultRangeMax = Infinity;

    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.object, isRequired: ObjectField.defaultIsRequired});
        this._lengthRange = [ObjectField.defaultRangeMin, ObjectField.defaultRangeMax];
        this._containedValueValidator = ObjectField.defaultValueType;
        this._nested = true;
        this._setErrorMessageRequiredValue();
        this._setErrorMessageInvalidType();
        this._setErrorMessageRangeMin();
        this._setErrorMessageRangeMax();
        this._setErrorMessageNested();
        this._setErrorMessageInvalidContainedValue();
        this._setErrorMessageFailedUserDefinedTest();
    }

    _setErrorMessageRequiredValue(message) {
        this._errorMessageRequiredValue = message !== undefined ? message : `${this._valueIdentifier} is required`;
    }

    _setErrorMessageInvalidType(message) {
        this._errorMessageInvalidType = message !== undefined ? message : `invalid value, expected an ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.object]}`;
    }

    _setErrorMessageRangeMin(message) {
        this._errorMessageRangeMin = message !== undefined ? message : `${this._valueIdentifier} must have at least ${this._lengthRange[0]} values`;
    }

    _setErrorMessageRangeMax(message) {
        this._errorMessageRangeMax = message !== undefined ? message : `${this._valueIdentifier} must have more than ${this._lengthRange[1]} values`;
    }

    _setErrorMessageNested(message) {
        this._errorMessageNested = message !== undefined ? message : `${this._valueIdentifier} must not contain an ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.object]}`;
    }

    _setErrorMessageInvalidContainedValue(message) {
        if(message === undefined) {
            if(this._containedValueValidator !== null) {
                message = `${this._valueIdentifier} must only have ${DATA_TYPE_TO_COMMON_NAME[this._containedValueValidator.type]} values`;
            }
        }
        this._errorMessageInvalidContainedValue = message;
    }

    _setErrorMessageFailedUserDefinedTest(message) {
        this._errorMessageFailedUserDefinedTest = message !== undefined ? message : DEFAULT_INVALID_VALUE_MESSAGE;
    }

    _assertContainedValues(object) {
        for(const prop in object) {
            if(this._containedValueValidator !== null) {
                const errorMessage = this._containedValueValidator.validate(object[prop]);
                if(errorMessage !== null) {
                    return this._errorMessageInvalidContainedValue;
                }
            }
            if(!this._nested && validators[DATA_TYPE.object](object[prop])) {
                return this._errorMessageNested;
            }
        }
        return null;
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
        this._lengthRange[0] = rangeMin;
        this._setErrorMessageRangeMin(message);
        return this;
    }

    min(rangeMax, message = undefined) {
        this._lengthRange[1] = rangeMax;
        this._setErrorMessageRangeMax(message);
        return this;
    }

    values(type, message = undefined) {
        this._containedValueValidator = type;
        this._setErrorMessageInvalidContainedValue(message);
        return this;
    }

    notNested(message = undefined) {
        this._nested = false;
        this._setErrorMessageNested(message);
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
            if(this._isRequired) {
                return this._errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.object](value)) {
            return this._errorMessageInvalidType;
        }
        const keys = Object.keys(value);
        if(keys.length < this._lengthRange[0]) {
            return this._errorMessageRangeMin;
        }
        if(keys.length > this._lengthRange[1]) {
            return this._errorMessageRangeMax;
        }
        if(this._containedValueValidator !== null || !this._nested){
            const message = this._assertContainedValues(value);
            if(message !== null) {
                return message;
            }
        }
        if(!this._assertUserDefinedTests(value)) {
            return this._errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
