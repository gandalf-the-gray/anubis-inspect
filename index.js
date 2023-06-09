import { DATA_TYPE, DEFAULT_INVALID_VALUE_MESSAGE } from "./src/constants.js";
export { ArrayField } from "./src/types/array.js";
export { BooleanField } from "./src/types/boolean.js";
export { DateField } from "./src/types/date.js";
export { FloatField } from "./src/types/float.js";
export { IntegerField } from "./src/types/integer.js";
export { NullField } from "./src/types/null.js";
export { NumberField } from "./src/types/number.js";
export { ObjectField } from "./src/types/object.js";
export { StringField } from "./src/types/string.js";
export { UndefinedField } from "./src/types/undefined.js";
import { setObjectValue, getObjectValue, validators } from "./src/utils.js";

// Base validator class
export class BaseValidator {
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
            let [fieldAddress, testFn, dependencies] = this.dependantTestList.sync[i];
            if(getObjectValue(errors, fieldAddress) === undefined) {
                if(dependencies.every((dep) => getObjectValue(errors, dep) === undefined)) {
                    let [isValid, message] = testFn(getObjectValue(body, fieldAddress), dependencies.map((dep) => getObjectValue(body, dep)));
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
                errors[bodyField] = `Unknown field ${bodyField}`;
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
                rules[ruleField].userDefinedTests.async.map((testFn) => {
                    return [address, testFn];
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
            this.dependantTestList.sync.push(
                ...rules[ruleField].dependantTests.sync.map(([testFn, dependencies]) => {
                    return [address, testFn, dependencies];
                })
            );
            this.dependantTestList.async.push(
                ...rules[ruleField].dependantTests.async.map(([testFn, dependencies]) => {
                    return [address, testFn, dependencies];
                })
            );
        }
    }

    async asyncValidate(body, res) {
        let errors = this.validate(body);
        // Note: every element in asyncTestQueue will be [address, testFn]
        const validAsyncTests = this.asyncTestList.filter(
            (test) => getObjectValue(errors, test[0]) === undefined
        );
        if(validAsyncTests.length > 0) {
            const results = await Promise.all(
                validAsyncTests.map((test) => test[1](getObjectValue(body, test[0]), res))
            );
            for(let i = 0; i < results.length; i++) {
                let [isValid, message] = results[i];
                if(!isValid) {
                    errors = errors ? errors : {};
                    setObjectValue(errors, validAsyncTests[i][0], message ? message : DEFAULT_INVALID_VALUE_MESSAGE);
                }
            }
        }

        // Note: every dependantTest will be [address, testFn, dependencies]
        const validDependantTests = this.dependantTestList.async.filter((test) => {
            const [fieldAddress, _, dependencies] = test;
            const isFieldValid = getObjectValue(errors, fieldAddress) === undefined;
            const areDependenciesValid = dependencies.every((dep) => getObjectValue(errors, dep) === undefined);
            return isFieldValid && areDependenciesValid;
        })

        if(validDependantTests.length > 0) {
            const results = await Promise.all(
                validDependantTests.map(([fieldAddress, testFn, dependencies]) => {
                    const dependencyValues = dependencies.map((dep) => getObjectValue(body, dep));
                    return testFn(getObjectValue(body, fieldAddress), dependencyValues);
                })
            )
            for(let i = 0; i < results.length; i++) {
                let [isValid, message] = results[i];
                if(!isValid) {
                    const address = validDependantTests[i][0];
                    errors = errors ? errors : {};
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
