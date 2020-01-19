
function deleteMessage(messageId) {

    var http = new XMLHttpRequest();
    var url = 'delete';
    var params = 'messageId=' + messageId;
    http.open('POST', url, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = function() {
        location.reload();
    };
    http.send(params);
}
    

