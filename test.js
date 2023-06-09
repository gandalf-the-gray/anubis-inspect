import { BaseValidator, StringField } from "./index.js";

const rules1 = {
    user: {
        name: new StringField('name').required(),
        email: StringField.email('email').required()
    }
}

const rules2 = {
    user: {
        email: StringField.email('email'),
    }
}

class Validator1 extends BaseValidator{
    constructor() {
        super();
        super.init(rules1);
    }
}

// class Validator2 extends Validator1 {
//     constructor() {
//         super();
//         super.init(rules2);
//     }
// }

class A {
    constructor() {
        const _this = this;
        setTimeout(() => {
            _this.setA();
        }, 1000);
    }

    setA() {
        this.a = "a";
        console.log("set A");
    }
}

class B extends A {
    printA() {
        console.log(this.a);
    }
}
const b = new B();
setTimeout(() => {
    b.printA();
}, 2000);
