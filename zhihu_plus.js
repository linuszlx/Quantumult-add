const scriptName = "知乎助手";
const blockedUsersKey = "zhihu_blocked_users";
const currentUserInfoKey = "zhihu_current_userinfo";
const keywordBlockKey = "zhihu_keyword_block";
// 默认屏蔽推荐列表的用户，通常不是真实用户，无法通过加入黑名单屏蔽
const defaultAnswerBlockedUsers = ["会员推荐"];
const keywordMaxCount = 10; // 允许设置的关键词数量
let magicJS = MagicJS(scriptName, "INFO");

(() => {
  let response = null;
  if (magicJS.isResponse) {
    switch (true) {
      // 回答列表去广告与黑名单增强
      case /^https?:\/\/api\.zhihu\.com\/v4\/questions/.test(magicJS.request.url):
        try {
          let userInfo = GetUserInfo();
          let customBlockedUsers = magicJS.read(blockedUsersKey, userInfo.id);
          customBlockedUsers = !!customBlockedUsers ? customBlockedUsers : {};
          let obj = JSON.parse(magicJS.response.body);
          magicJS.logDebug(`当前黑名单列表: ${JSON.stringify(customBlockedUsers)}`);
          delete obj["ad_info"];
          delete obj["roundtable_info"];
          let data = obj["data"].filter((element) => {
            return !customBlockedUsers[element["author"]["name"]];
          });
          obj["data"] = data;
          response = { body: JSON.stringify(obj) };
        } catch (err) {
          magicJS.logError(`知乎回答列表去广告出现异常：${err}`);
        }
        break;
      // 拦截官方账号推广消息
      case /^https?:\/\/api\.zhihu\.com\/notifications\/v3\/timeline\/entry\/system_message/.test(magicJS.request.url):
        try {
          const sysmsg_blacklist = ["知乎小伙伴", "知乎视频", "知乎团队", "知乎礼券", "知乎读书会团队"];
          let obj = JSON.parse(magicJS.response.body);
          let data = obj["data"].filter((element) => {
            return sysmsg_blacklist.indexOf(element["content"]["title"]) < 0;
          });
          obj["data"] = data;
          response = { body: JSON.stringify(obj) };
        } catch (err) {
          magicJS.logError(`知乎拦截官方账号推广消息出现异常：${err}`);
        }
        break;
      // 屏蔽官方营销消息
      case /^https?:\/\/api\.zhihu\.com\/notifications\/v3\/message/.test(magicJS.request.url):
        try {
          let obj = JSON.parse(magicJS.response.body);
          let newItems = [];
          for (let item of obj["data"]) {
            if (item["detail_title"] === "官方帐号消息") {
              let unread_count = item["unread_count"];
              if (unread_count > 0) {
                item["content"]["text"] = "未读消息" + unread_count + "条";
              } else {
                item["content"]["text"] = "全部消息已读";
              }
              item["is_read"] = true;
              item["unread_count"] = 0;
              newItems.push(item);
            } else if (item["detail_title"] !== "知乎活动助手") {
              newItems.push(item);
            }
          }
          obj["data"] = newItems;
          response = { body: JSON.stringify(obj) };
        } catch (err) {
          magicJS.logError(`知乎屏蔽官方营销消息出现异常：${err}`);
        }
        break;
      // 去除预置关键字广告
      case /^https?:\/\/api\.zhihu\.com\/search\/preset_words\?/.test(magicJS.request.url):
        try {
          if (!!magicJS.response.body) {
            magicJS.logDebug(`预置关键字返回：${magicJS.response.body}`);
            let obj = JSON.parse(magicJS.response.body);
            if (obj.hasOwnProperty("preset_words") && obj["preset_words"]["words"]) {
              let words = obj["preset_words"]["words"].filter((element) => {
                return element["type"] !== "ad";
              });
              obj["preset_words"]["words"] = words;
              response = { body: JSON.stringify(obj) };
            }
          }
        } catch (err) {
          magicJS.logError(`知乎去除预置关键字广告出现异常：${err}`);
        }
        break;
      // 优化知乎软件配置
      case /^https?:\/\/appcloud2\.zhihu\.com\/v\d+\/config/.test(magicJS.request.url):
        try {
          if (!!magicJS.response.body) {
            let obj = JSON.parse(magicJS.response.body);
            let tab_infos = obj["config"]["homepage_feed_tab"]["tab_infos"].filter((e) => {
              if (e.tab_type === "activity_tab") {
                e.end_time = (Date.parse(new Date()) - 120000).toString().substr(0, 10);
                return true;
              } else {
                return false;
              }
            });
            obj["config"]["homepage_feed_tab"]["tab_infos"] = tab_infos;
            obj["config"]["zvideo_max_number"] = 1;
            response = { body: JSON.stringify(obj) };
          }
        } catch (err) {
          magicJS.logError(`优化知乎软件配置出现异常：${err}`);
        }
        break;
      // 知乎热搜去广告
      case /^https?:\/\/api\.zhihu\.com\/search\/top_search\/tabs\/hot\/items/.test(magicJS.request.url):
        try {
          if (!!magicJS.response.body) {
            let obj = JSON.parse(magicJS.response.body);
            obj["commercial_data"] = [];
            response = { body: JSON.stringify(obj) };
          }
        } catch (err) {
          magicJS.logError(`去除知乎热搜广告出现异常：${err}`);
        }
        break;
      // 知乎热榜去广告
      case /^https?:\/\/api\.zhihu\.com\/topstory\/hot-lists?(\?|\/)/.test(magicJS.request.url):
        try {
          if (!!magicJS.response.body) {
            let obj = JSON.parse(magicJS.response.body);
            let data = obj["data"].filter((e) => {
              return e["type"] === "hot_list_feed" || e["type"] === "hot_list_feed_video";
            });
            obj["data"] = data;
            response = { body: JSON.stringify(obj) };
          }
        } catch (err) {
          magicJS.logError(`去除知乎热搜广告出现异常：${err}`);
        }
        break;
      // 知乎V5版本评论去广告及黑名单增强
      case /^https?:\/\/api\.zhihu\.com\/comment_v5\/(answers|pins|comments?|articles)\/\d+\/(root|child)_comment/.test(magicJS.request.url):
        try {
          if (!!magicJS.response.body) {
            let obj = JSON.parse(magicJS.response.body);
            obj["ad_info"] = {};
            // 屏蔽黑名单用户
            let user_info = GetUserInfo();
            let customBlockedUsers = magicJS.read(blockedUsersKey, user_info.id);
            customBlockedUsers = !!customBlockedUsers ? customBlockedUsers : {};
            let newComments = [];
            let blockCommentIdObj = {};
            obj.data.forEach((comment) => {
              // 评论人昵称
              let commentUserName = comment.author.name;
              // 回复哪个人的评论(仅适用于独立子评论页面请求)
              let replyUserName = "";
              if (comment.reply_to_author && comment.reply_to_author && comment.reply_to_author.name) {
                replyUserName = comment.reply_to_author.name;
              }
              if (customBlockedUsers[commentUserName] || customBlockedUsers[replyUserName]) {
                if (customBlockedUsers[commentUserName] && !replyUserName && magicJS.request.url.indexOf("root_comment") > 0) {
                  magicJS.notifyDebug(`屏蔽黑名单用户“${commentUserName}”的主评论。`);
                } else if (customBlockedUsers[commentUserName] && !replyUserName && magicJS.request.url.indexOf("child_comment") > 0) {
                  magicJS.notifyDebug(`屏蔽黑名单用户“${commentUserName}”的子评论。`);
                } else if (customBlockedUsers[commentUserName] && replyUserName && magicJS.request.url.indexOf("child_comment") > 0) {
                  magicJS.notifyDebug(`屏蔽黑名单用户“${commentUserName}”回复“${replyUserName}”的子评论。`);
                } else {
                  magicJS.notifyDebug(`屏蔽“${commentUserName}”回复黑名单用户“${replyUserName}”的子评论。`);
                }
                blockCommentIdObj[comment.id] = commentUserName;
                // 主评论数量-1，仅适用于root_comment主评论页面请求
                if (obj.counts && obj.counts.total_counts) {
                  obj.counts.total_counts -= 1;
                }
                // 子评论数量-1，仅适用于child_comment子评论页面请求
                if (obj.paging && obj.paging.totals) {
                  obj.paging.totals -= 1;
                }
                if (obj.root && obj.root.child_comment_count) {
                  obj.root.child_comment_count -= 1;
                }
              } else {
                if (comment.child_comments) {
                  let newChildComments = [];
                  comment.child_comments.forEach((childComment) => {
                    let childCommentUserName = childComment.author.name;
                    if (customBlockedUsers[childCommentUserName] || blockCommentIdObj[childComment.reply_comment_id]) {
                      if (customBlockedUsers[childCommentUserName]) {
                        magicJS.notifyDebug(`屏蔽黑名单用户“${childCommentUserName}”的子评论。`);
                        blockCommentIdObj[childComment.id] = childCommentUserName;
                      } else {
                        magicJS.notifyDebug(`屏蔽“${childCommentUserName}”回复黑名单用户“${blockCommentIdObj[childComment.reply_comment_id]}”的子评论。`);
                      }
                      comment.child_comment_count -= 1;
                    } else {
                      newChildComments.push(childComment);
                    }
                  });
                  comment.child_comments = newChildComments;
                }
                newComments.push(comment);
              }
            });
            obj.data = newComments;
            response = { body: JSON.stringify(obj) };
          }
        } catch (err) {
          magicJS.logError(`去除知乎评论广告出现异常：${err}`);
        }
        break;
    }
  } else if (magicJS.isRequest) {
    // 知乎屏蔽关键词解锁
    if (/^https?:\/\/api\.zhihu\.com\/feed-root\/block/.test(magicJS.request.url) === true) {
      try {
        let userInfo = GetUserInfo();
        // 获取屏蔽关键词列表
        if (magicJS.request.method === "GET" && userInfo.is_vip !== true) {
          let keywords = magicJS.read(keywordBlockKey, userInfo.id);
          if (!keywords) {
            keywords = [];
          }
          let headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
            "Connection": "keep-alive",
            "Content-Type": "application/json;charset=utf-8",
            "Pragma": "no-cache",
            "Referrer-Policy": "no-referrer-when-downgrade",
            "Server": "CLOUD ELB 1.0.0",
            "Vary": "Accept-Encoding",
            "X-Cache-Lookup": "Cache Miss",
            "x-cdn-provider": "tencent",
          };
          let body = JSON.stringify({
            success: true,
            is_vip: true,
            kw_min_length: 2,
            kw_max_length: 15,
            kw_max_count: keywordMaxCount,
            data: keywords,
          });
          if (magicJS.isQuanX) {
            response = { body: body, headers: headers, status: "HTTP/1.1 200 OK" };
          } else {
            response = { response: { body: body, headers: headers, status: 200 } };
          }
          magicJS.logDebug(`获取屏蔽关键词：${keywords.join("、")}`);
        }
        // 添加屏蔽关键词
        else if (magicJS.request.method === "POST" && userInfo.is_vip !== true) {
          if (!!magicJS.request.body) {
            // 构造 response headers
            let headers = {
              "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
              "Connection": "keep-alive",
              "Content-Type": "application/json;charset=utf-8",
              "Pragma": "no-cache",
              "Referrer-Policy": "no-referrer-when-downgrade",
              "Server": "CLOUD ELB 1.0.0",
              "Vary": "Accept-Encoding",
              "X-Cache-Lookup": "Cache Miss",
              "x-cdn-provider": "tencent",
            };
            // 读取关键词
            let keyword = decodeURIComponent(magicJS.request.body).match(/keyword=(.*)/)[1];
            let keywords = magicJS.read(keywordBlockKey, userInfo.id);
            if (!keywords) {
              keywords = [];
            }
            // 判断关键词是否存在
            let keywordExists = false;
            for (let i = 0; i < keywords.length; i++) {
              if (keyword === keywords[i]) {
                keywordExists = true;
              }
            }
            // 不存在添加，存在返回异常
            if (keywordExists === false) {
              keywords.push(keyword);
              magicJS.write(keywordBlockKey, keywords, userInfo.id);
              let body = JSON.stringify({ success: true });
              if (magicJS.isQuanX) {
                response = { body: body, headers: headers, status: "HTTP/1.1 200 OK" };
              } else {
                response = { response: { body: body, headers: headers, status: 200 } };
              }
              magicJS.logInfo(`使用本地脚本添加关键词：${keyword}`);
            } else {
              let body = JSON.stringify({
                error: {
                  message: "关键词已存在",
                  code: 100002,
                },
              });
              if (magicJS.isQuanX) {
                response = {
                  body: body,
                  headers: headers,
                  status: "HTTP/1.1 400 Bad Request",
                };
              } else {
                response = { response: { body: body, headers: headers, status: 400 } };
              }
            }
          }
        }
        // 删除屏蔽关键词
        else if (magicJS.request.method === "DELETE" && userInfo.is_vip !== true) {
          let keyword = decodeURIComponent(magicJS.request.url).match(/keyword=(.*)/)[1];
          let keywords = magicJS.read(keywordBlockKey, userInfo.id);
          if (!keywords) {
            keywords = [];
          }
          keywords = keywords.filter((e) => {
            return e != keyword;
          });
          magicJS.write(keywordBlockKey, keywords, userInfo.id);
          let headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
            "Connection": "keep-alive",
            "Content-Type": "application/json;charset=utf-8",
            "Pragma": "no-cache",
            "Referrer-Policy": "no-referrer-when-downgrade",
            "Server": "CLOUD ELB 1.0.0",
            "Vary": "Accept-Encoding",
            "X-Cache-Lookup": "Cache Miss",
            "x-cdn-provider": "tencent",
          };
          let body = JSON.stringify({ success: true });
          if (magicJS.isQuanX) {
            response = { body: body, headers: headers, status: "HTTP/1.1 200 OK" };
          } else {
            response = { response: { body: body, headers: headers, status: 200 } };
          }
          magicJS.logInfo(`使用本地脚本删除关键词：${keyword}`);
        }
      } catch (err) {
        magicJS.logError(`知乎关键词屏蔽操作出现异常：${err}`);
      }
    }
  } else {
    magicJS.write(currentUserInfoKey, "");
    magicJS.write(blockedUsersKey, "");
    magicJS.write(keywordBlockKey, "");
    magicJS.notify("知乎助手数据清理完毕");
  }
  if (response) {
    magicJS.done(response);
  } else {
    magicJS.done();
  }
})();

function GetUserInfo() {
  let defaultUserInfo = { id: "default", is_vip: false };
  try {
    let userInfo = magicJS.read(currentUserInfoKey);
    if (typeof userInfo === "string") userInfo = JSON.parse(userInfo);
    if (!!userInfo && userInfo.hasOwnProperty("id")) {
      return userInfo;
    } else {
      return defaultUserInfo;
    }
  } catch (err) {
    magicJS.logError(`获取用户信息出现异常：${err}`);
    return defaultUserInfo;
  }
}

// prettier-ignore
function MagicJS(scriptName="MagicJS",logLevel="INFO"){return new class{constructor(){if(this.version="2.2.3.3",this.scriptName=scriptName,this.logLevels={DEBUG:5,INFO:4,NOTIFY:3,WARNING:2,ERROR:1,CRITICAL:0,NONE:-1},this.isLoon="undefined"!=typeof $loon,this.isQuanX="undefined"!=typeof $task,this.isJSBox="undefined"!=typeof $drive,this.isNode="undefined"!=typeof module&&!this.isJSBox,this.isSurge="undefined"!=typeof $httpClient&&!this.isLoon,this.node={request:void 0,fs:void 0,data:{}},this.iOSUserAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.5 Mobile/15E148 Safari/604.1",this.pcUserAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36 Edg/84.0.522.59",this.logLevel=logLevel,this._barkUrl="",this.isNode){this.node.fs=require("fs"),this.node.request=require("request");try{this.node.fs.accessSync("./magic.json",this.node.fs.constants.R_OK|this.node.fs.constants.W_OK)}catch(err){this.node.fs.writeFileSync("./magic.json","{}",{encoding:"utf8"})}this.node.data=require("./magic.json")}else this.isJSBox&&($file.exists("drive://MagicJS")||$file.mkdir("drive://MagicJS"),$file.exists("drive://MagicJS/magic.json")||$file.write({data:$data({string:"{}"}),path:"drive://MagicJS/magic.json"}))}set barkUrl(url){this._barkUrl=url.replace(/\/+$/g,"")}set logLevel(level){this._logLevel="string"==typeof level?level.toUpperCase():"DEBUG"}get logLevel(){return this._logLevel}get isRequest(){return"undefined"!=typeof $request&&"undefined"==typeof $response}get isResponse(){return"undefined"!=typeof $response}get request(){return"undefined"!=typeof $request?$request:void 0}get response(){return"undefined"!=typeof $response?($response.hasOwnProperty("status")&&($response.statusCode=$response.status),$response.hasOwnProperty("statusCode")&&($response.status=$response.statusCode),$response):void 0}get platform(){return this.isSurge?"Surge":this.isQuanX?"Quantumult X":this.isLoon?"Loon":this.isJSBox?"JSBox":this.isNode?"Node.js":"Unknown"}read(key,session=""){let val="";this.isSurge||this.isLoon?val=$persistentStore.read(key):this.isQuanX?val=$prefs.valueForKey(key):this.isNode?val=this.node.data:this.isJSBox&&(val=$file.read("drive://MagicJS/magic.json").string);try{this.isNode&&(val=val[key]),this.isJSBox&&(val=JSON.parse(val)[key]),session&&("string"==typeof val&&(val=JSON.parse(val)),val=val&&"object"==typeof val?val[session]:null)}catch(err){this.logError(err),val=session?{}:null,this.del(key)}void 0===val&&(val=null);try{val&&"string"==typeof val&&(val=JSON.parse(val))}catch(err){}return this.logDebug(`READ DATA [${key}]${session?`[${session}]`:""}(${typeof val})\n${JSON.stringify(val)}`),val}write(key,val,session=""){let data=session?{}:"";if(session&&(this.isSurge||this.isLoon)?data=$persistentStore.read(key):session&&this.isQuanX?data=$prefs.valueForKey(key):this.isNode?data=this.node.data:this.isJSBox&&(data=JSON.parse($file.read("drive://MagicJS/magic.json").string)),session){try{"string"==typeof data&&(data=JSON.parse(data)),data="object"==typeof data&&data?data:{}}catch(err){this.logError(err),this.del(key),data={}}this.isJSBox||this.isNode?(data[key]&&"object"==typeof data[key]||(data[key]={}),data[key].hasOwnProperty(session)||(data[key][session]=null),void 0===val?delete data[key][session]:data[key][session]=val):void 0===val?delete data[session]:data[session]=val}else this.isNode||this.isJSBox?void 0===val?delete data[key]:data[key]=val:data=void 0===val?null:val;"object"==typeof data&&(data=JSON.stringify(data)),this.isSurge||this.isLoon?$persistentStore.write(data,key):this.isQuanX?$prefs.setValueForKey(data,key):this.isNode?this.node.fs.writeFileSync("./magic.json",data):this.isJSBox&&$file.write({data:$data({string:data}),path:"drive://MagicJS/magic.json"}),this.logDebug(`WRITE DATA [${key}]${session?`[${session}]`:""}(${typeof val})\n${JSON.stringify(val)}`)}del(key,session=""){this.logDebug(`DELETE KEY [${key}]${session?`[${session}]`:""}`),this.write(key,null,session)}notify(title=this.scriptName,subTitle="",body="",opts=""){let convertOptions;if(opts=(_opts=>{let newOpts={};return"string"==typeof _opts?this.isLoon?newOpts={openUrl:_opts}:this.isQuanX&&(newOpts={"open-url":_opts}):"object"==typeof _opts&&(this.isLoon?(newOpts.openUrl=_opts["open-url"]?_opts["open-url"]:"",newOpts.mediaUrl=_opts["media-url"]?_opts["media-url"]:""):this.isQuanX&&(newOpts=_opts["open-url"]||_opts["media-url"]?_opts:{})),newOpts})(opts),1==arguments.length&&(title=this.scriptName,subTitle="",body=arguments[0]),this.logNotify(`title:${title}\nsubTitle:${subTitle}\nbody:${body}\noptions:${"object"==typeof opts?JSON.stringify(opts):opts}`),this.isSurge)$notification.post(title,subTitle,body);else if(this.isLoon)opts?$notification.post(title,subTitle,body,opts):$notification.post(title,subTitle,body);else if(this.isQuanX)$notify(title,subTitle,body,opts);else if(this.isNode){if(this._barkUrl){let content=encodeURI(`${title}/${subTitle}\n${body}`);this.get(`${this._barkUrl}/${content}`,()=>{})}}else if(this.isJSBox){let push={title:title,body:subTitle?`${subTitle}\n${body}`:body};$push.schedule(push)}}notifyDebug(title=this.scriptName,subTitle="",body="",opts=""){"DEBUG"===this.logLevel&&(1==arguments.length&&(title=this.scriptName,subTitle="",body=arguments[0]),this.notify(title=title,subTitle=subTitle,body=body,opts=opts))}log(msg,level="INFO"){this.logLevels[this._logLevel]<this.logLevels[level.toUpperCase()]||console.log(`[${level}] [${this.scriptName}]\n${msg}\n`)}logDebug(msg){this.log(msg,"DEBUG")}logInfo(msg){this.log(msg,"INFO")}logNotify(msg){this.log(msg,"NOTIFY")}logWarning(msg){this.log(msg,"WARNING")}logError(msg){this.log(msg,"ERROR")}logRetry(msg){this.log(msg,"RETRY")}adapterHttpOptions(options,method){let _options="object"==typeof options?Object.assign({},options):{url:options,headers:{}};_options.hasOwnProperty("header")&&!_options.hasOwnProperty("headers")&&(_options.headers=_options.header,delete _options.header);const headersMap={accept:"Accept","accept-ch":"Accept-CH","accept-charset":"Accept-Charset","accept-features":"Accept-Features","accept-encoding":"Accept-Encoding","accept-language":"Accept-Language","accept-ranges":"Accept-Ranges","access-control-allow-credentials":"Access-Control-Allow-Credentials","access-control-allow-origin":"Access-Control-Allow-Origin","access-control-allow-methods":"Access-Control-Allow-Methods","access-control-allow-headers":"Access-Control-Allow-Headers","access-control-max-age":"Access-Control-Max-Age","access-control-expose-headers":"Access-Control-Expose-Headers","access-control-request-method":"Access-Control-Request-Method","access-control-request-headers":"Access-Control-Request-Headers",age:"Age",allow:"Allow",alternates:"Alternates",authorization:"Authorization","cache-control":"Cache-Control",connection:"Connection","content-encoding":"Content-Encoding","content-language":"Content-Language","content-length":"Content-Length","content-location":"Content-Location","content-md5":"Content-MD5","content-range":"Content-Range","content-security-policy":"Content-Security-Policy","content-type":"Content-Type",cookie:"Cookie",dnt:"DNT",date:"Date",etag:"ETag",expect:"Expect",expires:"Expires",from:"From",host:"Host","if-match":"If-Match","if-modified-since":"If-Modified-Since","if-none-match":"If-None-Match","if-range":"If-Range","if-unmodified-since":"If-Unmodified-Since","last-event-id":"Last-Event-ID","last-modified":"Last-Modified",link:"Link",location:"Location","max-forwards":"Max-Forwards",negotiate:"Negotiate",origin:"Origin",pragma:"Pragma","proxy-authenticate":"Proxy-Authenticate","proxy-authorization":"Proxy-Authorization",range:"Range",referer:"Referer","retry-after":"Retry-After","sec-websocket-extensions":"Sec-Websocket-Extensions","sec-websocket-key":"Sec-Websocket-Key","sec-websocket-origin":"Sec-Websocket-Origin","sec-websocket-protocol":"Sec-Websocket-Protocol","sec-websocket-version":"Sec-Websocket-Version",server:"Server","set-cookie":"Set-Cookie","set-cookie2":"Set-Cookie2","strict-transport-security":"Strict-Transport-Security",tcn:"TCN",te:"TE",trailer:"Trailer","transfer-encoding":"Transfer-Encoding",upgrade:"Upgrade","user-agent":"User-Agent","variant-vary":"Variant-Vary",vary:"Vary",via:"Via",warning:"Warning","www-authenticate":"WWW-Authenticate","x-content-duration":"X-Content-Duration","x-content-security-policy":"X-Content-Security-Policy","x-dnsprefetch-control":"X-DNSPrefetch-Control","x-frame-options":"X-Frame-Options","x-requested-with":"X-Requested-With","x-surge-skip-scripting":"X-Surge-Skip-Scripting"};if("object"==typeof _options.headers)for(let key in _options.headers)headersMap[key]&&(_options.headers[headersMap[key]]=_options.headers[key],delete _options.headers[key]);_options.headers&&"object"==typeof _options.headers&&_options.headers["User-Agent"]||(_options.headers&&"object"==typeof _options.headers||(_options.headers={}),this.isNode?_options.headers["User-Agent"]=this.pcUserAgent:_options.headers["User-Agent"]=this.iOSUserAgent);let skipScripting=!1;if(("object"==typeof _options.opts&&(!0===_options.opts.hints||!0===_options.opts["Skip-Scripting"])||"object"==typeof _options.headers&&!0===_options.headers["X-Surge-Skip-Scripting"])&&(skipScripting=!0),skipScripting||(this.isSurge?_options.headers["X-Surge-Skip-Scripting"]=!1:this.isLoon?_options.headers["X-Requested-With"]="XMLHttpRequest":this.isQuanX&&("object"!=typeof _options.opts&&(_options.opts={}),_options.opts.hints=!1)),this.isSurge&&!skipScripting||delete _options.headers["X-Surge-Skip-Scripting"],!this.isQuanX&&_options.hasOwnProperty("opts")&&delete _options.opts,this.isQuanX&&_options.hasOwnProperty("opts")&&delete _options.opts["Skip-Scripting"],"GET"===method&&!this.isNode&&_options.body){let qs=Object.keys(_options.body).map(key=>void 0===_options.body?"":`${encodeURIComponent(key)}=${encodeURIComponent(_options.body[key])}`).join("&");_options.url.indexOf("?")<0&&(_options.url+="?"),_options.url.lastIndexOf("&")+1!=_options.url.length&&_options.url.lastIndexOf("?")+1!=_options.url.length&&(_options.url+="&"),_options.url+=qs,delete _options.body}return this.isQuanX?(_options.hasOwnProperty("body")&&"string"!=typeof _options.body&&(_options.body=JSON.stringify(_options.body)),_options.method=method):this.isNode?(delete _options.headers["Accept-Encoding"],"object"==typeof _options.body&&("GET"===method?(_options.qs=_options.body,delete _options.body):"POST"===method&&(_options.json=!0,_options.body=_options.body))):this.isJSBox&&(_options.header=_options.headers,delete _options.headers),_options}adapterHttpResponse(resp){let _resp={body:resp.body,headers:resp.headers,json:()=>JSON.parse(_resp.body)};return resp.hasOwnProperty("statusCode")&&resp.statusCode&&(_resp.status=resp.statusCode),_resp}get(options,callback){let _options=this.adapterHttpOptions(options,"GET");this.logDebug(`HTTP GET: ${JSON.stringify(_options)}`),this.isSurge||this.isLoon?$httpClient.get(_options,callback):this.isQuanX?$task.fetch(_options).then(resp=>{resp.status=resp.statusCode,callback(null,resp,resp.body)},reason=>callback(reason.error,null,null)):this.isNode?this.node.request.get(_options,(err,resp,data)=>{resp=this.adapterHttpResponse(resp),callback(err,resp,data)}):this.isJSBox&&(_options.handler=resp=>{let err=resp.error?JSON.stringify(resp.error):void 0,data="object"==typeof resp.data?JSON.stringify(resp.data):resp.data;callback(err,resp.response,data)},$http.get(_options))}getPromise(options){return new Promise((resolve,reject)=>{magicJS.get(options,(err,resp)=>{err?reject(err):resolve(resp)})})}post(options,callback){let _options=this.adapterHttpOptions(options,"POST");if(this.logDebug(`HTTP POST: ${JSON.stringify(_options)}`),this.isSurge||this.isLoon)$httpClient.post(_options,callback);else if(this.isQuanX)$task.fetch(_options).then(resp=>{resp.status=resp.statusCode,callback(null,resp,resp.body)},reason=>{callback(reason.error,null,null)});else if(this.isNode){let resp=this.node.request.post(_options,callback);resp.status=resp.statusCode,delete resp.statusCode}else this.isJSBox&&(_options.handler=resp=>{let err=resp.error?JSON.stringify(resp.error):void 0,data="object"==typeof resp.data?JSON.stringify(resp.data):resp.data;callback(err,resp.response,data)},$http.post(_options))}get http(){return{get:this.getPromise,post:this.post}}done(value={}){"undefined"!=typeof $done&&$done(value)}isToday(day){if(null==day)return!1;{let today=new Date;return"string"==typeof day&&(day=new Date(day)),today.getFullYear()==day.getFullYear()&&today.getMonth()==day.getMonth()&&today.getDay()==day.getDay()}}isNumber(val){return"NaN"!==parseFloat(val).toString()}attempt(promise,defaultValue=null){return promise.then(args=>[null,args]).catch(ex=>(this.logError(ex),[ex,defaultValue]))}retry(fn,retries=5,interval=0,callback=null){return(...args)=>new Promise((resolve,reject)=>{function _retry(...args){Promise.resolve().then(()=>fn.apply(this,args)).then(result=>{"function"==typeof callback?Promise.resolve().then(()=>callback(result)).then(()=>{resolve(result)}).catch(ex=>{retries>=1?interval>0?setTimeout(()=>_retry.apply(this,args),interval):_retry.apply(this,args):reject(ex),retries--}):resolve(result)}).catch(ex=>{this.logRetry(ex),retries>=1&&interval>0?setTimeout(()=>_retry.apply(this,args),interval):retries>=1?_retry.apply(this,args):reject(ex),retries--})}_retry.apply(this,args)})}formatTime(time,fmt="yyyy-MM-dd hh:mm:ss"){var o={"M+":time.getMonth()+1,"d+":time.getDate(),"h+":time.getHours(),"m+":time.getMinutes(),"s+":time.getSeconds(),"q+":Math.floor((time.getMonth()+3)/3),S:time.getMilliseconds()};/(y+)/.test(fmt)&&(fmt=fmt.replace(RegExp.$1,(time.getFullYear()+"").substr(4-RegExp.$1.length)));for(let k in o)new RegExp("("+k+")").test(fmt)&&(fmt=fmt.replace(RegExp.$1,1==RegExp.$1.length?o[k]:("00"+o[k]).substr((""+o[k]).length)));return fmt}now(){return this.formatTime(new Date,"yyyy-MM-dd hh:mm:ss")}today(){return this.formatTime(new Date,"yyyy-MM-dd")}sleep(time){return new Promise(resolve=>setTimeout(resolve,time))}}(scriptName)}
