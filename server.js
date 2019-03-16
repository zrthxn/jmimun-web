const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');
const vhost = require('vhost');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const request = require('request');
const fileUpload = require('express-fileupload');

const jmimun = express();
const homepage = express();
const register = express();

const PORT = process.env.PORT || 3000;
const ServerConfig = require('./config.json');
const __domain = require('./config.json').domain;

const Security = require('./util/Security');
const Gmailer = require('./util/Gmailer');
const GSheets = require('./util/GSheets');
const ContentDelivery = require('./util/ContentDelivery');
const Database = require('./util/Database');

jmimun.use(cookieParser(ServerConfig.clientKey, {}))
jmimun.use(bodyParser.json())
jmimun.use(bodyParser.urlencoded({ extended: true }))
jmimun.use(express.json())
jmimun.use(express.urlencoded({ extended: true }))

// Virtual Host ---------------------- //
jmimun.use(vhost(__domain, homepage))
jmimun.use(vhost('www.' +  __domain, homepage))
jmimun.use(vhost('register.' +  __domain, register))

jmimun.listen(PORT, ()=>{
    console.log("Started")
})

// Static Served Directories
homepage.use('/static', express.static( path.join(__dirname, 'pages', 'static') ))
// homepage.use('/register', express.static( path.join(__dirname, 'bookings', 'build') ))
// homepage.use('/register/main', express.static( path.join(__dirname, 'bookings', 'build') ))
// homepage.use('/register/payment/', express.static( path.join(__dirname, 'bookings', 'build') ))
// homepage.use('/register/cancel', express.static( path.join(__dirname, 'bookings', 'build') ))

homepage.set('views', path.join(__dirname, 'homepage'))
homepage.set('view engine', 'hbs')
homepage.engine('hbs', hbs({
    defaultLayout: 'main',
    extname: 'hbs',
    layoutsDir: __dirname + '/homepage/layouts',
    partialsDir: [
        __dirname + '/homepage/partials'
    ]
}))


register.set('views', path.join(__dirname, 'pages', 'forms'))
register.set('view engine', 'hbs')
register.engine('hbs', hbs({
    defaultLayout: 'main',
    extname: 'hbs',
    layoutsDir: __dirname + '/pages/layouts',
    partialsDir: [
        __dirname + '/pages/partials'
    ]
}))

homepage.get('/unga', (req,res) =>{
    res.render('unga', {'title': 'General Assembly Delegate Form | JMI International MUN 2019'})
})

homepage.post('_unga', (req,res) => {
    if(req.body!=null){
        let data =req.body
        Gmailer.SingleDataDelivery({
            to: data.email,
            from: "thatazimjaved@gmail.com",
            subject: "Registration received - Number"
        }, "Registration received", []) 
        GSheets.AppendToSpreadsheet([{
            ssId : config.unga.ssid,
            range: config.unga.sheet,
            values: [ data.category, data.inst, data.instTypeo, data.age, data.email, data.phone, data.accomodation, data.passport, data.campusAmbassador, data.xp, data.xpDetail, data.pref1, data.pref2, data.pref3, data.payemnt ]
        }])
        res.render('success', {'title': "Success | JMI International MUN 2019"})
        res.sendStatus(200);
    }
    else {
        res.render('error', {'title': 'Error | JMI International MUN 2019'})
        res.sendStatus(500)
    }
})