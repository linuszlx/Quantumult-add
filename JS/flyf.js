var body = $response.body;
var obj = JSON.parse(body);
delete obj.Variables.data.data;
obj.Variables.msg = "暂无广告";
$done({body: JSON.stringify(obj)});
