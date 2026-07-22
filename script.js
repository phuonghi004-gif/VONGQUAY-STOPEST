// Cấu hình vòng quay đúng 5 ô cho thoáng mắt
const prizes = [
    { text: "10%", color: "#a30000", textColor: "#ffffff" },
    { text: "20%", color: "#ffffff", textColor: "#a30000" },
    { text: "30%", color: "#a30000", textColor: "#ffffff" },
    { text: "50%", color: "#ffffff", textColor: "#a30000" },
    { text: "70%", color: "#a30000", textColor: "#ffffff" }
];

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const numSegments = prizes.length;
const segmentAngle = (2 * Math.PI) / numSegments; // Mỗi ô rộng 72 độ (360 / 5)
let isSpinning = false;

// Hàm vẽ vòng quay 5 ô
function drawWheel() {
    if (!canvas || !ctx) return;
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const startAngle = i * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius - 2, startAngle, endAngle);
        ctx.fillStyle = prizes[i].color;
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#a30000";
        ctx.stroke();

        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = prizes[i].textColor;
        ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif"; // Chữ to rõ ràng vì ô rất rộng
        ctx.fillText(prizes[i].text, radius - 40, 0);
        ctx.restore();
    }
}

window.onload = function() {
    drawWheel();
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
        spinBtn.onclick = startSpin;
    }

    const deviceHasSpun = localStorage.getItem('stopest_v2_device_spun');
    const savedPrize = localStorage.getItem('stopest_v2_device_prize');

    if (deviceHasSpun === 'true') {
        if (document.getElementById('input-fields')) document.getElementById('input-fields').style.display = 'none';
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.innerText = "ĐÃ HẾT LƯỢT QUAY";
        }
        if (document.getElementById('status-message')) document.getElementById('status-message').innerText = "Thiết bị của bạn đã tham gia chương trình này rồi!";
        if (document.getElementById('result-text')) document.getElementById('result-text').innerText = savedPrize;
        if (document.getElementById('result-box')) document.getElementById('result-box').classList.remove('hidden');
    }
};

function startSpin() {
    if (isSpinning) return;

    if (localStorage.getItem('stopest_v2_device_spun') === 'true') {
        alert("Thiết bị này đã hết lượt quay!");
        return;
    }

    const nameInput = document.getElementById('fullname');
    const phoneInput = document.getElementById('phone');

    const fullname = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";

    if (!fullname || !phone) {
        alert("Vui lòng nhập đầy đủ Họ tên và Số điện thoại!");
        return;
    }
    if (!/^\d{9,11}$/.test(phone)) {
        alert("Số điện thoại không hợp lệ!");
        return;
    }

    let usedPhones = JSON.parse(localStorage.getItem('stopest_v2_used_phones')) || [];
    if (usedPhones.includes(phone)) {
        alert("Số điện thoại này đã tham gia quay thưởng trước đó rồi!");
        return;
    }

    isSpinning = true;
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) spinBtn.disabled = true;

    // THUẬT TOÁN ĐIỀU CHỈNH XÁC XUẤT CHÍNH XÁC:
    // Tạo số ngẫu nhiên từ 1 đến 100
    const rand = Math.floor(Math.random() * 100) + 1;
    let prizeIndex = 0;

    if (rand <= 15) {
        prizeIndex = 4; // 15% xác suất trúng ô số 4 (70%)
    } else {
        // 85% còn lại chia đều cho 4 ô còn lại (Mỗi ô hưởng ~21.25%)
        const remainders = [0, 1, 2, 3];
        prizeIndex = remainders[Math.floor(Math.random() * remainders.length)];
    }
    
    // Thuật toán tính góc quay chuẩn xác cho hệ 5 ô (Mỗi ô 72 độ) để trúng đúng ô đã chọn
    // Kim nằm ở góc 270 độ. Tâm ô thứ i là: (i * 72) + 36.
    const targetAngleDegree = 270 - (prizeIndex * 72 + 36);
    const totalRotation = 2880 + targetAngleDegree; 

    canvas.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
        const finalPrize = prizes[prizeIndex].text;
        const displayPrize = "Ưu đãi " + finalPrize;
        
        if (document.getElementById('result-text')) document.getElementById('result-text').innerText = displayPrize;
        if (document.getElementById('result-box')) document.getElementById('result-box').classList.remove('hidden');
        if (spinBtn) spinBtn.innerText = "ĐÃ HẾT LƯỢT QUAY";
        if (document.getElementById('status-message')) document.getElementById('status-message').innerText = "Chúc mừng bạn đã trúng giải!";
        if (document.getElementById('input-fields')) document.getElementById('input-fields').style.display = 'none';

        localStorage.setItem('stopest_v2_device_spun', 'true');
        localStorage.setItem('stopest_v2_device_prize', displayPrize);

        usedPhones.push(phone);
        localStorage.setItem('stopest_v2_used_phones', JSON.stringify(usedPhones));

        sendDataToGoogle(fullname, phone, finalPrize);
        isSpinning = false;
    }, 4000); 
}

function sendDataToGoogle(name, phone, prize) {
    const baseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeboYa4TZbA28yF3Tnlf_EVdLgy7tYRNxIIOpLJjYtqJVNIbQ/formResponse";
    const prizeText = "Ưu đãi " + prize; 
    const finalUrl = `${baseUrl}?entry.810076137=${encodeURIComponent(name)}&entry.1928279920=${encodeURIComponent(phone)}&entry.2010302772=${encodeURIComponent(prizeText)}&submit=Submit`;

    const newWindow = window.open(finalUrl, '_blank');
    if (newWindow) {
        setTimeout(() => {
            newWindow.close();
        }, 600); 
    }
}
