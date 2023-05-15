# anubis-inspect

A simple and extendible object validator

## Contents
1) Installation
2) How it works
3) Usage
4) Types
5) Ways of validating

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install anubis-inspect.

```bash
npm install anubis-inspect
```

## How it works
To validate an object, you must create an object validator, an object validator is an instance of class that defines the keys and the kind of values the object being tested must have, every validator class must either extend the BaseValidator class or another validator class, validator classes can inherit validation logic from other validator classes.

To test an object against the rules of a validator, you must instantiate the valudator class, and use the validate method of the validator-instance, and pass the object to the validate method as an argument, if the object is valid you'll get an empty object otherwise an object with the error messages assigned to the respective keys.

## Usage

```javascript
import express from 'express';
import { BaseValidator, StringField } from 'anubis-inspect';

// validator for login form
const loginRules = {
  username: StringField.alphanum('username').required().min(8),
  password: StringField.alphanum('password').required().min(6)
};

class LoginValidator extends BaseValidator {
    constructor() {
      super();
      super.init(loginRules);
    }
}

// validator for sign-up form
const signUpRules = {
  email: StringField.email('email').required()
};

class SignUpValidator extends LoginValidator {
  constructor() {
    super();
    super.init(signUpRules);
  }
}

// validator instances

const loginValidator = new LoginValidator();
const signUpValidator = new SignUpValidator();

// use validator as a normal validator
console.log(loginValidator.validate({}));

// express app config
const app = express();
app.use(express.json());

// use validator as a middleware
// note: the middleware method accepts status-code as an argument, 422 is the default
app.post('/login', loginValidator.middleware(), (req, res) => {
  res.status(200).json({message: 'Your attempts was not futile'});
});

app.post('/sign-up', signUpValidator.middleware(), (req, res) => {
  res.status(200).json({message: 'Your attempts was not futile'});
});

app.listen(9000);

```
## Types and the corresponding validator classes
A type-validator by default only checks the type of the value, the value can either be null/undefined or the given type, to make it required or fit in a certain range, you must call the appropriate method, eg. new StringField('email') only makes sure that the value is either a valid string or null/undefined, whereas new StringField('email').required() doesn't accept null/undefined, every such method has a default error message to return if the value isn't valid but you can pass your own messages too, the 'test' method allows you to add your own tests in form of functions, return 'true' if the value is valid and false if invalid, you can add as many tests as you want

type-validators don't have to be a part of a big schema, you can use them to validate their respective types, eg. new StringField("username").required().validate(43), if value is valid, null is returned, otherwise an error message

### Here is a list of the types and their respective type-validator classes

### string - new StringField(fieldName)
- ### static methods
- alphanum(fieldName, [message]) -> returns a StringField instance that checks if the given value is strictly alphanumeric
- email(fieldName, [message]) -> returns a StringField instance that checks if the given value is an email

- ### instance methods
- invalidTypeMessage(message) -> error message to return if the value is not a string,
- required(message) -> makes the value required
- min(min-range, [message]) -> the min number of characters
- max(max-range, [message]) -> the max number of characters
- match(regex, [message]) -> makes the value match the pattern
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### number - new NumberField(fieldName)
- ### static methods
- lt(fieldName, maxValue, [message]) -> returns a NumberField instance that checks if the given value is less than the passed maxValue
- gt(fieldName, minValue, [message]) -> returns a NumberField instance that checks if the given value is greater than the passed minValue

- ### instance methods
- invalidTypeMessage(message) -> error message to return if the value is not a number,
- required(message) -> makes the value required
- min(minValue, [message]) -> the min value(inclusive)
- max(maxValue, [message]) -> the max value(inclusive)
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### integer - new IntegerField(fieldName)
- ### static methods
- lt(fieldName, maxValue, [message]) -> returns an IntegerField instance that checks if the given value is less than the passed maxValue
- gt(fieldName, minValue, [message]) -> returns an IntegerField instance that checks if the given value is greater than the passed minValue

- ### instance methods
- invalidTypeMessage(message) -> error message to return if the value is not an integer,
- required(message) -> makes the value required
- min(minValue, [message]) -> the min value(inclusive)
- max(maxValue, [message]) -> the max value(inclusive)
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### float - new FloatField(fieldName)
- ### static methods
- lt(fieldName, maxValue, [message]) -> returns an FloatField instance that checks if the given value is less than the passed maxValue
- gt(fieldName, minValue, [message]) -> returns an FloatField instance that checks if the given value is greater than the passed minValue

- ### instance methods
- invalidTypeMessage(message) -> error message to return if the value is not a float,
- required(message) -> makes the value required
- min(minValue, [message]) -> the min value(inclusive)
- max(maxValue, [message]) -> the max value(inclusive)
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### date - new DateField(fieldName)
- ### static methods
- before(fieldName, maxDate, [message]) -> returns an DateField instance that checks if the given value is a date before the passed maxDate
- gt(fieldName, minDate, [message]) -> returns an DateField instance that checks if the given value is a date after the passed minDate

- ### instance methods
- invalidTypeMessage(message) -> error message to return if the value is not a float,
- required(message) -> makes the value required
- min(minValue, [message]) -> the min value(inclusive)
- max(maxValue, [message]) -> the max value(inclusive)
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### array - new ArrayField(fieldName)
- ### static methods
- string(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only string values
- number(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only number values
- integer(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only integer values
- float(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only float values
- date(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only date values
- array(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only array values
- object(fieldName, [message]) -> returns an ArrayField instance that checks if the given array contains only object values

- ### instance methods
- invalidTypeMessage(message) -> error message to return if the value is not an array,
- required(message) -> makes the value required
- min(minValue, [message]) -> the min array length(inclusive)
- max(maxValue, [message]) -> the max array length(inclusive)
- values(type-validator, [message]) -> validates the array items with the type-validator passed
- notNested() -> rejects nested arrays
- test((value) => {}, [message]) -> passes the value through this function to check it's validity


### object- new ObjectField(fieldName)

- ### instance methods
- invalidTypeMessage(message) -> error message to return if the value is not an array,
- required(message) -> makes the value required
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
Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.
