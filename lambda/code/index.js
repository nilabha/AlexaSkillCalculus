/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';
const Alexa = require('alexa-sdk');

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = 'amzn1.ask.skill.17d20629-23b0-42b3-8223-0ff269b6e1c1';

const SKILL_NAME = 'calculus';

const simpleutterance1 = " direct. differentiate. x. x. power. two";
const createutterance1 = " start. create. a. x. power. two";
const continueutterance1 = " continue. assign. b. a. add. five";
const continueutterance2 = " continue. assign. b. a. sine";
const solveutterance1 = " solve. differentiate. x. a.";
const solveutterance2 = " solve. differentiate. x. b.";
const missingnumber = "number is not present, please note that for trignometric function we would switch to defaults.\
 For logarithm and exponent operations number is not required";

const GET_FACT_MESSAGE = "Here's your answer. ";

const GET_HELP = " .Say Help for a sample utterance";

const HELP_MESSAGE = 'You can say. ' + simpleutterance1 + ' , or, you can say. stop... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';
const ERROR_MESSAGE = "invalid or unsupported operation";
const REPEAT_MESSAGE = " .Would you like to do another maths problem ?";
const SOLVEREPEAT_MESSAGE = " .Would you like to do another maths problem ? You can also further\
 build on the expressions that you have created.";
const TRIG_FUNC = ["sine", "cosine", "tan", "cot", "secant", "cosecant"];
const OTHER_FUNC = ["reverse", "inverse", "log", "exponent"];
const NORMAL_FUNC = ['add', 'subtract', 'multiply', 'power', 'divide'];

//SUPPORTED SLOT VALUES
const taskvals = ['create', 'assign'];
const functionvals = ['differentiate'];
const operationvals = NORMAL_FUNC.concat(TRIG_FUNC, OTHER_FUNC);
const symbolvals = ['x', 'y', 'z', 'u', 'v', 'w'];
var alphabetvals = ['a'];

var curalp = 'a';
for (var i = 1; i < 20; i++) {
    curalp = nextChar(curalp);
    alphabetvals = alphabetvals.concat(curalp);
}

//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================
var math = require('mathjs');

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

String.prototype.returnAll = function (replacement, search) {
    var target = this;
    return target.split(search).join(replacement);
};


var createequation = function (text) {
    return text.replaceAll(" squared", "^2").replaceAll(" cubed", "^3")
        .replaceAll("add", "+").replaceAll("subtract", "-").replaceAll("multiply", "*").replaceAll("divide", "/").replaceAll("equals", "=")
        .replaceAll("zero", "0").replaceAll("{reverse}", "-1*").replaceAll("{inverse}", "1/").replaceAll("power", "^")
        .replaceAll("{sine}", "sin").replaceAll("{cosine}", "cos").replaceAll("{tan}", "tan")
        .replaceAll("{cot}", "cot").replaceAll("{secant}", "sec").replaceAll("{cosecant}", "csc")
        .replaceAll("{log}", "log").replaceAll("{exponent}", "exp").replaceAll("root", "root")
        .replaceAll("open bracket", "(").replaceAll("close bracket", ")");
};

var createspeech = function (text) {
    return text.returnAll(" .squared. ", "^2").returnAll(" .cubed. ", "^3")
        .returnAll(" .add. ", "+").returnAll(" .subtract. ", "-").returnAll(" .multiply. ", "*").returnAll(" .divide. ", "/").returnAll(" .equals. ", "=")
        .returnAll(" .zero. ", "0").returnAll(" .power. ", "^")
        .returnAll(" .sine. ", "sin").returnAll(" .cosine. ", "cos").returnAll(" .tan. ", "tan")
        .returnAll(" .cot. ", "cot").returnAll(" .secant. ", "sec").returnAll(" .cosecant. ", "csc")
        .returnAll(" .log. ", "log").returnAll(" .exponent. ", "exp").returnAll(" .root. ", "root")
        .returnAll(" .open bracket. ", "(").returnAll(" .close bracket. ", ")");
};

var simplifytext = function (text) {
    if (text != undefined) {
        return text.toLowerCase()[0].replaceAll(".", "");
    } else {
        return text;
    }
};

var removepunctuations = function (text) {
    if (text != undefined) {
        return text.replaceAll(".", "");
    } else {
        return text;
    }
};


function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function nextChar(c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}

var substituteexpression = function (expr, dictCurrent) {
    var value;
    var replacer;
    for (var key in dictCurrent) {
        if (dictCurrent.hasOwnProperty(key)) {
            value = dictCurrent[key];
            replacer = new RegExp("\\b" + "(" + key + ")" + "\\b", "g");
            console.log("replacing key:" + replacer);
            expr = expr.replace(replacer, value);
        }
    }
    console.log("expression after replacing:", expr);
    return expr;
};


const handlers = {
    'LaunchRequest': function () {
        this.attributes.allvariables = {};
        this.emit(':ask', 'welcome to calculus, tell me a mathematical expression', 'Say. ' + simpleutterance1);
    },
    'createIntent': function () {
        var message;
        try {
            var task = removepunctuations(this.event.request.intent.slots.task.value);
            //var variable = this.event.request.intent.slots.variable.value;
            var symbol = simplifytext(this.event.request.intent.slots.symbol.value);
            var alphabet = simplifytext(this.event.request.intent.slots.alphabet.value);
            var newalphabet = simplifytext(this.event.request.intent.slots.newalphabet.value);
            var operation = removepunctuations(this.event.request.intent.slots.operation.value);
            var number = this.event.request.intent.slots.number.value;

            var expr;
            var originalsymbol = symbol;
            var success = true;


            if (task == "assign") {
                symbol = alphabet;
                alphabet = newalphabet;
                if (!alphabetvals.includes(symbol)) {
                    success = false;
                    message = "Supported Types for variable in case of assign are: " + alphabetvals + ". You have provided:" + symbol;
                } else if (!alphabetvals.includes(alphabet)) {
                    success = false;
                    message = "Supported Types for new variable in case of assign are: " + alphabetvals + ". You have provided:" + alphabet;
                } else if (originalsymbol != undefined) {
                    success = false;
                    message = 'You have not invoked the intent correctly.To create a complicated mathematical expression Say. ' + createutterance1 + ' .After that you can say. ' +
                        continueutterance1 + ' .And finally solve by saying.' + solveutterance2;
                }
            }
            console.log("symbol and alphabet are:" + symbol + " and " + alphabet);
            console.log("task::" + task);

            if (!taskvals.includes(task)) {
                success = false;
                message = message = "Supported Types for task are: " + taskvals + ". You have provided:" + task;
            } else if (!symbolvals.includes(symbol)) {
                if (task == "create") {
                    success = false;
                    message = "Supported Types for symbol in case of create are: " + symbolvals + ". You have provided:" + symbol;
                }
            } else if (!operationvals.includes(operation)) {
                success = false;
                message = "Supported Types for operations are: " + operationvals + ". You have provided:" + operation;
            } else if (!alphabetvals.includes(alphabet)) {
                success = false;
                message = "Supported Types for variable names are: " + alphabetvals + ". You have provided:" + alphabet;
            } else if (isNaN(number)) {
                if (TRIG_FUNC.includes(operation) || OTHER_FUNC.includes(operation)) {
                    console.log(missingnumber);
                } else {
                    success = false;
                    message = "The last part should be a number. ";
                }
            }

            console.log("Success:" + success);

            if (!success) {
                this.attributes.lastSpeech = message + GET_HELP;
                this.response.speak(message + GET_HELP).listen(GET_HELP);
                this.emit(':responseReady');
            } else {

                var origoperation = operation;
                symbol = "(" + symbol + ")";
                if (TRIG_FUNC.includes(origoperation) || OTHER_FUNC.includes(origoperation)) {
                    //trig = true;
                    operation = "{" + operation + "}";
                    operation = createequation(operation);
                    if (TRIG_FUNC.includes(origoperation)) {
                        if (number == undefined) {
                            number = "";
                        } else if (number == 1) {
                            number = "";  //inverse
                            operation = "a" + operation;
                        } else if (number == 2) {
                            number = "";  //hyperbolic
                            operation = operation + "h";
                        } else if (number == 3) {
                            number = "";  //inverse hyperbolic
                            operation = "a" + operation + "h";
                        }

                    }
                    expr = operation + symbol;
                } else {
                    operation = createequation(operation + number);
                    expr = symbol + operation;
                }

                console.log("operation is ", operation);
                //dict[origsymbol] = "(" + expr + ")";

                console.log(expr);

                var speechexpr = createspeech(expr);
                var nextalphabet = nextChar(alphabet);
                if (task == "create") {
                    message = "You entered the expression ." + speechexpr + " .Please continue building\
                    your expression for example by saying. continue. assign. "+ nextalphabet + ". " + alphabet + ". add. five. and once done, solve it by saying. \
                    solve. differentiate. " + originalsymbol + ". " + nextalphabet;
                } else if (task == "assign") {
                    message = "You entered the expression ." + speechexpr + " .Please continue building\
                    your expression for example by saying. continue. assign. "+ nextalphabet + ". " + alphabet + ". add. five. Also make sure you have defined an symbol which will be used to differentiate against. \
                    This can be done for example by saying. " + createutterance1 + ". Once done, solve it by saying. \
                    solve. differentiate. x. " + nextalphabet;
                }
                this.attributes.allvariables["(" + alphabet + ")"] = "(" + expr + ")";
                this.attributes.lastSpeech = message + GET_HELP;
                this.response.cardRenderer(SKILL_NAME, "The answer is: " + expr.toString() + "\n");
                this.response.speak(message + GET_HELP).listen(GET_HELP);
                //this.emit(':ask',, "Please say. that again? Try help in case of issues");

                //this.response.cardRenderer(SKILL_NAME, "The answer is: " + expr.toString() + "\n" + "\n" +" The latex expression is: " + expr.toTex());
                //this.response.speak(speechOutput + REPEAT_MESSAGE).listen(REPEAT_MESSAGE); 
                //this.emit(':tell',speechOutput,"try again"); 
                this.emit(':responseReady');

            }
        } catch (err) {
            console.log("Error Occured:" + err.message);
            message = 'Invalid Operation. To create a complicated mathematical expression Say. ' + createutterance1 + ' .After that you can say. ' +
                continueutterance1 + ' .And finally solve by saying.' + solveutterance2;
            this.attributes.lastSpeech = message + GET_HELP;
            this.response.speak(message + GET_HELP).listen(GET_HELP);
            this.emit(':responseReady');
        }
    },

    'DirectIntent': function () {
        //var https = require('https');
        var message;
        try {
            var task = removepunctuations(this.event.request.intent.slots.function.value);
            var variable = simplifytext(this.event.request.intent.slots.variable.value);
            var symbol = simplifytext(this.event.request.intent.slots.symbol.value);
            var operation = removepunctuations(this.event.request.intent.slots.operation.value);
            var number = this.event.request.intent.slots.number.value;
            var success = true;

            if (!functionvals.includes(task)) {
                success = false;
                message = "Supported Types for function are: " + functionvals + ". You have provided:" + task;
            } else if (!symbolvals.includes(variable)) {
                success = false;
                message = "Supported Types for variables are: " + symbolvals + ". You have provided:" + variable;
            } else if (!symbolvals.includes(symbol)) {
                success = false;
                message = "Supported Types for symbol are: " + symbolvals + ". You have provided:" + symbol;
            } else if (!operationvals.includes(operation)) {
                success = false;
                message = "Supported Types for operations are: " + operationvals + ". You have provided:" + operation;
            } else if (isNaN(number)) {
                if (TRIG_FUNC.includes(operation) || OTHER_FUNC.includes(operation)) {
                    console.log(missingnumber);
                } else {
                    success = false;
                    message = "The last part should be a number. " + "You have provided:" + number;
                }
            }

            if (!success) {
                this.attributes.lastSpeech = message + GET_HELP;
                this.response.speak(message + GET_HELP).listen(GET_HELP);
                this.emit(':responseReady');
            } else {

                var dv;
                //var trig=false;
                var expr;
                var answer;

                //var origsymbol = symbol;
                var origoperation = operation;
                symbol = "(" + symbol + ")";

                if (TRIG_FUNC.includes(origoperation) || OTHER_FUNC.includes(origoperation)) {
                    //trig = true;
                    operation = "{" + operation + "}";
                    operation = createequation(operation);
                    if (TRIG_FUNC.includes(origoperation)) {
                        if (number == 1) {
                            number = "";  //inverse
                            operation = "a" + operation;
                        } else if (number == 2) {
                            number = "";  //hyperbolic
                            operation = operation + "h";
                        } else if (number == 3) {
                            number = "";  //inverse hyperbolic
                            operation = "a" + operation + "h";
                        } else {
                            number = "";
                        }
                    }
                    expr = operation + symbol;
                } else {
                    operation = createequation(operation + number);
                    expr = symbol + operation;
                }




                console.log("operation is ", operation);
                //dict[origsymbol] = "(" + expr + ")";
                //this.attributes.allvariables[origsymbol] = "(" + expr + ")";    

                console.log(expr);
                dv = math.derivative(expr, variable);
                console.log(dv.toString());
                answer = createspeech(dv.toString());
                console.log(answer);
                //math.derivative('x^2', 'x'); 
                console.log(this.attributes.allvariables);
                const speechOutput = GET_FACT_MESSAGE + answer;

                this.attributes.lastSpeech = speechOutput;
                this.response.cardRenderer(SKILL_NAME, "The answer is: " + dv.toString() + "\n" + "\n" + " The latex expression is: " + dv.toTex());
                this.response.speak(speechOutput + REPEAT_MESSAGE).listen(REPEAT_MESSAGE);
                //this.emit(':tell',speechOutput,"try again"); 
                this.emit(':responseReady');
            }
        } catch (err) {
            console.log("Error Occured:" + err.message);
            message = "Invalid Operation: ";
            this.attributes.lastSpeech = message + GET_HELP;
            this.response.speak(message + GET_HELP).listen(GET_HELP);
            this.emit(':responseReady');
        }
    },
    'SolveExpressionIntent': function () {
        //var https = require('https');
        var message;
        try {
            var task = removepunctuations(this.event.request.intent.slots.function.value);
            var variable = simplifytext(this.event.request.intent.slots.variable.value);
            //var symbol = simplifytext(this.event.request.intent.slots.symbol.value);
            var alphabet = simplifytext(this.event.request.intent.slots.alphabet.value);
            //var operation = this.event.request.intent.slots.operation.value;
            //var number = this.event.request.intent.slots.number.value;
            var dv;
            //var trig=false;
            var expr;
            var answer;
            var dictnew;
            var dictAllVariables = {};
            var finalexpr;
            var success = true;

            //var origsymbol = symbol;
            //var origoperation = operation;

            dictnew = this.attributes.allvariables;

            if (!functionvals.includes(task)) {
                success = false;
                message = "Supported Types for function are: " + functionvals + ". You have provided:" + task;
            } else if (!symbolvals.includes(variable)) {
                success = false;
                message = "Supported Types for variable with which to differentiate are: " + symbolvals + ". You have provided:" + variable;
            } else if (!alphabetvals.includes(alphabet)) {
                success = false;
                message = "Supported Types for symbols or variable names are: " + alphabetvals + ". You have provided:" + alphabet;
            }

            if (isEmpty(dictnew)) {
                success = false;
                message = 'Invalid Operation. You have not created any expression before solving. To create a complicated mathematical expression Say. ' + createutterance1 + ' .After that you can say. ' +
                    continueutterance1 + ' .And finally solve by saying.' + solveutterance2;
                //this.emit(':ask','Invalid Operation. You have not created any expression before solving. To create a complicated mathematical expression Say. ' + createutterance1 + ' .After that you can say. '+
                //continueutterance1 + ' .And finally solve by saying.' + solveutterance2);
                //this.emit(':ask','Do you want to try again. For simple cases you can also try '+simpleutterance1,'Say. '+ simpleutterance1);
            }

            if (!success) {
                this.attributes.lastSpeech = message + GET_HELP;
                this.response.speak(message + GET_HELP).listen(GET_HELP);
                this.emit(':responseReady');
            } else {

                console.log(this.attributes.allvariables);

                //var replacer;
                var counter = 0;
                //var finalexpr;
                //var prevvalue;
                //var prevkey;
                var value;


                for (var key in dictnew) {
                    // check if the property/key is defined in the object itself, not in parent
                    if (dictnew.hasOwnProperty(key)) {
                        value = dictnew[key];
                        if (counter != 0) {
                            console.log(key + ":" + value);

                            expr = substituteexpression(value, dictAllVariables);
                            //dictCurrent[key]=value;
                            dictAllVariables[key] = expr;
                        } else {
                            console.log(key + ":" + value);
                            expr = value;
                            console.log("expr::" + expr);
                            //dictCurrent[key]=value;
                            dictAllVariables[key] = value;
                            counter += 1;
                        }
                        //console.log(key, dictnew[key]);
                    }
                }

                console.log("expr:" + expr);
                console.log(dictAllVariables);
                finalexpr = dictAllVariables["(" + alphabet + ")"];
                console.log("final expr:" + finalexpr);

                if (finalexpr != undefined) {
                    dv = math.derivative(finalexpr, variable);
                    console.log(dv.toString());
                    answer = createspeech(dv.toString());
                    console.log(answer);
                    this.attributes.lastSpeech = answer;
                    const speechOutput = GET_FACT_MESSAGE + answer;
                    this.response.cardRenderer(SKILL_NAME, "The answer is: " + dv.toString() + "\n" + "\n" + " The latex expression is: " + dv.toTex());
                    this.response.speak(speechOutput + SOLVEREPEAT_MESSAGE).listen(SOLVEREPEAT_MESSAGE);
                    //this.emit(':ask',speechOutput,"Do you want to try again?");
                    this.emit(':responseReady');
                } else {
                    message = 'You have note defined the symbol or variable name: ' + alphabet + ' previously. Please define it using create and assign as follows: . ' + ' To create a complicated mathematical expression Say. ' + createutterance1 + ' .After that you can say. ' +
                        continueutterance1 + ' .And finally solve by saying.' + solveutterance2;
                    this.attributes.lastSpeech = message + GET_HELP;
                    this.response.speak(message + GET_HELP).listen(GET_HELP);
                    this.emit(':responseReady');
                }
            }
        } catch (err) {
            console.log("Error Occured:" + err.message);
            message = 'Invalid Operation. You have not created any expression before solving. To create a complicated mathematical expression Say. ' + createutterance1 + ' .After that you can say. ' +
                continueutterance1 + ' .And finally solve by saying.' + solveutterance2;
            this.attributes.lastSpeech = message + GET_HELP;
            this.response.speak(message + GET_HELP).listen(GET_HELP);
            this.emit(':responseReady');
        }
    },

    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;
        this.attributes.lastSpeech = speechOutput;
        this.response.speak(speechOutput).listen(reprompt);
        //this.emit(':ask','To create a complicated mathematical expression','Say. '+ createutterance1 + ' .Followed by. '+
        //continueutterance1 + ' .And finally solve by saying. the final expression.' + solveutterance2);
        this.emit(':responseReady');
    },
    'AMAZON.RepeatIntent': function () {
        this.response.speak(this.attributes.lastSpeech + REPEAT_MESSAGE).listen(REPEAT_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.YesIntent': function () {
        this.emit('LaunchRequest');
    },
    'AMAZON.NoIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        this.emit(':ask', ERROR_MESSAGE, "try again. Start over by invoking the skill and Say. Help if you want to hear sample request.");
        //this.emit('AMAZON.HelpIntent');
    }


};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
