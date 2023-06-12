import { DATA_TYPE, DEFAULT_INVALID_VALUE_MESSAGE } from "./constants.js";
import { ArrayField } from "./types/array.js";
import { DateField } from "./types/date.js";
import { FloatField } from "./types/float.js";
import { IntegerField } from "./types/integer.js";
import { NullField } from "./types/null.js";
import { NumberField } from "./types/number.js";
import { ObjectField } from "./types/object.js";
import { StringField } from "./types/string.js";
import { UndefinedField } from "./types/undefined.js";
import { setObjectValue, getObjectValue, validators } from "./utils.js";

// Base validator class
class BaseValidator {
    constructor() {
        this.rules = {};
        this.asyncTestList = [];
        this.dependantTestList = {sync: [], async: []};
    }

    init(rules) {
        // this.rules in the _init call refers to rules of the immediate super class
        this.rules = this._init(this.rules, rules);
        this.cacheAsyncTests(this.rules);
        this.cachedependantTests(this.rules);
    }

    _init(superRules, newRules) {
        const rules = {...superRules};
        for(const ruleField in newRules) {
            if(validators[DATA_TYPE.object](newRules[ruleField]) && validators[DATA_TYPE.object](superRules[ruleField])) {
                rules[ruleField] = this._init(superRules[ruleField], newRules[ruleField]);
            } else {
                rules[ruleField] = newRules[ruleField];
            }
        }
        return rules;
    }

    validate(body) {
        let errors = this._validate(this.rules, body);            
        for(let i = 0; i < this.dependantTestList.sync.length; i++) {
            let [fieldAddress, testFn, dependencies, message] = this.dependantTestList.sync[i];
            if(getObjectValue(errors, fieldAddress) === undefined) {
                if(dependencies.every((dep) => getObjectValue(errors, dep) === undefined)) {
                    let isValid = testFn(getObjectValue(body, fieldAddress), dependencies.map((dep) => getObjectValue(body, dep)));
                    if(Array.isArray(isValid)) {
                        message = isValid[1];
                        isValid = isValid[0];
                    }
                    if(!isValid) {
                        errors = errors ? errors : {};
                        setObjectValue(errors, fieldAddress, message ? message : DEFAULT_INVALID_VALUE_MESSAGE);
                    }
                }
            }
        }
        return errors;
    }

    _validate(rules, body) {
        body = validators[DATA_TYPE.object](body) ? body : {};
        let errors = null;
        for(const ruleField in rules) {
            let error = null;
            if(validators[DATA_TYPE.object](rules[ruleField])) {
                error = this._validate(rules[ruleField], body[ruleField]);
            } else {
                error = rules[ruleField].validate(body[ruleField]);
            }
            if(error !== null) {
                errors = errors ? errors : {};
                errors[ruleField] = error;
            }
        }
        for(const bodyField in body) {
            if(rules[bodyField] === undefined) {
                errors = errors ? errors : {};
                errors[bodyField] = "unknown field";
            }
        }
        return errors;
    }

    cacheAsyncTests(rules, prefix = "") {
        for(const ruleField in rules) {
            const address = prefix ? `${prefix}.${ruleField}` : ruleField;
            if(validators[DATA_TYPE.object](rules[ruleField])) {
                this.cacheAsyncTests(rules[ruleField], address);
                continue;
            }
            this.asyncTestList = this.asyncTestList.concat(
                rules[ruleField].userDefinedTests.async.map(([testFn, message]) => {
                    return [address, testFn, message ? message : DEFAULT_INVALID_VALUE_MESSAGE];
                })
            );
        }
    }

    cachedependantTests(rules, prefix = "") {
        for(const ruleField in rules) {
            const address = prefix ? `${prefix}.${ruleField}` : ruleField;
            if(validators[DATA_TYPE.object](rules[ruleField])) {
                this.cachedependantTests(rules[ruleField], address);
                continue;
            }
            this.dependantTestList.sync = this.dependantTestList.sync.concat(
                rules[ruleField].dependantTests.sync.map(([testFn, dependencies, message]) => {
                    return [address, testFn, dependencies, message ? message : DEFAULT_INVALID_VALUE_MESSAGE];
                })
            );
            this.dependantTestList.async = this.dependantTestList.async.concat(
                rules[ruleField].dependantTests.async.map(([testFn, dependencies, message]) => {
                    return [address, testFn, dependencies, message ? message : DEFAULT_INVALID_VALUE_MESSAGE];
                })
            );
        }
    }

    async asyncValidate(body, res) {
        let errors = this.validate(body);
        // Note: every element in asyncTestQueue will be [address, testFn, message]
        const validAsyncTests = this.asyncTestList.filter(
            (task) => getObjectValue(errors, task[0]) === undefined
        );
        if(validAsyncTests.length > 0) {
            const results = await Promise.all(
                validAsyncTests.map((task) => task[1](getObjectValue(body, task[0]), res))
            );
            for(let i = 0; i < results.length; i++) {
                let isValid = results[i];
                let message = validAsyncTests[i][2];
                if(Array.isArray(isValid)) {
                    message = isValid[1];
                    isValid = isValid[0];
                }
                if(!isValid) {
                    errors = errors ? errors : {};
                    setObjectValue(errors, validAsyncTests[i][0], message ? message : DEFAULT_INVALID_VALUE_MESSAGE);
                }
            }
        }

        // Note: every dependantTest will be [address, testFn, dependencies, message]
        const validAsyncDependantTests = this.dependantTestList.async.filter((item) => {
            const [fieldAddress, _, dependencies] = item;
            const isFieldValid = getObjectValue(errors, fieldAddress) === undefined;
            const areDependenciesValid = dependencies.every((dep) => getObjectValue(errors, dep) === undefined);
            return isFieldValid && areDependenciesValid;
        })

        if(validAsyncDependantTests.length > 0) {
            const results = await Promise.all(
                validAsyncDependantTests.map(([fieldAddress, testFn, dependencies]) => {
                    const dependencyValues = dependencies.map((dep) => getObjectValue(body, dep));
                    return testFn(getObjectValue(body, fieldAddress), dependencyValues);
                })
            )
            for(let i = 0; i < results.length; i++) {
                let isValid = results[i];
                let message = validAsyncDependantTests[i][3];
                if(Array.isArray(isValid)) {
                    message = isValid[1];
                    isValid = isValid[0];
                }
                if(!isValid) {
                    const address = validAsyncDependantTests[i][0];
                    setObjectValue(errors, address, message ? message : DEFAULT_INVALID_VALUE_MESSAGE);
                }
            }
        }

        return errors;
    }

    middleware(status = 422) {
        const _this = this;
        return async function(req, res, next) {
            if(!req.body) {
                throw new Error("request body not found, you're probably not parsing the request body");
            }
            const messages = await _this.asyncValidate(req.body, res);
            if(messages) {
                res.status(status).json(messages);
            }else{
                next();
            }
        }
    }
}

export { ArrayField, BaseValidator, DateField, FloatField, IntegerField, NullField, NumberField, ObjectField, StringField, UndefinedField };
