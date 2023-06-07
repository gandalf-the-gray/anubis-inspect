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
        this._rules = {};
        this._asyncTestQueue = [];
        this._cachedAsyncTests = false;
        this._unknownFieldMessage = "Unknown field";
    }

    init(rules) {
        this._rules = {...this._rules, ...rules};
    }

    _validate(rules, body, errors, prefix = "") {
        body = validators[DATA_TYPE.object](body) ? body : {};
        for(const ruleField in rules) {
            const address = prefix ? `${prefix}.${ruleField}` : ruleField;
            if(validators[DATA_TYPE.object](rules[ruleField])) {
                this._validate(rules[ruleField], body[ruleField], errors, address);
                continue;
            }
            const errorMessage = rules[ruleField].validate(body[ruleField]);
            if(errorMessage !== null) {
                setObjectValue(errors, address, errorMessage);
            }
        }
        for(const bodyField in body) {
            if(rules[bodyField] === undefined) {
                const address = prefix ? `${prefix}.${bodyField}` : bodyField;
                setObjectValue(errors, address, "unknown field");
            }
        }
    }

    cacheAsyncTests(rules, prefix = "") {
        for(const ruleField in rules) {
            const address = prefix ? `${prefix}.${ruleField}` : ruleField;
            if(validators[DATA_TYPE.object](rules[ruleField])) {
                this.cacheAsyncTests(rules[ruleField], address);
                continue;
            }
            this._asyncTestQueue = this._asyncTestQueue.concat(
                rules[ruleField].userDefinedAsyncTests.map(([testFn, message]) => {
                    return [address, testFn, message ? message : DEFAULT_INVALID_VALUE_MESSAGE];
                })
            );
        }
    }

    validate(body) {
        const errors = {};

        // Run synchronous tests
        this._validate(this._rules, body, errors);

        return errors;
    }

    async asyncValidate(body) {
        const errors = this.validate(body);

        if(!this.cachedAsyncTests) {
            this.cacheAsyncTests(this._rules);
            this.cachedAsyncTests = true;
        }
        if(this._asyncTestQueue.length > 0) {
            const tasks = this._asyncTestQueue.filter(
                (task) => getObjectValue(errors, task[0]) === undefined
            );
            const results = await Promise.all(tasks.map((task) => task[1]()));
            for(let i = 0; i < results.length; i++) {
                if(!results[i]) {
                    setObjectValue(errors, this._asyncTestQueue[i][0], this._asyncTestQueue[i][2])
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
            const messages = await _this.asyncValidate(req.body);
            if(Object.keys(messages).length > 0) {
                res.status(status).json(messages);
            }else{
                next();
            }
        }
    }
}

export { ArrayField, BaseValidator, DateField, FloatField, IntegerField, NullField, NumberField, ObjectField, StringField, UndefinedField };
