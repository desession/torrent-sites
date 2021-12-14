<template>
  <div>
    <p>Torrent Sites</p>
<div v-if="typeof(checked) === 'boolean'">
  <p v-if="checked">ready, wait some minutes, it takes some time for all the torrents to show up, if it does not show up, then no one might be seeding the torrent</p>
  <p v-if="!checked">not ready, give it a minute, doing some checks and updating everything</p>
</div>
<div v-else>
    <p>ready to go</p>
</div>
<div v-if="counted">
  <p><span v-if="counted.torrents">torrents: {{counted.torrents}}</span><span v-else>torrents: 0</span> | synced: {{counted.torrents === counted.properties}} | <span v-if="counted.properties">properties: {{counted.properties}}</span><span v-else>properties: 0</span></p>
</div>
<div>
  <form @submit.prevent="publish" style="margin: 20px auto;">
    <input type="text" placeholder="folder, required" v-model="folderText">
    <input type="text" placeholder="address, optional" v-model="addressText">
    <input type="text" placeholder="secret, optional" v-model="secretText">
    <input type="text" placeholder="sequence, optional" v-model="sequenceText">
    <button type="submit">publish</button>
  </form>
</div>
<div style="margin: 20px auto;">
  <form @submit.prevent="resolve">
    <input type="text" placeholder="address required" v-model="resolveText">
    <button type="submit">resolve</button>
  </form>
</div>
<div style="margin: 10px auto;">
  <p v-if="extraText">{{extraText}}</p>
  <p v-else>no extra data has come in yet</p>
</div>
<div style="margin: 10px auto;">
  <p v-if="errorText">{{errorText}}</p>
  <p v-else>no errors has happened yet</p>
</div>
<div v-if="torPropsPaginatedData && torPropsPaginatedData.length" id="torProps">
  <div v-for="(torrent, index) in torPropsPaginatedData" :key="index" style="margin: 30px auto;">
    <div v-if="typeof(torrent) === 'string'">
      <p>{{torrent}} is loading, might take some time</p>
    </div>
    <div v-else>
    <p @click="torrent.show = !torrent.show" v-if="torrent.address">address: {{torrent.address}}</p>
    <div v-if="torrent.show">
      <!-- <p>{{torrent}}</p> -->
      <div v-if="torrent.secret">
        <p>{{torrent.secret}}</p>
        <p><button @click="delete torrent.secret">Hide Secret</button>make sure you copy it, once you hide it, it is gone</p>
      </div>
      <p>magnet: {{`magnet:?xs=urn:btpk:${torrent.address}`}}</p>
      <p>infohash: {{torrent.infohash}}</p>
      <p>sequence: {{torrent.sequence}}</p>
      <p>active: {{torrent.active}}</p>
      <p>signed: {{torrent.signed}}</p>
      <p>path: {{torrent.path}}</p>
      <p>folder: {{torrent.path + sep + torrent.name}}</p>
      <div v-if="torrent.stuff">
        <p v-for="(data, i) in torrent.stuff" :key="i">{{data}}</p>
      </div>
      <p><button @click="remove(torrent.address)">remove</button></p>
      <p v-if="torrent.error">{{torrent.error}}</p>
    </div>
    </div>
  </div>
<div>
<button :disabled="torPropsCurrentPage === 0" @click="torPropsPrevPage">Previous</button>
<button :disabled="torPropsCurrentPage >= torPropsPageCount - 1" @click="torPropsNextPage">Next</button>
</div>
</div>
<div v-else style="margin: 30px auto;">
  <p>either no torrent or loading torrents</p>
</div>
  </div>
</template>

<script>
import {ref, computed} from 'vue'
import {ipcRenderer} from 'electron'

export default {
  name: 'App',
  setup(){
    setInterval(() => {
      ipcRenderer.send('counted', true)
    }, 30000)
    function resolve(){
      if(resolveText.value){
        torProps.value.push(resolveText.value)
        ipcRenderer.send('resolve', resolveText.value)
        resolveText.value = ''
      }
    }
    function publish(){
      if(folderText.value){
        torProps.value.push(folderText.value)
        ipcRenderer.send('publish', {folder: folderText.value, sequence: Number.isInteger(Number(sequenceText.value)) ? Number(sequenceText.value) : 0, address: addressText.value, secret: secretText.value})
        folderText.value = ''
        sequenceText.value = ''
        addressText.value = ''
        secretText.value = ''
      }
    }
    function remove(address){
      if(address){
        ipcRenderer.send('remove', address)
      }
    }
    function torPropsNextPage(){
      torPropsCurrentPage.value++
    }
    function torPropsPrevPage(){
      torPropsCurrentPage.value--
    }
      const torPropsPageCount = computed(() => {
      let l = torProps.value.length
      let s = torPropsSize.value
      return Math.ceil(l/s);
    })
    const torPropsPaginatedData = computed(() => {
      return torProps.value.slice(torPropsCurrentPage.value * torPropsSize.value, (torPropsCurrentPage.value * torPropsSize.value) + torPropsSize.value);
    })
    const torPropsCurrentPage = ref(0)
    const torPropsSize = ref(10)
    const tempUpdated = ref()
    const tempDeactivated = ref()
    const folderText = ref('')
    const sequenceText = ref('')
    const addressText = ref('')
    const secretText = ref('')
    const resolveText = ref('')
    const errorText = ref(null)
    const torProps = ref([])
    const sep = ref('/')
    const counted = ref({})
    const checked = ref(null)
    const extraText = ref("")
    ipcRenderer.send('start', true)
    ipcRenderer.on('start', (event, data) => {
      sep.value = data
    })
    ipcRenderer.on('error', (event, data) => {
      errorText.value = data
      setTimeout(() => {
        errorText.value = null
      }, 5000)
    })
    ipcRenderer.on('more', (event, data) => {
      extraText.value = data
      setTimeout(() => {
        extraText.value = ""
      }, 5000)
    })
    ipcRenderer.on('checked', (event, data) => {
      checked.value = data
    })
    ipcRenderer.on('counted', (event, data) => {
      counted.value = data.res
    })
    ipcRenderer.on('updated', (event, data) => {
      let iter = null
      for(let i = 0;i < torProps.value.length;i++){
        if(torProps.value[i].address === data.address){
          iter = i
          break
        }
      }
      if(Number.isInteger(iter)){
        torProps.value.splice(iter, 1, data)
      } else {
        torProps.value.push(data)
      }
    })
    ipcRenderer.on('deactivated', (event, data) => {
      let iter = null
      for(let i = 0;i < torProps.value.length;i++){
        if(torProps.value[i].address === data.address){
          iter = i
          break
        }
      }
      if(Number.isInteger(iter)){
        torProps.value.splice(iter, 1, data)
      } else {
        torProps.value.push(data)
      }
    })
    ipcRenderer.on('same', (event, data) => {
      let iter = null
      for(let i = 0;i < torProps.value.length;i++){
        if(torProps.value[i].address === data.address){
          iter = i
          break
        }
      }
      if(Number.isInteger(iter)){
        torProps.value.splice(iter, 1, data)
      } else {
        torProps.value.push(data)
      }
    })
    ipcRenderer.on('frozen', (event, data) => {
      let iter = null
      for(let i = 0;i < torProps.value.length;i++){
        if(torProps.value[i].address === data.address){
          iter = i
          break
        }
      }
      if(Number.isInteger(iter)){
        torProps.value.splice(iter, 1, data)
      } else {
        torProps.value.push(data)
      }
    })
    ipcRenderer.on('removed', (event, data) => {
      let iter = null
      for(let i = 0;i < torProps.value.length;i++){
        if(torProps.value[i].infohash === data){
          iter = i
          break
        }
      }
      if(Number.isInteger(iter)){
        torProps.value.splice(iter, 1)
      }
    })
    ipcRenderer.on('errorPub', (event, data) => {
      let iter = torProps.value.indexOf(data.main)
      torProps.value.splice(iter, 1, data.res)
      setTimeout(() => {
        torProps.value.splice(iter, 1)
      }, 5000)
    })
    ipcRenderer.on('errorRes', (event, data) => {
      let iter = torProps.value.indexOf(data.main)
      torProps.value.splice(iter, 1, data.res)
      setTimeout(() => {
        torProps.value.splice(iter, 1)
      }, 5000)
    })
    ipcRenderer.on('errorRem', (event, data) => {
      let iter = null
      for(let i = 0;i < torProps.value.length;i++){
        if(torProps.value[i].address === data.main){
          iter = i
          break
        }
      }
      if(Number.isInteger(iter)){
        torProps.value[iter].error = data.res
        setTimeout(() => {
          delete torProps.value[iter].error
        }, 5000)
      }
    })
    ipcRenderer.on('publish', (event, data) => {
      data.res.show = true
      data.res.alt = false
      torProps.value.splice(torProps.value.indexOf(data.main), 1, data.res)
    })
    ipcRenderer.on('resolve', (event, data) => {
      data.res.show = true
      data.res.alt = false
      torProps.value.splice(torProps.value.indexOf(data.main), 1, data.res)
    })
    ipcRenderer.on('remove', (event, data) => {
      let iter = null
      for(let i = 0;i < torProps.value.length;i++){
        if(torProps.value[i].address === data.main){
          iter = i
          break
        }
      }
      torProps.value.splice(iter, 1)
    })
    return {
      torProps,
      folderText,
      sequenceText,
      addressText,
      secretText,
      resolveText,
      errorText,
      resolve,
      publish,
      tempUpdated,
      tempDeactivated,
      remove,
      torPropsCurrentPage,
      torPropsNextPage,
      torPropsPageCount,
      torPropsPaginatedData,
      torPropsPrevPage,
      torPropsSize,
      sep,
      counted,
      checked,
      extraText
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
