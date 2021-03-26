var body = $response.body;
var obj = JSON.parse(body);
obj.images.showTimes=0;
obj.images.time=0;
obj.images.url= "";
body = JSON.stringify(obj);
$done({body});
