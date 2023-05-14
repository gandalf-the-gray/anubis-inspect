import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME } from "../constants.js";
import { ValidatorField, isNullish, validators } from "../utils.js";
import { DateField } from "./date.js";
import { FloatField } from "./float.js";
import { IntegerField } from "./integer.js";
import { NumberField } from "./number.js";
import { ObjectField } from "./object.js";
import { StringField } from "./string.js";

export class ArrayField extends ValidatorField {
    static defaultIsRequired = false;
    static defaultMinLength = 0;
    static defaultMaxLength = Infinity;
    static defaultContainedTypeValidator = null;
    static defaultUserDefinedTests = [];

    static _getInvalidTypeMessage(valueIdentifier, type) {
        return `${valueIdentifier} must only have ${type} values`;
    }

    static string(valueIdentifier, message = undefined) {
        return new ArrayField(valueIdentifier).values(new StringField(), message);
    }

    static number(valueIdentifier, message = undefined) {
        return new ArrayField(valueIdentifier).values(new NumberField(), message);
    }

    static integer(valueIdentifier, message = undefined) {
        return new ArrayField(valueIdentifier).values(new IntegerField(), message);
    }

    static float(valueIdentifier, message = undefined) {
        return new ArrayField(valueIdentifier).values(new FloatField(), message);
    }

    static date(valueIdentifier, message = undefined) {
        return new ArrayField(valueIdentifier).values(new DateField(), message);
    }

    static array(valueIdentifier, message = undefined) {
        return new ArrayField(valueIdentifier).values(new ArrayField(), message);
    }

    static object(valueIdentifier, message = undefined) {
        return new ArrayField(valueIdentifier).values(new ObjectField(), message);
    }

    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.array, isRequired: ArrayField.defaultIsRequired, userDefinedTests: ArrayField.defaultUserDefinedTests});
        this._lengthRange = [ArrayField.defaultMinLength, ArrayField.defaultMaxLength];
        this._containedValueValidator = ArrayField.defaultContainedTypeValidator;
        this._nested = true;
        this._setErrorMessageInvalidType();
        this._setErrorMessageRangeMin();
        this._setErrorMessageRangeMax();
        this._setErrorMessageNested();
        this._setErrorMessageInvalidContainedValue();
        this._setErrorMessageFailedUserDefinedTest();
    }

    _setErrorMessageRequiredValue(message) {
        this._errorMessageRequiredValue = message !== undefined ? message : `${this._valueIdentifier} are required`;
    }

    _setErrorMessageInvalidType(message) {
        this._errorMessageInvalidType = message !== undefined ? message : `invalid value, ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.array]} expected`;
    }

    _setErrorMessageRangeMin(message) {
        this._errorMessageRangeMin = message !== undefined ? message : `${this._valueIdentifier} must not have less than ${this._lengthRange[0]} values`;
    }

    _setErrorMessageRangeMax(message) {
        this._errorMessageRangeMax = message !== undefined ? message : `${this._valueIdentifier} must not have more than ${this._lengthRange[1]} values`;
    }

    _setErrorMessageNested(message) {
        this._errorMessageNested = message !== undefined ? message : `${this._valueIdentifier} must not contain a nested ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.array]}`;
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
        this._errorMessageFailedUserDefinedTest = message !== undefined ? message : "invalid value";
    }

    _assertContainedValue(list) {
        for(const item of list) {
            if(this._containedValueValidator !== null) {
                const errorMessage = this._containedValueValidator.validate(item);
                if(errorMessage !== null) {
                    return this._errorMessageInvalidContainedValue;
                }
            }
            if(!this._nested && validators[DATA_TYPE.array](item)) {
                return this._errorMessageNested;
            }
        }
        return null;
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
        this._lengthRange[0] = rangeMin;
        this._setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax, message = undefined) {
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
        this._userDefinedTests.push([testFun, message]);
        return this;
    }

    validate(value) {
        if(isNullish(value)) {
            if(this._isRequired){
                return this._errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.array](value)) {
            return this._errorMessageInvalidType;
        }
        if(value.length < this._lengthRange[0]) {
            return this._errorMessageRangeMin;
        }
        if(value.length > this._lengthRange[1]) {
            return this._errorMessageRangeMax;
        }
        if(this._containedValueValidator !== null || !this._nested) {
            const message = this._assertContainedValue(value);
            if(message !== null) {
                return message;
            }
        }
        if(this._userDefinedTests.length > 0 && !this._assertUserDefinedTests(value)) {
            return this._errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
