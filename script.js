// Cấu hình 5 ô xen kẽ hai màu Đỏ thẫm (#a30000) và Trắng (#ffffff)
const prizes = [
    { text: "10%", color: "#ff9966", textColor: "#ffffff" }, // Cam đất pastel
    { text: "20%", color: "#ffe066", textColor: "#8a6d00" }, // Vàng dịu
    { text: "30%", color: "#ff8888", textColor: "#ffffff" }, // Hồng dâu pastel
    { text: "50%", color: "#74c0fc", textColor: "#ffffff" }, // Xanh dương nhạt
    { text: "70%", color: "#63e6be", textColor: "#0ca678" }  // Xanh mint tươi mát
];

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const numSegments = prizes.length;
const segmentAngle = (2 * Math.PI) / numSegments;
let isSpinning = false;

// Các hàm vẽ drawWheel() và xử lý logic startSpin(), sendDataToGoogle()... ở bên dưới giữ nguyên không đổi.

// Hàm tự động tạo lập vòng quay
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
        ctx.strokeStyle = prizes[i].color === "#ffffff" ? "#a30000" : "#ffffff";
        ctx.stroke();

        ctx.save();
        ctx.translate(radius, radius);
        const midAngle = startAngle + segmentAngle / 2;
        ctx.rotate(midAngle);
        
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = prizes[i].textColor;
        ctx.font = "bold 34px 'Segoe UI', Arial, sans-serif";
        
        ctx.fillText(prizes[i].text, radius * 0.62, 0);
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
        if (document.getElementById('status-message')) document.getElementById('status-message').innerText = "Thiết bị của bạn đã tham gia chương trình!";
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

    const rand = Math.floor(Math.random() * 100) + 1;
    let prizeIndex = 0;

    if (rand <= 15) {
        prizeIndex = 4; 
    } else {
        const remainders = [0, 1, 2, 3];
        prizeIndex = remainders[Math.floor(Math.random() * remainders.length)];
    }
    
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

// Hàm gửi dữ liệu ngầm chuẩn qua iframe không sợ lỗi CORS trình duyệt
function sendDataToGoogle(name, phone, prize) {
    const baseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeboYa4TZbA28yF3Tnlf_EVdLgy7tYRNxIIOpLJjYtqJVNIbQ/formResponse";
    const prizeText = "Ưu đãi " + prize; 
    
    // Tạo form ảo để submit vào iframe ẩn
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = baseUrl;
    form.target = 'hidden_iframe'; // Đẩy luồng xử lý vào iframe ẩn

    const nameInput = document.createElement('input');
    nameInput.type = 'hidden';
    nameInput.name = 'entry.810076137';
    nameInput.value = name;
    form.appendChild(nameInput);

    const phoneInput = document.createElement('input');
    phoneInput.type = 'hidden';
    phoneInput.name = 'entry.1928279920';
    phoneInput.value = phone;
    form.appendChild(phoneInput);

    const prizeInput = document.createElement('input');
    prizeInput.type = 'hidden';
    prizeInput.name = 'entry.2010302772';
    prizeInput.value = prizeText;
    form.appendChild(prizeInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}V
