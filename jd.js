var body = $response.body;
var obj = JSON.parse(body);
delete obj.images;
$done({body: JSON.stringify(obj)});
