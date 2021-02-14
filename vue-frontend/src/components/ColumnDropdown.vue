<template>
  <div>
    <Section>
      <b-form-select v-model="selectedColumn" :options="columnChoices" @change="emitColumnChange">
        <template slot="first">
        <option disabled>  -- Please select column choice -- </option>
        </template>
      </b-form-select>
    </Section>
  </div>
</template>

<script>

export default {
  name: 'ColumnDropdown',
  data: function () {
    return {
      columnChoices: [1,2,3,4,5,6,7],
      selectedColumn: null
    }
  },
  methods:{
    emitColumnChange(){
      this.$emit('column-change', this.selectedColumn)
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
