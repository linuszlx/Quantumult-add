var body = $response.body;
var obj = JSON.parse(body);
delete obj.Variables.data.threaddetail.bottomadv;
delete obj.Variables.data.threaddetail.middleadv;
$done({body: JSON.stringify(obj)});
