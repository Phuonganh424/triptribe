// 🔁 Xóa toàn bộ token và user info cũ khi vào trang login hoặc signup
if (window.location.pathname.includes("login.html") || window.location.pathname.includes("signup.html")) {
  localStorage.clear();
  sessionStorage.clear();
}

document.addEventListener("DOMContentLoaded", () => {
  // ===== Scroll card (trang home) =====
  const container = document.getElementById("card-container");

  if (container) {
    function getScrollAmount() {
      const card = container.querySelector(".card");
      if (card) {
        const gap = 20;
        return card.offsetWidth + gap;
      }
      return 300;
    }

    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn");

    if (nextBtn) nextBtn.onclick = () => container.scrollLeft += getScrollAmount();
    if (prevBtn) prevBtn.onclick = () => container.scrollLeft -= getScrollAmount();
  }

  // ===== Signup form =====
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirm = document.getElementById("confirm-password").value;

      if (password !== confirm) {
        alert("Mật khẩu không khớp!");
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        alert(data.message);
        if (res.ok) window.location.href = "login.html";
      } catch (err) {
        console.error("Lỗi khi đăng ký:", err);
        alert("Lỗi khi gửi yêu cầu.");
      }
    });
  }

  // ===== Login form =====
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const rememberMe = document.getElementById("remember")?.checked;

      try {
        const res = await fetch("http://localhost:3000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem("token", data.token);
          storage.setItem("username", data.user.name);
          storage.setItem("email", data.user.email);
          window.location.href = "profile.html";
        }
      } catch (err) {
        console.error("Lỗi khi đăng nhập:", err);
        alert("Không thể kết nối đến server.");
      }
    });
  }

  // ===== Toggle password visibility =====
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      btn.textContent = isVisible ? "👁" : "👁";
    });
  });

  // ===== Profile page - fetch user data =====
  if (window.location.pathname.includes("profile.html")) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      alert("Bạn chưa đăng nhập!");
      window.location.href = "login.html";
      return;
    }

    fetch("http://localhost:3000/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 403 || res.status === 401) throw new Error("Token hết hạn hoặc không hợp lệ");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          document.getElementById("user-name").textContent = data.user.name;
          document.getElementById("user-email").textContent = data.user.email;
        } else {
          alert(data.message || "Không thể lấy thông tin người dùng");
          window.location.href = "login.html";
        }
      })
      .catch((err) => {
        console.error("Lỗi khi lấy thông tin profile:", err);
        alert("Token có thể đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "login.html";
      });
  }

  // ===== Planning page - submit plan =====
  const planForm = document.getElementById("plan-form");
  if (planForm) {
    planForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        alert("Bạn cần đăng nhập để tạo kế hoạch.");
        return;
      }

      const name = document.getElementById("trip-name").value;
      const start_date = document.getElementById("trip-start-date").value;
      const end_date = document.getElementById("trip-end-date").value;
      const location = document.getElementById("trip-location").value;
      const description = document.getElementById("trip-description").value;
      const detail = "";

      try {
        const response = await fetch("http://localhost:3000/plans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ name, start_date, end_date, location, description }),
        });

        const result = await response.json();

        if (response.ok) {
          alert("✅ Tạo kế hoạch thành công!");
          window.location.href = "view_plan.html";
        } else {
          alert("❌ " + result.message);
        }
      } catch (err) {
        console.error("Lỗi gửi kế hoạch:", err);
        alert("Đã xảy ra lỗi khi tạo kế hoạch.");
      }
    });
  }

  // ===== View plans page - load and show plans =====
  if (window.location.pathname.includes("view_plan.html")) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      alert("Bạn chưa đăng nhập!");
      window.location.href = "login.html";
      return;
    }

    fetch("http://localhost:3000/plans", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("plans-list");
        container.innerHTML = "";

        if (!data.plans || data.plans.length === 0) {
          container.textContent = "Bạn chưa có kế hoạch nào.";
          return;
        }

        data.plans.forEach(plan => {
          const div = document.createElement("div");
          div.className = "plan-card";
          div.onclick = () => {
            window.location.href = `edit-plan.html?id=${plan.id}`;
          };

          div.innerHTML = `
            <h3>${plan.name}</h3>
            <p><strong>Địa điểm:</strong> ${plan.location || "–"}</p>
            <p><strong>Thời gian:</strong> ${plan.start_date} → ${plan.end_date || "–"}</p>
            <p>${plan.description || "Không có mô tả"}</p>
          `;
          container.appendChild(div);
        });
      })
      .catch(err => {
        console.error("Lỗi khi tải kế hoạch:", err);
        alert("Không thể tải kế hoạch.");
      });
  }
});

function formatDate(dateStr) {
  if (!dateStr) return "–";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Khi vào edit_plan.html?id=123
if (window.location.pathname.includes("edit_plan.html")) {
  const params = new URLSearchParams(window.location.search);
  const planId = params.get("id");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    alert("Vui lòng đăng nhập.");
    window.location.href = "login.html";
  }

  // ===== Load chi tiết kế hoạch =====
  fetch(`http://localhost:3000/plans/${planId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("trip-name").value = data.name;
      document.getElementById("trip-location").value = data.location;
      document.getElementById("trip-date").value = data.start_date?.split('T')[0] || "";
      document.getElementById("trip-end-date").value = data.end_date?.split('T')[0] || "";
      document.getElementById("trip-description").value = data.description;
      document.getElementById("trip-detail").value = data.detail || "";

      // ===== Sau khi load kế hoạch, tiếp tục load chi phí =====
      return fetch(`http://localhost:3000/plans/${planId}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    })
    .then(res => res.json())
    .then(expenses => {
      const expenseBody = document.getElementById("expense-body");
      let total = 0;
      expenseBody.innerHTML = "";

      expenses.forEach((e, i) => {
        addExpenseRow(i, e);
        total += parseFloat(e.amount);
      });

      document.getElementById("total-amount").textContent = total.toLocaleString("vi-VN");

      // Gọi lại dropdown nếu có custom select
      if (typeof setupCustomSelect === "function") {
        setupCustomSelect();
      }
    })
    .catch(err => {
      console.error("Lỗi khi load kế hoạch hoặc chi phí:", err);
      alert("Không thể load dữ liệu kế hoạch hoặc chi phí.");
    });

  // Gắn lại sự kiện nút dấu cộng
  document.getElementById("add-expense")?.addEventListener("click", () => {
    addExpenseRow();
  });
}

function addExpenseRow(index = null, data = {}) {
  const tbody = document.getElementById("expense-body");
  const tr = document.createElement("tr");
  const count = index !== null ? index + 1 : tbody.children.length + 1;

  tr.innerHTML = `
    <td>${count}</td>
    <td>
      <div class="custom-select-wrapper">
        <div class="custom-select-display">${data.category || '-- Chọn --'}</div>
        <ul class="custom-select-options" style="display:none;">
          <li>Di chuyển</li><li>Lưu trú</li><li>Ăn uống</li>
          <li>Vé & hoạt động</li><li>Mua sắm</li><li>Tiện ích</li><li>Dự phòng</li>
        </ul>
        <input type="hidden" class="custom-select-value" value="${data.category || ''}">
      </div>
    </td>
    <td><input type="text" class="expense-desc" value="${data.description || ''}" /></td>
    <td><input type="number" class="expense-amount" value="${data.amount || ''}" /></td>
    <td><input type="text" class="expense-note" value="${data.note || ''}" /></td>
    <td>
      <button type="button" class="remove-expense" title="Xoá">
        <img src="imgs/trash.png" alt="Xoá" class="trash-icon" />
      </button>
    </td>
  `;

  tbody.appendChild(tr);

  // Gọi lại dropdown nếu bạn có hàm custom
  if (typeof setupCustomSelect === "function") setupCustomSelect();

  // Gắn sự kiện xoá dòng và cập nhật STT + tổng tiền
  tr.querySelector(".remove-expense")?.addEventListener("click", () => {
    tr.remove();

    const rows = document.querySelectorAll("#expense-body tr");
    let total = 0;
    rows.forEach((row, i) => {
      row.children[0].textContent = i + 1;
      const amount = parseFloat(row.querySelector(".expense-amount")?.value) || 0;
      total += amount;
    });
    document.getElementById("total-amount").textContent = total.toLocaleString("vi-VN");
  });
}

function setupCustomSelect() {
  document.querySelectorAll(".custom-select-wrapper").forEach(function (wrapper) {
    const display = wrapper.querySelector(".custom-select-display");
    const options = wrapper.querySelector(".custom-select-options");
    const valueInput = wrapper.querySelector(".custom-select-value");

    // Toggle dropdown
    display.onclick = function (e) {
      e.stopPropagation();
      document.querySelectorAll(".custom-select-options").forEach(ul => ul.style.display = "none");
      options.style.display = options.style.display === "block" ? "none" : "block";
    };

    // Chọn 1 mục
    options.querySelectorAll("li").forEach(function (li) {
      li.onclick = function (e) {
        e.stopPropagation();
        display.textContent = li.textContent;
        valueInput.value = li.textContent;
        options.style.display = "none";
        options.querySelectorAll("li").forEach(item => item.classList.remove("selected"));
        li.classList.add("selected");
      };
    });
  });

  // Click ngoài sẽ đóng dropdown
  document.addEventListener("click", function () {
    document.querySelectorAll(".custom-select-options").forEach(ul => ul.style.display = "none");
  });
}

const editForm = document.getElementById("edit-plan-form");

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const params = new URLSearchParams(window.location.search);
  const planId = params.get("id");

  const name = document.getElementById("trip-name").value;
  const start_date = document.getElementById("trip-date").value;
  const end_date = document.getElementById("trip-end-date").value;
  const location = document.getElementById("trip-location").value;
  const description = document.getElementById("trip-description").value;
  const detail = document.getElementById("trip-detail").value;

  try {
    // ===== CẬP NHẬT KẾ HOẠCH =====
    const res = await fetch(`http://localhost:3000/plans/${planId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ name, start_date, end_date, location, description, detail }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert("❌ " + result.message);
      return;
    }

    // ===== CHUẨN BỊ DỮ LIỆU CHI PHÍ =====
    const expenses = [];
    document.querySelectorAll("#expense-body tr").forEach((tr) => {
      const category = tr.querySelector(".custom-select-value")?.value || "";
      const description = tr.querySelector(".expense-desc")?.value || "";
      const amount = parseFloat(tr.querySelector(".expense-amount")?.value) || 0;
      const note = tr.querySelector(".expense-note")?.value || "";

      if (amount > 0 && category) {
        expenses.push({ category, description, amount, note });
      }
    });

    // ===== XOÁ CHI PHÍ CŨ TRƯỚC =====
    await fetch(`http://localhost:3000/plans/${planId}/expenses`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    // ===== GỬI CHI PHÍ MỚI (NẾU CÓ) =====
    if (expenses.length > 0) {
      const resExpense = await fetch(`http://localhost:3000/plans/${planId}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ expenses }),
      });

      const expenseResult = await resExpense.json();
      if (!resExpense.ok) {
        alert("❌ Lưu kế hoạch thành công nhưng lỗi khi lưu chi phí: " + expenseResult.message);
        return;
      }
    }

    alert("✅ Đã cập nhật kế hoạch và chi phí!");
    window.location.href = `plan_detail.html?id=${planId}`;

  } catch (err) {
    console.error("Lỗi khi cập nhật:", err);
    alert("Không thể cập nhật kế hoạch.");
  }
});
