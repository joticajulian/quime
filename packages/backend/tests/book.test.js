const Book = require("../src/records/book");
const database = require("../src/database");

describe("Balances in accounting book", () => {
  it("should calculate balances", async () => {
    expect.assertions(2);
    jest.spyOn(database, "setRecords").mockImplementation();
    jest.spyOn(database, "setState").mockImplementation();
    const spyAccounts = jest.spyOn(database, "getAccounts").mockImplementation(() => ({
      accounts: [
        {name: "Bank", type: "asset", currency: "EUR"},
        {name: "Food", type: "expense", currency: "EUR"},
        {name: "Salary", type: "income", currency: "EUR"}
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
        debit: "Food",
        credit: "Bank",
        amount: "20050",
      }
    ]));
    const spyState = jest.spyOn(database, "getState").mockImplementation(() => (null));

    const book = new Book();
    await book.initBook();
    book.recalculateBalances();
    expect(book.state.balancesByPeriod).toStrictEqual([
      {
        period: {
          start: 0,
          end: 2678399999,
        },
        balances: [
          {
            account: "Bank",
            type: "asset",
            currency: "EUR",
            precision: 2,
            principalCurrency: {
              lastBalance: 0n,
              debits: 0n,
              credits: 20050n,
              monthBalance: -20050n,
              totalBalance: -20050n,
            },
          },
          {
            account: "Food",
            type: "expense",
            currency: "EUR",
            precision: 2,
            principalCurrency: {
              lastBalance: 0n,
              debits: 20050n,
              credits: 0n,
              monthBalance: 20050n,
              totalBalance: 20050n,
            },
          },
          {
            account: "Salary",
            type: "income",
            currency: "EUR",
            precision: 2,
            principalCurrency: {
              lastBalance: 0n,
              debits: 0n,
              credits: 0n,
              monthBalance: 0n,
              totalBalance: 0n,
            },
          },
        ],
      },
    ]);

    book.insertRecord({
      date:1001,
      description: "description2",
      debit: "Bank",
      credit: "Salary",
      amount: "150000",
    });
    book.recalculateBalances();

    expect(book.state.balancesByPeriod).toStrictEqual([
      {
        period: {
          start: 0,
          end: 2678399999,
        },
        balances: [
          {
            account: "Bank",
            type: "asset",
            currency: "EUR",
            precision: 2,
            principalCurrency: {
              lastBalance: 0n,
              debits: 150000n,
              credits: 20050n,
              monthBalance: 129950n,
              totalBalance: 129950n,
            },
          },
          {
            account: "Food",
            type: "expense",
            currency: "EUR",
            precision: 2,
            principalCurrency: {
              lastBalance: 0n,
              debits: 20050n,
              credits: 0n,
              monthBalance: 20050n,
              totalBalance: 20050n,
            },
          },
          {
            account: "Salary",
            type: "income",
            currency: "EUR",
            precision: 2,
            principalCurrency: {
              lastBalance: 0n,
              debits: 0n,
              credits: 150000n,
              monthBalance: -150000n,
              totalBalance: -150000n,
            },
          },
        ],
      },
    ]);
  });
});
