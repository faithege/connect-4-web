<template>
  <Section>
      <b-row>
        <b-col cols="8" offset="2">
          <Board
            v-bind:boardState="board"/>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="2" offset="5">
          <ColumnDropdown
            @column-change="playMove($event)"/>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="2" offset="5">
          <b-button size="lg" @click="handleClick()">Close Connection</b-button>
        </b-col>
      </b-row>
  </Section>
</template>

<script>
import Board from '@/components/Board.vue'
import ColumnDropdown from '@/components/ColumnDropdown.vue'
//import { generateId } from '@/../../connect4-sls/src/utils';

export default {
  name: 'GameSession',
  components: {
    Board,
    ColumnDropdown
  },
  data: function() {
    return {
      connection: null,
      board: null,
      gameId: null,
      playerId: null
    }
  },
  methods: {
    playMove: function(column) {
      //remember will need to 0-index column
      const columnMessage = {
        gameId: this.gameId,
        playerId: this.playerId,
        type: 'CLIENT_COLUMN',
        column: column -1
      }
      console.log(JSON.stringify(columnMessage))
      this.connection.send(JSON.stringify(columnMessage));
    
    },

    handleClick() {
      this.connection.close()
    }
    
  },
  created: function() {
    this.gameId = this.$route.params.gameId
    this.playerId = this.$route.params.playerId
    console.log("Starting connection to WebSocket Server") 

    function generateId() {
      const idLength = 32 //how long we want the game id -> the bigger the less liklihood of collision
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      const result = Array(idLength).fill(undefined)
                                      .map(_ => characters.charAt(Math.floor(Math.random() * charactersLength)))
                                      .join('')
      return result;
    }
    
    //look in local storage to see if token exists -> tidy up if not, then extract out from storage
    if (!localStorage.getItem("secretToken")) {
      const newToken = generateId()
      localStorage.setItem("secretToken", newToken)
    }

    
    
    
    const clientToken = localStorage.getItem("secretToken")


    // hardcoding player and game ids
    this.connection = new WebSocket(`wss://71cpicttcd.execute-api.eu-west-1.amazonaws.com/dev?gameId=${this.gameId}&playerId=${this.playerId}&secretAccessToken=${clientToken}`)

    // on open only completes once - when connection established
    this.connection.onopen = (event) => {
      console.log(event)
      console.log("Successfully connected to the connect 4 api...")
      const helloMessage = {
        gameId: this.gameId,
        playerId: this.playerId,
        type: 'CLIENT_HELLO'
      }
      // using event.target as we cannot access this key word
      this.connection.send(JSON.stringify(helloMessage));
    }

    this.connection.onmessage = (event) => { //called for every incoming message
      console.log(event);
      const serverMessage = JSON.parse(event.data)
      this.board = serverMessage.boardState // not updating this.board -> gets confused
    }

    this.connection.onclose = (event) => {
      console.log(event)
      console.log("Successfully disconnected...")
    }

  },
  
}
</script>

<style>
</style>
