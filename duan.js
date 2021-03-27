var body = $response.body;
var obj = JSON.parse(body);

obj.access.profile = {
    "is_member" : true,
    "is_premium" : true,
    "nickname" : "linusZ",
    "custom_font" : true,
    "end_member_date" :"2099-01-01",
    "end_premium_date" :"2099-01-01",
    "language" : "zh-hans",
    "coin" : "0.0",
    "invite_max" : 0,
    "default_font_size" : "normal",
    "current_period_end" : null
  };
$done({body: JSON.stringify(obj)});
