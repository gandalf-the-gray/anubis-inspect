class RequiredParamterError extends Error {
    constructor(parameterName) {
        super(`${parameterName} is required`);
        this.code = "req-param";
    }
}

export function throwRequired(fieldname) {
    throw new RequiredParamterError(fieldname);
}
