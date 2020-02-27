import Vue from 'vue'
import App from './App.vue'
import Chat from './components/beautiful-chat/index'
// import Chat from './../../dist/index'
import vmodal from 'vue-js-modal'
import VueResource from 'vue-resource';

Vue.use(vmodal , { dialog: true })
Vue.use(Chat, {})
Vue.use(VueResource);

// eslint-disable-next-line
new Vue({
  el: '#app',
  render: h => h(App)
})
