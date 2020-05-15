const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
let Web3 = require('web3');
const PORT = process.env.PORT || 3000;

let web3 = new Web3(new Web3.providers.HttpProvider('HTTP://127.0.0.1:7545'));

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

let orderCA = "0x3ba51a2D42246f9177d23663FAc3a4beb8cFF0ee";

let OrderContract = new web3.eth.Contract(orderABI, orderCA);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

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

const model = mongoose.model("Register", registerSchema, 'register');
const modelOrder = mongoose.model( "Order", orderSchema, 'order');

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

        let time = orderInfo[2];
        if (time === "0") {
            time = "-";
        }
        if (orderInfo[0] === "" || orderInfo[1] === "" || orderInfo[3] === "" || orderInfo[4] === "" || orderInfo[5] === "") {
            res.send('<script type="text/javascript">alert("The provided Order Number is incorrect!"); window.location=history.back(); </script>');
        }

        // let status = "";
        //
        // modelOrder.findOne({orderID: orderNumber}, (err, obj) => {
        //     let driver = obj.driver;
        //     model.findOne( {username: driver}, (err2, doc) => {
        //         if (doc.status === "confirmed") {
        //             status = "Driver has yet to confirm the order!";
        //         }
        //         if (doc.status === "assigned") {
        //             status = "Driver has confirmed the order!";
        //         }
        //         if (doc.status === "driving") {
        //              status = "Driver has started the delivery!";
        //         }
        //         if (doc.status === "done") {
        //             status = "Driver has finished the delivery!";
        //         }
        //     });
        // });
        //
        // console.log("STATUS: " + status)

        res.render('CheckOrder', {ordernumber: orderNumber, date: orderInfo[0], location: orderInfo[1], time: time, driver: orderInfo[3], pork: orderInfo[4], weight: orderInfo[5]});

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

        let randomNumber = Math.floor(Math.random() * 1000000) + 1;

        registerForm.orderID = randomNumber.toString();

        console.log("Random number is " + registerForm.orderID);

        modelOrder.exists({ orderID: registerForm.orderID }, (err, item) => {
            if (err) {
                console.log("MongoDB error: " + err);
                return false;
            }
            if (item) {
                console.log("Found already existing orderID, please buy lotto");
                randomNumber = Math.floor(Math.random() * 1000000) + 1;
                registerForm.orderID = randomNumber.toString();
                console.log("New random orderID is " + registerForm.orderID);
            }
        });

        console.log("Order ID = " + registerForm.orderID);

        if (registerForm.date === "" || registerForm.location === "" || registerForm.driver === "" || registerForm.pork === "" || registerForm.weight == "") {
            res.send('<script type="text/javascript">alert("Form error, missing input"); window.location=history.back(); </script>');
            // res.send("Form error, missing input");
            return;
        }

        if (isNaN(registerForm.weight)) {
            res.send('<script type="text/javascript">alert("Form error, weight input is not a number"); window.location=history.back(); </script>');
            return;
        }
        let weight = parseInt(registerForm.weight, 10);
        if (weight <= 0 || weight >= 100000) {
            res.send('<script type="text/javascript">alert("Form error, weight input is wrong"); window.location=history.back(); </script>');
            return;
        }

        registerForm.save((err) => {
            if(err) {
                console.error(err);
                res.send('<script type="text/javascript">alert("Form error"); window.location=history.back(); </script>');
                return;
            }
        });

        model.findOne({username: registerForm.driver}, (err, doc) => {
            doc.status = "accepted";
            doc.save();
        });

        OrderContract.methods.SetOrderInfo(registerForm.orderID, String(registerForm.date), registerForm.location, String("0"), registerForm.driver, registerForm.pork, registerForm.weight).send({
            from: '0xE9e344599890319B89c36ccc83070971fB48e776',
            gas:'200000',
            gasPrice: 200,
            value: 0
        });
        res.redirect('/confirm?driverName=' + registerForm.driver);
    }
    if (inputValue === "Cancel") {
        res.redirect('/');
    }
});

app.get('/confirm', (req, res) => {
    let driverName = req.query.driverName;
    modelOrder.findOne({driver: driverName}, (err, obj) => {
        res.render('Confirm', {ordernumber: obj.orderID, date: obj.date, location: obj.location, time: obj.time, driver: obj.driver, pork: obj.pork, weight: obj.weight});
    });
});

app.post('/confirm', (req, res) => {
    let inputValue = req.body.button;
    if (inputValue === 'Back') {
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
           if (state !== "accepted") {
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
    let ts = Date.now();
    let tstring = Date(ts);

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

        res.render('Assign', {date:date, location:location, time: tstring, driver:driver, pork:pork, weight:weight});
    });

    app.post('/driver/assign', (req2, res2) => {
        driverName = req2.query.driverName;
        model.findOne({username: driverName}, (err, doc) => {
            doc.status = "confirmed";
            doc.save();
        });

        modelOrder.findOne({driver: driverName}, (err, obj) => {
            let orderID = obj.orderID;

            OrderContract.methods.GetOrderInfo(orderID).call().then((result) => {
                let orderInfo = result;

                OrderContract.methods.SetOrderInfo(orderID, orderInfo[0], orderInfo[1], tstring, orderInfo[3], orderInfo[4], orderInfo[5]).send({
                    from: '0xE9e344599890319B89c36ccc83070971fB48e776',
                    gas:'200000',
                    gasPrice: 200,
                    value: 0
                });
                console.log("Driver assign uploaded to blockchain with OrderID " + orderID);
            });
        console.log("Order confirmed for " + driverName);
        });
        res2.redirect('/driver?driverName=' + driverName);
    });
});

// Renders driver/transportStart page
app.get('/driver/transportStart', (req, res) => {
    let driverName = req.query.driverName;
    let ts = Date.now();
    let tstring = Date(ts);

    modelOrder.findOne({driver: driverName}, (err, obj) => {
        if (obj === null) {
            res.send('<script type="text/javascript">alert("No transport ready!"); window.location=history.back(); </script>');
            return;
        }

        let date = obj.date;
        let location = obj.location;
        let driver = obj.driver;
        let pork = obj.pork;
        let weight = obj.weight;

        res.render('TransportStart', {date: date, location: location, time: tstring, driver: driver, pork: pork, weight: weight});
    });

    app.post('/driver/transportStart', (req2, res2) => {
        driverName = req2.query.driverName;
        model.findOne({username: driverName}, (err2, doc2) => {
            doc2.status = "driving";
            doc2.save();
        });
        modelOrder.findOne({driver: driverName}, (err, obj) => {
            let orderID = obj.orderID;

            OrderContract.methods.GetOrderInfo(orderID).call().then((result) => {
                let orderInfo = result;

                OrderContract.methods.SetOrderInfo(orderID, orderInfo[0], orderInfo[1], tstring, orderInfo[3], orderInfo[4], orderInfo[5]).send({
                    from: '0xE9e344599890319B89c36ccc83070971fB48e776',
                    gas:'200000',
                    gasPrice: 200,
                    value: 0
                });
                console.log("Driver start uploaded to blockchain with OrderID " + orderID);
            });
            console.log("Transporter " + driverName + " started driving!");
        });
        res2.redirect('/driver?driverName=' + driverName);
    });

});

// Renders driver/transportEnd page
app.get('/driver/transportEnd', (req, res) => {
    let driverName = req.query.driverName;
    let ts = Date.now();
    let tstring = Date(ts);

    modelOrder.findOne({driver: driverName}, (err, obj) => {
        if (obj === null) {
            res.send('<script type="text/javascript">alert("No transport ongoing!"); window.location=history.back(); </script>');
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
    });

    app.post('/driver/transportEnd', (req2, res2) => {
        driverName = req2.query.driverName;
        model.findOne({username: driverName}, (err2, doc2) => {
            doc2.status = "done";
            doc2.save();
        });
        modelOrder.findOne({driver: driverName}, (err, obj) => {
            let orderID = obj.orderID;

            OrderContract.methods.GetOrderInfo(orderID).call().then((result) => {
                let orderInfo = result;

                OrderContract.methods.SetOrderInfo(orderID, orderInfo[0], orderInfo[1], tstring, orderInfo[3], orderInfo[4], orderInfo[5]).send({
                    from: '0xE9e344599890319B89c36ccc83070971fB48e776',
                    gas:'200000',
                    gasPrice: 200,
                    value: 0
                });
                console.log("Driver end uploaded to blockchain with OrderID " + orderID);
            });
            console.log("Transporter " + driverName + " finished delivery!");
        });
        res2.redirect('/driver?driverName=' + driverName);
    });
});


// Renders driver/return page
app.get('/driver/return', (req, res) => {
    let driverName = req.query.driverName;
    let ts = Date.now();
    let tstring = Date(ts);

    modelOrder.findOne({driver: driverName}, (err, obj) => {
        if (obj === null) {
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

        res.render('Return', {date: date, location: location, time: tstring, driver: driver, pork: pork, weight: weight});
    });

    app.post('/driver/return', (req2, res2) => {
        model.findOne({username: driverName}, (err, doc2) => {
            doc2.status = "ready";
            doc2.save();
        });

        modelOrder.findOne({driver: driverName}, (err, obj) => {
            let orderID = obj.orderID;

            OrderContract.methods.GetOrderInfo(orderID).call().then((result) => {
                let orderInfo = result;

                OrderContract.methods.SetOrderInfo(orderID, orderInfo[0], orderInfo[1], tstring, orderInfo[3], orderInfo[4], orderInfo[5]).send({
                    from: '0xE9e344599890319B89c36ccc83070971fB48e776',
                    gas:'200000',
                    gasPrice: 200,
                    value: 0
                });
                console.log("Driver end uploaded to blockchain with OrderID " + orderID);
            });
            console.log("Transporter " + driverName + " finished delivery!");

            modelOrder.findOneAndDelete({orderID: orderID}, (err2, obj2) => {
                if (err2) {
                    console.error(err2);
                    return;
                }
                console.log("Deleted order! " + obj2);
            });
        });
        res2.redirect('/driver?driverName=' + driverName);
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