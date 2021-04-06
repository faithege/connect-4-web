import axios from 'axios';

export default {
    createNewGame: async function() {
        try {
          if(process.env.VUE_APP_ROOT_REST){
            const response = await axios.post(`${process.env.VUE_APP_ROOT_REST}/new`);
            console.log(response);
          }
          else{
            console.log('error extracting env vars')
          }
          } catch (error) {
            console.error(error);
          }
    },
}