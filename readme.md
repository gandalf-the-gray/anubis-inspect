# anubis-inspect

A simple and extendible object validator

## Contents
1) Installation
2) In a nutshell
3) Usage
4) Things to keep in mind
5) Types

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install anubis-inspect.

```bash
npm install anubis-inspect
```

## In a nutshell
Create an object and specify the fields and the corresponding rules in it, use the built-in classes
to specify the rules for fields, and then, create a class for your object validator which extends BaseValidator, in the constructor, call the super.init method with the rules object as the only parameter

## Usage

```javascript
import { BaseValidator, StringField } from 'anubis-inspect';

const loginRules = {
    username: new StringField("Username").max(20),
    password: new StringField("Password")
}

class LoginValidator extends BaseValidator {
    constructor() {
        super();
        super.init(loginRules);
    }
}

const signUpRules = {
    name: {
        first: new StringField("First name"),
        last: new StringField("Last name", false)
    },
    email: new StringField("email")
        .test(async(email) => {
            // simulating an API call
            const isValid = await new Promise((resolve) => {
                setTimeout(resolve, 1000, true);
            })
            // If email is valid nothing happens
            // if it is invalid, the second element in the array is used as error message
            return [isValid, "Invalid email"];
        })
}

// SignUpValidaor will inherit the rules defined in LoginValidator
class SignUpValidator extends LoginValidator {
    constructor() {
        super();
        super.init(signUpRules);
    }
}
(async() => {
    // Only the synchronous tests run
    console.log(new SignUpValidator().validate({}))

    // Both synchronous and asynchronous tests run
    console.log(await new SignUpValidator().asyncValidate(
        {
            name: { first: 'First name' },
            username: 'Username',
            password: 'Password',
            email: 'email@gmail.com'
        }
    ))
})()

// Use with express middlewares
const app = express();
app.get("/sign-up", new SignUpValidator().middleware(), (req, res, next) => {
  // API logic
})

```
## Things to keep in mind
A type-validator by default only checks for the presence and type of the value, to make the value optional or fit in a certain range, you must call the appropriate method, eg. new StringField('email') only makes sure that the value is not null/undefined and is a string, whereas new StringField('email', false) makes the email optional i.e allows either null/undefined or a string and new StringField('email').min(10) makes sure the email is at leats 10 characters long, every such method has a default error message to return if the value isn't as expected but you can pass your own messages too

The 'test' method allows you to add your own custom tests in form of functions, take the value, run tests (async tests too) and return an array in [isValid, errorMessage] format, the first item in the returned must be a boolean indicating if the value passes the test and the second is the error-message to be used in case the value failed the test

### The test function has some flavors
1) vanilla - a function that takes the value of the field as the only parameter, example below
```javascript
const rules = {
    name: new StringField("Name").test((name) => {
        return [name === "anubis", "Name must be anubis"]
    })
}
```
2) async vanilla - an async function that takes the value of the field as the only parameter, example below
```javascript
const rules = {
    name: new StringField("Name").test(async (name) => {
        const isValid = await new Promise((resolve) => {
            setTimeout(resolve, 1000, true);
        })
        return [isValid, "Invalid name"]
    })
}
```
3) vanilla with dependencies - an function that takes the value of the field and other values that it depends on, the format is <TypeValidator>.test(testFunction, ["field"]), the first parameter is the test function and the second is an array of dependencies from the object being validated, if the dependency is a nested field just use the dot notation in the path like 'field1.field2', note that dependency values will be passed to your function in the same order you specified
```javascript
const rules = {
    weight: new NumberField("Weight"),
    unit: new StringField("Unit").test((unit, [weight]) => {
        let isValid = false;
        let message = "Invalid unit";
        if (weight && !unit) {
            message = "Unit for given weight is required";
        } else if (unit && !weight) {
            message = "Unit can only be given with weight";
        } else {
            isValid = true;
        }
        return [isValid, message];
    }, ["weight"])
}
```
3) async with dependencies - a dependent test, but asynchronous
```javascript
const rules = {
    weight: new NumberField("Weight"),
    unit: new StringField("Unit").test(async (unit, [weight]) => {
        const isUnitValid = await new Promise((resolve) => {
            setTimeout(resolve, 1000, true, 1000);
        })
        return [isUnitValid, "Invalid unit"];
    }, ["weight"])
}
```
**Note: the async test functions will be run concurrently using the Promise API, so feel free to use multiple async functions**

## Types and their corresponding classes
**Note: All values are required by default**
### string - new StringField(fieldName, [isRequired])
- ### static methods
- alphanum(fieldName, [message]) -> returns a StringField instance that checks if the given value is strictly alphanumeric
- email(fieldName, [message]) -> returns a StringField instance that checks if the given value is an email

- ### instance methods
- requiredValueMessage(message) -> error message to return if the value is not provided
- invalidTypeMessage(message) -> error message to return if the value is not a string,
- min(min-range, [message]) -> the min number of characters
- max(max-range, [message]) -> the max number of characters
- match(regex, [message]) -> makes the value match the pattern
- test((value) => {}) -> passes the value through this function to check it's validity


### number - new NumberField(fieldName, [isRequired])
- ### static methods
- lt(fieldName, maxValue, [message]) -> returns a NumberField instance that checks if the given value is less than the passed maxValue
- gt(fieldName, minValue, [message]) -> returns a NumberField instance that checks if the given value is greater than the passed minValue

- ### instance methods
- requiredValueMessage(message) -> error message to return if the value is not provided
- invalidTypeMessage(message) -> error message to return if the value is not a number
- min(minValue, [message]) -> the min value(inclusive)
- max(maxValue, [message]) -> the max value(inclusive)
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### integer - new IntegerField(fieldName, [isRequired])
- ### static methods
- lt(fieldName, maxValue, [message]) -> returns an IntegerField instance that checks if the given value is less than the passed maxValue
- gt(fieldName, minValue, [message]) -> returns an IntegerField instance that checks if the given value is greater than the passed minValue

- ### instance methods
- requiredValueMessage(message) -> error message to return if the value is not provided
- invalidTypeMessage(message) -> error message to return if the value is not an integer
- min(minValue, [message]) -> the min value(inclusive)
- max(maxValue, [message]) -> the max value(inclusive)
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### float - new FloatField(fieldName, [isRequired])
- ### static methods
- lt(fieldName, maxValue, [message]) -> returns an FloatField instance that checks if the given value is less than the passed maxValue
- gt(fieldName, minValue, [message]) -> returns an FloatField instance that checks if the given value is greater than the passed minValue

- ### instance methods
- requiredValueMessage(message) -> error message to return if the value is not provided
- invalidTypeMessage(message) -> error message to return if the value is not a float,
- min(minValue, [message]) -> the min value(inclusive)
- max(maxValue, [message]) -> the max value(inclusive)
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### date - new DateField(fieldName, [isRequired])
- ### static methods
- before(fieldName, maxDate, [message]) -> returns an DateField instance that checks if the given value is a date before the passed maxDate
- gt(fieldName, minDate, [message]) -> returns an DateField instance that checks if the given value is a date after the passed minDate

- ### instance methods
- requiredValueMessage(message) -> error message to return if the value is not provided
- invalidTypeMessage(message) -> error message to return if the value is not a float
- min(minValue, [message]) -> the min value(inclusive)
- max(maxValue, [message]) -> the max value(inclusive)
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### array - new ArrayField(fieldName, [isRequired])
- ### static methods
- string(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only string values
- number(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only number values
- integer(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only integer values
- float(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only float values
- date(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only date values
- array(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only array values
- object(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only object values

- ### instance methods
- requiredValueMessage(message) -> error message to return if the value is not provided
- invalidTypeMessage(message) -> error message to return if the value is not an array
- min(minValue, [message]) -> the min array length(inclusive)
- max(maxValue, [message]) -> the max array length(inclusive)
- values(type-validator, [message]) -> validates the array items with the type-validator passed
- notNested() -> rejects nested arrays
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### object- new ObjectField(fieldName, [isRequired])

- ### instance methods
- requiredValueMessage(message) -> error message to return if the value is not provided
- invalidTypeMessage(message) -> error message to return if the value is not an array
- min(minValue, [message]) -> the min number of keys(inclusive)
- max(maxValue, [message]) -> the max number of keys(inclusive)
- values(type-validator, [message]) -> validates the object values with the type-validator passed, doesn't validate keys, they'll always be strings
- notNested() -> rejects nested objects
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### null - new NullField(fieldName)

- ### instance methods
- invalidTypeMessage(message) -> error message to return if the value is not null


### undefined - new UndefinedField(fieldName)

- ### instance methods
- invalidTypeMessage(message) -> error message to return if the value is not undefined


## Contributing
Pull requests and discussions are welcome. For major changes, please open an issue first
to discuss what you would like to change.
