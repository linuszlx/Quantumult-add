var body = $response.body;
var obj = JSON.parse(body);
delete obj.Variables.data. .adv;
$done({body: JSON.stringify(obj)});
