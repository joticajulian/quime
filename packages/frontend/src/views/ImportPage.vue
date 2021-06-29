<template>
  <div>
    <b-modal ref="modalUpload" hide-footer title="Leer archivo">
      <ListRecords :records="fileRecords" :accounts="$store.state.accounts"/>
      <button class="btn btn-primary mt-3" @click="insertRecords(fileRecords)">Insert</button>
    </b-modal>

    <AppHeader back="/months/0?type=incomes"/>
    <div class="container-fluid mt-5">
      <div class="row">
        <div class="col-md-9">
          <div class="custom-file">            
            <input type="file" class="custom-file-input" id="input_file" :class="{'is-invalid': error.file }"/>
            <label class="custom-file-label" for="input_file">Choose file...</label>
            <div v-if="error.file" class="invalid-feedback">{{ errorText.file }}</div>
            <button class="btn btn-primary mt-3 mb-3 mr-3" @click="uploadFile">Upload</button>
          </div>
          <Alerts ref="alerts"></Alerts>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import stateDev from '@/assets/stateDev.json'
import dbDev from '@/assets/dbDev.json'
import accountsDev from '@/assets/accountsDev.json'
import axios from 'axios'
import Database from "@/mixins/Database";
import AppHeader from '@/components/AppHeader'
import ListRecords from '@/components/ListRecords'
// import FormRecord from "@/components/FormRecord"
import Alerts from "@/components/Alerts"
import config from '@/config'
import Utils from "@/mixins/Utils"

let callApi;

export default{
  name: 'ImportPage',
  data(){
    return {
      loaded: false,
      fileRecords: [],
      error: {
        file: false,
      },
      errorText: {
        file: "",
      },
    }
  },

  mounted() {
    let timer = setInterval(()=>{
      if(this.dbLoaded) {
        this.assets = this.$store.state.accounts.filter(a => a.type === "asset");
        this.liabilities = this.$store.state.accounts.filter(a => a.type === "liability");
        this.incomes = this.$store.state.accounts.filter(a => a.type === "income");
        this.expenses = this.$store.state.accounts.filter(a => a.type === "expense");
        this.loaded = true;
        clearInterval(timer);
      }
    }, 100);
  },

  components: {
    AppHeader,
    ListRecords,
    //FormRecord,
    Alerts,
  },

  mixins:[
    Utils,
    Database,
  ],

  methods: {
    async insertRecords(records) {
      console.log("insert records")
      console.log(records)
      this.$refs.alerts.hideAlerts()
      
      try{
        var result = await callApi.put("/", records);
        console.log(result.data)
        this.$refs.alerts.showSuccess('Records inserted');
        this.load()
      }catch(error){
        this.$refs.alerts.showDanger(error.message)
        throw error
      }
    },

    async uploadFile() {
      const localFile = document.getElementById("input_file").files[0];
      const formFile = new FormData();
      formFile.append("file", localFile);
      this.fileRecords = await this.parseFile(formFile);
      console.log(this.fileRecords)
      console.log("accounts")
      console.log(this.$store.state.accounts)
      this.$refs.modalUpload.show();
      // await this.insertRecords(response.data);
    },
  }
}
</script>
