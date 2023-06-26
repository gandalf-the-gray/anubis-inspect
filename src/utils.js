import { DATA_TYPE, JAVASCRIPT_TYPE, INVALID_DATE_MESSAGE } from "./constants.js";
import { throwRequired } from "./errors.js";

export class BaseField {
    constructor({valueIdentifier = throwRequired("Field's name"), type, isRequired, range}) {
        this.valueIdentifier = valueIdentifier;
        this.isRequired = isRequired;
        this.type = type;
        this.range = range;
        this.userDefinedTests = {sync: [], async: []};
        this.dependantTests = {sync: [], async: []};
    }

    min(rangeMin = throwRequired("Minimum value"), message) {
        this.range[0] = rangeMin;
        this.setErrorMessageRangeMin(message);
        return this;
    }

    max(rangeMax = throwRequired("Maximum value"), message) {
        this.range[1] = rangeMax;
        this.setErrorMessageRangeMax(message);
        return this;
    }

    test(testFn = throwRequired("Test function"), dependencies) {
        const isAsync = isAsyncFunction(testFn);
        if(dependencies) {
            if(isAsync) {
                this.dependantTests.async.push([testFn, dependencies]);
            } else {
                this.dependantTests.sync.push([testFn, dependencies]);
            }
        } else {
            if(isAsync) {
                this.userDefinedTests.async.push(testFn);
            } else {
                this.userDefinedTests.sync.push(testFn);
            }
        }
        return this;
    }

    assertUserDefinedTests(value) {
        for(let test of this.userDefinedTests.sync) {
            let [isValid, message] = test(value);
            if(!isValid) {
                this.setErrorMessageUserDefinedTest(message);
                return false;
            }
        }
        return true;
    }
}

function isFiniteNumber(value) {
    return typeof value === JAVASCRIPT_TYPE.number && isFinite(value);
}

function isTruthyValue(value){
    return !(!value);
}

export function isNullish(value) {
    return value === null || value === undefined;
}

export function isAsyncFunction(fn) {
    return fn?.constructor?.name === "AsyncFunction";
}

export function formateDate(date, locality = "en-US") {
    return date.toLocaleDateString(locality, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function setObjectValue(object, address, value) {
    const keys = address.split(".");
    for(let i = 0; i < keys.length; i++) {
        if(i === keys.length - 1) {
            object[keys[i]] = value;
            return;
        }
        if(object[keys[i]] === undefined) {
            object[keys[i]] = {};
        }
        object = object[keys[i]];
    }
}
export function getObjectValue(object, address) {
    if(!object) {
        return undefined;
    }
    const keys = address.split(".");
    for(let i = 0; i < keys.length; i++) {
        if(i === keys.length - 1) {
            return object[keys[i]];
        }
        if(object[keys[i]] === undefined) {
            return undefined;
        }
        object = object[keys[i]];
    }
}

// Type checkers
function isString(value) {
    return typeof value === JAVASCRIPT_TYPE.string;
}

function isNumber(value) {
    return isFiniteNumber(value);
}

function isInteger(value){
    return Number.isInteger(value);
}

function isFloat(value) {
    return isNumber(value) && !isInteger(value);
}

function isArray(value) {
    return isTruthyValue(value) && Array.isArray(value);
}

function isObject(value){
    return isTruthyValue(value) && typeof value === JAVASCRIPT_TYPE.object && value.constructor === Object;
}

function isDate(value){
    return new Date(value).toString() !== INVALID_DATE_MESSAGE;
}

function isBoolean(value) {
    return typeof value === JAVASCRIPT_TYPE.boolean;
}

function isNull(value) {
    return value === null;
}

function isUndefined(value) {
    return value === undefined;
}

export const validators = {[DATA_TYPE.string]: isString, [DATA_TYPE.number]: isNumber, [DATA_TYPE.integer]: isInteger, [DATA_TYPE.float]: isFloat, [DATA_TYPE.array]: isArray, [DATA_TYPE.object]: isObject, [DATA_TYPE.date]: isDate, [DATA_TYPE.boolean]: isBoolean, [DATA_TYPE.null]: isNull, [DATA_TYPE.undefined]: isUndefined};

// Patterns
export const patternDescriptors = {email: "email", alphanumeric: "alphanumeric"};
export const patterns = {[patternDescriptors.email]: /[A-Za-z0-9-_]{1,}@[A-Za-z0-9-_]{1,}\.[A-Za-z0-9-_]{2,}/, [patternDescriptors.alphanumeric]: /^[A-Za-z0-9\s]*$/};
