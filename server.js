const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const port = 3000;
const SECRET_KEY = 'triptribe-secret-key'; // 🔐 Nên dùng biến môi trường

app.use(cors());
app.use(express.json());

// === Test Server ===
app.get('/', (req, res) => {
  res.send('✅ Server is running and DB is connected!');
});

// === Đăng ký tài khoản ===
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

    db.query(sql, [name, email, hashedPassword], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Email đã tồn tại' });
        }
        console.error('❌ Lỗi đăng ký:', err);
        return res.status(500).json({ message: 'Lỗi khi đăng ký' });
      }

      res.status(200).json({ message: 'Đăng ký thành công!' });
    });
  } catch (err) {
    console.error('❌ Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// === Đăng nhập + Tạo JWT ===
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('❌ Lỗi truy vấn:', err);
      return res.status(500).json({ message: 'Lỗi server' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Sai mật khẩu' });
    }

    const token = jwt.sign({ id: user.id, name: user.name }, SECRET_KEY, { expiresIn: '90d' });

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });
  });
});

// === Middleware kiểm tra JWT ===
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Không có token' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ' });

    req.user = user;
    next();
  });
}

// === Route lấy thông tin user ===
app.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = 'SELECT name, email, created_at FROM users WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi truy vấn' });

    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    res.json({ user: results[0] });
  });
});

// === API lấy danh sách kế hoạch của user ===
app.get('/plans', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = 'SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Lỗi truy vấn plans:', err);
      return res.status(500).json({ message: 'Lỗi server khi lấy kế hoạch' });
    }

    res.status(200).json({ plans: results });
  });
});

// === API tạo kế hoạch mới ===
app.post('/plans', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name, start_date, end_date, location, description, detail } = req.body;

  if (!name || !start_date) {
    return res.status(400).json({ message: 'Tên và ngày khởi hành là bắt buộc.' });
  }

  const sql = 'INSERT INTO plans (user_id, name, start_date, end_date, location, description) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [userId, name, start_date, end_date, location, description], (err, result) => {
    if (err) {
      console.error('❌ Lỗi tạo kế hoạch:', err);
      return res.status(500).json({ message: 'Lỗi server khi tạo kế hoạch' });
    }

    res.status(201).json({ message: 'Tạo kế hoạch thành công!' });
  });
});

// === Start Server ===
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

function formatDate(raw) {
  if (!raw) return "";
  if (typeof raw === "string" && raw.includes("T")) {
    return raw.split("T")[0];
  }
  if (raw instanceof Date) {
    const year = raw.getFullYear();
    const month = String(raw.getMonth() + 1).padStart(2, "0");
    const day = String(raw.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  // Nếu là chuỗi dạng sẵn YYYY-MM-DD thì trả về nguyên
  return raw;
}

app.get("/plans/:id", authenticateToken, (req, res) => {
  const planId = req.params.id;
  const userId = req.user.id;

  console.log("🧠 DEBUG /plans/:id → userId:", userId, "planId:", planId);

  const sql = "SELECT * FROM plans WHERE id = ? AND user_id = ?";
  db.query(sql, [planId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi truy vấn" });
    if (results.length === 0) {
      console.log("❌ Không tìm thấy kế hoạch với userId và planId này");
      return res.status(404).json({ message: "Không tìm thấy kế hoạch" });
    }
    res.json({
      ...results[0],
      start_date: formatDate(results[0].start_date),
      end_date: formatDate(results[0].end_date),
    });
  });
});

// PUT /plans/:id – cập nhật kế hoạch
app.put("/plans/:id", authenticateToken, (req, res) => {
  const planId = req.params.id;
  const userId = req.user.id;
  const { name, start_date, end_date, location, description ,detail } = req.body;

  if (!name || !start_date) {
    return res.status(400).json({ message: "Tên và ngày khởi hành là bắt buộc." });
  }

  const sql = `UPDATE plans 
               SET name = ?, start_date = ?, end_date = ?, location = ?, description = ?, detail = ?
               WHERE id = ? AND user_id = ?`;

  db.query(sql, [name, start_date, end_date, location, description, detail, planId, userId], (err, result) => {
    if (err) {
      console.error("❌ Lỗi cập nhật kế hoạch:", err);
      return res.status(500).json({ message: "Lỗi server khi cập nhật kế hoạch" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền sửa kế hoạch này" });
    }

    res.status(200).json({ message: "Cập nhật kế hoạch thành công!" });
  });
});

// Xóa kế hoạch theo ID và userId
app.delete("/plans/:id", authenticateToken, (req, res) => {
  const planId = req.params.id;
  const userId = req.user.id;

  // Bước 1: Kiểm tra quyền
  db.query("SELECT * FROM plans WHERE id = ? AND user_id = ?", [planId, userId], (err, results) => {
    if (err) {
      console.error("❌ Lỗi truy vấn kiểm tra quyền:", err);
      return res.status(500).json({ message: "Lỗi server khi kiểm tra kế hoạch" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy kế hoạch để xóa." });
    }

    // Bước 2: Xoá chi phí trước
    db.query("DELETE FROM expenses WHERE plan_id = ?", [planId], (err) => {
      if (err) {
        console.error("❌ Lỗi khi xoá chi phí:", err);
        return res.status(500).json({ message: "Lỗi xoá chi phí" });
      }

      // Bước 3: Xoá kế hoạch
      db.query("DELETE FROM plans WHERE id = ? AND user_id = ?", [planId, userId], (err) => {
        if (err) {
          console.error("❌ Lỗi khi xoá kế hoạch:", err);
          return res.status(500).json({ message: "Lỗi xoá kế hoạch" });
        }

        res.json({ message: "Đã xoá kế hoạch." });
      });
    });
  });
});

// ✅ GET /plans/:id/expenses – lấy chi phí kế hoạch
app.get("/plans/:id/expenses", authenticateToken, (req, res) => {
  const planId = req.params.id;
  const sql = "SELECT * FROM expenses WHERE plan_id = ?";
  db.query(sql, [planId], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi truy vấn chi phí" });
    res.json(results);
  });
});

// DELETE /plans/:id/expenses – xoá toàn bộ chi phí cũ
app.delete("/plans/:id/expenses", authenticateToken, (req, res) => {
  const planId = req.params.id;
  const sql = "DELETE FROM expenses WHERE plan_id = ?";
  db.query(sql, [planId], (err, result) => {
    if (err) {
      console.error("❌ Lỗi xoá chi phí:", err);
      return res.status(500).json({ message: "Không thể xoá chi phí cũ." });
    }
    res.status(200).json({ message: "Đã xoá chi phí cũ thành công." });
  });
});

// POST /plans/:id/expenses – thêm chi phí
app.post("/plans/:id/expenses", authenticateToken, (req, res) => {
  const planId = req.params.id;
  const { expenses } = req.body;

  if (!Array.isArray(expenses) || expenses.length === 0) {
    return res.status(400).json({ message: "Không có chi phí nào được gửi." });
  }

  const values = expenses.map(exp => [
    planId,
    exp.category,
    exp.description || "",
    exp.amount,
    req.user.email,
    true
  ]);

  const sql = `INSERT INTO expenses (plan_id, category, description, amount, payer_email, shared)
               VALUES ?`;

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("❌ Lỗi lưu chi phí:", err);
      return res.status(500).json({ message: "Không thể lưu chi phí." });
    }

    res.status(200).json({ message: "Đã lưu chi phí thành công!" });
  });
});

app.get("/plans/:id/checklist", authenticateToken, (req, res) => {
  const planId = req.params.id;
  const sql = "SELECT * FROM checklist_items WHERE plan_id = ?";
  db.query(sql, [planId], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi truy vấn checklist" });
    res.json(results);
  });
});

app.post("/plans/:id/checklist", authenticateToken, (req, res) => {
  const planId = req.params.id;
  const items = req.body.items;

  if (!Array.isArray(items)) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }

  // Xoá toàn bộ checklist cũ rồi thêm mới
  const deleteSql = "DELETE FROM checklist_items WHERE plan_id = ?";
  db.query(deleteSql, [planId], (err) => {
    if (err) return res.status(500).json({ message: "Không thể xoá checklist cũ" });

    if (items.length === 0) return res.json({ message: "Đã lưu checklist (rỗng)" });

    const values = items.map(i => [planId, i.item_name, i.quantity, i.is_checked]);
    const insertSql = "INSERT INTO checklist_items (plan_id, item_name, quantity, is_checked) VALUES ?";
    db.query(insertSql, [values], (err) => {
      if (err) return res.status(500).json({ message: "Lỗi khi lưu checklist" });
      res.json({ message: "Đã lưu checklist thành công" });
    });
  });
});
