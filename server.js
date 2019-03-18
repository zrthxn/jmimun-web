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

const PORT = process.env.PORT || 5000;
const ServerConfig = require('./config.json');
const __domain = require('./config.json').domain;

// const Security = require('./util/Security');
const Gmailer = require('./util/Gmailer');
const GSheets = require('./util/GSheets');
// const ContentDelivery = require('./util/ContentDelivery');
// const Database = require('./util/Database');

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

const regPrefix = 'RGN-JMC2019DEL'

// // Static Served Directories
// homepage.use('/static', express.static( path.join(__dirname, 'pages', 'static') ))
// // homepage.use('/register', express.static( path.join(__dirname, 'bookings', 'build') ))
// // homepage.use('/register/main', express.static( path.join(__dirname, 'bookings', 'build') ))
// // homepage.use('/register/payment/', express.static( path.join(__dirname, 'bookings', 'build') ))
// // homepage.use('/register/cancel', express.static( path.join(__dirname, 'bookings', 'build') ))

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

register.get('/unga', (req,res) =>{
    res.render('unga', { 'title': 'General Assembly Delegate Form | JMI International MUN 2019' })
})
register.get('/loksb', (req,res) =>{
    res.render('loksb', { 'title': 'Lok Sabha Delegate Form | JMI International MUN 2019' })
})
register.get('/aippm', (req,res) =>{
    res.render('aippm', { 'title': 'AIPPM Delegate Form | JMI International MUN 2019' })
})
register.get('/disec', (req,res) =>{
    res.render('disec', { 'title': 'UNGA DISEC Delegate Form | JMI International MUN 2019' })
})
register.get('/oic', (req,res) =>{
    res.render('oic', { 'title': 'OIC Delegate Form | JMI International MUN 2019' })
})
register.get('/hcc', (req,res) =>{
    res.render('hcc', { 'title': 'Crisis Committee Delegate Form | JMI International MUN 2019' })
})
register.get('/unsc', (req,res) =>{
    res.render('unsc', { 'title': 'Security Council Delegate Form | JMI International MUN 2019' })
})
register.get('/unhrc', (req,res) =>{
    res.render('unhrc', { 'title': 'Human Rights Council Delegate Form | JMI International MUN 2019' })
})
register.get('/arl', (req,res) =>{
    res.render('arl', { 'title': 'Arab League Delegate Form | JMI International MUN 2019' })
})

// REGISTRATION HANDLER --------------------------------------------------

register.post('/_register/:type/:comm', (req,res) => {
    let { comm, type } = req.params
    let _values = []

    if(req.body!==null) {
        let data = req.body
        for(let field in data) {
            if(field===undefined) continue
            if(data[field]===undefined || data[field]===null) data[field] = ""
        }

        if(type==='double'){
            _values = [ 
                data.category, data.name_1, data.inst_1, data.instType_1,
                data.age_1, data.email_1, data.phone_1, 
                data.accomodation_1, data.passport_1, data.ca_code_1,
                data.name_1, data.inst_2, data.instType_2, data.instTypeo_2, 
                data.age_2, data.email_2, data.phone_2, 
                data.accomodation_2, data.passport_2, data.ca_code_2,
                data.xp, data.xpDetail, data.pref1, data.pref2, data.pref3, data.payment
            ]
        } else if(type==='single'){
            _values = [ 
                data.category, data.name, data.inst, data.instType,
                data.age, data.email, data.phone, 
                data.accomodation, data.passport, data.ca_code, 
                data.xp, 
                data.pref1, data.pref2, data.pref3, data.payment, data.xpDetail, 
            ]
        }
        
        let regConfig = JSON.parse(fs.readFileSync('./registrations/register.json').toString())
        regConfig[comm].ref++
        let rgn = regPrefix + regConfig[comm].ref + regConfig[comm].suffix
        let pwd = regConfig[comm].suffix + regConfig[comm].ref + '319'

        _values = [ Date.now(), ..._values, rgn, pwd ]

        fs.writeFileSync('./registrations/register.json', JSON.stringify(regConfig, null, 2))

        console.log(_values)
        GSheets.AppendToSpreadsheet([{
            ssId : ServerConfig.Sheets[comm].ssId,
            sheet: ServerConfig.Sheets[comm].sheet,
            values: _values
        }]).then(()=>{
            Gmailer.SingleDataDelivery({
                to: data.email,
                from: "register.jmimun18@gmail.com",
                subject: "Thank you for your Registration | JMI International MUN 2019"
            }, 
            fs.readFileSync('./email/templates/confirmation.htm').toString(),
            [
                { id: 'rgn', data: rgn },
                { id: 'pwd', data: pwd },
            ]).then(()=>{
                res.render('success', { 
                    'title': "Success | JMI International MUN 2019",
                    'rgn': rgn
                })
            })
        })
    } else {
        res.status(500).render('error', {'title': 'Error | JMI International MUN 2019'})
    }
})
