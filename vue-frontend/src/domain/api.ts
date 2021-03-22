import axios from 'axios';

export default {
    createNewGame: function() : Promise<any>{
        return  axios.post('https://ikx385nw43.execute-api.eu-west-1.amazonaws.com/dev/new');
    },
}