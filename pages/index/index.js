const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const user = require('../../utils/user.js');

//获取应用实例
const app = getApp();

Page({
  data: {
    newGoods: [],
    hotGoods: [],
    topics: [],
    brands: [],
    groupons: [],
    floorGoods: [],
    banner: [],
    channel: [],
    coupon: [],
    goodsCount: 0,
    categorys: [],
    tabIndex: 0,
    productList: []
  },

  onShareAppMessage: function() {
    return {
      title: '互联网千篇一律，为什么不让TA充满个性',
      desc: '互联网千篇一律，为什么不让TA充满个性',
      path: '/pages/index/index'
    }
  },

  onPullDownRefresh() {
    wx.showNavigationBarLoading() //在标题栏中显示加载
    this.getIndexData();
    this.getCategoryInfo();
    wx.hideNavigationBarLoading() //完成停止加载
    wx.stopPullDownRefresh() //停止下拉刷新
  },

  getIndexData: function() {
    let that = this;
    util.request(api.IndexUrl).then(function(res) {
      if (res.errcode === '0') {
        that.setData({
          newGoods: res.data.newGoodsList,
          hotGoods: res.data.hotGoodsList,
          topics: res.data.topicList,
          brands: res.data.brandList,
          floorGoods: res.data.floorGoodsList,
          banner: res.data.banner,
          groupons: res.data.grouponList,
          channel: res.data.channel,
          coupon: res.data.couponList
        });
      }
    });
    util.request(api.GoodsCount).then(function (res) {
      that.setData({
        goodsCount: res.data
      });
    });
  },
  onLoad: function(options) {
    var that = this;
    // 页面初始化 options为页面跳转所带来的参数
    if (options.scene) {
      //这个scene的值存在则证明首页的开启来源于朋友圈分享的图,同时可以通过获取到的goodId的值跳转导航到对应的详情页
      var scene = decodeURIComponent(options.scene);
      console.log("scene:" + scene);

      let info_arr = [];
      info_arr = scene.split(',');
      let _type = info_arr[0];
      let id = info_arr[1];

      if (_type == 'goods') {
        wx.navigateTo({
          url: '../goods/goods?id=' + id
        });
      } else if (_type == 'groupon') {
        wx.navigateTo({
          url: '../goods/goods?grouponId=' + id
        });
      } else {
        wx.navigateTo({
          url: '../index/index'
        });
      }
    }

    // 页面初始化 options为页面跳转所带来的参数
    if (options.grouponId) {
      //这个pageId的值存在则证明首页的开启来源于用户点击来首页,同时可以通过获取到的pageId的值跳转导航到对应的详情页
      wx.navigateTo({
        url: '../goods/goods?grouponId=' + options.grouponId
      });
    }

    // 页面初始化 options为页面跳转所带来的参数
    if (options.goodId) {
      //这个goodId的值存在则证明首页的开启来源于分享,同时可以通过获取到的goodId的值跳转导航到对应的详情页
      wx.navigateTo({
        url: '../goods/goods?id=' + options.goodId
      });
    }

    // 页面初始化 options为页面跳转所带来的参数
    if (options.orderId) {
      //这个orderId的值存在则证明首页的开启来源于订单模版通知,同时可以通过获取到的pageId的值跳转导航到对应的详情页
      wx.navigateTo({
        url: '../ucenter/orderDetail/orderDetail?id=' + options.orderId
      });
    }

    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          scrollHeight: res.windowHeight  - 84* res.pixelRatio
        });
      }
    })

    this.getIndexData();
    this.getCategoryInfo();
  },
  getCategoryInfo: function() {
    let that = this;
    util.request(api.GoodsCategory, {
        id: 1036008 // 首页分类
      })
      .then(function(res) {

        if (res.errcode == "0") {

          var categorys = []
          for(var i = 0; i < res.data.brotherCategory.length; i++){
            categorys[i] = {}
            categorys[i].id = res.data.brotherCategory[i].id
            categorys[i].products = []
            categorys[i].pageNum = 1
            categorys[i].pageSize = 10
            categorys[i].lastPage = false
            categorys[i].nav = res.data.brotherCategory[i]
          }

          that.setData({
            categorys: categorys
          })


        } else {
          //显示错误信息
        }
      });
  },
  getGoodsList: function() {
    let that = this;

    let category = that.data.categorys[this.data.tabIndex - 1]

    util.request(api.GoodsList, {
        categoryId: category.id,
        pageNum: category.pageNum,
        pageSize: category.pageSize
      }, "POST")
      .then(function(res) {
        if (res.errcode === '0') {
          var products = category.products;
          products = products.concat(res.data.list)
          that.data.categorys[that.data.tabIndex - 1].products = products

          that.setData({
            categorys: that.data.categorys
          })

          if(res.data.list.length < category.pageSize){
            category.lastPage = true
          }
        }
      });
  },
  onReachBottom() {
    if(this.data.tabIndex == 0){
      return false;
    }

    var categoryProduct = this.data.categorys[this.data.tabIndex - 1];

    if(categoryProduct.lastPage){
      wx.showToast({
        title: '没有更多商品了',
        icon: 'none',
        duration: 2000
      });
      return false;
    }else{
      categoryProduct.pageNum = categoryProduct.pageNum + 1
      this.getGoodsList();
    }
  },
  onReady: function() {
    // 页面渲染完成
  },
  onShow: function() {
    // 页面显示
  },
  onHide: function() {
    // 页面隐藏
  },
  onUnload: function() {
    // 页面关闭
  },
  getCoupon(e) {
    if (!app.globalData.hasLogin) {
      wx.navigateTo({
        url: "/pages/auth/login/login"
      });
    }

    let couponId = e.currentTarget.dataset.index
    util.request(api.CouponReceive, {
      couponId: couponId
    }, 'POST').then(res => {
      if (res.errcode === '0') {
        wx.showToast({
          title: "领取成功"
        })
      }
      else{
        util.showErrorToast(res.errmsg);
      }
    })
  },
  switchCate: function(event) {
    if(event.detail.index == 0){
      this.data.tabIndex = 0
      return false;
    }

    this.data.tabIndex = event.detail.index;
    this.data.id = this.data.categorys[this.data.tabIndex - 1].id;
    if(this.data.categorys[this.data.tabIndex - 1].products.length > 0){
      return false;
    }

    this.getGoodsList();
  }
})