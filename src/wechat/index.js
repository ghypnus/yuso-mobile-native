/**
 * 微信API
 * @author john.gao
 */
'use strict'
import { getQueryString } from '../_utils/base_util'
var cookiePrefix = 'LOGIN_WECHAT_';
/**
 * 获取cookie
 */
function getCookie(name) {
  var arr,
    reg = new RegExp('(^| )' + cookiePrefix + name + '=([^;]*)(;|$)')
  if ((arr = document.cookie.match(reg))) {
    var result = null
    try {
      result = decodeURIComponent(arr[2])
    } catch (e) {
      result = arr[2]
    }
    try {
      result = JSON.parse(result)
    } catch (e) {}
    return result
  } else return null
}

/**
 * 设置cookie
 */
function setCookie(name, value, seconds) {
  seconds = seconds || 0;
  var expires = "";
  if (seconds != 0 ) {      //设置cookie时间
    var date = new Date();
    date.setTime(date.getTime()+(seconds*1000));
    expires = "; expires="+date.toGMTString();
  }
  document.cookie = cookiePrefix + name+"="+escape(value)+expires+"; path=/";
}

export default {
  url: '', //接口前缀
  
  /**
   * 判断微信是否可以免密登录
   * @param callback 回调函数
   */
  isAutoLogin(callback) {

    let wechatType = getQueryString('type');
    if (wechatType === '2') {
      //企业微信
      setCookie('wechatType', 'corp')
    } 
    let customerCode = getQueryString('customerCode');
    if (customerCode) {
      setCookie('customerCode', customerCode)
    } 
    let openId = getQueryString('code');
    if (openId) {
      setCookie('code', openId)
    } 

    this.getSign((configRes) => {
      this.setConfig(configRes, () => {
        this.checkAutoLogin(callback)
      })
    })
  },
  /**
   * 获取Customer Code
   */
  getCustomerCode() {
    return getCookie('customerCode')
  },
  /**
   * 获取wechatType
   */
  getWechatType() { 
    return getCookie('wechatType')
  },
  /**
   * 获取code
   */
  getWechatCode() {
    return getCookie('code')
  },
  /**
   * 获取openId
   */
  getOpenId() {
    return getCookie('openId')
  },

  /**
   * 向自身服务器请求获取配置参数
   */
  getSign(callback) {
    var param = {
      url: location.href.split('#')[0],
    }
    var wechatType = this.getWechatType()
    var configUrl = '/platform/wechat/wechatSign.nolog'
    param.customerCode = this.getCustomerCode()
    param.type = wechatType === 'corp' ? '2': '1'
    
    axios.post(configUrl, param).then((data) => {
      if (callback) {
        callback(data)
      }
    })
  },

  setConfig(data, callback) {
    wx.config({
      debug: !!data.debug,
      appId: data.appId,
      timestamp: data.timestamp,
      nonceStr: data.nonceStr,
      signature: data.signature,
      jsApiList: data.jsApiList || [
        'getLocation',
        'onHistoryBack',
        'closeWindow',
      ],
    })
    wx.ready(() => {
      if (callback) {
        callback()
      }
    })
  },

  /**
   * 第三步：判断是否可以免密登录
   */
  checkAutoLogin(callback) {
    var param = { code: this.getWechatCode() }
    var checkUrl = '/platform/wechat/wechatCheckLogin.nolog';
    var wechatType = this.getWechatType()
    
    param.customerCode = this.getCustomerCode()
    param.type = wechatType === 'corp' ? '2': '1'
    axios.post(checkUrl, param).then(res => { 
      if (res && res.user && res.user.openId) { 
        setCookie('openId', res.user.openId)
      }
      callback(res)
    })
  },

  logOut(callback) { 
    var param = {
      openId: this.getOpenId(),
      type: this.getWechatType() === 'corp' ? '2' : '1',
      customerCode: this.getCustomerCode()
    }
    var loginOutUrl = '/platform/wechat/wechatLogOut.nolog'
    axios.post(loginOutUrl, param).then(res => { 
      callback && callback(res)
    })
  },

  getOS() {
    let result = ''
    let u = navigator.userAgent
    if (u.indexOf('Android') > -1) {
      result = 'android'
    } else if (!!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
      result = 'ios'
    }
    return result
  },

  /**
   * 获取GPS定位
   * @param callback
   */
  getGPS(callback) {
    if (this.getOS() === 'android') {
      this.getSign((configRes) => {
        this.setConfig(configRes, () => {
          wx.getLocation({
            type: 'gcj02',
            success: (res) => {
              callback && callback(res)
            },
            fail: () => {
              callback && callback(null)
            },
          })
        })
      })
    } else {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          callback && callback(res)
        },
        fail: () => {
          callback && callback(null)
        },
      })
    }
  },
  openBluetoothAdapter(callback) {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.info('openBluetoothAdapter success', res)
        callback({ ...res, ...{ isSuccess: true } })
      },
      fail: (errMsg) => {
        callback({ ...errMsg, ...{ isSuccess: false } })
      },
    })
  },
  getWifi(callback) {
    var wechatType = this.getWechatType()
    if (wechatType === 'corp') {
      var self = this
      self.getSign((configRes) => {
        configRes.jsApiList = ['startWifi', 'getConnectedWifi']
        self.setConfig(configRes, () => {
          wx.startWifi({
            success: (res) => {
              console.info('startWifi success', res)
              wx.getConnectedWifi({
                success: (res) => {
                  console.log('getConnectedWifi success', res)
                  callback(res.wifi)
                },
                fail: (res) => {
                  console.log('getConnectedWifi fail', res)
                  callback({})
                },
              })
            },
            fail: (res) => {
              console.log('startWifi fail', res)
              callback({})
            },
          })
        })
      })
    } else {
      callback({})
    }
  },
  /**
   * 企业微信: 获取蓝牙设备列表
   */
  getBluetooth(params, callback) {
    var wechatType = this.getWechatType()
    if (wechatType === 'corp') {
      var self = this
      self.getSign((configRes) => {
        var _param = {
          ...configRes,
          ...{
            jsApiList: [
              'openBluetoothAdapter',
              'startBeaconDiscovery',
              'stopBeaconDiscovery',
              'onBeaconUpdate',
            ],
          },
        }
        self.setConfig(_param, () => {
          self.getBluetoothCount = 0
          self.openBluetoothAdapter((data) => {
            if (data.isSuccess) {
              self.isBluetoothStopping = false
              self.isBluetoothStoped = false
              wx.startBeaconDiscovery({
                uuids: params.uuids, //参数uuid
                success: (res) => {
                  console.info('startBeaconDiscovery success', res)
                  //监听 iBeacon 设备的更新事件
                  wx.onBeaconUpdate((data) => {
                    console.info('onBeaconUpdate update', data)
                    self.beacons = data.beacons
                    if (!self.isBluetoothStopping) {
                      self.isBluetoothStopping = true
                      wx.stopBeaconDiscovery({
                        success: () => {
                          callback({
                            success: true,
                            list: this.beacons,
                          })
                          self.isBluetoothStoped = true
                          self.isBluetoothStopping = false
                        },
                      })
                    }
                  })
                },
                complete: (res) => {
                  setTimeout(() => {
                    console.info(
                      'complete',
                      self.isBluetoothStopping,
                      self.isBluetoothStoped,
                      res
                    )
                    if (!self.isBluetoothStoped) {
                      wx.stopBeaconDiscovery()
                    }
                  }, 10000)
                },
                fail: (errMsg) => {
                  console.info(
                    'startBeaconDiscovery fail',
                    self.isBluetoothStopping,
                    self.isBluetoothStoped,
                    errMsg
                  )
                  wx.stopBeaconDiscovery()
                  callback({
                    success: false,
                    error: errMsg,
                  })
                },
              })
            } else {
              callback({
                success: false,
                error: '请开启蓝牙',
              })
            }
          })
        })
      })
    } else {
      callback([])
    }
  },

  setEvent(callback) {
    wx.ready(function () {
      try {
        wx.onHistoryBack(function () {
          callback && callback()
          return false
        })
      } catch (err) {
        console.warn(`${err}, 请使用企业微信平台登录`)
      }
    })
  },

  close() {
    wx.closeWindow()
  },
}
