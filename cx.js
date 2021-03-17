var body = $response.body.replace('var isPay = document', 'var isPay = 1;  #').replace('var articleProperties', 'var articleProperties2').replace('isFree\":\\d', 'isFree\":0').replace('aType\":\\d', 'aType\":0').replace('feeType\":\\d', 'feeType\":0')

$done({ body });
