const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const reload = require('reload');
const markdown = require('marked');
const sanitizeHTML = require('sanitize-html');
const csrf = require('csurf');
const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());

//app.use('/api', require('./router-api'));

let sessionOptions = session({
    secret: "Javascript is soooo coool",
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000*60*60*24,
        httpOnly: true
    }
});

app.use(sessionOptions);
app.use(flash());

//to musi być przed routerem
app.use(function(req, res, next){

    //make markdown function available from within ejs templates    
    res.locals.filterUserHTML = function(content){
        return  sanitizeHTML(
            markdown(content),
            {
                allowedTags: [
                    'p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em',
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
                ],
                allowedAttributes: {}
            }
        );
    }

    //make all error and success flash messages available from all requests
    res.locals.errors = req.flash('errors');
    res.locals.success = req.flash('success');
    res.locals.recipient_username = req.flash('recipient_username');
    res.locals.value = req.flash('value');

    //make current user id available on the req object
    if(req.session.user){
        req.visitorId = req.session.user._id
    } else {
        req.visitorId = 0;
    }

    //make user session data available from within view templates
    res.locals.user = req.session.user;
    next();
});
const web = require('./routes/web');

app.use(express.static('public'));

//pierwszy parametr to opcja a drugi to nazwa Twojego folderu
app.set('views', 'resources/views');
app.set('view engine', 'ejs');

app.use(csrf());
app.use(function(req, res, next){
    res.locals.csrfToken = req.csrfToken();
    next();
});
app.use('/', web);
app.use(function(err, req, res, next){
    if(err){
        console.log(err.toString());
        if(err.code == 'EBADCSRFTOKEN'){
            req.flash('errors', "Cross site request forgery detected");
            req.session.save(() => res.redirect('/'));
        } else {
            res.send('<h1>404</h1>');
        }
    } 
});

const server = require('http').createServer(app);
/*const path = require('path');
const fs = require('fs');*/
const io = require('socket.io')(server);

io.use(function(socket, next){
    sessionOptions(socket.request, socket.request.res, next);
})

io.on('connection', function(socket){

    let user = socket.request.session.user;

    if(user){
        socket.on('updateSubkonto', function(data){

            let recipient;

            if(data.user_id){
                recipient = data.user_id;
            } else if( data.recipient_username ){
                recipient = data.recipient_username;
            }

            socket.broadcast.emit('updateSubkontoFromServer', {
                recipient: recipient,
                value: data.value
            });
        });
    }
});


module.exports = server;

reload(app);