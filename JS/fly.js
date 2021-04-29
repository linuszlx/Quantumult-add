var body = $response.body;
var obj = JSON.parse(body);
delete obj.['bottomadv'];
delete obj.Variables.data.middleadv;
$done({body: JSON.stringify(obj)});
