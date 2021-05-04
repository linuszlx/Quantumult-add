  
var body = $response.body;
var obj = JSON.parse(body);
obj.data= "{\"date\":\"2021-05-04 22:48:27\",\"result\":\"操作成功\",\"stat\":\"00\"}";
$done({body: JSON.stringify(obj)});
