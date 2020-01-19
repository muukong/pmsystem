const express =  require('express');
const cors = require('cors');
const session =  require('express-session') ;
var mongoose = require('mongoose');

const app = express();
const PORT = 8080;

/*
 * Mongoose Schemata
 */

var userSchema = new mongoose.Schema({
    username: String,
    password: String
});
var User = mongoose.model('User', userSchema);

var messageSchema = new mongoose.Schema({
    sender: String,
    recipient: String,
    subject: String,
    message: String
});
var Message = mongoose.model('Message', messageSchema);

var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/pm_system');
mongoose.connect('mongodb://mongodb:27017/pm_system');
var db = mongoose.connection;
//db.on('error', console.error.bind(console, 'DB connection error:'));
db.once('open', function() {
    console.log('[*] We are connected to the database!');
});

/*
 * CORS origin reflection and allow credentials vulnerability
 */
var corsOptions = {
    origin: function (origin, callback) {
        callback(null, true)
    },
    credentials: true
}

/*
 * Application setup
 */

app.set('view engine', 'ejs');
app.use(session({ 
    'secret' : 'foo',
    resave: false, 
    saveUninitialized: false,
    cookie: {
        path: '/',
        httponly: true
    }
}));
app.use(express.urlencoded());
app.use(cors(corsOptions));
app.use('/scripts', express.static(__dirname + '/scripts'));


/*
 * Helpers
 */

function checkUserAuthenticated(req, res, next) {
    if ( req.session.authenticated ) {
        console.log('[*] User authenticated');
        next();
    } else {
        console.log('[*] User is not authenticated');
        res.redirect('/', 302);
    }
}

/*
 * Application routes
 */

app.get('/', (req, res) => { 
    res.render('pages/index', {
        authenticated: req.session.authenticated,
        username: req.session.username
    });
});

app.get('/login', (req, res) => {
    if ( req.session.authenticated ) {
        res.redirect(302, '/');
    }

    res.render('pages/login', {
        authenticated: req.session.authenticated,
        loginFail: false
    });
});

app.post('/login', (req, res) => {

    if ( req.session.authenticated ) {
        res.redirect(302, '/');
    }

    User.findOne({ 'username': req.body.username, 'password': req.body.password}, function(err, usr) {
        if ( err ) throw err;
        if ( usr ) {
            req.session.authenticated = true;
            req.session.username = usr.username;
            res.redirect('/');        
        } else {
            res.render('pages/login', {
                authenticated: req.session.authenticated,
                loginFail: true
            });
        }
    });
});

/*
app.post('/login', (req, res) => {

    if ( req.session.authenticated ) {
        res.redirect(302, '/');
    }

    User.findOne({ 'username': {$in: [req.body.username]}, 'password': {$in: [req.body.password]} },
                 function(err, usr) {
        if ( err ) {
            console.error('[!] Invalid username or password parameter');
        }
        if ( usr ) {
            req.session.authenticated = true;
            req.session.username = usr.username;
            res.redirect('/');        
        } else {
            res.render('pages/login', {
                authenticated: req.session.authenticated,
                loginFail: true
            });
        }
    });
});
*/

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect(302, '/');
});

app.get('/register', function(req, res) {

    if ( req.session.authenticated ) {
        res.redirect(302, '/');
    }

    res.render('pages/register', {
        authenticated: req.session.authenticated,
        registrationFailed: false,
        errorMessage: ''
    });
});

app.post('/register', function(req, res) {
    User.findOne({ 'username': req.body.username }, function(err, usr) {
        if ( err ) throw err;
        if ( usr ) {
            res.render('pages/register', {
                authenticated: req.session.authenticated,
                registrationFailed: true,
                errorMessage: 'User already exists.'
            });
        } else {
            var user = new User({ username: req.body.username, password: req.body.password});
            user.save(function(err, user) {
                if ( err ) throw err;
            });
            res.redirect(302, '/login');
        } 
    });

});

app.get('/send', checkUserAuthenticated, function(req, res) {
    res.render('pages/send', {
        authenticated: req.session.authenticated,
        sendError: false,
        sendErrorMessage: ''
    });
});

app.post('/send', checkUserAuthenticated, function(req, res) {

    User.findOne({ 'username': req.body.recipient }, function(err, result) {
        if ( err ) throw err;
        if ( result ) {
            const message = new Message({
                sender: req.session.username,
                recipient: req.body.recipient,
                subject: req.body.subject,
                message: req.body.message
            });
            message.save(function(err, msg) {
                if ( err ) throw err;
            });
            res.redirect(302, '/send');
        } else {
            console.log('Invalid Recipient'); 
            res.redirect(302, '/send');
        }
    });

});

app.get('/inbox', checkUserAuthenticated, function(req, res) {

    Message.find({ 'recipient': req.session.username}, function(err, result) {
        if ( err ) throw err;

        res.render('pages/inbox', {
            authenticated: req.session.authenticated,
            messages: result
        }); 
    });
});

app.post('/delete', checkUserAuthenticated, function(req, res) {

    console.log('[*] Hit /delete endpoint');
    const id = req.body.messageId;
    console.log(id);
    Message.findOne({ '_id': id}, function(err, result) {
        if ( err ) throw err;
        if ( result ) {
            console.log('deleting message...');
            Message.deleteOne({ '_id': id}, function(err, result) {
                if ( err ) throw err;
                console.log(result);
            });
        };
    });

    res.redirect('/inbox', 302);
});

var server = app.listen(PORT, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('PM System app listening at http://%s:%s', host, port);
});




