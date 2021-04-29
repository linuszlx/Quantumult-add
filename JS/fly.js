var body = $response.body;
var obj = JSON.parse(body);
delete obj.Variables.bottomadv;
delete obj.Variables.middleadv;
$done({body: JSON.stringify(obj)});
