import axios from 'axios';

export default {
    createNewGame: async function() {
        try {
            const response = await axios.post('https://ikx385nw43.execute-api.eu-west-1.amazonaws.com/dev/new');
            console.log(response);
          } catch (error) {
            console.error(error);
          }
    },
}