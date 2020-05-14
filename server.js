const express = require('express');
const app = express();
const path = require('path');
//const router = express.Router();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
let Web3 = require('web3');
const PORT = process.env.PORT || 3000;


let web3 = new Web3(new Web3.providers.HttpProvider('HTTP://127.0.0.1:7545'));

let ABI = [
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "string",
                "name": "_Username",
                "type": "string"
            }
        ],
        "name": "GetUserInfo",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "string",
                "name": "_Username",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_Role",
                "type": "string"
            }
        ],
        "name": "SetUserInfo",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let orderABI = [
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "string",
                "name": "_OrderID",
                "type": "string"
            }
        ],
        "name": "GetOrderInfo",
        "outputs": [
            {
                "internalType": "string",
                "name": "getDate",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "getLocation",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "getTime",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "getDriver",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "getPork",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "getWeight",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "string",
                "name": "_OrderID",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_Date",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_Location",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_Time",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_Driver",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_Pork",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_Weight",
                "type": "string"
            }
        ],
        "name": "SetOrderInfo",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let CA = "0x44263a3aD20177E70db5F997618aa4a3471ef1d3";

let orderCA = "0x3ba51a2D42246f9177d23663FAc3a4beb8cFF0ee";

let Contract = new web3.eth.Contract(ABI, CA);

let OrderContract = new web3.eth.Contract(orderABI, orderCA);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// app.use(express.static(__dirname+"/views"));

// let driverName = "";

let temp_date = new Date();

let db_date = temp_date.getFullYear() + '/' + parseInt(temp_date.getMonth()+1) + '/' +
    temp_date.getDate() + " " + temp_date.getHours() + ":" + temp_date.getMinutes() + ":" +
    temp_date.getSeconds();

// let orderNumber = "";

mongoose.connect('mongodb://localhost:27017/testDB');
const db = mongoose.connection;

const registerSchema = new mongoose.Schema({
    role: String,
    username: String,
    password: String,
    status: String
});

const orderSchema = new mongoose.Schema({
    orderID: String,
    date: Date,
    location: String,
    driver: String,
    pork: String,
    weight: String
});

const driverLocation = new mongoose.Schema({
    orderID: String,
    date: Date,
    location: String,
    time: Number,
    driver: String,
    pork: String,
    weight: String
});

const model = mongoose.model("Register", registerSchema, 'register');
const modelOrder = mongoose.model( "Order", orderSchema, 'order');
const modelStart = mongoose.model( "TransportStartTime", driverLocation, 'driverLocation');
const modelDone = mongoose.model( "TransportDoneTime", driverLocation, 'driverLocation');
const modelReturn = mongoose.model( "ReturnTime", driverLocation, 'driverLocation');

// Renders first login page
app.get('/', (req, res) => {
    res.render("Login");
});

// Renders post request for first login page
app.post('/', (req, res) => {
    let info = {
        id: req.body.id,
        password: req.body.pwd,
    };

    let inputValue = req.body.button;
    if (inputValue === 'Login') {
        if (!info.id || !info.password) {
            // res.send("Please type both ID and Password");
            res.send('<script type="text/javascript">alert("Please type both ID and password"); window.location=history.back(); </script>');
            return;
        }

        model.find({ username: info.id, password: info.password }, (err, item) => {

            let data = JSON.stringify(item);

            if (data === '[]') {
                // res.send("Username or password is not correct");
                res.send('<script type="text/javascript">alert("Username or password is not correct"); window.location=history.back(); </script>');
                return;
            }

            if (data.includes('manager')) {
                res.redirect('/manager');
                return;
            }

            if (data.includes('driver')) {
                let driverName = req.body.id;
                res.redirect('/driver?driverName=' + driverName);
            }
        });
    }
    if (inputValue === "Register") {
        res.redirect('/registerUser');
    }
    if (inputValue === "Check") {
        let orderNumber = req.body.ordernumber;
        res.redirect('/checkOrder?orderNumber=' + orderNumber);
    }
});

app.post('/checkOrder', (req, res) => {
    let inputValue = req.body.button;
    if (inputValue === 'Back') {
        res.redirect('/');
    }
});

app.get('/checkOrder', (req, res) => {

    let orderNumber = req.query.orderNumber;

    OrderContract.methods.GetOrderInfo(orderNumber).call().then((result) => {
        let orderInfo = result;
        res.render('CheckOrder', {date: orderInfo[0], location: orderInfo[1], time: orderInfo[2], driver: orderInfo[3], pork: orderInfo[4], weight: orderInfo[5]});
    });
});

// Renders post request for manager page
app.post('/manager', (req, res) => {
    let inputValue = req.body.button;
    if (inputValue === 'Register') {
        res.redirect('/registerOrder');
    }
    if (inputValue === "Cancel") {
        res.redirect('/');
    }
});

// Renders post request for registerUser page
app.post('/registerUser', (req, res) => {
    let inputValue = req.body.button;
    if (inputValue === "Confirm") {
        let registerForm = new model();
        registerForm.role = req.body.role;
        registerForm.username = req.body.username;
        registerForm.password = req.body.password;

        if (registerForm.role === "driver") {
            registerForm.status = "ready";
        }

        if (registerForm.role === "" || registerForm.username === "" || registerForm.password === "") {
            res.send('<script type="text/javascript">alert("Form error, missing input"); window.location=history.back(); </script>');
            // res.send("Form error, missing input");
            return;
        }

        model.exists({ username: registerForm.username }, (err, item) => {
            if (err) {
                console.log("MongoDB error: " + err);
                return false;
            }
            if (!item) {
                registerForm.save((err2) => {
                    if(err2) {
                        console.error(err2);
                        res.send('<script type="text/javascript">alert("Form error"); window.location=history.back(); </script>');
                        // res.send("Form error");
                        return;
                    }
                    res.send('<script type="text/javascript">alert("Form is registered"); window.location="/"; </script>');
                    // res.send("Form is registered");
                });
                Contract.methods.SetUserInfo(registerForm.username, registerForm.role).send({
                    from: '0xE9e344599890319B89c36ccc83070971fB48e776',
                    gas:'200000',
                    gasPrice: 200,
                    value: 0
                }); // This does not work
                Contract.methods.GetUserInfo(registerForm.username).call().then(console.log);
            }
            else {
                // res.send("Username already exists");
                res.send('<script type="text/javascript">alert("Username already exists"); window.location=history.back(); </script>');
            }
        });
    }
    if (inputValue === "Cancel") {
        res.redirect('/');
    }

    console.log(req.body);

});

// Renders post request for registerOrder page
app.post('/registerOrder', (req, res) => {
    let inputValue = req.body.button;
    if (inputValue === "Confirm") {
        let registerForm = new modelOrder();
        registerForm.date = req.body.date;
        registerForm.location = req.body.location;
        registerForm.driver = req.body.driver;
        registerForm.pork = req.body.pork;
        registerForm.weight = req.body.weight;

        let randomNumber = Math.floor(Math.random() * 100) + 1;

        registerForm.orderID = randomNumber.toString();

        let ifExists = false;

        while (ifExists) {
            model.exists({ orderID: registerForm.orderID }, (err, item) => {
                if (err) {
                    console.log("MongoDB error: " + err);
                    return false;
                }
                if (!item) {
                    ifExists = true;
                }
                else {
                    randomNumber = Math.floor(Math.random() * 100) + 1;
                    registerForm.orderID = randomNumber.toString();
                }
            });
        }

        console.log("Order ID = " + registerForm.orderID);

        if (registerForm.date === "" || registerForm.location === "" || registerForm.driver === "" || registerForm.pork === "" || registerForm.weight == "") {
            res.send('<script type="text/javascript">alert("Form error, missing input"); window.location=history.back(); </script>');
            // res.send("Form error, missing input");
            return;
        }

        // if (!Number.isInteger(registerForm.weight) || registerForm.weight <= 0 || registerForm.weight >= Number.MAX_VALUE) {
        //     res.send('<script type="text/javascript">alert("Form error, weight input is wrong"); window.location=history.back(); </script>');
        //     return;
        // }

        registerForm.save((err) => {
            if(err) {
                console.error(err);
                res.send('<script type="text/javascript">alert("Form error"); window.location=history.back(); </script>');
                // res.send("Form Error");
                return;
            }
            // res.send("Form is registered");
            res.send('<script type="text/javascript">alert("Form is registered"); window.location="/"; </script>');
        });

        OrderContract.methods.SetOrderInfo(registerForm.orderID, String(registerForm.date), registerForm.location, String("0"), registerForm.driver, registerForm.pork, registerForm.weight).send({
            from: '0xE9e344599890319B89c36ccc83070971fB48e776',
            gas:'200000',
            gasPrice: 200,
            value: 0
        });
    }
    if (inputValue === "Cancel") {
        res.redirect('/');
    }
});

// Renders post request for /driver page
app.post('/driver', (req, res) => {
    let inputValue = req.body.button;
    let driverName = req.query.driverName;

    model.findOne({username: driverName}, (err, obj) => {
        if (err) {
            console.error(err);
            return;
        }

        let state = obj.status;

        if (inputValue === "Assign") {
           if (state !== "ready") {
               // res.send("This driver has no assignments to confirm!");
               res.send('<script type="text/javascript">alert("This driver has no assignments to confirm!"); window.location=history.back(); </script>');
               return;
           }
           res.redirect('/driver/assign?driverName=' + driverName);
        }
        if (inputValue === "TransportStart") {
           if (state !== "confirmed") {
               res.send('<script type="text/javascript">alert("This driver has no confirmed assignments"); window.location=history.back(); </script>');
               // res.send("This driver has no confirmed assignments!");
               return;
           }
           res.redirect('/driver/transportStart?driverName=' + driverName);
        }
        if (inputValue === "TransportEnd") {
           if (state !== "driving") {
               res.send('<script type="text/javascript">alert("This driver is not driving"); window.location=history.back(); </script>');
               // res.send("This driver is not driving!");
               return;
           }
           res.redirect('/driver/transportEnd?driverName=' + driverName);
        }
        if (inputValue === "Return") {
           if (state !== "done") {
               res.send('<script type="text/javascript">alert("This driver is not done with an assignment!"); window.location=history.back(); </script>');
               // res.send("This driver is not done with an assignment!");
               return;
           }
           res.redirect('/driver/return?driverName=' + driverName);
        }
        if (inputValue === "Cancel") {
            res.redirect('/');
        }

    });
});

// Renders driver/assign page
app.get('/driver/assign', (req, res) => {
    let driverName = req.query.driverName;

    modelOrder.findOne({driver: driverName}, (err, obj) => {
        if (obj === null) {
            res.send('<script type="text/javascript">alert("No assignment found!"); window.location=history.back(); </script>');
            return;
        }

        let date = obj.date;
        let location = obj.location;
        let driver = obj.driver;
        let pork = obj.pork;
        let weight = obj.weight;

        res.render('Assign', {date:date, location:location, driver:driver, pork:pork, weight:weight});

        app.post('/driver/assign', (req2, res2) => {
            model.findOne({username: driverName}, (err2, doc2) => {
                doc2.status = "confirmed";
                doc2.save();

                // Interaction with smart contract?
                // res2.send("Order confirmed!");

                // res2.send('<script type="text/javascript">alert("Order confirmed!"); window.location="/driver"; </script>');
                res2.send('<script type="text/javascript">alert("Order confirmed!"); window.location=history.go(-2); </script>');
                // res2.redirect('/driver?driverName=' + driverName);
            });
        });
    });
});

// Renders driver/transportStart page
app.get('/driver/transportStart', (req, res) => {
    let driverName = req.query.driverName;

    modelOrder.findOne({driver: driverName}, (err, obj) => {
        if (obj === null) {
            res.send('<script type="text/javascript">alert("No transport ready!"); window.location=history.back(); </script>');
            // res.send("No transport ready!");
            return;
        }

        let date = obj.date;
        let location = obj.location;
        let driver = obj.driver;
        let pork = obj.pork;
        let weight = obj.weight;
        let ts = Date.now();
        let tstring = Date(ts);

        res.render('TransportStart', {date: date, location: location, time: tstring, driver: driver, pork: pork, weight: weight});

        app.post('/driver/transportStart', (req2, res2) => {
            model.findOne({username: driverName}, (err2, doc2) => {
                doc2.status = "driving";
                doc2.save();

                let driverStartTime = new modelStart();
                driverStartTime.date = date;
                driverStartTime.location = location;
                driverStartTime.time = ts;
                driverStartTime.driver = driver;
                driverStartTime.pork = pork;
                driverStartTime.weight = weight;

                driverStartTime.save((err3) => {
                    if (err3) {
                        console.error(err3);
                        return;
                    }
                    // res2.send("Transporter started driving!");
                    // res2.send('<script type="text/javascript">alert("Transporter started driving!"); window.location="/driver"; </script>');
                    res2.send('<script type="text/javascript">alert("Transporter started driving!"); window.location=history.go(-2); </script>');
                });
            });
        });
    });
});

// Renders driver/taansportEnd page
app.get('/driver/transportEnd', (req, res) => {
    let driverName = req.query.driverName;

    modelOrder.findOne({driver: driverName}, (err, obj) => {
        if (obj === null) {
            res.send('<script type="text/javascript">alert("No transport ongoing!"); window.location=history.back(); </script>');
            res.send("No transport ongoing!");
            return;
        }

        let date = obj.date;
        let location = obj.location;
        let driver = obj.driver;
        let pork = obj.pork;
        let weight = obj.weight;
        let ts = Date.now();
        let tstring = Date(ts);

        res.render('TransportEnd', {date: date, location: location, time: tstring, driver: driver, pork: pork, weight: weight});

        app.post('/driver/transportEnd', (req2, res2) => {
            model.findOne({username: driverName}, (err2, doc2) => {
                doc2.status = "done";
                doc2.save();

                let driverEndTime = new modelDone();
                driverEndTime.date = date;
                driverEndTime.location = location;
                driverEndTime.time = ts;
                driverEndTime.driver = driver;
                driverEndTime.pork = pork;
                driverEndTime.weight = weight;

                driverEndTime.save((err3) => {
                    if (err3) {
                        console.error(err3);
                        return;
                    }
                    // res2.send("Transporter finished delivery!");
                    // res2.send('<script type="text/javascript">alert("Transporter finished delivery!"); window.location="/driver"; </script>');
                    res2.send('<script type="text/javascript">alert("Transporter finished delivery!"); window.location=history.go(-2); </script>');
                });
            });
        });
    });
});

// Renders driver/return page
app.get('/driver/return', (req, res) => {
    let driverName = req.query.driverName;

    console.log("DRIVER NAME " + driverName);

    modelOrder.findOne({driver: driverName}, (err, obj) => {
        if (obj === null) {
            res.send("No transport done!");
            res.send('<script type="text/javascript">alert("No transport done!"); window.location=history.back(); </script>');
            return;
        }

        let idNumber = obj._id;
        console.log("ID NUMBER: " + idNumber);
        let date = obj.date;
        let location = obj.location;
        let driver = obj.driver;
        let pork = obj.pork;
        let weight = obj.weight;
        let ts = Date.now();
        let tstring = Date(ts);

        res.render('Return', {date: date, location: location, time: tstring, driver: driver, pork: pork, weight: weight});

        app.post('/driver/return', (req2, res2) => {
            model.findOne({username: driverName}, (err2, doc2) => {
                doc2.status = "ready";
                doc2.save();

                let driverReturn = new modelReturn();
                driverReturn.date = date;
                driverReturn.location = location;
                driverReturn.time = ts;
                driverReturn.driver = driver;
                driverReturn.pork = pork;
                driverReturn.weight = weight;

                driverReturn.save((err3) => {
                    if (err3) {
                        console.error(err3);
                        return;
                    }
                });
            });
            modelOrder.findOneAndDelete({_id: idNumber}, (err4, obj2) => {
                if (err4) {
                    console.error(err4);
                    return;
                }
                console.log("Deleted order! " + obj2);
                // res2.send("Transporter returned back!");
                // res2.send('<script type="text/javascript">alert("Transporter returned back!"); window.location="/driver"; </script>');

            });
            res2.send('<script type="text/javascript">alert("Transporter returned back!"); window.location=history.go(-2); </script>'); // NEEDS TO DELETE PROPERLY
        });
    });
});


// Renders register user page
app.get('/registerUser', (req, res) => {
    res.render('RegisterUser');
});

// Renders manager page
app.get('/manager', (req, res) => {
    res.render("Manager");
});

// Renders driver page
app.get('/driver', (req, res) => {
    let driverName = req.query.driverName;

    res.render("Driver", {name: driverName});
});

// Renders register page
app.get('/registerOrder', (req, res) => {
    model.find({role: "driver", status: "ready"}, 'username', (err, doc) => {

        let getId = doc.map((obj) => {
            return obj.username;
        });
        res.render("RegisterOrder", {driverList: getId});
    });
});

// Listens to port
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));