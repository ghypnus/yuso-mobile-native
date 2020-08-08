/**
 * 高德API
 * @author john.gao
 */
'use strict';

export default {
  /**
  * 获取GPS定位
  * @param callback
  */
  getGPS(callback) {
    let map,
      geolocation;
    map = new AMap.Map('');
    map.plugin('AMap.Geolocation', ()=> {
      geolocation = new AMap.Geolocation({
        enableHighAccuracy: true, //是否使用高精度定位，默认:true
        timeout: 10000, //超过10秒后停止定位，默认：无穷大
      });
      map.addControl(geolocation);
      geolocation.getCurrentPosition();
      AMap.event.addListener(geolocation, 'complete', (data)=> {
        callback && callback({
          longitude: data.position.getLng(),
          latitude: data.position.getLat()
        })
      })
      AMap.event.addListener(geolocation, 'error', function (data) {
        callback && callback();
      })
    })
  }
}