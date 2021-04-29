var body = $response.body;
var obj = JSON.parse(body);
delete obj.bottomadv;
delete obj.middleadv;
$done({body: JSON.stringify(obj)});
