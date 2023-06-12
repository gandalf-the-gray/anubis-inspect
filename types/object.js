import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { ValidatorField, isNullish, isAsyncFunction, validators } from "../utils.js";

export class ObjectField extends ValidatorField {
    static defaultIsRequired = false;
    static defaultValueType = null;
    static defaultRangeMin = 0;
    static defaultRangeMax = Infinity;

    constructor(valueIdentifier) {
        super({valueIdentifier, type: DATA_TYPE.object, isRequired: ObjectField.defaultIsRequired});
        this.lengthRange = [ObjectField.defaultRangeMin, ObjectField.defaultRangeMax];
        this.containedValueValidator = ObjectField.defaultValueType;
        this.nested = true;
        this.setErrorMessageRequiredValue();
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageNested();
        this.setErrorMessageInvalidContainedValue();
        this.setErrorMessageFailedUserDefinedTest();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `invalid value, expected an ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.object]}`;
    }

    setErrorMessageRangeMin(message) {
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must have at least ${this.lengthRange[0]} values`;
    }

    setErrorMessageRangeMax(message) {
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must have more than ${this.lengthRange[1]} values`;
    }

    setErrorMessageNested(message) {
        this.errorMessageNested = message !== undefined ? message : `${this.valueIdentifier} must not contain an ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.object]}`;
    }

    setErrorMessageInvalidContainedValue(message) {
        if(message === undefined) {
            if(this.containedValueValidator !== null) {
                message = `${this.valueIdentifier} must only have ${DATA_TYPE_TO_COMMON_NAME[this.containedValueValidator.type]} values`;
            }
        }
        this.errorMessageInvalidContainedValue = message;
    }

    setErrorMessageFailedUserDefinedTest(message) {
        this.errorMessageFailedUserDefinedTest = message !== undefined ? message : DEFAULT_INVALID_VALUE_MESSAGE;
    }

    assertContainedValues(object) {
        for(const prop in object) {
            if(this.containedValueValidator !== null) {
                const errorMessage = this.containedValueValidator.validate(object[prop]);
                if(errorMessage !== null) {
                    return this.errorMessageInvalidContainedValue;
                }
            }
            if(!this.nested && validators[DATA_TYPE.object](object[prop])) {
                return this.errorMessageNested;
            }
        }
        return null;
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
        this.lengthRange[0] = rangeMin;
        this.setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax, message = undefined) {
        this.lengthRange[1] = rangeMax;
        this.setErrorMessageRangeMax(message);
        return this;
    }

    values(type, message = undefined) {
        this.containedValueValidator = type;
        this.setErrorMessageInvalidContainedValue(message);
        return this;
    }

    notNested(message = undefined) {
        this.nested = false;
        this.setErrorMessageNested(message);
        return this;
    }

    validate(value) {
        if(isNullish(value)) {
            if(this.isRequired) {
                return this.errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.object](value)) {
            return this.errorMessageInvalidType;
        }
        const keys = Object.keys(value);
        if(keys.length < this.lengthRange[0]) {
            return this.errorMessageRangeMin;
        }
        if(keys.length > this.lengthRange[1]) {
            return this.errorMessageRangeMax;
        }
        if(this.containedValueValidator !== null || !this.nested){
            const message = this.assertContainedValues(value);
            if(message !== null) {
                return message;
            }
        }
        if(!this.assertUserDefinedTests(value)) {
            return this.errorMessageFailedUserDefinedTest;
        }
        return null;
    }
}
