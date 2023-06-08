import { DATA_TYPE, JAVASCRIPT_TYPE } from "./constants.js";


// Utilities
// --------------------------------------------------------------------------------------------------
// All validator classes will inherit from the following class
// This will help to check if an object in the rules is a plain object or a validator
export class ValidatorField {
    constructor({valueIdentifier, type, isRequired}) {
        this._valueIdentifier = valueIdentifier;
        // It might seem strange that I'm making almost all internal utilities private
        // but type is public, the 'type' getter will be used by other types such as objects and arrays
        // to validate the values they contain, that is why it needs to be public
        this.type = type;
        this._isRequired = isRequired;
        this._userDefinedTests = [];
        this.userDefinedAsyncTests = [];
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

// TODO: should the pattrn 'value.constructor be used to check all types?
function isObject(value){
    return isTruthyValue(value) && typeof value === JAVASCRIPT_TYPE.object && value.constructor === Object;
}

function isDate(value){
    return new Date(value).toString() !== 'Invalid Date';
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
