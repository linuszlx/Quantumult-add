  
var body = $response.body;
var obj = JSON.parse(body);
delete obj.data.body;
$done({body: JSON.stringify(obj)});
