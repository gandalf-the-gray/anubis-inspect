import { DATA_TYPE } from "./constants.js";
import { ArrayField } from "./types/array.js";
import { DateField } from "./types/date.js";
import { FloatField } from "./types/float.js";
import { IntegerField } from "./types/integer.js";
import { NullField } from "./types/null.js";
import { NumberField } from "./types/number.js";
import { ObjectField } from "./types/object.js";
import { StringField } from "./types/string.js";
import { UndefinedField } from "./types/undefined.js";
import { isNullish, setObjectValue, validators } from "./utils.js";

// Base validator class
class BaseValidator {
    constructor() {
        this._rules = {};
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

    middleware(status = 422) {
        const _this = this;
        return function(req, res, next) {
            if(!req.body) {
                throw new Error("request body not found, you're probably not parsing the request body");
            }
            const messages = _this.validate(req.body);
            if(Object.keys(messages).length > 0) {
                res.status(status).json(messages);
            }else{
                next();
            }
        }
    }

    validate(body) {
        const errors = {};
        this._validate(this._rules, body, errors);
        return errors;
    }
}

export { ArrayField, BaseValidator, DateField, FloatField, IntegerField, NullField, NumberField, ObjectField, StringField, UndefinedField };
