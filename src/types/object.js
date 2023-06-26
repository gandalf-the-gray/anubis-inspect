import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { BaseField, isNullish, validators } from "../utils.js";

export class ObjectField extends BaseField {
    static defaultIsRequired = true;
    static defaultValueType = null;
    static defaultRangeMin = 0;
    static defaultRangeMax = Infinity;

    constructor(valueIdentifier, isRequired = ObjectField.defaultIsRequired) {
        super({valueIdentifier, type: DATA_TYPE.object, range: [ObjectField.defaultRangeMin, ObjectField.defaultRangeMax], isRequired});
        this.containedValueValidator = ObjectField.defaultValueType;
        this.nested = true;
        this.setErrorMessageRequiredValue();
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageNested();
        this.setErrorMessageInvalidContainedValue();
        this.setErrorMessageUserDefinedTest();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} is required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `Invalid value, expected an ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.object]}`;
    }

    setErrorMessageRangeMin(message) {
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must have at least ${this.range[0]} values`;
    }

    setErrorMessageRangeMax(message) {
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must have more than ${this.range[1]} values`;
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

    setErrorMessageUserDefinedTest(message) {
        this.errorMessageUserDefinedTest = message !== undefined ? message : DEFAULT_INVALID_VALUE_MESSAGE;
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

    invalidTypeMessage(message) {
        this.setErrorMessageInvalidType(message);
        return this;
    }

    requiredValueMessage(message) {
        this.setErrorMessageRequiredValue(message);
        return this;
    }

    values(type, message) {
        this.containedValueValidator = type;
        this.setErrorMessageInvalidContainedValue(message);
        return this;
    }

    notNested(message) {
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
        if(keys.length < this.range[0]) {
            return this.errorMessageRangeMin;
        }
        if(keys.length > this.range[1]) {
            return this.errorMessageRangeMax;
        }
        if(this.containedValueValidator !== null || !this.nested){
            const message = this.assertContainedValues(value);
            if(message !== null) {
                return message;
            }
        }
        if(!this.assertUserDefinedTests(value)) {
            return this.errorMessageUserDefinedTest;
        }
        return null;
    }
}
