import { useEffect, useState } from 'react'
import { categories, type Expense, type NewExpense } from '../types'

const API_URL =
  'https://6ad03adf03feaa52b21f215e.mockapi.io/api/quangamoi01/so_tay_sv'

function isExpense(value: unknown): value is Expense {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.content === 'string' &&
    typeof item.amount === 'number' &&
    categories.some((category) => category === item.category) &&
    typeof item.date === 'string'
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Có lỗi khi kết nối MockAPI.'
}

export function useFetch() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function getExpenses() {
      try {
        const response = await fetch(API_URL)
        if (!response.ok) {
          throw new Error(`MockAPI trả về lỗi ${response.status}.`)
        }

        const data: unknown = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('MockAPI không trả về danh sách khoản chi.')
        }

        const records: unknown[] = data
        const validExpenses = records.filter(isExpense)

        if (isMounted && validExpenses.length !== records.length) {
          const invalidRecord = records.find((item) => !isExpense(item))
          const fields =
            typeof invalidRecord === 'object' && invalidRecord !== null
              ? Object.keys(invalidRecord).join(', ')
              : 'không có'

          setError(
            `${records.length - validExpenses.length} bản ghi bị bỏ qua. Cần các trường id, content, amount, category, date; endpoint hiện có: ${fields}.`,
          )
        }

        if (isMounted) setExpenses(validExpenses)
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void getExpenses()
    return () => {
      isMounted = false
    }
  }, [])

  async function addExpense(expense: NewExpense) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      })
      if (!response.ok) {
        throw new Error(`Không thể thêm khoản chi (${response.status}).`)
      }

      const data: unknown = await response.json()
      if (!isExpense(data)) {
        throw new Error('MockAPI trả về dữ liệu khoản chi không hợp lệ.')
      }

      setExpenses((oldExpenses) => [data, ...oldExpenses])
      return true
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      return false
    } finally {
      setLoading(false)
    }
  }

  async function deleteExpense(id: string) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Không thể xóa khoản chi (${response.status}).`)
      }

      setExpenses((oldExpenses) =>
        oldExpenses.filter((expense) => expense.id !== id),
      )
      return true
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { expenses, loading, error, addExpense, deleteExpense }
}
