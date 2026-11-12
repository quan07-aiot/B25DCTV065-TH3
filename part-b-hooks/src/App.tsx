import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useClock } from './hooks/useClock'
import { useFetch } from './hooks/useFetch'
import { useTheme } from './useTheme'
import { categories, type ExpenseCategory } from './types'
import './App.css'

const digitNames = [
  'không',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
]
const numberUnits = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ']

function readThreeDigits(value: number, includeHundreds: boolean) {
  const hundreds = Math.floor(value / 100)
  const tens = Math.floor((value % 100) / 10)
  const ones = value % 10
  const words: string[] = []

  if (hundreds > 0 || includeHundreds) {
    words.push(`${digitNames[hundreds]} trăm`)
  }

  if (tens === 0) {
    if (ones > 0) {
      if (hundreds > 0 || includeHundreds) words.push('lẻ')
      words.push(digitNames[ones])
    }
  } else if (tens === 1) {
    words.push('mười')
    if (ones === 5) words.push('lăm')
    else if (ones > 0) words.push(digitNames[ones])
  } else {
    words.push(`${digitNames[tens]} mươi`)
    if (ones === 1) words.push('mốt')
    else if (ones === 4) words.push('tư')
    else if (ones === 5) words.push('lăm')
    else if (ones > 0) words.push(digitNames[ones])
  }

  return words.join(' ')
}

function numberToVietnameseCurrency(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return ''

  const groups: number[] = []
  let remaining = amount
  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const words: string[] = []
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    if (groups[index] === 0) continue
    const groupWords = readThreeDigits(groups[index], index < groups.length - 1)
    words.push(
      numberUnits[index]
        ? `${groupWords} ${numberUnits[index]}`
        : groupWords,
    )
  }

  return `${words.join(' ')} đồng`
}

function getLocalDateTime() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

function App() {
  const { expenses, loading, error, addExpense, deleteExpense } =
    useFetch()
  const { theme, toggleTheme } = useTheme()
  const now = useClock()
  const contentInput = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Ăn uống')
  const [date, setDate] = useState(getLocalDateTime)
  const [filter, setFilter] = useState<ExpenseCategory | 'Tất cả'>('Tất cả')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [formError, setFormError] = useState('')

  const amountInWords = numberToVietnameseCurrency(Number(amount))
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  useEffect(() => {
    document.title = `Sổ chi tiêu · ${total.toLocaleString('vi-VN')} đ`
  }, [total])

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(timeoutId)
  }, [search])

  const visibleExpenses = expenses.filter((expense) => {
    const sameCategory = filter === 'Tất cả' || expense.category === filter
    const sameContent = expense.content
      .toLocaleLowerCase('vi')
      .includes(debouncedSearch.toLocaleLowerCase('vi'))
    return sameCategory && sameContent
  })

  const categoryTotals = categories.map((item) => {
    const amount = expenses
      .filter((expense) => expense.category === item)
      .reduce((sum, expense) => sum + expense.amount, 0)
    return { category: item, amount }
  })

  const visibleTotal = visibleExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericAmount = Number(amount)

    if (!content.trim()) {
      setFormError('Vui lòng nhập nội dung khoản chi.')
      return
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Số tiền phải lớn hơn 0.')
      return
    }

    const saved = await addExpense({
      content: content.trim(),
      amount: numericAmount,
      category,
      date: new Date(date).toISOString(),
    })
    if (!saved) return

    setContent('')
    setAmount('')
    setCategory('Ăn uống')
    setDate(getLocalDateTime())
    setFormError('')
    contentInput.current?.focus()
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Bạn có chắc muốn xóa khoản chi này?')) return
    await deleteExpense(id)
  }

  return (
    <main className={`app-shell ${theme}`}>
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">$</span>
          <div>
            <h1>Sổ chi tiêu</h1>
          </div>
        </div>
        <div className="header-actions">
          <div className="clock">
            <span className="clock-dot" />
            {now.toLocaleTimeString('vi-VN')}
          </div>
          <button className="theme-button" onClick={toggleTheme} type="button">
            {theme === 'light' ? '🌙 Tối' : '☀️ Sáng'}
          </button>
        </div>
      </header>

      <section className="welcome">
        <p className="eyebrow">HÔM NAY</p>
        <h2>Ghi lại số tiền tiêu hàng ngày </h2>
      </section>
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THÊM GIAO DỊCH</p>
            <h2>Khoản chi mới</h2>
          </div>
        </div>
        <form className="expense-form" onSubmit={handleSubmit}>
          <label>
            Nội dung
            <input
              ref={contentInput}
              required
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Ví dụ: Ăn trưa"
            />
          </label>
          <label>
            Số tiền (đ)
            <input
              required
              min="1"
              step="1"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
            />
            {amountInWords && (
              <small aria-live="polite" className="amount-preview">
                {amountInWords}
              </small>
            )}
          </label>
          <label>
            Loại chi
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as ExpenseCategory)
              }
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Ngày chi
            <input
              required
              type="datetime-local"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <button className="primary-button add-button" disabled={loading} type="submit">
            + Thêm khoản chi
          </button>
          {formError && <p className="form-error">{formError}</p>}
        </form>
      </section>

      <section className="card">
        <div className="section-heading list-heading">
          <div>
            <p className="eyebrow">TỔNG QUAN</p>
            <h2>Danh sách khoản chi</h2>
          </div>
          <label className="filter-control">
            <span>Lọc theo loại</span>
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as ExpenseCategory | 'Tất cả')
              }
            >
              <option>Tất cả</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="search-control">
          <label htmlFor="expense-search">Tìm kiếm theo nội dung</label>
          <input
            id="expense-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nhập nội dung khoản chi..."
          />
        </div>

        <div className="total-panel">
          <span>Tổng tiền{filter !== 'Tất cả' && ` · ${filter}`}</span>
          <strong>{visibleTotal.toLocaleString('vi-VN')} đ</strong>
        </div>

        <div className="category-summary">
          {categoryTotals.map((item) => (
            <div className="category-total" key={item.category}>
              <span>{item.category}</span>
              <strong>{item.amount.toLocaleString('vi-VN')} đ</strong>
            </div>
          ))}
        </div>

        {error && <p className="error-message">{error}</p>}
        {loading && <p className="status-message">Đang tải dữ liệu...</p>}
        {!loading && !error && visibleExpenses.length === 0 && (
          <p className="empty-state">Chưa có khoản chi phù hợp.</p>
        )}
        {!loading && (
          <div className="expense-list">
            {visibleExpenses.map((expense) => (
              <article className="expense-row" key={expense.id}>
                <div className="expense-description">
                  <strong>{expense.content}</strong>
                  <span>
                    {expense.category} ·{' '}
                    {new Date(expense.date).toLocaleString('vi-VN')}
                  </span>
                </div>
                <strong className="expense-amount">
                  {expense.amount.toLocaleString('vi-VN')} đ
                </strong>
                <button
                  aria-label={`Xóa ${expense.content}`}
                  className="delete-button"
                  disabled={loading}
                  onClick={() => void handleDelete(expense.id)}
                  type="button"
                >
                  Xóa
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="app-footer">Save Money Please T-T.</footer>
    </main>
  )
}

export default App
