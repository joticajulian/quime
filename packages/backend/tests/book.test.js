const Book = require("../src/records/book");
const database = require("../src/database");

describe("Balances in accounting book", () => {
  it("should calculate balances", async () => {
    expect.assertions(1);
    const spyAccounts = jest.spyOn(database, "getAccounts").mockImplementation(() => ({
      accounts: [
        {name: "Bank", type: "asset", currency: "EUR"},
        {name: "Food", type: "expense", currency: "EUR"}
      ],
      currencies: [
        {name: "EUR", precision: 2},
        {name: "BTC", precision: 8},
        {name: "ETH", precision: 18},
      ],
      principalCurrency: "EUR",
    }));
    const spyRecords = jest.spyOn(database, "getRecords").mockImplementation(() => ([
      {
        id: "id1",
        date: 1000,
        description: "description1",
        debit: "Bank",
        credit: "Food",
        amount: "20050",
      }
    ]));
    const spyState = jest.spyOn(database, "getState").mockImplementation(() => (null));

    const book = new Book();
    await book.initBook();
    book.recalculateBalances();
    expect(book.state.balances_by_period).toStrictEqual([
      {
        "accounts": [
          {
            "account": "Bank",
            "account_type": "asset",
            "currency": "EUR",
            "precision": 2,
            "acc_balance": 20050n,
            "acc_balanceCurrency": 0n,
            "balance": 20050n,
            "balanceCurrency": 0n,
            "balance_credit": 0n,
            "balance_creditCurrency": 0n,
            "balance_debit": 20050n,
            "balance_debitCurrency": 0n,
            "credits": 0n,
            "creditsCurrency": 0n,
            "debits": 20050n,
            "debitsCurrency": 0n,
            "lastBalance": 0n,
            "lastBalanceCurrency": 0n,
          },
          {
            "account": "Food",
            "account_type": "expense",
            "currency": "EUR",
            "precision": 2,
            "acc_balance": -20050n,
            "acc_balanceCurrency": 0n,
            "balance": -20050n,
            "balanceCurrency": 0n,
            "balance_credit": 20050n,
            "balance_creditCurrency": 0n,
            "balance_debit": 0n,
            "balance_debitCurrency": 0n,
            "credits": 20050n,
            "creditsCurrency": 0n,
            "debits": 0n,
            "debitsCurrency": 0n,
            "lastBalance": 0n,
            "lastBalanceCurrency": 0n,
          },
        ],
        "period": {
          "start": 0,
          "end": 2678399999,
        },
      },
    ]);
  });
});
