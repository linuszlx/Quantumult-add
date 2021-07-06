var body = $response.body;
var obj = JSON.parse(body);
delete obj.Variables.data;
$done({body: JSON.stringify(obj)});
