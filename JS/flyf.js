var body = $response.body;
var obj = JSON.parse(body);
    if (body['Variables'].hasOwnProperty('data')){
      if (body['Variables']['data'].hasOwnProperty('adv')){
        delete body['Variables']['data']['adv'];
      }
$done({body: JSON.stringify(obj)});
