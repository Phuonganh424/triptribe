document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const plansList = document.getElementById("plans-list");

  if (!token) {
    alert("Bạn chưa đăng nhập!");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/plans", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await res.json();

    if (res.ok) {
      const plans = data.plans;

      if (plans.length === 0) {
        plansList.innerHTML = "<p>Chưa có kế hoạch nào. Hãy bắt đầu bằng cách tạo kế hoạch mới!</p>";
        return;
      }

      plansList.innerHTML = "";

      plans.forEach((plan) => {
        const div = document.createElement("div");
        div.className = "plan-card";

        div.innerHTML = `
            <div class="plan-info">
              <div class="plan-row"><span class="label">Plan name:</span><span class="value">${plan.name}</span></div>
              <div class="plan-row"><span class="label">Destination:</span><span class="value">${plan.location || "–"}</span></div>
              <div class="plan-row"><span class="label">Time:</span><span class="value">${formatDate(plan.start_date)}${plan.end_date ? " → " + formatDate(plan.end_date) : ""}</span></div>
              <div class="plan-row"><span class="label">Description:</span><span class="value">${plan.description || "Không có mô tả."}</span></div>
              <div class="plan-actions">
                <button onclick="window.location.href='edit_plan.html?id=${plan.id}'">
                  <img src="imgs/edit.png" alt="Edit" />
                </button>
                <button onclick="location.href='plan_detail.html?id=${plan.id}'">View Details</button>
                    <button class="delete-plan" data-id="${plan.id}" title="Xoá kế hoạch">
                      <img src="imgs/trash.png" alt="Xoá" class="trash-icon" />
                    </button>
                </div>
            </div>
        `;

        // Gắn sự kiện xoá cho nút .delete-plan vừa được render
        div.querySelector(".delete-plan")?.addEventListener("click", async (e) => {
          e.stopPropagation();
          const planId = plan.id;
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");

          try {
            const res = await fetch(`http://localhost:3000/plans/${planId}`, {
              method: "DELETE",
              headers: {
              Authorization: "Bearer " + token,
            },
          });

          if (res.ok) {
            div.remove(); // Xoá luôn khỏi DOM nếu xoá thành công
          }
        } catch (err) {
          console.error("Lỗi xoá:", err);
        }
      });

        plansList.appendChild(div);
      });
    } else {
      plansList.innerHTML = `<p>Lỗi khi tải kế hoạch: ${data.message || "Không xác định"}</p>`;
    }
  } catch (err) {
    console.error("❌ Lỗi khi fetch kế hoạch:", err);
    plansList.innerHTML = "<p>Không thể tải kế hoạch. Vui lòng thử lại sau.</p>";
  }
});

// ===== Hàm định dạng ngày theo dd/mm/yyyy =====
function formatDate(dateStr) {
  if (!dateStr) return "–";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
