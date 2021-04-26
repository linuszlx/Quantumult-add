let body = null;

switch (true) {
    // 去除MCN信息
    case /^https?:\/\/api\.zhihu\.com\/people\/((?!self).)*$/.test($request.url):
        try {
            let obj = JSON.parse($response.body);
            delete obj['mcn_user_info'];
            body = JSON.stringify(obj);
        } catch (err) {
            console.log(`知乎去除MCN信息出现异常：${err}`);
        }
        break;

    // 推荐去广告
    case /^https:\/\/api\.zhihu\.com\/topstory\/recommend\?/.test($request.url):
        try {
            let obj = JSON.parse($response.body);
            let data = obj['data'].filter((element) => {
                let flag = !(
                    element['card_type'] === 'slot_event_card' ||
                    element.hasOwnProperty('ad') ||
                    (element['extra']['type'] != 'article' && element['extra']['type'] != 'answer')
                );
                return flag;
            });
            obj['data'] = data;
            body = JSON.stringify(obj);
        } catch (err) {
            console.log(`知乎推荐列表去广告出现异常：${err}`);
        }
        break;

    // 关注列表去广告
    case /^https?:\/\/api\.zhihu\.com\/moments(\/|\?)?(recommend|action=|feed_type=)(?!\/people)/.test($request.url):
        try {
            let obj = JSON.parse($response.body);
            let data = [];
            // 修正由于JS number类型精度问题，导致JSON.parse精度丢失，引起想法不存在的问题
            const targetIdFix = (element) => {
                if (element['target_type'] == 'pin') {
                    target_id = element['target']['url'].match(/https?:\/\/www\.zhihu\.com\/pin\/(\d*)/)[1];
                    element['target']['id'] = target_id;
                    // 转发的想法处理
                    if (!!element['target']['origin_pin'] && element['target']['origin_pin'].hasOwnProperty('url')) {
                        origin_target_id = element['target']['origin_pin']['url'].match(/https?:\/\/www\.zhihu\.com\/pin\/(\d*)/)[1];
                        element['target']['origin_pin']['id'] = origin_target_id;
                    }
                }
                // 动态折叠处理
                else if (element['type'] == 'moments_group') {
                    let momentsGroupList = [];
                    for (let j = 0; j < element['list'].length; j++) {
                        momentsGroupList.push(targetIdFix(element['list'][j]));
                    }
                    element['list'] = momentsGroupList;
                }
                return element;
            }
            for (let i = 0; i < obj['data'].length; i++) {
                let element = targetIdFix(obj['data'][i]);
                if (!element['ad']) {
                    data.push(element);
                }
            }
            obj['data'] = data;
            body = JSON.stringify(obj);
        } catch (err) {
            console.log(`知乎关注列表去广告出现异常：${err}`);
        }
        break;

    // 回答列表去广告
    case /^https?:\/\/api\.zhihu\.com\/v4\/questions/.test($request.url):
        try {
            let obj = JSON.parse($response.body);
            delete obj['ad_info'];
            delete obj['roundtable_info'];
            body = JSON.stringify(obj);
        } catch (err) {
            console.log(`知乎回答列表去广告出现异常：${err}`);
        }
        break;

    // 拦截官方账号推广消息
    case /^https?:\/\/api\.zhihu\.com\/notifications\/v3\/timeline\/entry\/system_message/.test($request.url):
        try {
            const sysmsg_blacklist = ['知乎小伙伴', '知乎视频', '知乎团队', '知乎礼券', '知乎读书会团队', '知乎活动助手'];
            let obj = JSON.parse($response.body);
            let data = obj['data'].filter((element) => { return sysmsg_blacklist.indexOf(element['content']['title']) < 0 })
            obj['data'] = data;
            body = JSON.stringify(obj);
        } catch (err) {
            console.log(`知乎拦截官方账号推广消息出现异常：${err}`);
        }
        break;

    // 屏蔽官方营销消息
    case /^https?:\/\/api\.zhihu\.com\/notifications\/v3\/message\?/.test($request.url):
        try {
            let obj = JSON.parse($response.body);
            let newItems = [];
            for (let item of obj['data']) {
                if (item['detail_title'] === '官方帐号消息') {
                    let unread_count = item['unread_count'];
                    if (unread_count > 0) {
                        item['content']['text'] = '未读消息' + unread_count + '条';
                    } else {
                        item['content']['text'] = '全部消息已读';
                    }
                    item['is_read'] = true;
                    item['unread_count'] = 0;
                    newItems.push(item);
                } else if (item['detail_title'] !== '知乎活动助手') {
                    newItems.push(item);
                }
            }
            obj['data'] = newItems;
            body = JSON.stringify(obj);
        } catch (err) {
            console.log(`知乎屏蔽官方营销消息出现异常：${err}`);
        }
        break;

    // 去除预置关键字广告
    case /^https?:\/\/api\.zhihu\.com\/search\/preset_words\?/.test($request.url):
        try {
            if (!!$response.body) {
                let obj = JSON.parse($response.body);
                if (obj.hasOwnProperty('preset_words') && obj['preset_words']['words']) {
                    let words = obj['preset_words']['words'].filter((element) => {
                        return element['type'] !== 'ad';
                    })
                    obj['preset_words']['words'] = words;
                    body = JSON.stringify(obj);
                }
            }
        } catch (err) {
            console.log(`知乎去除预置关键字广告出现异常：${err}`);
        }
        break;

    // 优化知乎软件配置
    case /^https?:\/\/appcloud2\.zhihu\.com\/v\d+\/config/.test($request.url):
        try {
            if (!!$response.body) {
                let obj = JSON.parse($response.body);
                obj['config']['homepage_feed_tab']['tab_infos'] = [];
                obj['config']['zvideo_max_number'] = 1;
                body = JSON.stringify(obj);
            }
        } catch (err) {
            console.log(`优化知乎软件配置出现异常：${err}`);
        }
        break;
    default:
        console.log(`unhandled URL: ${$request.url}`);
        break;
}

if (body) {
    $done({ body: body });
} else {
    $done({});
}
