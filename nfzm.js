var body = $response.body;
var obj = JSON.parse(body);

obj.data.expire_time = null;
obj.data.member_type =  5;
body = JSON.stringify(obj);
$done({body});
