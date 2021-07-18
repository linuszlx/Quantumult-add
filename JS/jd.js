var body = $response.body;
var obj = JSON.parse(body);
obj.images = [];
obj.showTimesDaily  = 0;
$done({body: JSON.stringify(obj)});
