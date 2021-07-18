var body = $response.body;
var obj = JSON.parse(body);
obj.images = [

  ];
obj.countdown = 100;
obj.showTimesDaily  = 0;
$done({body: JSON.stringify(obj)});
