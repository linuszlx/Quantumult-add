/*
by Primovist

Surge:

[Script]
http-response ^https?:\/\/(i|newdrugs)\.dxy\.cn\/(snsapi\/username\/|app\/user\/(pro\/stat|init)) requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/linuszlx/Quantumult-add/master/JS/yyzs.js

[MITM]
hostname = newdrugs.dxy.cn
*/

const path1 = "/snsapi/username/";
const path2 = "/app/user/pro/stat";
const path3 = "/app/user/init";

const url = $request.url;
let body = $response.body;

if (url.indexOf(path1) != -1){
body = JSON.parse(body);
body.items.expertUser = true;
body.items.expert = true;
body.items.expertStatus = 1;
body.items.professional = true;
body = JSON.stringify(body);
}

if (url.indexOf(path2) != -1){
body = JSON.parse(body);
body.data.userProStatStatusEnum = "VALID";
body.data.expireDate = "2025-06-07 09:39:31"; 
body.data.userProInfoVO.userProStatStatusEnum="VALID";
body.data.userProInfoVO.expiredTime="2025-06-07 09:39:31";
body.data.userProInfoVO.subscribe=false;
body.data.userProInfoVO.expiredDay=1470;
body.data.userProInfoVO.androidWithhold=false;  
body.data.userProInfoVO.upgradeSvipCount=0;  
body.data.userProInfoVO.activeType=1; 
  
  
  
body = JSON.stringify(body);
}

if (url.indexOf(path3) != -1){
body = JSON.parse(body);
body.data.userProInfoVO.userProStatStatusEnum = "VALID";
body.data.userProInfoVO.expiredTime = 1623029971000;
body.data.userProInfoVO.activeType = 1;
body.data.isProActive = true;
body.data.expireDate= 2025-06-07 09:39:31;
body = JSON.stringify(body);
}

$done({body})
