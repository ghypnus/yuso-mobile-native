/**
 * 钉钉UI调整
 * @author john.gao
 */
'use strict';

//TODO 标题设置需要兼容新的APP

export default {
  /**
   * 设置标题
   * @param title 标题
   */
  setTitle(title) {
    dd.biz.navigation.setTitle({
      title: title
    });
    let setText = $.i18n["my_setTitle"],
      searchText = $.i18n["search"],
      toRoute = "",
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
      onSuccess: (result) => {
        // history.push(targetRoute);
      }
    })
  },

  /**
   * 钉钉返回按钮事件
   */
  setEvent(callback) {
    dd.ready(() => {
      if (navigator.userAgent.indexOf('Android') > -1) {
        //android 返回按钮事件
        document.addEventListener('backbutton', (e) => {
          e.preventDefault();
          callback();
        }, false);
      } else {
        //ios 返回按钮事件
        dd.biz.navigation.setLeft({
          show: true,
          control: true,
          showIcon: true,
          onSuccess: (result) => {
            callback();
          }
        });
      }
    });
  },

  /**
   * 关闭微应用
   */
  close() {
    dd.biz.navigation.close();
  }
}