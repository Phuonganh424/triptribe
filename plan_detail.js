document.addEventListener("DOMContentLoaded", async () => {
  const planId = new URLSearchParams(window.location.search).get("id");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token || !planId) {
    alert("Thiếu token hoặc kế hoạch.");
    window.location.href = "login.html";
    return;
  }

  try {
    // === 1. Lấy thông tin kế hoạch
    const res = await fetch(`http://localhost:3000/plans/${planId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể lấy kế hoạch");

    // 🧾 Đổ dữ liệu cơ bản
    document.getElementById("plan-name").textContent = data.name;
    document.getElementById("plan-location").textContent = data.location || "–";
    document.getElementById("plan-start").textContent = formatDate(data.start_date);
    document.getElementById("plan-end").textContent = formatDate(data.end_date);
    document.getElementById("plan-description").textContent = data.description || "Không có mô tả.";

    // ✅ Hiển thị chi tiết kế hoạch
    const detailList = document.getElementById("note-detail-list");
    if (data.detail) {
      const lines = data.detail.split("\n").filter(line => line.trim() !== "");
      if (lines.length > 0) {
        lines.forEach(line => {
          const li = document.createElement("li");
          li.textContent = line;
          detailList.appendChild(li);
        });
      } else {
        detailList.innerHTML = "<li>(Không có nội dung chi tiết)</li>";
      }
    } else {
      detailList.innerHTML = "<li>(Không có nội dung chi tiết)</li>";
    }

    // === 2. Hiển thị chi phí vào bảng sẵn có
    const expenseBody = document.querySelector("#expense-body");
    const totalCell = document.getElementById("total-amount");

    if (expenseBody && totalCell) {
      const resExp = await fetch(`http://localhost:3000/plans/${planId}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const expenses = await resExp.json();

      if (!Array.isArray(expenses) || expenses.length === 0) {
        expenseBody.innerHTML = `<tr><td colspan="6">Không có chi phí nào.</td></tr>`;
        totalCell.textContent = "0";
      } else {
        expenseBody.innerHTML = "";
        let total = 0;

        expenses.forEach((e, index) => {
          total += parseFloat(e.amount);
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${e.category}</td>
            <td>${e.description || ""}</td>
            <td>${parseInt(e.amount).toLocaleString("vi-VN")}</td>
            <td>${e.note || ""}</td>
          `;
          expenseBody.appendChild(row);
        });

        totalCell.textContent = total.toLocaleString("vi-VN");
      }
    }

  } catch (err) {
    console.error("❌ Lỗi khi tải kế hoạch:", err);
    alert("Không thể tải kế hoạch.");
    window.location.href = "view_plan.html";
  }
});

function formatDate(dateStr) {
  if (!dateStr) return "–";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

document.getElementById("open-checklist").addEventListener("click", async () => {
  document.getElementById("checklist-popup").classList.remove("hidden");

  const planId = new URLSearchParams(window.location.search).get("id");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:3000/plans/${planId}/checklist`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const checklist = await res.json();
    const tbody = document.getElementById("checklist-body");
    tbody.innerHTML = "";

    checklist.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><input type="text" value="${item.item_name}" /></td>
        <td><input type="number" min="1" value="${item.quantity}" /></td>
        <td><input type="checkbox" ${item.is_checked ? "checked" : ""} /></td>
        <td><button class="remove-item">Xoá</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Lỗi khi load checklist:", err);
  }
});

document.getElementById("add-checklist-item").addEventListener("click", () => {
  const tbody = document.getElementById("checklist-body");
  const index = tbody.children.length + 1;
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${index}</td>
    <td><input type="text" placeholder="Tên đồ" /></td>
    <td><input type="number" min="1" value="1" /></td>
    <td><input type="checkbox" /></td>
    <td><button class="remove-item">Xoá</button></td>
  `;
  tbody.appendChild(tr);
});

document.getElementById("checklist-body").addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-item")) {
    e.target.closest("tr").remove();
  }
});

document.getElementById("ok-checklist").addEventListener("click", async () => {
  const planId = new URLSearchParams(window.location.search).get("id");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const items = Array.from(document.querySelectorAll("#checklist-body tr")).map(row => {
    return {
      item_name: row.children[1].querySelector("input").value,
      quantity: parseInt(row.children[2].querySelector("input").value),
      is_checked: row.children[3].querySelector("input").checked,
    };
  });

  try {
    const res = await fetch(`http://localhost:3000/plans/${planId}/checklist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    });

    const result = await res.json();
    alert(result.message);
    document.getElementById("checklist-popup").classList.add("hidden");
  } catch (err) {
    console.error("Lỗi khi lưu checklist:", err);
    alert("Không thể lưu checklist.");
  }
});
