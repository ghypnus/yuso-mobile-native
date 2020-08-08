/**
 * yuso-mobile-native
 * author : john.gao
 * homepage :
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var uuid = require('uuid');

/**
 * 钉钉核心API
 * @author john.gao
 */

var getQueryString = function getQueryString(name) {
  var result = null;
  var url = location.hash ? location.hash.indexOf('?') !== -1 ? '?' + location.hash.split('?')[1] : location.hash : location.search;
  url = decodeURIComponent(url);
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
};

var configUrl = 'dingding/getsign/'; //获取钉钉配置参数
var checkUrl = 'dingding/checklogin/'; //检查是否可以自动登录
var corpId = getQueryString('corpid');

var DdCore = {
  url: '', //接口前缀
  /**
   * 判断钉钉是否可以免密登录
   * @param callback 回调函数
   */
  isAutoLogin: function isAutoLogin(json) {
    var _this = this;

    this.url = json.url;
    var callback = json.callback;
    this.getConfig().then(function (res) {
      _this.getAuthCode(res.response, function (resCode) {
        _this.checkAutoLogin(false, resCode.code).then(function (resLogin) {
          if (resLogin.success) {
            callback(resLogin.response);
          } else {
            callback({});
          }
        });
      });
    });
  },


  /**
   * 第一步，向自身服务器请求获取配置参数
   */
  getConfig: function getConfig() {
    return axios.request(this.url, '' + configUrl + corpId, {
      hideError: true,
      type: 'get',
      params: {}
    });
  },


  /**
   * 第二步：向钉钉服务器请求授权code
   * @param {Object} res 服务器返回数据
   * @param {Func}  callback  回调函数
   */
  getAuthCode: function getAuthCode(res, callback) {
    dd.config({
      agentId: res.agentId,
      corpId: corpId,
      timeStamp: res.timeStamp,
      nonceStr: res.nonceStr,
      signature: res.signature,
      jsApiList: ['device.base.getUUID', 'device.base.getInterface', 'device.geolocation.get', 'runtime.info', 'biz.contact.choose', 'device.notification.confirm', 'device.notification.alert', 'device.notification.prompt', 'biz.ding.post', 'biz.util.openLink']
    });
    dd.ready(function () {
      dd.runtime.permission.requestAuthCode({
        corpId: corpId,
        onSuccess: callback,
        onFail: function onFail(err) {
          console.log(err);
        }
      });
    });

    dd.error(function (error) {
      console.log('dd error: ' + JSON.stringify(error));
    });
  },


  /**
   * 第三步：判断是否可以免密登录
   * @param flag true：缓存存在userid
   * @param userId_Code 企业id或者授权码
   */
  checkAutoLogin: function checkAutoLogin(flag, userId_Code) {
    var type = flag ? 'dduserid/' : 'authcode/';
    return axios.request(this.url, '' + checkUrl + type + corpId + '/' + userId_Code, {
      type: 'get',
      params: {
        noToken: true
      }
    });
  },


  /**
   * 获取GPS定位
   * @param recode 是否逆地理编码
   * @param callback 回调函数
   */
  getGPS: function getGPS(recode, callback) {
    dd.ready(function () {
      dd.device.geolocation.get({
        targetAccuracy: 200,
        coordinate: 1,
        withReGeocode: recode,
        onSuccess: function onSuccess(result) {
          callback && callback(result);
        },
        onFail: function onFail(err) {
          console.log(JSON.stringify(err));
        }
      });
    });
  },


  /**
   * 获取热点信息
   */
  getWiFi: function getWiFi(callback) {
    dd.ready(function () {
      dd.device.base.getInterface({
        onSuccess: function onSuccess(data) {
          callback && callback(data);
        },
        onFail: function onFail(err) {
          console.log(JSON.stringify(err));
        }
      });
    });
  },
  getUUID: function getUUID(callback) {
    dd.ready(function () {
      dd.device.base.getUUID({
        onSuccess: function onSuccess(data) {
          callback && callback(data);
        },
        onFail: function onFail(error) {
          callback && callback();
        }
      });
    });
  }
};

/**
 * 钉钉UI调整
 * @author john.gao
 */

//TODO 标题设置需要兼容新的APP

var DdUI = {
  /**
   * 设置标题
   * @param title 标题
   */
  setTitle: function setTitle(title) {
    dd.biz.navigation.setTitle({
      title: title
    });
    var setText = $.i18n["my_setTitle"],
        searchText = $.i18n["search"],
        rightText = "",
        isShow = false;
    // switch (pageObj.route) {
    //   case "work/work":
    //     rightText = setText;
    //     toRoute = "my/set";
    //     break;
    //   case "colleague/colleague":
    //   case "colleague/cGroup":
    //   case "colleague/cLists":
    //     rightText = searchText;
    //     toRoute = "search/search";
    //     break;
    //   default:
    //     isShow = false;
    //     break;
    // }
    dd.biz.navigation.setRight({
      show: isShow,
      control: true,
      text: rightText,
      onSuccess: function onSuccess(result) {
        // history.push(targetRoute);
      }
    });
  },


  /**
   * 钉钉返回按钮事件
   */
  setEvent: function setEvent(callback) {
    dd.ready(function () {
      if (navigator.userAgent.indexOf('Android') > -1) {
        //android 返回按钮事件
        document.addEventListener('backbutton', function (e) {
          e.preventDefault();
          callback();
        }, false);
      } else {
        //ios 返回按钮事件
        dd.biz.navigation.setLeft({
          show: true,
          control: true,
          showIcon: true,
          onSuccess: function onSuccess(result) {
            callback();
          }
        });
      }
    });
  },


  /**
   * 关闭微应用
   */
  close: function close() {
    dd.biz.navigation.close();
  }
};

/**
 * 判断是否为空对象
 * @param  {Object}  obj 对象
 * @return {Boolean}     true or false
 */
var isEmptyObject = function isEmptyObject(obj) {
  return obj === undefined || obj === null || Object.keys(obj).length === 0 ? true : false;
};

/**
 * 地址栏参数
 * @param {string} name 参数名称
 */
var getQueryString$1 = function getQueryString(name) {
  var result = null;
  var url = location.hash ? location.hash.indexOf('?') !== -1 ? '?' + location.hash.split('?')[1] : location.hash : location.search;
  url = decodeURIComponent(url);
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
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

/**
 * 微信API
 * @author john.gao
 */
var cookiePrefix = 'LOGIN_WECHAT_';
/**
 * 获取cookie
 */
function getCookie(name) {
  var arr,
      reg = new RegExp('(^| )' + cookiePrefix + name + '=([^;]*)(;|$)');
  if (arr = document.cookie.match(reg)) {
    var result = null;
    try {
      result = decodeURIComponent(arr[2]);
    } catch (e) {
      result = arr[2];
    }
    try {
      result = JSON.parse(result);
    } catch (e) {}
    return result;
  } else return null;
}

/**
 * 设置cookie
 */
function setCookie(name, value, seconds) {
  seconds = seconds || 0;
  var expires = "";
  if (seconds != 0) {
    //设置cookie时间
    var date = new Date();
    date.setTime(date.getTime() + seconds * 1000);
    expires = "; expires=" + date.toGMTString();
  }
  document.cookie = cookiePrefix + name + "=" + escape(value) + expires + "; path=/";
}

var WeCore = {
  url: '', //接口前缀

  /**
   * 判断微信是否可以免密登录
   * @param callback 回调函数
   */
  isAutoLogin: function isAutoLogin(callback) {
    var _this = this;

    var wechatType = getQueryString$1('type');
    if (wechatType === '2') {
      //企业微信
      setCookie('wechatType', 'corp');
    }
    var customerCode = getQueryString$1('customerCode');
    if (customerCode) {
      setCookie('customerCode', customerCode);
    }
    var openId = getQueryString$1('code');
    if (openId) {
      setCookie('code', openId);
    }

    this.getSign(function (configRes) {
      _this.setConfig(configRes, function () {
        _this.checkAutoLogin(callback);
      });
    });
  },

  /**
   * 获取Customer Code
   */
  getCustomerCode: function getCustomerCode() {
    return getCookie('customerCode');
  },

  /**
   * 获取wechatType
   */
  getWechatType: function getWechatType() {
    return getCookie('wechatType');
  },

  /**
   * 获取code
   */
  getWechatCode: function getWechatCode() {
    return getCookie('code');
  },

  /**
   * 获取openId
   */
  getOpenId: function getOpenId() {
    return getCookie('openId');
  },


  /**
   * 向自身服务器请求获取配置参数
   */
  getSign: function getSign(callback) {
    var param = {
      url: location.href.split('#')[0]
    };
    var wechatType = this.getWechatType();
    var configUrl = '/platform/wechat/wechatSign.nolog';
    param.customerCode = this.getCustomerCode();
    param.type = wechatType === 'corp' ? '2' : '1';

    axios.post(configUrl, param).then(function (data) {
      if (callback) {
        callback(data);
      }
    });
  },
  setConfig: function setConfig(data, callback) {
    wx.config({
      debug: !!data.debug,
      appId: data.appId,
      timestamp: data.timestamp,
      nonceStr: data.nonceStr,
      signature: data.signature,
      jsApiList: data.jsApiList || ['getLocation', 'onHistoryBack', 'closeWindow']
    });
    wx.ready(function () {
      if (callback) {
        callback();
      }
    });
  },


  /**
   * 第三步：判断是否可以免密登录
   */
  checkAutoLogin: function checkAutoLogin(callback) {
    var param = { code: this.getWechatCode() };
    var checkUrl = '/platform/wechat/wechatCheckLogin.nolog';
    var wechatType = this.getWechatType();

    param.customerCode = this.getCustomerCode();
    param.type = wechatType === 'corp' ? '2' : '1';
    axios.post(checkUrl, param).then(function (res) {
      if (res && res.user && res.user.openId) {
        setCookie('openId', res.user.openId);
      }
      callback(res);
    });
  },
  logOut: function logOut(callback) {
    var param = {
      openId: this.getOpenId(),
      type: this.getWechatType() === 'corp' ? '2' : '1',
      customerCode: this.getCustomerCode()
    };
    var loginOutUrl = '/platform/wechat/wechatLogOut.nolog';
    axios.post(loginOutUrl, param).then(function (res) {
      callback && callback(res);
    });
  },
  getOS: function getOS() {
    var result = '';
    var u = navigator.userAgent;
    if (u.indexOf('Android') > -1) {
      result = 'android';
    } else if (!!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
      result = 'ios';
    }
    return result;
  },


  /**
   * 获取GPS定位
   * @param callback
   */
  getGPS: function getGPS(callback) {
    var _this2 = this;

    if (this.getOS() === 'android') {
      this.getSign(function (configRes) {
        _this2.setConfig(configRes, function () {
          wx.getLocation({
            type: 'gcj02',
            success: function success(res) {
              callback && callback(res);
            },
            fail: function fail() {
              callback && callback(null);
            }
          });
        });
      });
    } else {
      wx.getLocation({
        type: 'gcj02',
        success: function success(res) {
          callback && callback(res);
        },
        fail: function fail() {
          callback && callback(null);
        }
      });
    }
  },
  openBluetoothAdapter: function openBluetoothAdapter(callback) {
    wx.openBluetoothAdapter({
      success: function success(res) {
        console.info('openBluetoothAdapter success', res);
        callback(_extends({}, res, { isSuccess: true }));
      },
      fail: function fail(errMsg) {
        callback(_extends({}, errMsg, { isSuccess: false }));
      }
    });
  },
  getWifi: function getWifi(callback) {
    var wechatType = this.getWechatType();
    if (wechatType === 'corp') {
      var self = this;
      self.getSign(function (configRes) {
        configRes.jsApiList = ['startWifi', 'getConnectedWifi'];
        self.setConfig(configRes, function () {
          wx.startWifi({
            success: function success(res) {
              console.info('startWifi success', res);
              wx.getConnectedWifi({
                success: function success(res) {
                  console.log('getConnectedWifi success', res);
                  callback(res.wifi);
                },
                fail: function fail(res) {
                  console.log('getConnectedWifi fail', res);
                  callback({});
                }
              });
            },
            fail: function fail(res) {
              console.log('startWifi fail', res);
              callback({});
            }
          });
        });
      });
    } else {
      callback({});
    }
  },

  /**
   * 企业微信: 获取蓝牙设备列表
   */
  getBluetooth: function getBluetooth(params, callback) {
    var _this3 = this;

    var wechatType = this.getWechatType();
    if (wechatType === 'corp') {
      var self = this;
      self.getSign(function (configRes) {
        var _param = _extends({}, configRes, {
          jsApiList: ['openBluetoothAdapter', 'startBeaconDiscovery', 'stopBeaconDiscovery', 'onBeaconUpdate']
        });
        self.setConfig(_param, function () {
          self.getBluetoothCount = 0;
          self.openBluetoothAdapter(function (data) {
            if (data.isSuccess) {
              self.isBluetoothStopping = false;
              self.isBluetoothStoped = false;
              wx.startBeaconDiscovery({
                uuids: params.uuids, //参数uuid
                success: function success(res) {
                  console.info('startBeaconDiscovery success', res);
                  //监听 iBeacon 设备的更新事件
                  wx.onBeaconUpdate(function (data) {
                    console.info('onBeaconUpdate update', data);
                    self.beacons = data.beacons;
                    if (!self.isBluetoothStopping) {
                      self.isBluetoothStopping = true;
                      wx.stopBeaconDiscovery({
                        success: function success() {
                          callback({
                            success: true,
                            list: _this3.beacons
                          });
                          self.isBluetoothStoped = true;
                          self.isBluetoothStopping = false;
                        }
                      });
                    }
                  });
                },
                complete: function complete(res) {
                  setTimeout(function () {
                    console.info('complete', self.isBluetoothStopping, self.isBluetoothStoped, res);
                    if (!self.isBluetoothStoped) {
                      wx.stopBeaconDiscovery();
                    }
                  }, 10000);
                },
                fail: function fail(errMsg) {
                  console.info('startBeaconDiscovery fail', self.isBluetoothStopping, self.isBluetoothStoped, errMsg);
                  wx.stopBeaconDiscovery();
                  callback({
                    success: false,
                    error: errMsg
                  });
                }
              });
            } else {
              callback({
                success: false,
                error: '请开启蓝牙'
              });
            }
          });
        });
      });
    } else {
      callback([]);
    }
  },
  setEvent: function setEvent(callback) {
    wx.ready(function () {
      try {
        wx.onHistoryBack(function () {
          callback && callback();
          return false;
        });
      } catch (err) {
        console.warn(err + ', \u8BF7\u4F7F\u7528\u4F01\u4E1A\u5FAE\u4FE1\u5E73\u53F0\u767B\u5F55');
      }
    });
  },
  close: function close() {
    wx.closeWindow();
  }
};

/**
 * 蓝信API
 * @author Groot.xie
 */
var cookiePrefix$1 = 'LOGIN_LANXIN_';
/**
 * 获取cookie
 */
function getCookie$1(name) {
  var arr,
      reg = new RegExp('(^| )' + cookiePrefix$1 + name + '=([^;]*)(;|$)');
  if (arr = document.cookie.match(reg)) {
    var result = null;
    try {
      result = decodeURIComponent(arr[2]);
    } catch (e) {
      result = arr[2];
    }
    try {
      result = JSON.parse(result);
    } catch (e) {}
    return result;
  } else return null;
}

/**
 * 设置cookie
 */
function setCookie$1(name, value, seconds) {
  seconds = seconds || 0;
  var expires = "";
  if (seconds != 0) {
    //设置cookie时间
    var date = new Date();
    date.setTime(date.getTime() + seconds * 1000);
    expires = "; expires=" + date.toGMTString();
  }
  document.cookie = cookiePrefix$1 + name + "=" + escape(value) + expires + "; path=/";
}

var LxCore = {
  url: '', //接口前缀
  /**
   * 判断蓝信是否可以免密登录
   * @param callback 回调函数
   */
  isAutoLogin: function isAutoLogin(callback) {
    var customerCode = getQueryString$1('customerCode');
    var openId = getQueryString$1('code');
    if (customerCode) {
      setCookie$1('customerCode', customerCode);
    }
    if (openId) {
      setCookie$1('code', openId);
    }

    this.checkAutoLogin(callback);
  },

  // 判断是否可以免密登录
  checkAutoLogin: function checkAutoLogin(callback) {
    var checkUrl = '/platform/wechat/wechatCheckLogin.nolog';
    var param = {
      code: this.getLanxinCode(),
      customerCode: this.getCustomerCode(),
      type: '3'
    };

    axios.post(checkUrl, param).then(function (res) {
      if (res && res.user && res.user.openId) {
        setCookie$1('openId', res.user.openId);
      }
      callback(res);
    });
  },

  // 登出
  logOut: function logOut(callback) {
    var loginOutUrl = '/platform/wechat/wechatLogOut.nolog';
    var param = {
      openId: this.getOpenId(),
      customerCode: this.getCustomerCode(),
      type: '3'
    };

    axios.post(loginOutUrl, param).then(function (res) {
      callback && callback(res);
    });
  },

  /**
   * 获取GPS定位
   * @param callback
   */
  getGPS: function getGPS(callback) {
    lx.getLocation({
      type: 'gcj02',
      success: function success(res) {
        return callback && callback(res);
      },
      fail: function fail(err) {
        return callback && callback(null);
      }
    });
    return;
  },
  getWifi: function getWifi(callback) {
    lx.wifiDeviceInfo({
      success: function success(res) {
        return callback(res);
      },
      fail: function fail() {
        return callback({});
      }
    });
  },

  // 获取CustomerCode
  getCustomerCode: function getCustomerCode() {
    return getQueryString$1('customerCode') || getCookie$1('customerCode');
  },

  // 获取code
  getLanxinCode: function getLanxinCode() {
    return getQueryString$1('code') || getCookie$1('code');
  },

  // 获取openId
  getOpenId: function getOpenId() {
    return getCookie$1('openId');
  },
  getOS: function getOS() {
    var result = '';
    var u = navigator.userAgent;
    if (u.indexOf('Android') > -1) {
      result = 'android';
    } else if (!!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
      result = 'ios';
    }
    return result;
  }
};

/**
 * 高德API
 * @author john.gao
 */

var MapCore = {
  /**
  * 获取GPS定位
  * @param callback
  */
  getGPS: function getGPS(callback) {
    var map = void 0,
        geolocation = void 0;
    map = new AMap.Map('');
    map.plugin('AMap.Geolocation', function () {
      geolocation = new AMap.Geolocation({
        enableHighAccuracy: true, //是否使用高精度定位，默认:true
        timeout: 10000 //超过10秒后停止定位，默认：无穷大
      });
      map.addControl(geolocation);
      geolocation.getCurrentPosition();
      AMap.event.addListener(geolocation, 'complete', function (data) {
        callback && callback({
          longitude: data.position.getLng(),
          latitude: data.position.getLat()
        });
      });
      AMap.event.addListener(geolocation, 'error', function (data) {
        callback && callback();
      });
    });
  }
};

/**
 * 中间件
 * @author john.gao
 */

/**
 * 判断平台类型
 * @returns
 */
var getOS = function getOS() {
  var result = {};
  var u = navigator.userAgent;
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
};

/**
 * 判断是否android app
 * @returns {boolean}
 */
var _isNativeAndroid = function _isNativeAndroid() {
  var isNative = true;
  try {
    android.callWithDict(JSON.stringify({
      method: 'test'
    }));
  } catch (e) {
    isNative = false;
  }
  return isNative;
};

/**
 * 判断是否ios app
 * @returns {boolean}
 */
var _isNativeIos = function _isNativeIos() {
  var isNative = true;
  try {
    ios.callWithDict({
      method: 'test'
    });
  } catch (e) {
    isNative = false;
  }
  return isNative;
};

var Native = {
  /**
   * 平台类型
   */
  OS: getOS(),

  callbackMap: new Map(),
  /**
   * 判断是否android app
   * @returns {boolean}
   */
  isNativeAndroid: function isNativeAndroid() {
    return _isNativeAndroid();
  },

  /**
  * 判断是否ios app
  * @returns {boolean}
  */
  isNativeIos: function isNativeIos() {
    return _isNativeIos();
  },


  /**
   * 获取标题栏和导航栏加载方式
   * @param type 导航显示类型
   * @returns  1: 头部标题栏 + 底部导航栏 2.无头标题 + 无底导航 3：仅头部标题栏
   */
  getNavigation: function getNavigation(type) {
    var result = 1;
    switch (this.OS.type) {
      case 'dd':
        result = type ? type == 3 ? 2 : type : 4;
        break;
      default:
        if (type) result = type;
        break;
    }
    return result;
  },

  /**
   * 启动页 - 设置钉钉返回按钮
   * @param routeList 点击返回直接关闭应用的路由集合
   */
  setDingTalkMenu: function setDingTalkMenu(history, routeList) {
    switch (this.OS.type) {
      case 'dd':
        DdUI.setEvent(function () {
          if (routeList.indexOf(history.location.pathname) >= 0) {
            DdUI.close();
          } else {
            history.goBack();
          }
        });
        break;
    }
  },

  /**
   * 设置标题栏
   * @param target 工作模块
   */
  setTitle: function setTitle(title) {
    switch (this.OS.type) {
      case 'dd':
        DdUI.setTitle(title);
        break;
    }
  },

  /**
   * 获取缓存值
   * @param {String} key 
   */
  getCache: function getCache(key, callback) {
    var result = '';
    switch (this.OS.type) {
      case 'android':
        this.callNative({ method: 'getCache', key: key }, function (val) {
          if (callback) {
            callback(val);
          } else {
            result = val;
          }
        });
        break;
      default:
        result = window.localStorage.getItem(key);
        break;
    }
    return result;
  },

  /**
   * 设置缓存值
   * @param {String} key 
   * @param {Any} value 
   */
  setCache: function setCache(key, value) {
    switch (this.OS.type) {
      case 'android':
        this.callNative({
          method: 'setCache',
          key: key,
          value: value
        });
        break;
      default:
        window.localStorage.setItem(key, value);
        break;
    }
  },
  removeCache: function removeCache(key) {
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
   * 登录
   * @param target
   * @param data
   */
  login: function login(target, data) {
    switch (this.OS.type) {
      case 'dd':
        target.dingTalkLogin(data);
        break;
      case 'wechat':
        data.wechatType = WeCore.getWechatType();
        target.weChatLogin(data);
        break;
      case 'lanxin':
        target.lanXinLogin(data);
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
  isLogin: function isLogin(_callback) {
    var _this = this;

    console.warn('this.OS.type:', this.OS.type);
    switch (this.OS.type) {
      case 'dd':
        DdCore.isAutoLogin({
          url: url,
          callback: function callback(result) {
            if (isEmptyObject(result)) {
              _callback(false);
            } else {
              //保存钉钉的userid
              if (result.dduserid != undefined) _this.setCache('ddUserId', result.dduserid);
              _this.setCache('userLogin', result.userinfo);
              _callback(result.islogin);
            }
          }
        });
        break;
      case 'wechat':
        WeCore.isAutoLogin(function (res) {
          //保存微信的openid
          _callback(res);
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
        });
        break;
      case 'lanxin':
        LxCore.isAutoLogin(function (res) {
          return _callback(res);
        });
        break;
      case 'android':
        this.getCache('', function (val) {
          _callback(val);
        });
        break;
      default:
        _callback({
          user: JSON.parse(this.getCache('userInfo')),
          token: this.getCache('token')
        });
        break;
    }
  },

  /**
   * 退出登录
   * @param {Object} history 路由历史
   * @param callback
   */
  exit: function exit(callback, apiUrl) {
    switch (this.OS.type) {
      case 'dd':
        var ddUserId = this.getCache('ddUserId');
        axios.post('/dingding/logout/' + ddUserId, {
          type: 'get',
          params: {}
        }).then(function (res) {
          if (res.success) ;
          callback && callback(res);
        });
        break;
      case 'wechat':
        WeCore.logOut(callback);
        break;
      case 'lanxin':
        LxCore.logOut(callback);
        break;
      default:
        callback && callback();
        break;
    }
  },

  /**
   * 调用原生系统
   * @param  参数：object或者string  object: {method:'',value:''} string : 原生系统方法名称
   * @param callback 回调函数
   */
  callNative: function callNative(params, callback) {
    var uuid$1 = uuid.v4();
    var json = {
      _callback_key_: uuid$1
    };
    if (typeof params == 'string') params = {
      method: params
    };
    for (var k in params) {
      json[k] = params[k];
    }
    this.callbackMap.set(uuid$1, callback);
    switch (this.OS.type) {
      case 'ios':
        ios.callWithDict(json);
        break;
      case 'android':
        android.callWithDict(JSON.stringify(json));
        break;
    }
  },

  /**
   * 调用前端匿名函数
   * @param json {success:true}
   */
  callFront: function callFront(callbackKey, json) {
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
  getValidateList: function getValidateList(type, list, map) {
    var _this2 = this;

    var arr = [],
        _map = map ? map : {
      num: '密码解锁',
      hand: '手势解锁',
      finger: '指纹解锁'
    };
    switch (this.OS.type) {
      case 'dd':
      case 'android':
        if (type == 1) {
          arr = [{
            pwd_type: 'num',
            label: _map['num']
          }, {
            pwd_type: 'hand',
            label: _map['hand']
          }];
        } else {
          arr = list.filter(function (o) {
            return o.enable == '1' && (o.pwd_type == 'hand' || o.pwd_type == 'num');
          });
        }
        break;
      case 'ios':
        if (type == 1) {
          arr = [{
            pwd_type: 'num',
            label: _map['num']
          }, {
            pwd_type: 'hand',
            label: _map['hand']
          }];
          if (this.OS.fingerAllow) {
            arr.push({
              pwd_type: 'finger',
              label: _map['finger']
            });
          }
        } else {
          arr = list.filter(function (o) {
            if (o.pwd_type == 'finger') {
              return _this2.OS.fingerAllow && o.enable == '1';
            } else {
              return o.enable == '1';
            }
          });
        }
        break;
      default:
        if (type == 1) {
          arr = [{
            pwd_type: 'num',
            label: _map['num']
          }, {
            pwd_type: 'hand',
            label: _map['hand']
          }];
        } else {
          arr = list.filter(function (o) {
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
  log: function log(path, value) {
    switch (this.OS.type) {
      case 'dd':
      case 'wechat':
        //TODO 如何记录日志
        $.get('./error?value=' + value);
        break;
      case 'android':
      case 'ios':
        this.callNative({
          method: 'log',
          path: path,
          value: value
        });
        break;
      default:
        $.get('./error?value=' + value);
        break;
    }
  },
  getSystemInfo: function getSystemInfo(callback) {
    var json = {
      success: true,
      device: ''
    };
    switch (this.OS.type) {
      case 'dd':
        DdCore.getUUID(function (result) {
          if (result) {
            json.device = result.uuid;
          }
          callback && callback(json);
        });
        break;
      case 'wechat':
        var openId = this.getCache('openId');
        json.device = openId;
        callback && callback(json);
        break;
      case 'lanxin':
        callback && callback({
          device: this.getCache('openId')
        });
        break;
      case 'android':
      case 'ios':
        this.callNative("getSystemInfo", function (result) {
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
  getGPS: function getGPS(params, callback) {
    var opts = Object.assign({}, {
      method: 'getGPS'
    }, params);
    switch (this.OS.type) {
      case 'dd':
        var recode = params.recode;
        DdCore.getGPS(recode, function (res) {
          var json = Object.assign({}, {
            success: true
          }, res);
          callback && callback(json);
        });
        break;
      case 'wechat':
        WeCore.getGPS(function (res) {
          var json = {
            success: false
          };
          if (res != null) json = Object.assign({}, {
            success: true
          }, res);
          callback && callback(json);
        });
        break;
      case 'lanxin':
        LxCore.getGPS(function (res) {
          var json = {
            success: false
          };
          if (res != null) json = Object.assign({}, {
            success: true
          }, res);
          callback && callback(json);
        });
        break;
      case 'android':
      case 'ios':
        this.callNative(opts, function (json) {
          callback && callback(json);
        });
        break;
      case 'h5':
        MapCore.getGPS(function (res) {
          var json = Object.assign({}, {
            success: true
          }, res);
          callback && callback(json);
        });
        break;
    }
  },


  /**
   * 获取WiFi
   * @param  {Func} callback 回调函数
   */
  getWiFi: function getWiFi(callback) {
    switch (this.OS.type) {
      case 'dd':
        DdCore.getWiFi(function (res) {
          var json = {
            mac: res.macIp,
            name: res.ssid
          };
          if (callback) callback(json);
        });
        break;
      case 'wechat':
        WeCore.getWifi(function (res) {
          var json = {};
          if (res.BSSID) {
            json.mac = res.BSSID.toLowerCase();
            json.name = res.SSID;
          }
          callback && callback(json);
        });
        break;
      case 'lanxin':
        LxCore.getWifi(function (res) {
          var json = {};
          if (res.bssid) {
            json.mac = res.bssid.toLowerCase();
            json.name = res.ssid;
          }
          callback && callback(json);
        });
        break;
      case 'android':
      case 'ios':
        this.callNative({
          method: 'getWiFi'
        }, function (json) {
          if (json.mac) {
            var arr = [],
                tempArr = json.mac.split(':');
            for (var k in tempArr) {
              if (tempArr[k].length == 1) tempArr[k] = "0" + tempArr[k];
              arr.push(tempArr[k]);
            }
            json.mac = arr.join(':');
          }
          if (callback) callback(json);
        });
        break;
    }
  },


  /**
   * 获取蓝牙
   * @param  {Func} callback 回调函数
   */
  getBlueTooth: function getBlueTooth(params, callback) {
    switch (this.OS.type) {
      case 'wechat':
        WeCore.getBluetooth(params, function (data) {
          if (callback) {
            callback(data);
          }
        });
        break;
      case "android":
      case "ios":
        this.callNative({
          method: "getBlueTooth"
        }, function (json) {
          callback && callback(json);
        });
        break;
      default:
        if (callback) {
          callback({ success: true, list: [] });
        }
        break;
    }
  }
};

if (window.Native === undefined) {
  window.Native = Native;
}

var index = window.Native;

exports.Native = index;
