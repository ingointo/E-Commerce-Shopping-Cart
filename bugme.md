app.js
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const hbs = require('express-handlebars');
var fileUpload = require('express-fileupload')
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var db = require('./config/db')


var app = express();
db.connect().then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.log('Error connecting to MongoDB: ' + err.message);
  process.exit(1);
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({extname:'hbs', defaultLayout: 'layout', layoutDir: __dirname + '/views/layouts', partialsDir: __dirname + '/views/partials'}))
  
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use('/', userRouter);
app.use('/admin', adminRouter);
// app.use('/connection', connectionRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

old simple code
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('express-handlebars');
const fileUpload = require('express-fileupload');
const session = require('express-session')

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

const db = require('./config/db')

const app = express();

db.connect().then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.log('Error connecting to MongoDB: ' + err.message);
    process.exit(1);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({extname:'hbs', defaultLayout: 'layout', layoutDir: __dirname + '/views/layouts', partialsDir: __dirname + '/views/partials'}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/product-images', express.static(path.join(__dirname, 'public', 'product-images')));

app.use(fileUpload())
app.use(session({secret: "key", cookie:{maxAge: 8000000}}))
app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

product-helper.js 
const db = require('../config/db');

module.exports = {
  getAllProducts: async () => {
    const collection = db.collection('products');
    const products = await collection.find().toArray();
    return products;
  },

  addProduct: async (product) => {
    const collection = db.collection('products');
    const result = await collection.insertOne(product);
    return result;
  }
};
var productCollection = require('../config/db')

module.exports = {
    addProduct: (product, callback) => {
        console.log(product)  
        console.log(product)  
        const myColl = productCollection.get().collection("product");
        myColl.insertOne(product).then((data) => {
            callback(true)
        })
    }
}
var db = require('../config/db')

module.exports = {
    addProduct: (product, callback) => {
        console.log(product)  
        console.log(product)  
        db.connect(() => {
            const myColl = db.get().collection("product");
            myColl.insertOne(product).then((data) => {
                callback(true)
            })
        })
    }
}


var db = require('../config/db')

module.exports = {
    addProduct: (product, callback) => {
        console.log(product);
        console.log(product);
        const myColl = db.collection("product");
        myColl.insertOne(product).then((data) => {
            callback(true);
        });
    }
};


var db = require('../config/db')

module.exports = {
    addProduct: (product, callback) => {
        console.log(product);
        console.log(product);
        const myColl = db.collection("product");
        myColl.insertOne(product).then((data) => {
            // if (typeof callback === 'function') {
                console.log(data)
                callback(data);
            // }
        });
    }
};
db.js
 var express = require('express');
 var router = express.Router();
 const mongoose = require('mongoose')
  const state = {
      db:null
  }
 module.exports.connect = function(done){
     const url = 'mongodb+srv://mongoadmin:mongoadmin03@nodeapi.jvov1mk.mongodb.net/'
     const dbname = 'Shopping'
     mongoose.connect(url, (err, data) => {
         if(err) return done(err)
         console.log(data)
         state.db = data.db(dbname)
         done()
     })
 }
 module.exports = get.function(){
   return state.db
 }
 mongoose.set('strictQuery',false)
 mongoose.connect('mongodb+srv://mongoadmin:mongoadmin03@nodeapi.jvov1mk.mongodb.net/Node-API?retryWrites=true&w=majority')
 .then(()=>{
     console.log('MongoDB is Connected')
 }).catch((error) =>{
     console.log(error)
 })
 module.exports = router;
 const connect = async () => {
     await mongoose.connect("mongodb://localhost:27017/task-manager-api", {
         useNewUrlParser: true
     });
 };
 const {
   MongoClient
 } = require('mongodb')
 const client = new MongoClient('mongodb+srv://mongoadmin:mongoadmin03@nodeapi.jvov1mk.mongodb.net/Shopping')
 console.log('client')
 async function start() {
   await client.connect()
   console.log("Connected")
   module.exports = client.db()
   const app = require('../app')
   console.log('Module exported app.js')
 }
 console.log('hooooo')
 start()