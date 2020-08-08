/**
 * 蓝信API
 * @author Groot.xie
 */
'use strict'
import { getQueryString } from '../_utils/base_util'
const cookiePrefix = 'LOGIN_LANXIN_'
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
    } catch (e) { }
    return result
  } else return null
}

/**
 * 设置cookie
 */
function setCookie(name, value, seconds) {
  seconds = seconds || 0
  var expires = ""
  if (seconds != 0) {      //设置cookie时间
    var date = new Date()
    date.setTime(date.getTime() + (seconds * 1000))
    expires = "; expires=" + date.toGMTString()
  }
  document.cookie = cookiePrefix + name + "=" + escape(value) + expires + "; path=/"
}

export default {
  url: '', //接口前缀
  /**
   * 判断蓝信是否可以免密登录
   * @param callback 回调函数
   */
  isAutoLogin(callback) {
    let customerCode = getQueryString('customerCode')
    let openId = getQueryString('code')
    if (customerCode) {
      setCookie('customerCode', customerCode)
    }
    if (openId) {
      setCookie('code', openId)
    }

    this.checkAutoLogin(callback)
  },
  // 判断是否可以免密登录
  checkAutoLogin(callback) {
    const checkUrl = '/platform/wechat/wechatCheckLogin.nolog'
    let param = {
      code: this.getLanxinCode(),
      customerCode: this.getCustomerCode(),
      type: '3'
    }

    axios.post(checkUrl, param).then(res => {
      if (res && res.user && res.user.openId) {
        setCookie('openId', res.user.openId)
      }
      callback(res)
    })
  },
  // 登出
  logOut(callback) {
    const loginOutUrl = '/platform/wechat/wechatLogOut.nolog'
    let param = {
      openId: this.getOpenId(),
      customerCode: this.getCustomerCode(),
      type: '3'
    }

    axios.post(loginOutUrl, param).then(res => {
      callback && callback(res)
    })
  },
  /**
   * 获取GPS定位
   * @param callback
   */
  getGPS(callback) {
    lx.getLocation({
      type: 'gcj02',
      success: res => callback && callback(res),
      fail: err => callback && callback(null)
    })
    return
    if (this.getOS() === 'android') {
      // TODO 安卓
      // this.getSign((configRes) => {
      //   this.setConfig(configRes, () => {
      //     wx.getLocation({
      //       type: 'gcj02',
      //       success: (res) => {
      //         callback && callback(res)
      //       },
      //       fail: () => {
      //         callback && callback(null)
      //       }, 
      //     })
      //   })
      // })
    } else {
      lx.getLocation({
        type: 'gcj02',
        success: res => {
          callback && callback(res)
        },
        fail: err => {
          callback && callback(null)
        }
      })
    }
  },
  getWifi(callback) {
    lx.wifiDeviceInfo({
      success: res => callback(res),
      fail: () => callback({})
    })
  },
  // 获取CustomerCode
  getCustomerCode() {
    return getQueryString('customerCode') || getCookie('customerCode')
  },
  // 获取code
  getLanxinCode() {
    return getQueryString('code') || getCookie('code')
  },
  // 获取openId
  getOpenId() {
    return getCookie('openId')
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
}