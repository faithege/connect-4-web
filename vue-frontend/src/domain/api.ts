import axios from 'axios';

export default {
    createNewGame: function() : Promise<any>{
      if(process.env.VUE_APP_ROOT_REST){
        return  axios.post(`${process.env.VUE_APP_ROOT_REST}/new`);
      }
      else{
        return Promise.reject(new Error('error extracting env vars'))
      }
    },
}