  
var body = $response.body;
var obj = JSON.parse(body);
delete obj.data;
$done({body: JSON.stringify(obj)});
