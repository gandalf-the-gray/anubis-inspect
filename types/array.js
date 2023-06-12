import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { ValidatorField, isNullish, isAsyncFunction, validators } from "../utils.js";
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
        super({valueIdentifier, type: DATA_TYPE.array, isRequired: ArrayField.defaultIsRequired});
        this.lengthRange = [ArrayField.defaultMinLength, ArrayField.defaultMaxLength];
        this.containedValueValidator = ArrayField.defaultContainedTypeValidator;
        this.nested = true;
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageNested();
        this.setErrorMessageInvalidContainedValue();
        this.setErrorMessageFailedUserDefinedTest();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} are required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `invalid value, expected a ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.array]}`;
    }

    setErrorMessageRangeMin(message) {
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must have at least ${this.lengthRange[0]} values`;
    }

    setErrorMessageRangeMax(message) {
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must not have more than ${this.lengthRange[1]} values`;
    }

    setErrorMessageNested(message) {
        this.errorMessageNested = message !== undefined ? message : `${this.valueIdentifier} must not contain a ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.array]}`;
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

    assertContainedValue(list) {
        for(const item of list) {
            if(this.containedValueValidator !== null) {
                const errorMessage = this.containedValueValidator.validate(item);
                if(errorMessage !== null) {
                    return this.errorMessageInvalidContainedValue;
                }
            }
            if(!this.nested && validators[DATA_TYPE.array](item)) {
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
            if(this.isRequired){
                return this.errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.array](value)) {
            return this.errorMessageInvalidType;
        }
        if(value.length < this.lengthRange[0]) {
            return this.errorMessageRangeMin;
        }
        if(value.length > this.lengthRange[1]) {
            return this.errorMessageRangeMax;
        }
        if(this.containedValueValidator !== null || !this.nested) {
            const message = this.assertContainedValue(value);
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
