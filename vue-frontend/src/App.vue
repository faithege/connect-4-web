<template>
  <Main id='app'>
    <b-container>
      <b-row>
        <b-col cols="12">
          <h1>Connect Four</h1>
        </b-col>
      </b-row>
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
    </b-container>
  </Main>
</template>

<script>
import Board from './components/Board.vue'
import ColumnDropdown from './components/ColumnDropdown.vue'

export default {
  name: 'App',
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
    
    }
  },
  created: function() {
    // const gameId = 'lBxwNMmOEqYrs2BrYkk4nQi5sLMcZgHC'
    this.gameId = this.$route.params.gameId
    this.playerId = this.$route.params.playerId
    console.log("Starting connection to WebSocket Server")
    // hardcoding player and game ids
    this.connection = new WebSocket(`wss://71cpicttcd.execute-api.eu-west-1.amazonaws.com/dev?gameId=${this.gameId}&playerId=${this.playerId}`)

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

  },
  
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
