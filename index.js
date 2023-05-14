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

    _validator(rules, body, errors, prefix = "") {
        for(const ruleField in rules) {
            const address = prefix ? `${prefix}.${ruleField}` : ruleField;
            if(validators[DATA_TYPE.object](rules[ruleField])) {
                if(isNullish(body[ruleField])) {
                    setObjectValue(errors, address, `${ruleField} is required`);
                    continue;
                }
                if(!validators[DATA_TYPE.object](body[ruleField])) {
                    setObjectValue(errors, address, "invalid value");
                    continue;
                }
                this._validator(rules[ruleField], body[ruleField], errors, address);
            }else{
                const errorMessage = rules[ruleField].validate(body[ruleField]);
                if(errorMessage !== null) {
                    setObjectValue(errors, address, errorMessage);
                }
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
        return function(req, res, next) {
            const messages = this.validate(req.body);
            if(Object.keys(req.body).length > 0) {
                res.status(status).json(messages);
            }else{
                next();
            }
        }
    }

    validate(body) {
        const errors = {};
        this._validator(this._rules, body, errors);
        return errors;
    }
}

export { ArrayField, BaseValidator, DateField, FloatField, IntegerField, NullField, NumberField, ObjectField, StringField, UndefinedField };
