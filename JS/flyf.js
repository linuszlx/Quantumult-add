var body = $response.body;
var obj = JSON.parse(body);
    if (body['data'].hasOwnProperty('Variables')){
      if (body['data']['Variables'].hasOwnProperty('data')){
         if (body['data']['Variables']['data'].hasOwnProperty('adv')){
        delete body['data']['Variables']['data']['adv'];
      }
$done({body: JSON.stringify(obj)});
