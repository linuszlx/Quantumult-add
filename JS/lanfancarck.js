var body = $response.body;
var obj = JSON.parse(body);

obj.content.stories.watch_type = 2;
body = JSON.stringify(obj);
$done({body});
