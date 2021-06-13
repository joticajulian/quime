
export default {
  
  methods: {

    cents2dollars(a, cu, showCurrency = false){
      let amount = a;
      let currency = cu;
      let isNegative = false;

      if(!currency)
        currency = this.$store.state.principalCurrency;

      if(typeof amount !== "string")
        amount = BigInt(amount).toString();

      const curr = this.$store.state.currencies.find((c) => (c.name === currency));
      if(!curr || !curr.precision)
        throw new Error(`Precision of currency '${currency}' couldn't be determined`);

      const {precision} = curr;
      
      if(amount.startsWith("-")) {
        isNegative = true;
        amount = amount.substring(1);
      }

      if( amount.length < precision + 1 )
        amount = "0".repeat(precision + 1 - amount.length) + amount;
      
      const sign = isNegative ? "-" : "";
      const part1 = amount.substring( 0 , amount.length - precision );
      const part2 = amount.substring( amount.length - precision );
      let stringDecimalNumber = `${sign}${part1}.${part2}`;
      if(showCurrency) stringDecimalNumber += ` ${currency}`;
      return stringDecimalNumber;
    },

    usesForeignCurrency(account) {
      const {currency} = this.$store.state.accounts.find((a) => (a.name === account));
      return currency !== this.$store.state.principalCurrency;
    }

  }
}