export const categories = ['Ăn uống', 'Đi lại', 'Học tập', 'Giải trí'] as const

export type ExpenseCategory = (typeof categories)[number]

export type Expense = {
  id: string
  content: string
  amount: number
  category: ExpenseCategory
  date: string
}

export type NewExpense = Omit<Expense, 'id'>
