var body = $response.body;
var obj = JSON.parse(body);
delete obj.Variables.data.threaddetail.tagadv;
delete obj.Variables.data.threaddetail.bottomadv;
delete obj.Variables.data.threaddetail.middleadv;
delete obj.Variables.data.threaddetail.pingyouadv;
$done({body: JSON.stringify(obj)});
