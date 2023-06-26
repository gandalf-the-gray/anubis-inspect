import { DATA_TYPE, DATA_TYPE_TO_COMMON_NAME, DEFAULT_INVALID_VALUE_MESSAGE } from "../constants.js";
import { BaseField, isNullish, validators } from "../utils.js";
import { DateField } from "./date.js";
import { FloatField } from "./float.js";
import { IntegerField } from "./integer.js";
import { NumberField } from "./number.js";
import { ObjectField } from "./object.js";
import { StringField } from "./string.js";
import { throwRequired } from "../errors.js";

export class ArrayField extends BaseField {
    static defaultIsRequired = true;
    static defaultMinLength = 0;
    static defaultMaxLength = Infinity;
    static defaultContainedTypeValidator = null;

    static string(valueIdentifier, message) {
        return new ArrayField(valueIdentifier).values(new StringField(), message);
    }

    static number(valueIdentifier, message) {
        return new ArrayField(valueIdentifier).values(new NumberField(), message);
    }

    static integer(valueIdentifier, message) {
        return new ArrayField(valueIdentifier).values(new IntegerField(), message);
    }

    static float(valueIdentifier, message) {
        return new ArrayField(valueIdentifier).values(new FloatField(), message);
    }

    static date(valueIdentifier, message) {
        return new ArrayField(valueIdentifier).values(new DateField(), message);
    }

    static array(valueIdentifier, message) {
        return new ArrayField(valueIdentifier).values(new ArrayField(), message);
    }

    static object(valueIdentifier, message) {
        return new ArrayField(valueIdentifier).values(new ObjectField(), message);
    }

    constructor(valueIdentifier, isRequired = ArrayField.defaultIsRequired) {
        super({valueIdentifier, type: DATA_TYPE.array, range: [ArrayField.defaultMinLength, ArrayField.defaultMaxLength], isRequired});
        this.containedValueValidator = ArrayField.defaultContainedTypeValidator;
        this.nested = true;
        this.setErrorMessageInvalidType();
        this.setErrorMessageRangeMin();
        this.setErrorMessageRangeMax();
        this.setErrorMessageNested();
        this.setErrorMessageInvalidContainedValue();
        this.setErrorMessageUserDefinedTest();
    }

    setErrorMessageRequiredValue(message) {
        this.errorMessageRequiredValue = message !== undefined ? message : `${this.valueIdentifier} are required`;
    }

    setErrorMessageInvalidType(message) {
        this.errorMessageInvalidType = message !== undefined ? message : `Invalid value, expected a ${DATA_TYPE_TO_COMMON_NAME[DATA_TYPE.array]}`;
    }

    setErrorMessageRangeMin(message) {
        this.errorMessageRangeMin = message !== undefined ? message : `${this.valueIdentifier} must have at least ${this.range[0]} values`;
    }

    setErrorMessageRangeMax(message) {
        this.errorMessageRangeMax = message !== undefined ? message : `${this.valueIdentifier} must not have more than ${this.range[1]} values`;
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

    setErrorMessageUserDefinedTest(message) {
        this.errorMessageUserDefinedTest = message !== undefined ? message : DEFAULT_INVALID_VALUE_MESSAGE;
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

    requiredValueMessage(message) {
        this.setErrorMessageRequiredValue(message);
        return this;
    }

    invalidTypeMessage(message) {
        this.setErrorMessageInvalidType(message);
        return this;
    }

    values(type = throwRequired("Type validator"), message) {
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
            if(this.isRequired){
                return this.errorMessageRequiredValue;
            }
            return null;
        }
        if(!validators[DATA_TYPE.array](value)) {
            return this.errorMessageInvalidType;
        }
        if(value.length < this.range[0]) {
            return this.errorMessageRangeMin;
        }
        if(value.length > this.range[1]) {
            return this.errorMessageRangeMax;
        }
        if(this.containedValueValidator !== null || !this.nested) {
            const message = this.assertContainedValue(value);
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
