/**
 * 钉钉核心API
 * @author john.gao
 */
'use strict';

const getQueryString = (name) => {
  var result = null;
  var url = location.hash ? location.hash.indexOf('?') !== -1 ?
    '?' + location.hash.split('?')[1] : location.hash : location.search;
  url = decodeURIComponent(url)
  if (url.indexOf("?") != -1) {
    var str = url.substr(1);
    var strArr = str.split("&");
    for (var i = 0; i < strArr.length; i++) {
      if (strArr[i].split("=")[0] == name) {
        result = unescape(strArr[i].split("=")[1]);
        break;
      }
    }
  }
  return result;
}

const configUrl = 'dingding/getsign/' //获取钉钉配置参数
const checkUrl = 'dingding/checklogin/' //检查是否可以自动登录
const corpId = getQueryString('corpid')

export default {
  url: '', //接口前缀
  /**
   * 判断钉钉是否可以免密登录
   * @param callback 回调函数
   */
  isAutoLogin(json) {
    this.url = json.url;
    let callback = json.callback
    this.getConfig().then(res => {
      this.getAuthCode(res.response, (resCode) => {
        this.checkAutoLogin(false, resCode.code).then(resLogin => {
          if (resLogin.success) {
            callback(resLogin.response);
          } else {
            callback({});
          }
        })
      })
    })
  },

  /**
   * 第一步，向自身服务器请求获取配置参数
   */
  getConfig() {
    return axios.request(this.url, `${configUrl}${corpId}`, {
      hideError: true,
      type: 'get',
      params: {}
    })
  },

  /**
   * 第二步：向钉钉服务器请求授权code
   * @param {Object} res 服务器返回数据
   * @param {Func}  callback  回调函数
   */
  getAuthCode(res, callback) {
    dd.config({
      agentId: res.agentId,
      corpId: corpId,
      timeStamp: res.timeStamp,
      nonceStr: res.nonceStr,
      signature: res.signature,
      jsApiList: [
        'device.base.getUUID',
        'device.base.getInterface',
        'device.geolocation.get',
        'runtime.info',
        'biz.contact.choose',
        'device.notification.confirm',
        'device.notification.alert',
        'device.notification.prompt',
        'biz.ding.post',
        'biz.util.openLink'
      ]
    })
    dd.ready(() => {
      dd.runtime.permission.requestAuthCode({
        corpId: corpId,
        onSuccess: callback,
        onFail: (err) => {
          console.log(err);
        }
      })
    })

    dd.error((error) => {
      console.log('dd error: ' + JSON.stringify(error));
    });
  },

  /**
   * 第三步：判断是否可以免密登录
   * @param flag true：缓存存在userid
   * @param userId_Code 企业id或者授权码
   */
  checkAutoLogin(flag, userId_Code) {
    let type = flag ? 'dduserid/' : 'authcode/';
    return axios.request(this.url, `${checkUrl}${type}${corpId}/${userId_Code}`, {
      type: 'get',
      params: {
        noToken: true
      }
    })
  },

  /**
   * 获取GPS定位
   * @param recode 是否逆地理编码
   * @param callback 回调函数
   */
  getGPS(recode, callback) {
    dd.ready(() => {
      dd.device.geolocation.get({
        targetAccuracy: 200,
        coordinate: 1,
        withReGeocode: recode,
        onSuccess: (result) => {
          callback && callback(result);
        },
        onFail: (err) => {
          console.log(JSON.stringify(err));
        }
      })
    })
  },

  /**
   * 获取热点信息
   */
  getWiFi(callback) {
    dd.ready(() => {
      dd.device.base.getInterface({
        onSuccess: (data) => {
          callback && callback(data)
        },
        onFail: (err) => {
          console.log(JSON.stringify(err))
        }
      })
    })
  },

  getUUID(callback) {
    dd.ready(() => {
      dd.device.base.getUUID({
        onSuccess: (data) => {
          callback && callback(data);
        },
        onFail: (error) => {
          callback && callback();
        }
      })
    })
  }
}