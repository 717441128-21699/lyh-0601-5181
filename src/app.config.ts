export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/analysis/index',
    'pages/community/index',
    'pages/mine/index',
    'pages/record/index',
    'pages/diary-detail/index',
    'pages/post-create/index',
    'pages/warning/index',
    'pages/settings/index',
    'pages/monthly-report/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFF8F5',
    navigationBarTitleText: '心语日记',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#B2BEC3',
    selectedColor: '#FF9B7B',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/analysis/index',
        text: '分析'
      },
      {
        pagePath: 'pages/community/index',
        text: '社区'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
