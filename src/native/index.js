/**
 * 中间件
 * @author john.gao
 */
import DdCore from '../ding-talk/dd-core/index'
import DdUI from '../ding-talk/dd-ui/index'
import WeCore from '../wechat/index'
import LxCore from '../lanxin/index'
import MapCore from '../a-map/index'
import { isEmptyObject } from '../_utils/base_util'
import { v4 } from 'uuid'

/**
 * 判断平台类型
 * @returns
 */
const getOS = () => {
  let result = {}
  let u = navigator.userAgent;
  if (u.indexOf('DingTalk') > -1) {
    result.type = 'dd';
  } else if (u.indexOf('MicroMessenger') > -1) {
    result.type = 'wechat';
  } else if (u.indexOf('Lanxin') > -1) {
    result.type = 'lanxin';
  } else if (u.indexOf('Android') > -1 || u.indexOf('Adr') > -1) {
    result.type = _isNativeAndroid() ? 'android' : 'h5';
  } else if (!!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
    result.type = _isNativeIos() ? 'ios' : 'h5';
  } else {
    result.type = 'windows';
  }
  return result;
}

/**
 * 判断是否android app
 * @returns {boolean}
 */
const _isNativeAndroid = () => {
  let isNative = true
  try {
    android.callWithDict(JSON.stringify({
      _callback_key_: v4(),
      method: 'test'
    }));
  } catch (e) {
    isNative = false;
  }
  return isNative;
}

/**
 * 判断是否ios app
 * @returns {boolean}
 */
const _isNativeIos = () => {
  let isNative = true;
  try {
    ios.callWithDict({
      _callback_key_: v4(),
      method: 'test'
    });
  } catch (e) {
    isNative = false
  }
  return isNative
}


const Native = {
  /**
   * 平台类型
   */
  OS: getOS(),

  callbackMap: new Map(),
  /**
   * 判断是否android app
   * @returns {boolean}
   */
  isNativeAndroid() {
    return _isNativeAndroid()
  },
  /**
 * 判断是否ios app
 * @returns {boolean}
 */
  isNativeIos() {
    return _isNativeIos()
  },

  /**
   * 获取标题栏和导航栏加载方式
   * @param type 导航显示类型
   * @returns  1: 头部标题栏 + 底部导航栏 2.无头标题 + 无底导航 3：仅头部标题栏
   */
  getNavigation(type) {
    let result = 1;
    switch (this.OS.type) {
      case 'dd':
        result = type ? (type == 3 ? 2 : type) : 4;
        break;
      default:
        if (type)
          result = type;
        break;
    }
    return result;
  },
  /**
   * 重新布局
   * @param {Boolean} visible 键盘显示 
   */
  resetLayout(visible) {
    
  },
  /**
   * 启动页 - 设置钉钉返回按钮
   * @param routeList 点击返回直接关闭应用的路由集合
   */
  setDingTalkMenu(history, routeList) {
    switch (this.OS.type) {
      case 'dd':
        DdUI.setEvent(() => {
          if (routeList.indexOf(history.location.pathname) >= 0) {
            DdUI.close();
          } else {
            history.goBack();
          }
        });
        break;
      case 'wechat':
        if (WeCore.wechatType === 'corp') {
          WeCore.setEvent(() => {
            if (routeList.indexOf(history.location.pathname) >= 0) {
              WeCore.close();
            } else {
              history.goBack();
            }
          })
        }
        break;
      default:
        break;
    }
  },
  /**
   * 设置标题栏
   * @param target 工作模块
   */
  setTitle(title) {
    switch (this.OS.type) {
      case 'dd':
        DdUI.setTitle(title);
        break;
      default:
        break;
    }
  },
  /**
   * json转字符串
   * @param val
   * @returns {string}
   */
  stringify(val) {
    return val === undefined || val === null || typeof val === "function" ? val + "" : JSON.stringify(val);
  },
  /**
   * 字符串转json
   * @param val
   * @returns {*}
   */
  deserialize(val) {
    if (typeof val !== "string") {
      return undefined;
    }
    try {
      return JSON.parse(val);
    } catch (e) {
      return val || undefined;
    }
  },
  /**
   * 获取缓存值
   * @param {String} key 
   */
  getCache(key, callback) {
    let result = '';
    switch (this.OS.type) {
      case 'android':
        this.callNative({ method: 'getCache', key: key }, val => {
          if (callback) {
            callback(val)
          } else {
            result = val;
          }
        })
        break;
      default:
        if(key) {
          result = window.localStorage.getItem(key);
        }else {
          let obj = {};
           Object.keys(window.localStorage).map(key=>{
            obj[key] = this.deserialize(window.localStorage.getItem(key));
          })
          result = obj;
        }
        if(callback) callback(result)
        break;
    }
  },
  /**
   * 设置缓存值
   * @param {String} key 
   * @param {Any} value 
   */
  setCache(key, value) {
    if (!key) return;
    let val = this.stringify(value);
    switch (this.OS.type) {
      case 'android':
        this.callNative({
          method: 'setCache',
          key: key,
          value: val
        });
        break;
      default:
        window.localStorage.setItem(key, val);
        break;
    }
  },
  removeCache(key) {
    switch (this.OS.type) {
      case 'android':
        this.callNative({
          method: 'removeCache',
          key: key
        });
        break;
      default:
        window.localStorage.removeItem(key);
        break;
    }
  },
    /**
   * 清除缓存
   * @param prefix
   */
  clearCache(excList = []) {
    for (var i = window.localStorage.length - 1; i >= 0; i--) {
      var k = window.localStorage.key(i);
      if (excList.indexOf(k) == -1) this.removeCache(k);
    }
  },
  /**
   * 登录
   * @param target
   * @param data
   */
  login(target, data) {
    switch (this.OS.type) {
      case 'dd':
        target.dingTalkLogin(data);
        break;
      case 'wechat':
        data.wechatType = WeCore.getWechatType();
        target.weChatLogin(data);
        break;
      case 'lanxin':
        target.lanXinLogin(data)
        break;
      default:
        target.login(data);
        break;
    }
  },
  /**
   * 是否自动登录
   * @param callback 回调函数
   * 回调参数：：isLogin true：是自动登录 false 不是自动登录
   */
  isLogin(callback) {
    console.warn('this.OS.type:', this.OS.type)
    switch (this.OS.type) {
      case 'dd':
        DdCore.isAutoLogin({
          url: url,
          callback: (result) => {
            if (isEmptyObject(result)) {
              callback(false);
            } else {
              //保存钉钉的userid
              if (result.dduserid != undefined) this.setCache('ddUserId', result.dduserid);
              this.setCache('userLogin', result.userinfo);
              callback(result.islogin);
            }
          }
        });
        break;
      case 'wechat':
        WeCore.isAutoLogin(res => {
          //保存微信的openid
          callback(res);
          //todo 循环访问页面问题
          // if (res.error && res.error.code == 300) {
          //   location.href = 'https://' + location.host + '/wechat';
          //   return;
          // }
          // if (res.response.openId) this.setCache('openId', res.response.openId);
          // if (res.response.token) {
          //   this.setCache('userInfo', res.response);
          //   callback(true);
          // } 

        })
        break;
      case 'lanxin':
        LxCore.isAutoLogin(res => callback(res))
        break;
      case 'android':
        this.getCache('', val => {
          callback(val);
        })
        break;
      default:
        this.getCache(null, val=>{
          callback(val)
        })
        break;
    }
  },
  /**
   * 退出登录
   * @param {Object} history 路由历史
   * @param callback
   */
  exit(callback, apiUrl) {
    //不需要清除的缓存
    let excludeList = ['openId', 'ddUserId']
    switch (this.OS.type) {
      case 'dd':
        let ddUserId = this.getCache('ddUserId');
        axios.post(`/dingding/logout/${ddUserId}`, {
          type: 'get',
          params: {}
        }).then(res => {
          if (res.success) {
            // StoreUtil.clear(excludeList);
          } else {
          }
          callback && callback(res)
        })
        break;
      case 'wechat':
        WeCore.logOut(callback);
        break;
      case 'lanxin':
        LxCore.logOut(callback);
        break;
      default:
        callback && callback()
        break;
    }
  },
  /**
   * 调用原生系统
   * @param  参数：object或者string  object: {method:'',value:''} string : 原生系统方法名称
   * @param callback 回调函数
   */
  callNative(params, callback) {
    let uuid = v4();
    let json = {
      _callback_key_: uuid
    };
    if (typeof params == 'string')
      params = {
        method: params
      };
    for (let k in params) {
      json[k] = params[k];
    }
    this.callbackMap.set(uuid, callback);
    switch (this.OS.type) {
      case 'ios':
        ios.callWithDict(json);
        break;
      case 'android':
        android.callWithDict(JSON.stringify(json));
        break;
      default:
        break;
    }
  },
  /**
   * 调用前端匿名函数
   * @param json {success:true}
   */
  callFront(callbackKey, json) {
    var result = JSON.parse(json);
    if (this.callbackMap.has(callbackKey)) {
      this.callbackMap.get(callbackKey)(result);
      this.callbackMap.delete(callbackKey);
    }
  },
  /**
   * 根据平台返回可用的加密方式
   * @param type 1：本地 2：服务器
   * @param list
   * @returns {Array}
   */
  getValidateList(type, list, map) {
    let arr = [],
      _map = map ? map : {
        num: '密码解锁',
        hand: '手势解锁',
        finger: '指纹解锁'
      };
    switch (this.OS.type) {
      case 'dd':
      case 'android':
        if (type == 1) {
          arr = [
            {
              pwd_type: 'num',
              label: _map['num']
            },
            {
              pwd_type: 'hand',
              label: _map['hand']
            }
          ];
        } else {
          arr = list.filter((o) => {
            return o.enable == '1' && (o.pwd_type == 'hand' || o.pwd_type == 'num');
          });
        }
        break;
      case 'ios':
        if (type == 1) {
          arr = [
            {
              pwd_type: 'num',
              label: _map['num']
            },
            {
              pwd_type: 'hand',
              label: _map['hand']
            }
          ];
          if (this.OS.fingerAllow) {
            arr.push({
              pwd_type: 'finger',
              label: _map['finger']
            })
          }
        } else {
          arr = list.filter((o) => {
            if (o.pwd_type == 'finger') {
              return this.OS.fingerAllow && o.enable == '1'
            } else {
              return o.enable == '1';
            }
          });
        }
        break;
      default:
        if (type == 1) {
          arr = [
            {
              pwd_type: 'num',
              label: _map['num']
            },
            {
              pwd_type: 'hand',
              label: _map['hand']
            }
          ];
        } else {
          arr = list.filter((o) => {
            return o.enable == '1' && (o.pwd_type == 'hand' || o.pwd_type == 'num');
          });
        }
        break;
    }
    return arr;
  },

  /**
   * 写日志
   * @param value
   */
  log(path, value) {
    switch (this.OS.type) {
      case 'dd':
      case 'wechat':
        //TODO 如何记录日志
        $.get(`./error?value=${value}`)
        break;
      case 'android':
      case 'ios':
        this.callNative({
          method: 'log',
          path: path,
          value: value
        })
        break;
      default:
        $.get(`./error?value=${value}`)
        break;
    }
  },

  getSystemInfo(callback) {
    let json = {
      success: true,
      device: ''
    }
    switch (this.OS.type) {
      case 'dd':
        DdCore.getUUID((result) => {
          if (result) {
            json.device = result.uuid
          }
          callback && callback(json);
        })
        break;
      case 'wechat':
        this.getCache('openId', openId=>{
          json.device = openId
          callback && callback(json)
        });
        break;
      case 'lanxin':
        callback && callback({
          device: this.getCache('openId')
        })
        break;
      case 'android':
      case 'ios':
        this.callNative("getSystemInfo", result => {
          if (callback) callback(result);
        });
        break;
      default:
        callback && callback(json);
        break;
    }
  },

  /**
   * 获取GPS定位
   */
  getGPS(params, callback) {
    let opts = Object.assign({}, {
      method: 'getGPS'
    }, params);
    switch (this.OS.type) {
      case 'dd':
        let recode = params.recode;
        DdCore.getGPS(recode, (res) => {
          let json = Object.assign({}, {
            success: true
          }, res)
          callback && callback(json)
        });
        break;
      case 'wechat':
        WeCore.getGPS((res) => {
          let json = {
            success: false
          };
          if (res != null)
            json = Object.assign({}, {
              success: true
            }, res)
          callback && callback(json);
        });
        break;
      case 'lanxin':
        LxCore.getGPS(res => {
          let json = {
            success: false
          };
          if (res != null)
            json = Object.assign({}, {
              success: true
            }, res)
          callback && callback(json);
        })
        break;
      case 'android':
      case 'ios':
        this.callNative(opts, (json) => {
          callback && callback(json)
        });
        break;
      case 'h5':
        MapCore.getGPS((res) => {
          let json = Object.assign({}, {
            success: true
          }, res)
          callback && callback(json);
        })
        break;
      default:
        break;
    }
  },

  /**
   * 获取WiFi
   * @param  {Func} callback 回调函数
   */
  getWiFi(callback) {
    switch (this.OS.type) {
      case 'dd':
        DdCore.getWiFi((res) => {
          let json = {
            mac: res.macIp,
            name: res.ssid
          };
          if (callback) callback(json);
        });
        break;
      case 'wechat':
        WeCore.getWifi((res) => {
          let json = {}
          if (res.BSSID) {
            json.mac = res.BSSID.toLowerCase();
            json.name = res.SSID;
          }
          callback && callback(json);
        });
        break;
      case 'lanxin':
        LxCore.getWifi(res => {
          let json = {}
          if (res.bssid) {
            json.mac = res.bssid.toLowerCase()
            json.name = res.ssid
          }
          callback && callback(json)
        })
        break;
      case 'android':
      case 'ios':
        this.callNative({
          method: 'getWiFi'
        }, (json) => {
          if (json.mac) {
            let arr = [],
              tempArr = json.mac.split(':');
            for (let k in tempArr) {
              if (tempArr[k].length == 1)
                tempArr[k] = "0" + tempArr[k];
              arr.push(tempArr[k]);
            }
            json.mac = arr.join(':');
          }
          if (callback) callback(json);
        });
        break;
      default:
        break;
    }
  },

  /**
   * 获取蓝牙
   * @param  {Func} callback 回调函数
   */
  getBlueTooth(params, callback) {
    switch (this.OS.type) {
      case 'wechat':
        WeCore.getBluetooth(params, data => {
          if (callback) {
            callback(data);
          }
        })
        break;
      case "android":
      case "ios":
        this.callNative({
          method: "getBlueTooth"
        }, (json) => {
          callback && callback(json)
        })
        break;
      default:
        if (callback) {
          callback({ success: true, list: [] })
        }
        break;
    }
  }
}


if (window.Native === undefined) {
  window.Native = Native
}

export default window.Native