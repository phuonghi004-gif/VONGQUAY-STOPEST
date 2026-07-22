// Cấu hình màu sắc nhã nhặn, chữ hiển thị rõ ràng
const prizes = [
    { text: "10%", color: "#ff9966", textColor: "#ffffff" },
    { text: "20%", color: "#ffcc66", textColor: "#cc5500" },
    { text: "30%", color: "#ff8888", textColor: "#ffffff" },
    { text: "50%", color: "#ffdd99", textColor: "#cc5500" },
    { text: "70%", color: "#ffaa66", textColor: "#ffffff" }
];

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const numSegments = prizes.length;
const segmentAngle = (2 * Math.PI) / numSegments;
let isSpinning = false;

function drawWheel() {
    if (!canvas || !ctx) return;
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const startAngle = i * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        // Vẽ phân vùng ô màu
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius - 2, startAngle, endAngle);
        ctx.fillStyle = prizes[i].color;
        ctx.fill();
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff"; 
        ctx.stroke();

        // Vẽ chữ hiển thị phần trăm (Đã xử lý chống lộn ngược đầu)
        ctx.save();
        ctx.translate(radius, radius);
        
        // Tính toán góc ở giữa của phân đoạn
        const midAngle = startAngle + segmentAngle / 2;
        ctx.rotate(midAngle);
        
        // Căn chỉnh chữ hướng từ viền vào tâm để không bao giờ bị ngược chữ
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = prizes[i].textColor;
        ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif";
        
        // Di chuyển chữ ra rìa vòng quay một khoảng vừa phải
        ctx.fillText(prizes[i].text, radius * 0.65, 0);
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
        if (document.getElementById('status-message')) document.getElementById('status-message').innerText = "Thiết bị của bạn đã tham gia!";
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
        alert("Số điện thoại này đã tham gia quay thưởng trước đó!");
        return;
    }

    isSpinning = true;
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) spinBtn.disabled = true;

    // Tỷ lệ trúng giải 70% là 15% (index số 4)
    const rand = Math.floor(Math.random() * 100) + 1;
    let prizeIndex = 0;

    if (rand <= 15) {
        prizeIndex = 4; 
    } else {
        const remainders = [0, 1, 2, 3];
        prizeIndex = remainders[Math.floor(Math.random() * remainders.length)];
    }
    
    // Thuật toán xoay khớp chuẩn với kim chỉ 12h đỉnh màn hình
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
