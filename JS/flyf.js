var body = $response.body;
var obj = JSON.parse(body);
delete obj.Variables.data.data;
delete obj.Variables.data.home_popup_all;
obj.Variables.msg = "暂无广告";
$done({body: JSON.stringify(obj)});
