var body = $response.body;
var obj = JSON.parse(body);
obj.showTime = 0;
obj.Time = 0;
body = JSON.stringfy(obj);
$done({ body });
