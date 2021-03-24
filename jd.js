var body = $response.body;
var obj = JSON.parse(body);
obj.images = [
    [
      {
        "showTimes" : 0,
        "onlineTime" : "2021-03-15 00:00:00",
        "referralsTime" : "2022-03-16 00:00:00",
        "ynSkip" : 1,
        "url" : "",
        "time" : 0,
        "type" : 0,
        "sourceValueJson" : "",
        "tag" : 0,
        "jump" : {
          "srv" : ,
          "shareInfo" : {
            "avatar" : ""
          },
          "des" : "m",
          "params" : {
            "needLogin" : "0",
            "url" : ""
          }
        },
        "miniConflict" : 0,
        "groupId" : 9657,
        "sequence" : 1,
        "sourceValue" : ""
      }
    ]
  ];
body = JSON.stringify(obj);
$done({body});
