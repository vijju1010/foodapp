var express = require('express');
var sendmail = require('./nodemail');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var axios = require('axios');
var app = express();
// var uuid = require('uuid');
app.use('/uploads', express.static('uploads'));
var multer = require('multer');
var st = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, '' + file.originalname.replace(' ', ''));
    },
});
const blob = multer({ storage: st });

app.use(cookieParser());
// app.use(cookies({ secret: 'ssshhhhh' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var session = require('express-session');
var RedisStore = require('connect-redis')(session);
app.set('trust proxy', 1); // trust first proxy
app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true },
    })
);

app.use(
    session({
        store: new RedisStore({
            host: '127.0.0.1', //where redis store is
            port: 6379, //default redis port
            prefix: 'sess', //prefix for sessions name is store
            pass: 'passwordtoredis', //password to redis db
        }),
        key: 'express.sid',
    })
);

app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', function (req, res) {
    res.redirect('/login');
});

var abc = (req, res, next) => {
    sendmail('pvijju198@gmail.com', 'kjhfds');
    next();
};

app.get('/login', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        res.redirect('/home');
    } else {
        res.render('login', { message: '' });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.clearCookie('password');
    res.redirect('/login');
});

app.get('/register', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        res.redirect('/home');
    } else {
        res.render('register', { message: '' });
    }
});

app.get('/home', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        var locations = [];
        axios.get('http://localhost:3000/foods').then((response) => {
            response.data.forEach((food) => {
                locations.push(food.location);
            });
            locations = [...new Set(locations)];
            res.render('home', {
                locations: locations,
                fooditems: response.data,
            });
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/profile', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        username = req.session.loginUser;
        axios
            .get('http://localhost:3000/users/' + username)
            .then((response) => {
                res.render('profile', {
                    user: response.data,
                });
            });
    } else {
        res.redirect('/login');
    }
});

app.get('/order/:id', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        var id = req.params.id;
        axios.get('http://localhost:3000/foods/' + id).then((response) => {
            res.render('order', {
                item: response.data,
            });
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/test1', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        username = req.session.loginUser;
        axios
            .get('http://localhost:3000/users/' + username)
            .then((response) => {
                res.render('test1', {
                    user: response.data,
                });
            });
    } else {
        res.redirect('/login');
    }
});

app.post('/editfood', (req, res) => {
    console.log(req.body);
    obj = {
        id: req.body.foodid,
        userid: req.session.loginUser,
        kitchen: req.body.kitchen,
        name: req.body.foodname,
        serves: req.body.serves,
        remarks: req.body.remarks,
        location: req.body.location,
        delivery: req.body.delivery,
        price: req.body.price,
        image: req.body.image,
    };
    axios.put('http://localhost:3000/foods/' + obj.id, obj);
    res.redirect('/myfood');
});

app.get('/myfood', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        username = req.session.loginUser;
        axios
            .get('http://localhost:3000/foods?userid=' + username)
            .then((response) => {
                res.render('myfood', {
                    user: req.session.loginUser,
                    fooditems: response.data,
                });
            });
    } else {
        res.redirect('/login');
    }
});
app.get('/placedorders', (req, res) => {
    userid = req.session.loginUser;
    var fooditems = [];
    axios.get('http://localhost:3000/users/' + userid).then((response) => {
        var placed = response.data.placedorders;
        axios.get('http://localhost:3000/foods').then((response) => {
            fooditems = response.data.filter((item) => {
                return placed.includes(item.id);
            });
            if (fooditems.length == 0) {
                res.render('placedorders', {
                    fooditems: fooditems,
                    message: 'No orders placed yet',
                });
            } else {
                res.render('placedorders', { fooditems: fooditems });
            }
        });
    });
});

app.get('/forgotpassword', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        res.redirect('/home');
    } else {
        res.render('forgotpassword', { message: '' });
    }
});

app.post('/sendpasscode', abc, (req, res) => {
    var email = req.body.email;

    var password = req.body.password;
    var passcode = '' + Math.floor(Math.random() * 1000000);
    sendmail(email, passcode);

    axios.get('http://localhost:3000/users?id=' + email).then((response) => {
        if (response.data.length == 0) {
            res.render('forgotpassword', { message: 'Email not registered' });
        } else {
            axios
                .put('http://localhost:3000/users/' + email, {
                    ...response.data[0],
                    passwd: passcode,
                })
                .then((response) => {
                    console.log(response.data);
                });
            var sent = sendmail(email, passcode);
            if (sent != '0') {
                res.render('forgotpassword', { message: 'Password sent' });
            } else {
                res.render('forgotpassword', { message: 'Email not sent' });
            }
        }
    });
});

// sendmail1 = (email, passcode) => {
//     sendmail(email, passcode);
// };
app.get('/receivedorders', (req, res) => {
    userid = req.session.loginUser;
    var fooditems = [];

    axios.get('http://localhost:3000/users/' + userid).then((response) => {
        var received = response.data.receivedorders;
        var receivedfoodids = [];
        received.forEach((order) => {
            receivedfoodids.push(order.foodid);
        });
        axios.get('http://localhost:3000/foods').then((response) => {
            fooditems = response.data.filter((item) => {
                return receivedfoodids.includes(item.id);
            });
            username = req.session.loginUser;
            if (fooditems.length == 0) {
                axios
                    .get('http://localhost:3000/users/' + username)
                    .then((response) => {
                        res.render('receivedorders', {
                            user: response.data,
                            fooditems: fooditems,
                            message: 'No orders received yet',
                        });
                    });
            } else {
                axios
                    .get('http://localhost:3000/users/' + username)
                    .then((response) => {
                        res.render('receivedorders', {
                            user: response.data,
                            fooditems: fooditems,
                        });
                    });
            }
        });
    });
});

app.get('/addfood', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        username = req.session.loginUser;
        axios
            .get('http://localhost:3000/users/' + username)
            .then((response) => {
                res.render('addfood', {
                    user: response.data,
                });
            });
    } else {
        res.redirect('/login');
    }
});

app.get('/test', (req, res) => {
    if (req.session.loginUser && req.session.password) {
        username = req.session.loginUser;
        axios
            .get('http://localhost:3000/foods?userid=' + username)
            .then((response) => {
                res.render('test', {
                    user: req.session.loginUser,
                    fooditems: response.data,
                });
            });
    } else {
        res.redirect('/login');
    }
});
app.post('/home', (req, res) => {
    var locations1 = [];
    axios.get('http://localhost:3000/foods').then((responseall) => {
        responseall.data.forEach((food) => {
            locations1.push(food.location);
        });
        locations = [...new Set(locations1)];
        axios
            .get('http://localhost:3000/foods?location=' + req.body.locations)
            .then((response) => {
                if (response.data.length == 0) {
                    res.render('home', {
                        fooditems: responseall.data,
                        locations: locations,
                    });
                } else {
                    res.render('home', {
                        fooditems: response.data,
                        locations: locations,
                    });
                }
            });
    });
});
app.post('/placeorder', (req, res) => {
    console.log(req.body.foodid, 'foodid');
    foodid = req.body.foodid;
    axios.get('http://localhost:3000/foods/' + foodid).then((response) => {
        sellerid = response.data.userid;
        axios
            .get('http://localhost:3000/users/' + sellerid)
            .then((response1) => {
                uowner = {
                    ...response1.data,
                    receivedorders: [
                        ...response1.data.receivedorders,
                        {
                            foodid: foodid,
                            customerid: req.session.loginUser,
                        },
                    ],
                };
                axios
                    .put('http://localhost:3000/users/' + sellerid, uowner)
                    .then((response2) => {
                        console.log('updated seller');
                        axios
                            .get(
                                'http://localhost:3000/users/' +
                                    req.session.loginUser
                            )
                            .then((response3) => {
                                uuser = {
                                    ...response3.data,
                                    placedorders: [
                                        ...response3.data.placedorders,
                                        foodid,
                                    ],
                                };
                                axios
                                    .put(
                                        'http://localhost:3000/users/' +
                                            req.session.loginUser,
                                        uuser
                                    )
                                    .then((response) => {
                                        console.log('updated user');
                                    });
                            });
                    });
                res.redirect('/home');
            });
    });
});

app.post('/addfood', blob.single('foodpic'), (req, res) => {
    // console.log(req.file, 'req.file');
    console.log(req.session.loginUser, 'req.userid');
    axios.get('http://localhost:3000/foods/').then((response) => {
        var food = {
            id: response.data.length + 1,
            userid: req.session.loginUser,
            kitchen: req.body.kitchen,
            name: req.body.foodname,
            serves: req.body.serves,
            remarks: req.body.remarks,
            location: req.body.location,
            delivery: req.body.delivery,
            image: '/uploads/' + req.file.originalname.replace(' ', ''),
            price: req.body.price,
        };
        console.log(food, 'food');
        axios
            .post('http://localhost:3000/foods', food)
            .then((response) => {
                res.redirect('/home');
            })
            .catch((err) => {
                console.log(err, 'error 167');
            });
    });
});

app.post('/reguser', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var cnfpassword = req.body.cnfpassword;
    if (password === cnfpassword) {
        axios
            .post('http://localhost:3000/users', {
                id: username,
                passwd: password,
                placedorders: [],
                receivedorders: [],
            })
            .then((response) => {
                res.redirect('/login');
            })
            .catch((error) => {
                res.render('register', { message: 'User already exists' });
            });
    } else {
        res.render('register', { message: "Passwords don't match" });
    }
});

app.post('/getin', (req, response) => {
    console.log(req.body);
    axios
        .get(
            'http://localhost:3000/users?id=' +
                req.body.username +
                '&passwd=' +
                req.body.password
        )
        .then((res) => {
            users = res.data;
            console.log(users);
            if (users.length != 0) {
                console.log(req.sessionID);
                // response.cookie('loginUser', req.body.username);
                // response.cookie('password', req.body.password);
                req.session.loginUser = req.body.username;
                req.session.password = req.body.password;
                response.redirect('/home');
            } else {
                response.render('register', {
                    msg: 'userNotFound please regisger or incorrect password',
                });
            }
        });
});

app.post('/deletefood', (req, res) => {
    console.log(req.body.foodid, 'foodid');
    // axios
    //     .delete('http://localhost:3000/foods/' + req.body.foodid)
    //     .then((response) => {
    //         res.redirect('/home');
    //     });
});

app.post('/removefromplaced', (req, res) => {
    axios
        .get('http://localhost:3000/users/' + req.session.loginUser)
        .then((response) => {
            uuser = {
                ...response.data,
                placedorders: response.data.placedorders.filter((foodid) => {
                    return foodid != req.body.foodid;
                }),
            };
            axios
                .put(
                    'http://localhost:3000/users/' + req.session.loginUser,
                    uuser
                )
                .then((response) => {
                    console.log('updated user');
                    res.redirect('/placedorders');
                });
        });
});

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'reddikumar205@gmail.com',
        pass: 'rootroot',
    },
});

port = 8080 || process.env.PORT;
var g = 'pvijju198@gmail.com';
app.listen(port, () => {
    console.log('Server started on port ' + port);
    // sendmail('pvijju198@gmail.com', '1234');
});
