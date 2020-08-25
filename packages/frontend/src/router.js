import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import ReportsPage from './views/ReportsPage.vue'
import MonthReportPage from './views/MonthReportPage.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/dashboard',
      name: 'reports',
      component: ReportsPage
    },
    {
      path: '/months/:index/:type',
      name: 'month reports',
      component: MonthReportPage,
      props: route => ({
        incomesPage: route.params.type === "incomes",
        assetsPage: route.params.type === "assets"
      })
    }
  ]
})
