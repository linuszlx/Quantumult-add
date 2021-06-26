var body = $response.body.replace('"watch_type" : 2', '"watch_type" : 1')

$done({ body });
