// import dependencies
const express = require('express');
const path = require('path');

// set up expess validator
const {check, validationResult} = require('express-validator'); 

//set up the DB connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/onlineplantstore',{
    useNewUrlParser:true,
    useUnifiedTopology:true
});

//set up the model for the order
const Order = mongoose.model('Order',{
    custName        : String,
    custEmail       : String,
    custPhone       : String,
    custAddress     : String,
    custCity        : String,
    custPostCode    : String,
    custProvince    : String,
    custCardNo      : String,
    deliveryTime    : String,
    peperomiaQty    : Number,
    stromantheQty   : Number,
    aglaonemaQty    : Number,
    arecaQty        : Number,
    total           : Number,
    totalTax        : Number,
    totalCost       : Number,
    shippingCharge  : Number  
});

//set up constants
const exp = require('constants');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

// set up variables to use packages
var myApp = express();
myApp.use(express.urlencoded({extended:false})); 

// set path to public folders and view folders
myApp.set('views', path.join(__dirname, 'views'));
//use public folder for CSS etc.
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');

// set up different routes (pages) of the website
// render the home page
myApp.get('/',function(req, res){
    res.render('home'); // will render views/home.ejs
});
//render the product page
myApp.get('/product',function(req, res){
    res.render('products'); // will render views/products.ejs
});
//render the gallery page
myApp.get('/gallery',function(req, res){
    res.render('gallery'); // will render views/gallery.ejs
});

//redirect to products page
myApp.post('/product',function(req,res){
    res.render('products')
});


//regex validations
var custNameRegex    = /^[a-zA-Z0-9]{1,}\s[a-zA-Z0-9]{1,}$/;
var cardNumRegex     = /^[0-9]{4}[\-][0-9]{4}[\-][0-9]{4}[\-][0-9]{4}$/;
var cardMonthRegex   = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/;
var cardYearRegex    = /^[0-9]{4}$/;
var phoneNoRegex     = /^[0-9]{3}[\-][0-9]{3}[\-][0-9]{4}$/;
var prodQtyRegex     = /^[0-9]+$/;
var postCodeRegex    = /^[A-Z][0-9][A-Z][\s][0-9][A-Z][0-9]$/

//functions for validation
function checkRegex(userInput, regex){
    if(regex.test(userInput)){
        return true;
    }
    else{
        return false;
    }
}

//number validation for quantity
function peperomiaQuantityValidation(value, {req}){
    var peperomiaQty = req.body.peperomiaQty;
    if(!checkRegex(peperomiaQty, prodQtyRegex) && peperomiaQty != ""){
        throw new Error('Peperomia quantity should be a number.');
    }
    return true;
}
function stromantheQuantityValidation(value, {req}){
    var stromantheQty = req.body.stromantheQty;
    if(!checkRegex(stromantheQty, prodQtyRegex) && stromantheQty != ""){
        throw new Error('Stromanthe quantity should be a number.');
    }
    return true;
}
function aglaonemaQuantityValidation(value, {req}){
    var aglaonemaQty = req.body.aglaonemaQty;
    if(!checkRegex(aglaonemaQty, prodQtyRegex) && aglaonemaQty != ""){
        throw new Error('Aglaonema quantity should be a number.');
    }
    return true;
}
function arecaQuantityValidation(value, {req}){
    var arecaQty = req.body.arecaQty;
    if(!checkRegex(arecaQty, prodQtyRegex) && arecaQty != ""){
        throw new Error('Areca quantity should be a number.');
    }
    return true;
}

//variable declaration and initialization for products
var prodList                = new Array();
var prodDetails             = new Array();
var totalPeperomiaCost      = 0;
var totalStromantheCost     = 0;
var totalAglaonemaCost      = 0;
var totalArecaCost          = 0;
var totalCost               = 0;
var tax                     = 0.13;
var totalTax                = 0;
var total                   = 0;
var shippingCharge          = 0;
const peperomiaPrice        = 10;
const stromanthePrice       = 12;
const aglaonemaPrice        = 14;
const arecaPrice            = 8;

//redirect to bill page when user clicks proceed
myApp.post('/receipt',[
    check('custName', '*Please enter your full name').matches(custNameRegex),
    check('custAddress', '*Please enter your address.').not().isEmpty(),
    check('custCity', '*Please enter a city.').not().isEmpty(),
    check('custProvince', '*Please select your provice code').not().isEmpty(),
    check('custPhone', '*Please enter a valid Phone Number.Eg:123-123-1234').matches(phoneNoRegex),
    check('custPostCode','*please enter valid postal code Eg:X9X 9X9').matches(postCodeRegex),
    check('custEmail', '*Please enter a valid email.Eg:test@test.com').isEmail(),
    check('cardNo', '*Please enter valid Card Number.Eg:1111-1111-1111-1111').matches(cardNumRegex),
    check('cardExpMonth', '*Please enter valid Expiry Month.Eg:JAN').matches(cardMonthRegex),
    check('cardExpYear', '*Please enter valid Expiry Year.Eg:2022').matches(cardYearRegex),
    check('peperimiaQty').custom(peperomiaQuantityValidation),
    check('stromantheQty').custom(stromantheQuantityValidation),
    check('aglaonemaQty').custom(aglaonemaQuantityValidation),
    check('arecaQty').custom(arecaQuantityValidation)
], function(req,res){
    // check for errors
    const errors = validationResult(req);
    console.log(errors);
    if(!errors.isEmpty())
    {
        res.render('products',{er: errors.array()});
    }
    else
    {
        //clearing once submitted values
        prodList    = new Array();
        totalCost   = 0;
        total       = 0;
        //fetch the values
        var custName     = req.body.custName; 
        var custEmail    = req.body.custEmail;
        var custPhone    = req.body.custPhone;
        var custAddress  = req.body.custAddress;
        var custCity     = req.body.custCity;
        var custPostCode = req.body.custPostCode;
        var custProvince = req.body.custProvince;
        var cardNo       = req.body.cardNo;
        var peperomiaQty = req.body.peperomiaQty;
        var stromantheQty= req.body.stromantheQty;
        var aglaonemaQty = req.body.aglaonemaQty;
        var arecaQty     = req.body.arecaQty;
        var deliveryTime = req.body.deliveryTime;

        //getting the last 4 characters from credit card
        var lastNum  = cardNo.substr(-4);
        var mask     = "XXXX-XXXX-XXXX-";
        cardNo  = mask + lastNum;

        //checking product quantity is not zero to add items
        if(peperomiaQty != 0)
        {
            totalPeperomiaCost = peperomiaPrice * peperomiaQty;
            prodDetails = ["Peperomia","$" + peperomiaPrice,peperomiaQty,"$" + totalPeperomiaCost];
            prodList.push(prodDetails);
            totalCost += totalPeperomiaCost;
        }
        if(stromantheQty != 0)
        {
            totalStromantheCost = stromanthePrice * stromantheQty;
            prodDetails = ["Stromanthe","$" + stromanthePrice,stromantheQty,"$" +totalStromantheCost];
            prodList.push(prodDetails);
            totalCost += totalStromantheCost;
        }
        if(aglaonemaQty != 0)
        {
            totalAglaonemaCost = aglaonemaPrice * aglaonemaQty;
            prodDetails = ["Aglaonema","$" + aglaonemaPrice,aglaonemaQty,"$" + totalAglaonemaCost];
            prodList.push(prodDetails);
            totalCost += totalAglaonemaCost;
        }
        if(arecaQty != 0)
        {
            totalArecaCost = arecaPrice * arecaQty;
            prodDetails = ["Areca","$" + arecaPrice,arecaQty,"$" + totalArecaCost];
            prodList.push(prodDetails);
            totalCost += totalArecaCost;
        }
        //calculating tax according to each province
        if(totalCost != 0)
        {
            if(deliveryTime == 1)
            {
                shippingCharge = 40;
            }
            if(deliveryTime == 2)
            {
                shippingCharge = 30;
            }
            if(deliveryTime == 3)
            {
                shippingCharge = 20;
            }
            totalCost = totalCost + shippingCharge;
            totalTax = totalCost * tax;
            total = totalCost + totalTax;
        }

        // create an object with the fetched data to send to the view
        var pageData = {
            custName        : custName,
            custEmail       : custEmail,
            custPhone       : custPhone,
            custAddress     : custAddress,
            custCity        : custCity,
            custProvince    : custProvince,
            custPostCode    : custPostCode,
            custCardNo      : cardNo,
            peperomiaQty    : peperomiaQty,
            stromantheQty   : stromantheQty,
            aglaonemaQty    : aglaonemaQty,
            arecaQty        : arecaQty,
            deliveryTime    : deliveryTime,
            shippingCharge  : shippingCharge,
            total           : total,
            totalTax        : totalTax,
            totalCost       : totalCost,
            prodList        : prodList
        }

        //storing  the order created  to the database
        var newOrder = new Order(pageData);

        //save the order using save()
        newOrder.save().then(function(){
            //console success message
        console.log('New order created successfully')
        });
        // render the invoice page with data
        res.render('invoice', pageData);
    }
});

//Your Orders Page
myApp.get('/yourorders',function(req,res){
    Order.find({}).exec(function(err, orders){
        console.log(err);
        res.render('yourorders',{orders:orders});
    });
})

// start the server and listen at a port
myApp.listen(8080);

//tell everything is going good
console.log('Everything executed fine.. website at port 8080....');

