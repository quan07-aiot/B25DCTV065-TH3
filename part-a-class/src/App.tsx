import { Component, type FormEvent } from 'react'
import './App.css'

type ExpenseCategory = 'Ăn uống' | 'Đi lại' | 'Học tập' | 'Giải trí'

type Expense = {
  id: string
  content: string
  amount: number
  category: ExpenseCategory
  date: string
}

const categories: ExpenseCategory[] = ['Ăn uống', 'Đi lại', 'Học tập', 'Giải trí']
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

const initialExpenses: Expense[] = [
  {
    id: '1',
    content: 'Ăn sáng',
    amount: 30000,
    category: 'Ăn uống',
    date: new Date().toISOString(),
  },
  {
    id: '2',
    content: 'Gửi xe',
    amount: 5000,
    category: 'Đi lại',
    date: new Date().toISOString(),
  },
  {
    id: '3',
    content: 'Mua vở',
    amount: 25000,
    category: 'Học tập',
    date: new Date().toISOString(),
  },
]

type ClockState = {
  now: Date
}

class Clock extends Component<object, ClockState> {
  private timerId: ReturnType<typeof setInterval> | undefined

  state: ClockState = { now: new Date() }

  componentDidMount() {
    // Chạy đồng hồ sau khi component xuất hiện.
    this.timerId = setInterval(() => this.setState({ now: new Date() }), 1000)
  }

  componentWillUnmount() {
    // Dừng đồng hồ khi component bị gỡ khỏi trang.
    if (this.timerId) clearInterval(this.timerId)
  }

  render() {
    return <span>{this.state.now.toLocaleTimeString('vi-VN')}</span>
  }
}

type ExpenseFormProps = {
  onAdd: (expense: Expense) => void
}

type ExpenseFormState = {
  content: string
  amount: string
  category: ExpenseCategory
  date: string
  error: string
}

function getLocalDateTime() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

class ExpenseForm extends Component<ExpenseFormProps, ExpenseFormState> {
  state: ExpenseFormState = {
    content: '',
    amount: '',
    category: 'Ăn uống',
    date: getLocalDateTime(),
    error: '',
  }

  handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(this.state.amount)

    if (!this.state.content.trim()) {
      this.setState({ error: 'Vui lòng nhập nội dung khoản chi.' })
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      this.setState({ error: 'Số tiền phải lớn hơn 0.' })
      return
    }

    this.props.onAdd({
      id: Date.now().toString(),
      content: this.state.content.trim(),
      amount,
      category: this.state.category,
      date: new Date(this.state.date).toISOString(),
    })
    this.setState({
      content: '',
      amount: '',
      category: 'Ăn uống',
      date: getLocalDateTime(),
      error: '',
    })
  }

  render() {
    const amount = Number(this.state.amount)
    const amountInWords = numberToVietnameseCurrency(amount)

    return (
      <form className="expense-form" onSubmit={this.handleSubmit}>
        <label>
          Nội dung
          <input
            required
            value={this.state.content}
            onChange={(event) => this.setState({ content: event.target.value })}
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
            value={this.state.amount}
            onChange={(event) => this.setState({ amount: event.target.value })}
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
            value={this.state.category}
            onChange={(event) =>
              this.setState({ category: event.target.value as ExpenseCategory })
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ngày chi
          <input
            required
            type="datetime-local"
            value={this.state.date}
            onChange={(event) => this.setState({ date: event.target.value })}
          />
        </label>
        <button className="primary-button add-button" type="submit">
          + Thêm khoản chi
        </button>
        {this.state.error && <p className="form-error">{this.state.error}</p>}
      </form>
    )
  }
}

type ExpenseListProps = {
  expenses: Expense[]
  onDelete: (id: string) => void
}

class ExpenseList extends Component<ExpenseListProps> {
  render() {
    if (this.props.expenses.length === 0) {
      return <p className="empty-state">Chưa có khoản chi phù hợp.</p>
    }

    return (
      <div className="expense-list">
        {this.props.expenses.map((expense) => (
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
              onClick={() => this.props.onDelete(expense.id)}
              type="button"
            >
              Xóa
            </button>
          </article>
        ))}
      </div>
    )
  }
}

type AppState = {
  expenses: Expense[]
  filter: ExpenseCategory | 'Tất cả'
}

class App extends Component<object, AppState> {
  state: AppState = {
    expenses: initialExpenses,
    filter: 'Tất cả',
  }

  componentDidMount() {
    this.updatePageTitle()
  }

  componentDidUpdate(_previousProps: object, previousState: AppState) {
    if (previousState.expenses !== this.state.expenses) {
      // Cập nhật tiêu đề tab sau khi thêm hoặc xóa khoản chi.
      this.updatePageTitle()
    }
  }

  updatePageTitle = () => {
    const total = this.state.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    )
    document.title = `Sổ chi tiêu · ${total.toLocaleString('vi-VN')} đ`
  }

  handleAdd = (expense: Expense) => {
    this.setState((state) => ({ expenses: [expense, ...state.expenses] }))
  }

  handleDelete = (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa khoản chi này?')) return
    this.setState((state) => ({
      expenses: state.expenses.filter((expense) => expense.id !== id),
    }))
  }

  render() {
    const visibleExpenses =
      this.state.filter === 'Tất cả'
        ? this.state.expenses
        : this.state.expenses.filter(
            (expense) => expense.category === this.state.filter,
          )
    const total = visibleExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    )

    return (
      <main className="app-shell">
        <header className="app-header">
          <div className="brand">
            <span className="brand-icon">$</span>
            <div>
              <h1>Sổ chi tiêu</h1>
            </div>
          </div>
          <div className="clock">
            <span className="clock-dot" />
            <Clock />
          </div>
        </header>

        <section className="welcome">
          <p className="eyebrow">HÔM NAY</p>
          <h2>Sổ chi tiêu cá nhân, ghi lại để không tiêu sạch tiền.</h2>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THÊM GIAO DỊCH</p>
              <h2>Khoản chi mới</h2>
            </div>
          </div>
          <ExpenseForm onAdd={this.handleAdd} />
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
                value={this.state.filter}
                onChange={(event) =>
                  this.setState({
                    filter: event.target.value as ExpenseCategory | 'Tất cả',
                  })
                }
              >
                <option>Tất cả</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="total-panel">
            <span>Tổng tiền{this.state.filter !== 'Tất cả' && ` · ${this.state.filter}`}</span>
            <strong>{total.toLocaleString('vi-VN')} đ</strong>
          </div>
          <ExpenseList
            expenses={visibleExpenses}
            onDelete={this.handleDelete}
          />
        </section>

        <footer className="app-footer">Cuối tháng mà vẫn hết tiền thì lỗi không phải do tôi.</footer>
      </main>
    )
  }
}

export default App
