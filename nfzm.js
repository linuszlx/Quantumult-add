var body = $response.body;
var obj = JSON.parse(body);

obj.expire_time =  2023-11-11;
obj.member_type =  5;
body = JSON.stringify(obj);
$done({body});
