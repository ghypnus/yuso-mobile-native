/**
 * 判断是否为空对象
 * @param  {Object}  obj 对象
 * @return {Boolean}     true or false
 */
export const isEmptyObject = obj => {
  return obj === undefined || obj === null || Object.keys(obj).length === 0 ? true : false;
}

/**
 * 地址栏参数
 * @param {string} name 参数名称
 */
export const getQueryString = name => {
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

/**
* 处理数值小数点位数
* @param numberRound
* @param roundDigit
* @return {number}
*/
export const round = (numberRound, roundDigit) => {
  if (numberRound >= 0) {
    var tempNumber = parseInt((numberRound * Math.pow(10, roundDigit) + 0.5)) / Math.pow(10, roundDigit);
    return tempNumber;
  } else {
    var numberRound1 = -numberRound;
    var tempNumber = parseInt((numberRound1 * Math.pow(10, roundDigit) + 0.5)) / Math.pow(10, roundDigit);
    return -tempNumber;
  }
}