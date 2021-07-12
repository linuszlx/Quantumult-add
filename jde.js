var body = $response.body;
var obj = JSON.parse(body);
delete obj.result.modeMap.dark.navigationAll.4;
delete obj.result.modeMap.normal.navigationAll.4;
$done({body: JSON.stringify(obj)});
