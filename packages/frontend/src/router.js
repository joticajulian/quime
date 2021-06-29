import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import ImportPage from './views/ImportPage.vue'
import MonthReportPage from './views/MonthReportPage.vue'
import ListRecordsPage from './views/ListRecordsPage.vue'
import UpdateRecordPage from './views/UpdateRecordPage.vue'
import SettingsPage from './views/SettingsPage.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/import',
      name: 'import',
      component: ImportPage
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage
    },
    {
      path: '/months/:idMonth',
      name: 'month reports',
      component: MonthReportPage,
      props: route => ({
        incomesPage: route.query.type === "incomes",
        assetsPage: route.query.type === "assets"
      })
    },
    {
      path: '/months/:idMonth/:idAccount',
      name: 'month-account report',
      component: ListRecordsPage,
    },
    {
      path: '/newRecord',
      name: 'month-account report',
      component: UpdateRecordPage,
    },
    {
      path: '/editRecord',
      name: 'month-account report',
      component: UpdateRecordPage,
      props: route => ({
        id: route.query.id,
      })
    }
  ]
})
